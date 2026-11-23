import { dineService, dineUser } from '@/app/lib/dine-server';
import { dineError, dineInt, dineOk, dineText, dineUuid, fingerprint } from '@/app/lib/dine-lite';
export const runtime='nodejs';
export const dynamic='force-dynamic';

/** QR menus are listed only for verified restaurants with an activated QR pilot. */
export async function GET(request:Request){
 const url=new URL(request.url);
 const restaurantId=url.searchParams.get('restaurant')||'';
 const tableId=url.searchParams.get('table')||'';
 const token=url.searchParams.get('key')||'';
 if(!dineUuid(restaurantId)||!dineUuid(tableId)||!dineUuid(token))
  return dineError('Invalid restaurant table QR code.',400);
 const db=await dineService();
 if(!db)return dineError('Dining menu temporarily unavailable.',503);
 const {data:restaurant,error:rerr}=await db.from('dine_restaurants')
  .select('id,name,city,area,fssai_registration,qr_order_enabled,booking_enabled,fssai_verified')
  .eq('id',restaurantId).maybeSingle();
 if(rerr)return dineError('Unable to load the restaurant.',503);
 if(!restaurant||!restaurant.qr_order_enabled||!restaurant.booking_enabled||!restaurant.fssai_verified)
  return dineError('QR ordering is not yet available at this restaurant.',404);
 const {data:table,error:terr}=await db.from('dine_tables')
  .select('id,label,seats').eq('id',tableId).eq('restaurant_id',restaurantId)
  .eq('qr_token',token).eq('enabled',true).maybeSingle();
 if(terr)return dineError('Unable to read this table.',503);
 if(!table)return dineError('This table QR is invalid or inactive. Please ask restaurant staff.',404);
 const {data:menu,error:merr}=await db.from('dine_menu_items')
  .select('id,name,category,price_paise,prep_minutes')
  .eq('restaurant_id',restaurantId).eq('available',true).order('category').order('name').limit(180);
 if(merr)return dineError('Unable to load menu.',503);
 return dineOk({
  restaurant:{id:restaurant.id,name:restaurant.name,city:restaurant.city,area:restaurant.area},
  table,menu:menu||[],
  note:'Browse without signing in. A request is not a kitchen order until staff accept it. Pay at the restaurant; no online charge.',
 });
}

/** Server-side menu price snapshots and atomic table/IP throttling prevent prank KOTs. */
export async function POST(request:Request){
 if(Number(request.headers.get('content-length')||0)>12_000)return dineError('Order request too large.',413);
 let body:Record<string,unknown>;
 try { const input:unknown=await request.json();if(!input||typeof input!=='object'||Array.isArray(input))throw Error();body=input as Record<string,unknown>; }
 catch {return dineError('Invalid order request.');}
 const restaurantId=body.restaurantId,tableId=body.tableId,qrToken=body.key,idem=body.idempotencyKey;
 const source=body.source==='STAFF_TABLE'?'STAFF_TABLE':'TABLE_QR';
 if(!dineUuid(restaurantId)||!dineUuid(tableId)||!dineUuid(idem)
    ||!Array.isArray(body.items)||body.items.length<1||body.items.length>12)
  return dineError('Check restaurant, table and selected dishes.');
 const items:Array<{id:string;quantity:number}>=[];
 const distinct=new Set<string>();
 for(const item of body.items){
  if(!item||typeof item!=='object'||Array.isArray(item))return dineError('Check item quantities.');
  const value=item as Record<string,unknown>;
  if(!dineUuid(value.id)||!dineInt(value.quantity,1,10)||distinct.has(value.id))
   return dineError('Choose unique available dishes with quantities from 1 to 10.');
  distinct.add(value.id);items.push({id:value.id,quantity:value.quantity as number});
 }
 const guestName=dineText(body.name,80),notes=dineText(body.notes,350);
 let userId:string|null=null;
 let rateFingerprint='';
 if(source==='STAFF_TABLE'){
  const user=await dineUser(request);
  if(!user)return dineError('Restaurant staff sign-in required.',401);
  userId=user.id;
 }else{
  if(!dineUuid(qrToken))return dineError('Invalid table QR.',400);
  const fp=fingerprint(request);
  if(!fp)return dineError('Ask restaurant staff to place this order; secure guest QR submission is unavailable.',503);
  rateFingerprint=fp;
 }
 const db=await dineService();
 if(!db)return dineError('Dining service temporarily unavailable.',503);
 const {data,error}=await db.rpc('create_dine_table_order',{
  p_restaurant_id:restaurantId,p_table_id:tableId,
  p_qr_token:source==='TABLE_QR'?qrToken:null,
  p_idempotency_key:idem,p_items:items,p_label:guestName,p_notes:notes,
  p_fingerprint:rateFingerprint,p_staff_user:userId,
 });
 if(error){
  const code=error.message||'';
  if(code.includes('RATE_LIMITED'))return dineError('Too many requests for this table. Please ask restaurant staff.',429);
  if(code.includes('DISH_UNAVAILABLE')||code.includes('INVALID_ITEM'))
   return dineError('A selected dish is unavailable. Refresh the menu.',409);
  if(code.includes('NOT_RESTAURANT_STAFF'))return dineError('Restaurant staff access required.',403);
  if(code.includes('TABLE_NOT_AVAILABLE')||code.includes('INVALID_TABLE_QR')||code.includes('RESTAURANT_NOT_ENABLED'))
   return dineError('This restaurant or table is not accepting QR orders.',409);
  if(code.includes('REUSED_REQUEST_KEY'))return dineError('Please start a new order request.',409);
  return dineError('Order request could not be saved. No payment was taken.',503);
 }
 return dineOk({
  orderId:data,status:source==='TABLE_QR'?'PENDING_APPROVAL':'ACCEPTED',
  note:source==='TABLE_QR'?
   'Request sent to the restaurant counter. Staff must approve it before the kitchen starts. No payment was taken.':
   'Staff order accepted for the kitchen. Customer pays the restaurant.',
 },201);
}
