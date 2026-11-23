import {dineService} from '@/app/lib/dine-server';
import {dineError,dineOk,dineUuid} from '@/app/lib/dine-lite';
export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Private-by-capability order tracking: requires both random order and retry keys.
 * Never reveal guest names, menu quantities, staff details or phone numbers. */
export async function GET(request:Request){
 const u=new URL(request.url);
 const orderId=u.searchParams.get('order')||'',key=u.searchParams.get('key')||'';
 if(!dineUuid(orderId)||!dineUuid(key))return dineError('Invalid order receipt.',400);
 const db=await dineService();
 if(!db)return dineError('Status unavailable.',503);
 const {data,error}=await db.from('dine_table_orders')
  .select('status,updated_at').eq('id',orderId).eq('idempotency_key',key).maybeSingle();
 if(error)return dineError('Unable to check order status.',503);
 if(!data)return dineError('Order receipt not found.',404);
 return dineOk({status:data.status,updatedAt:data.updated_at,note:'This is a kitchen request status, not a payment receipt.'});
}
