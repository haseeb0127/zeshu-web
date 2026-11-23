import 'server-only';
import { createHash } from 'node:crypto';
import { dineService, dineUser } from '@/app/lib/dine-server';

export type DineStaffRole = 'OWNER' | 'MANAGER' | 'WAITER' | 'KITCHEN';
export const dineUuid = (s:unknown):s is string =>
  typeof s==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export const dineError=(error:string,status=400)=>Response.json({error},{status,headers:{'Cache-Control':'private, no-store'}});
export const dineOk=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export const dineInt=(v:unknown,low:number,high:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=low&&v<=high;
export const dineText=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';
export function fingerprint(request:Request):string|null {
  // Trust only the trusted Cloudflare-derived connecting IP header. Never trust
  // a client-supplied forwarding chain for billing / request decisions.
  const ip=request.headers.get('cf-connecting-ip');
  if(!ip||ip.length>64||!/^[\da-fA-F.:]+$/.test(ip))return null;
  const agent=(request.headers.get('user-agent')||'').slice(0,150);
  const day=new Date().toISOString().slice(0,10);
  return createHash('sha256').update([ip,agent,day,'dine-lite-v1'].join('|')).digest('hex');
}
export async function dineStaffAccess(request:Request, restaurantId?:string){
  const user=await dineUser(request);
  if(!user)return null;
  const db=await dineService();
  if(!db)return null;
  let query=db.from('dine_restaurant_staff')
    .select('restaurant_id,role').eq('user_id',user.id).eq('active',true).limit(30);
  if(restaurantId)query=query.eq('restaurant_id',restaurantId);
  const {data,error}=await query;
  if(error)return null;
  return {db,user,roles:data||[]};
}
