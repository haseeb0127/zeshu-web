import {dateISO,dineService,dineUser,hhmm,localTime,phone,response,safeString,uuid} from '@/app/lib/dine-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const MS=60_000;
const isObj=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const integer=(v:unknown,min:number,max:number)=>Number.isInteger(v)&&Number(v)>=min&&Number(v)<=max;
const fmt=(v:Date)=>v.toISOString();

/** Customer's own requests. No phone numbers from other users are returned. */
export async function GET(request:Request){
 const user=await dineUser(request);
 if(!user)return response({error:'Please sign in to view your dining requests.'},401);
 const db=await dineService();
 if(!db)return response({error:'Dining service unavailable.'},503);
 const {data,error}=await db.from('dine_bookings')
  .select('id,restaurant_id,arrival_at,requested_serve_at,confirmed_serve_at,prep_start_at,party_size,status,kitchen_status,preordered_items,estimated_total_paise,created_at')
  .eq('customer_id',user.id).order('created_at',{ascending:false}).limit(30);
 return error?response({error:'Unable to load your requests.'},503):response({bookings:data||[]});
}

/** No reservation is made until a real restaurant explicitly confirms an actual free table. */
export async function POST(request:Request){
 const user=await dineUser(request);
 if(!user)return response({error:'Sign in to Zeshu before requesting a table.'},401);
 if(Number(request.headers.get('content-length')||0)>16_384)return response({error:'Request is too large.'},413);
 let x:Record<string,unknown>;
 try{const v:unknown=await request.json();if(!isObj(v))throw Error();x=v;}catch{return response({error:'Invalid dining request.'},400);}
 const restaurantId=x.restaurantId,partySize=x.partySize,arrivalAt=x.arrivalAt;
 const contactName=safeString(x.contactName,100),contactPhone=safeString(x.contactPhone,20);
 const notes=safeString(x.notes,500);
 if(!uuid(restaurantId)||!integer(partySize,1,24)||!dateISO(arrivalAt)
   ||contactName.length<2||!phone(contactPhone)||!Array.isArray(x.items)||x.items.length>20
   ||!integer(x.serveOffsetMinutes,0,30)||![0,5,10,15,20,30].includes(Number(x.serveOffsetMinutes)))
  return response({error:'Please check your reservation, contact information and arrival time.'},400);
 const arrivals=new Date(String(arrivalAt)),now=Date.now();
 if(arrivals.getTime()>now+14*24*60*MS||arrivals.getTime()<=now)
  return response({error:'Choose a future arrival within the next 14 days.'},400);
 const items: Array<{id:string;quantity:number}>=[];
 const counts=new Map<string,number>();
 for(const raw of x.items){
  if(!isObj(raw)||!uuid(raw.id)||!integer(raw.quantity,1,12))return response({error:'Please check your food quantities.'},400);
  counts.set(String(raw.id),(counts.get(String(raw.id))||0)+Number(raw.quantity));
 }
 if(counts.size>12||[...counts.values()].some(v=>v>12))return response({error:'Please select up to 12 menu items.'},400);
 for(const [id,quantity] of counts)items.push({id,quantity});
 const db=await dineService();
 if(!db)return response({error:'Dining service temporarily unavailable.'},503);
 const {data:restaurant,error:restaurantError}=await db.from('dine_restaurants')
  .select('id,name,booking_enabled,fssai_verified,preorder_enabled,opens_at,closes_at,min_notice_minutes,table_duration_minutes,prep_buffer_minutes')
  .eq('id',restaurantId).maybeSingle();
 if(restaurantError)return response({error:'Unable to verify restaurant availability.'},503);
 if(!restaurant||!restaurant.booking_enabled||!restaurant.fssai_verified)
  return response({error:'This restaurant is not accepting reservation requests.'},409);
 if(arrivals.getTime()<now+restaurant.min_notice_minutes*MS)
  return response({error:'This restaurant needs more notice. Choose a later time.'},409);
 const time=localTime(arrivals);
 if(time<hhmm(restaurant.opens_at)||time+restaurant.table_duration_minutes>hhmm(restaurant.closes_at))
  return response({error:'Choose a time within the restaurant’s published dining hours.'},409);
 const {data:tables,error:tableError}=await db.from('dine_tables')
  .select('id,seats').eq('restaurant_id',restaurantId).eq('enabled',true).gte('seats',partySize).limit(1);
 if(tableError)return response({error:'Unable to check table details.'},503);
 if(!tables?.length)return response({error:'This restaurant has no suitable table for your group at present.'},409);
 if(items.length&&!restaurant.preorder_enabled)
  return response({error:'This restaurant does not accept meal pre-orders yet.'},409);
 let snapshot:Array<{id:string;name:string;quantity:number;price_paise:number;prep_minutes:number}>=[];
 let total=0,prep=0;
 if(items.length){
  const {data:menu,error:menuError}=await db.from('dine_menu_items')
   .select('id,name,price_paise,prep_minutes,available').eq('restaurant_id',restaurantId)
   .in('id',items.map(i=>i.id));
  if(menuError)return response({error:'Menu could not be checked.'},503);
  const map=new Map((menu||[]).map(m=>[m.id,m]));
  for(const item of items){
   const dish=map.get(item.id);
   if(!dish||!dish.available)return response({error:'A selected dish is unavailable. Please review your order.'},409);
   total+=dish.price_paise*item.quantity;
   prep=Math.max(prep,dish.prep_minutes);
   snapshot.push({id:dish.id,name:dish.name,quantity:item.quantity,price_paise:dish.price_paise,prep_minutes:dish.prep_minutes});
  }
  if(total>10_000_000)return response({error:'Your pre-order is too large.'},400);
 }
 const serveAt=new Date(arrivals.getTime()+Number(x.serveOffsetMinutes)*MS);
 const kitchenMinutes=prep?prep+restaurant.prep_buffer_minutes:0;
 if(kitchenMinutes>0&&serveAt.getTime()-kitchenMinutes*MS<now+5*MS)
  return response({error:'The kitchen needs more advance notice to prepare these dishes fresh. Please choose a later arrival.'},409);
 const {data:existing,error:existingError}=await db.from('dine_bookings')
  .select('id,status').eq('customer_id',user.id).eq('restaurant_id',restaurantId)
  .eq('arrival_at',fmt(arrivals)).in('status',['REQUESTED','CONFIRMED']).limit(1);
 if(existingError)return response({error:'Unable to check existing requests.'},503);
 if(existing?.length)return response({error:'You already have a request for this restaurant and arrival time. Check My dining requests.'},409);
 const {data,error}=await db.from('dine_bookings').insert({
  restaurant_id:restaurantId,customer_id:user.id,contact_name:contactName,contact_phone:contactPhone,
  party_size:partySize,arrival_at:fmt(arrivals),requested_serve_at:fmt(serveAt),
  prep_minutes:prep,dining_minutes:restaurant.table_duration_minutes,
  preordered_items:snapshot,estimated_total_paise:total,notes,
 }).select('id,status,arrival_at,requested_serve_at').single();
 if(error)return response({error:'Unable to save your request. No booking or charge was made. Please try again.'},503);
 return response({booking:data,note:'Request received. Not confirmed. Restaurant must accept a real table and proposed kitchen serving time. No payment was collected.'},201);
}

export async function PATCH(request:Request){
 const user=await dineUser(request);
 if(!user)return response({error:'Sign in to cancel your request.'},401);
 let x:Record<string,unknown>;
 try{const v:unknown=await request.json();if(!isObj(v))throw Error();x=v;}catch{return response({error:'Invalid cancellation request.'},400);}
 if(x.action!=='cancel'||!uuid(x.bookingId))return response({error:'Invalid cancellation request.'},400);
 const db=await dineService();
 if(!db)return response({error:'Dining service unavailable.'},503);
 // Cancel only your own request, before its scheduled arrival. No fees/charges are assessed.
 const {data,error}=await db.from('dine_bookings').update({status:'CANCELLED',updated_at:new Date().toISOString()})
   .eq('id',x.bookingId).eq('customer_id',user.id).in('status',['REQUESTED','CONFIRMED'])
   .gt('arrival_at',new Date().toISOString()).select('id').maybeSingle();
 return error?response({error:'Unable to cancel right now.'},503)
  :!data?response({error:'This request cannot be cancelled online. Contact support.'},409)
  :response({ok:true,note:'Your request was cancelled. No payment was charged.'});
}
