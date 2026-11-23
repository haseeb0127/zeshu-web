import { dineStaffAccess, dineError, dineOk, dineUuid } from '@/app/lib/dine-lite';
import { dateISO } from '@/app/lib/dine-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

const readJson=async(request:Request)=>{
 try { const data:unknown=await request.json();
  return data && typeof data==='object'&&!Array.isArray(data)?data as Record<string,unknown>:null;
 }catch{return null;}
};

/** Strict server-authorized restaurant membership. No client-provided role is trusted. */
export async function GET(request:Request){
 const raw=new URL(request.url).searchParams.get('restaurant')||'';
 if(raw&&!dineUuid(raw))return dineError('Invalid restaurant.');
 const a=await dineStaffAccess(request,raw||undefined);
 if(!a)return dineError('Sign in to an approved restaurant account.',401);
 const {db,roles}=a;
 if(!roles.length)return dineOk({restaurants:[],restaurant:null,tables:[],menu:[],orders:[],bookings:[],
  note:'No restaurant is assigned to this account. Ask Zeshu Dine admin to approve your user ID and restaurant role.'});
 const ids=roles.map(r=>r.restaurant_id);
 const {data:venues,error:ve}=await db.from('dine_restaurants')
  .select('id,name,city,area,qr_order_enabled,booking_enabled,fssai_verified').in('id',ids);
 if(ve)return dineError('Restaurant access unavailable.',503);
 const restaurants=(venues||[]).map(v=>({
  ...v,role:roles.find(r=>r.restaurant_id===v.id)?.role||'KITCHEN',
 }));
 const selected=raw||restaurants[0]?.id;
 if(!selected||!ids.includes(selected))return dineError('Restaurant permission required.',403);
 const [tables,menu,orders,bookings]=await Promise.all([
  db.from('dine_tables').select('id,label,seats,enabled,qr_token')
   .eq('restaurant_id',selected).order('label').limit(100),
  db.from('dine_menu_items').select('id,name,category,price_paise,available,prep_minutes')
   .eq('restaurant_id',selected).order('category').order('name').limit(300),
  db.from('dine_table_orders')
   .select('id,table_id,source,customer_label,notes,items,item_count,subtotal_paise,status,payment_status,created_at,updated_at')
   .eq('restaurant_id',selected).order('created_at',{ascending:false}).limit(150),
  db.from('dine_bookings')
   .select('id,table_id,contact_name,party_size,arrival_at,requested_serve_at,confirmed_serve_at,prep_start_at,status,kitchen_status,preordered_items,estimated_total_paise,guest_journey_status')
   .eq('restaurant_id',selected).in('status',['REQUESTED','CONFIRMED'])
   .order('arrival_at').limit(100),
 ]);
 if([tables,menu,orders,bookings].some(r=>r.error))return dineError('Restaurant workspace temporarily unavailable.',503);
 return dineOk({restaurants,restaurant:restaurants.find(r=>r.id===selected),tables:tables.data||[],
  menu:menu.data||[],orders:orders.data||[],bookings:bookings.data||[],
  delivery:{enabled:false,note:'Delivery is held until verified drivers, dispatch, food safety and payment handling are approved.'},
  note:'New Table QR requests need staff approval; staff-assisted orders enter the kitchen after authenticated submission.'});
}

