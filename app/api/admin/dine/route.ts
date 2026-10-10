import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {dateISO,dineAdmin,phone,response,safeString,uuid} from '@/app/lib/dine-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const obj=(x:unknown):x is Record<string,unknown>=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x);
const int=(x:unknown,a:number,b:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=a&&x<=b;
const hhmm=(x:unknown)=>typeof x==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x);
const no=(error:string,status=400)=>response({error},status);

export async function GET(request:Request){
 const db=await dineAdmin(request);if(!db)return no('Admin access required.',403);
 const [restaurants,menus,tables,bookings,leads]=await Promise.all([
  db.from('dine_restaurants').select('*').order('created_at',{ascending:false}).limit(100),
  db.from('dine_menu_items').select('id,restaurant_id,name,category,price_paise,prep_minutes,available').limit(500),
  db.from('dine_tables').select('id,restaurant_id,label,seats,enabled').limit(500),
  db.from('dine_bookings').select('id,restaurant_id,contact_name,contact_phone,party_size,arrival_at,requested_serve_at,confirmed_serve_at,prep_start_at,preordered_items,estimated_total_paise,status,kitchen_status,notes,created_at').order('created_at',{ascending:false}).limit(200),
  db.from('dine_partner_leads').select('id,restaurant_name,city,contact_name,contact_phone,fssai_registration,enquiry_notes,status,created_at').order('created_at',{ascending:false}).limit(100),
 ]);
 if([restaurants,menus,tables,bookings,leads].some(r=>r.error))return no('Unable to load dining management data.',503);
 return response({restaurants:restaurants.data||[],menus:menus.data||[],tables:tables.data||[],bookings:bookings.data||[],leads:leads.data||[],
  note:'Partner verification, kitchen timing and table confirmations require real operator review.'});
}

export async function POST(request:Request){
 const db=await dineAdmin(request);if(!db)return no('Admin access required.',403);
 let x:Record<string,unknown>;
 try{const v:unknown=await request.json();if(!obj(v))throw Error();x=v;}catch{return no('Invalid input.');}
 if(x.action==='restaurant'){
  const name=safeString(x.name,120),city=safeString(x.city,80),address=safeString(x.address,400),
   area=safeString(x.area,100),fssai_registration=safeString(x.fssaiNumber,14);
  const opens=String(x.opensAt||'11:00'),closes=String(x.closesAt||'22:00');
  if(name.length<2||city.length<2||address.length<8||!/^\d{14}$/.test(fssai_registration)
    ||!hhmm(opens)||!hhmm(closes)||opens>=closes)return no('Check restaurant details, hours and 14-digit FSSAI number.');
  const {data,error}=await db.from('dine_restaurants').insert({
   name,city,area,address,fssai_registration,opens_at:opens,closes_at:closes,
   fssai_verified:false,booking_enabled:false,preorder_enabled:false,
  }).select('id').single();
  return error?no('Unable to save restaurant. It was not made public.',503):response({ok:true,restaurantId:data.id,note:'Saved privately; verify documents and seating before activation.'},201);
 }
 if(x.action==='table'){
  if(!uuid(x.restaurantId)||!int(x.seats,1,24))return no('Choose restaurant and seats.');
  const label=safeString(x.label,40);if(!label)return no('Enter a table label.');
  const {error}=await db.from('dine_tables').insert({restaurant_id:x.restaurantId,label,seats:x.seats});
  return error?no('Unable to add table. Use a unique label.',409):response({ok:true},201);
 }
 if(x.action==='menu'){
  if(!uuid(x.restaurantId)||!int(x.pricePaise,100,1000000)||!int(x.prepMinutes,5,180))
   return no('Check menu price and preparation time.');
  const name=safeString(x.name,120),category=safeString(x.category,80)||'Meals';
  if(name.length<2)return no('Enter a dish name.');
  const {error}=await db.from('dine_menu_items').insert({
   restaurant_id:x.restaurantId,name,category,price_paise:x.pricePaise,prep_minutes:x.prepMinutes,available:true,
  });
  return error?no('Unable to save dish.',503):response({ok:true},201);
 }
 return no('Unknown action.');
}

export async function PATCH(request:Request){
 const db=await dineAdmin(request);if(!db)return no('Admin access required.',403);
 let x:Record<string,unknown>;
 try{const v:unknown=await request.json();if(!obj(v))throw Error();x=v;}catch{return no('Invalid update.');}
 if(x.action==='activate'){
  if(!uuid(x.restaurantId)||x.documentsChecked!==true)return no('Document verification confirmation required.');
  if(await getRuntimeEnvValue('DINE_OPERATIONS_APPROVED')!=='true')return no('Zeshu Dine operations and food-platform compliance must be approved before accepting real reservations.',409);
  const {data,error}=await db.from('dine_tables').select('id').eq('restaurant_id',x.restaurantId).eq('enabled',true).limit(1);
  if(error||!data?.length)return no('Add a real seating table before enabling reservations.',409);
  const {data:restaurant,error:readError}=await db.from('dine_restaurants').select('id,preorder_enabled').eq('id',x.restaurantId).maybeSingle();
  if(x.preorderEnabled===true){const {data:items,error:menuError}=await db.from('dine_menu_items').select('id').eq('restaurant_id',x.restaurantId).eq('available',true).limit(1);
   if(menuError||!items?.length)return no('Add real verified menu dishes before enabling meal pre-orders.',409);
  }
  if(readError||!restaurant)return no('Restaurant unavailable.',404);
  const {error:updateError}=await db.from('dine_restaurants').update({
   fssai_verified:true,booking_enabled:true,preorder_enabled:x.preorderEnabled===true,updated_at:new Date().toISOString(),
  }).eq('id',x.restaurantId);
  return updateError?no('Unable to activate restaurant.',503):response({ok:true,note:'Restaurant activated by administrator after manual document review.'});
 }
 if(x.action==='pause'){
  if(!uuid(x.restaurantId))return no('Invalid restaurant.');
  const {error}=await db.from('dine_restaurants').update({
   booking_enabled:false,preorder_enabled:false,updated_at:new Date().toISOString(),
  }).eq('id',x.restaurantId);
  return error?no('Unable to pause new bookings.',503):response({ok:true,note:'New bookings are paused. Existing confirmations still require service.'});
 }
 if(x.action==='confirm'){
  if(!uuid(x.bookingId)||!dateISO(x.serveAt))return no('Enter a valid scheduled serving time.');
  const {data,error}=await db.rpc('confirm_dine_booking',{p_booking_id:x.bookingId,p_serve_at:x.serveAt});
  return error?no('Unable to verify table and kitchen availability.',503)
   :data===true?response({ok:true,note:'Real table assigned. Scheduled serving time is an estimate; notify the customer promptly through approved channels.'})
   :no('Cannot confirm: time, kitchen lead, table capacity, or request status does not allow it.',409);
 }
 if(x.action==='decline'){
  if(!uuid(x.bookingId))return no('Invalid booking.');
  const {data,error}=await db.from('dine_bookings').update({status:'DECLINED',updated_at:new Date().toISOString()})
   .eq('id',x.bookingId).eq('status','REQUESTED').select('id').maybeSingle();
  return error?no('Unable to decline request.',503):data?response({ok:true}):no('Booking already handled.',409);
 }
 if(x.action==='kitchen'){
  if(!uuid(x.bookingId)||!['PREPARING','READY','SERVED'].includes(String(x.kitchenStatus)))return no('Invalid kitchen update.');
  const desired=String(x.kitchenStatus),prev=desired==='PREPARING'?'NOT_STARTED':desired==='READY'?'PREPARING':'READY';
  const {data,error}=await db.from('dine_bookings').update({
   kitchen_status:desired,updated_at:new Date().toISOString(),
  }).eq('id',x.bookingId).eq('status','CONFIRMED').eq('kitchen_status',prev)
    .neq('estimated_total_paise',0).select('id').maybeSingle();
  return error?no('Kitchen status could not be updated.',503)
   :!data?no('Kitchen updates require a confirmed pre-order and the correct previous stage.',409):response({ok:true});
 }
 if(x.action==='complete'){
  if(!uuid(x.bookingId))return no('Invalid booking.');
  const {data,error}=await db.from('dine_bookings').update({status:'COMPLETED',updated_at:new Date().toISOString()})
   .eq('id',x.bookingId).eq('status','CONFIRMED').select('id').maybeSingle();
  return error?no('Unable to complete reservation.',503):data?response({ok:true}):no('Booking is not confirmed.',409);
 }
 return no('Unknown action.');
}