export async function PATCH(request:Request){
 const input=await readJson(request);
 if(!input||!dineUuid(input.restaurantId))return dineError('Choose a restaurant.');
 const restaurantId=input.restaurantId;
 const a=await dineStaffAccess(request,restaurantId);
 if(!a)return dineError('Sign in to an approved restaurant account.',401);
 const {db,user,roles}=a;
 if(!roles.length)return dineError('No access to this restaurant.',403);
 const role=roles[0].role;
 const action=String(input.action||'');
 if(action==='menuAvailability'){
  if(!['OWNER','MANAGER','KITCHEN'].includes(role))return dineError('Menu management permission required.',403);
  if(!dineUuid(input.menuItemId)||typeof input.available!=='boolean')return dineError('Invalid menu update.');
  const {data,error}=await db.from('dine_menu_items')
   .update({available:input.available}).eq('id',input.menuItemId).eq('restaurant_id',restaurantId)
   .select('id').maybeSingle();
  return error?dineError('Menu availability update failed.',503):
   !data?dineError('Dish not found.',404):
   dineOk({ok:true,note:'Menu availability saved for future orders. Already accepted kitchen tickets remain valid.'});
 }
 if(action==='tableAvailability'){
  if(!['OWNER','MANAGER'].includes(role))return dineError('Table management permission required.',403);
  if(!dineUuid(input.tableId)||typeof input.enabled!=='boolean')return dineError('Invalid table update.');
  const {data,error}=await db.from('dine_tables')
   .update({enabled:input.enabled}).eq('id',input.tableId).eq('restaurant_id',restaurantId)
   .select('id').maybeSingle();
  return error?dineError('Table update failed.',503):
   !data?dineError('Table not found.',404):
   dineOk({ok:true,note:'Table availability updated. Existing accepted orders still require service.'});
 }
 if(action==='orderStatus'){
  if(!dineUuid(input.orderId))return dineError('Invalid order.');
  const next=String(input.status||'');
  const allowed:Record<string,string[]>={
   PENDING_APPROVAL:['ACCEPTED','REJECTED'],
   ACCEPTED:['PREPARING','CANCELLED'],PREPARING:['READY'],READY:['SERVED'],
  };
  const {data:order,error:readErr}=await db.from('dine_table_orders')
   .select('id,status').eq('id',input.orderId).eq('restaurant_id',restaurantId).maybeSingle();
  if(readErr)return dineError('Could not review order.',503);
  if(!order)return dineError('Order not found in this restaurant.',404);
  if(!allowed[order.status]?.includes(next))return dineError('This order transition is not allowed.',409);
  if(role==='WAITER'&&next==='PREPARING')return dineError('Kitchen staff must start cooking.',403);
  const {data,error}=await db.from('dine_table_orders')
   .update({status:next,updated_at:new Date().toISOString()})
   .eq('id',input.orderId).eq('restaurant_id',restaurantId).eq('status',order.status)
   .select('id').maybeSingle();
  if(error)return dineError('Order status update failed.',503);
  if(!data)return dineError('Order changed on another screen. Refresh and try again.',409);
  const audit=await db.from('dine_table_order_events').insert({
   order_id:input.orderId,actor_user_id:user.id,previous_status:order.status,new_status:next,
  });
  if(audit.error)console.error('Dine order audit event not saved for transaction',data.id);
  return dineOk({ok:true,note:'Order updated. The restaurant remains responsible for table service and collecting payment.'});
 }
 if(action==='confirmBooking'){
  if(!['OWNER','MANAGER','WAITER'].includes(role))return dineError('Reservation approval permission required.',403);
  if(!dineUuid(input.bookingId)||!dateISO(input.serveAt))return dineError('Valid reservation and estimated serving time required.');
  const {data:booking,error:readErr}=await db.from('dine_bookings')
   .select('id').eq('id',input.bookingId).eq('restaurant_id',restaurantId).eq('status','REQUESTED').maybeSingle();
  if(readErr||!booking)return dineError('Reservation not available for confirmation.',409);
  const {data,error}=await db.rpc('confirm_dine_booking',{p_booking_id:input.bookingId,p_serve_at:input.serveAt});
  return error?dineError('Could not confirm real table and kitchen schedule.',503):
   data!==true?dineError('No suitable table or serving-time slot is available.',409):
   dineOk({ok:true,note:'Table confirmed. Contact the guest through an approved channel; this does not send messages automatically.'});
 }
 if(action==='declineBooking'){
  if(!['OWNER','MANAGER','WAITER'].includes(role))return dineError('Reservation permission required.',403);
  if(!dineUuid(input.bookingId))return dineError('Invalid reservation.');
  const {data,error}=await db.from('dine_bookings').update({status:'DECLINED',updated_at:new Date().toISOString()})
   .eq('restaurant_id',restaurantId).eq('id',input.bookingId).eq('status','REQUESTED')
   .select('id').maybeSingle();
  return error?dineError('Decline failed.',503):!data?dineError('Reservation already handled.',409):
   dineOk({ok:true,note:'Reservation declined. Notify the guest through an approved channel.'});
 }
 if(action==='bookingKitchen'){
  if(!['OWNER','MANAGER','KITCHEN'].includes(role))return dineError('Kitchen permission required.',403);
  if(!dineUuid(input.bookingId))return dineError('Invalid reservation.');
  const next=String(input.status||'');
  const previous:Record<string,string>={PREPARING:'NOT_STARTED',READY:'PREPARING',SERVED:'READY'};
  if(!previous[next])return dineError('Invalid kitchen status.');
  const {data,error}=await db.from('dine_bookings')
   .update({kitchen_status:next,updated_at:new Date().toISOString()})
   .eq('id',input.bookingId).eq('restaurant_id',restaurantId)
   .eq('status','CONFIRMED').eq('kitchen_status',previous[next])
   .gt('estimated_total_paise',0).select('id').maybeSingle();
  return error?dineError('Kitchen status unavailable.',503):
   !data?dineError('Booking changed or the previous kitchen stage is incomplete.',409):
   dineOk({ok:true,note:'Kitchen progress updated. Preparation and serving times remain estimates.'});
 }
 return dineError('Unknown restaurant action.');
}
