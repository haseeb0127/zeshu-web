import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'};
const respond=(value:object,status=200)=>NextResponse.json(value,{status,headers});
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Owner-only disclosure of one order's green programme status.
 * A payment or checkout confirmation is never evidence that a tree was planted.
 * Tree records remain hidden from anon/authenticated Data API clients via RLS.
 */
export async function GET(request:Request,context:{params:Promise<{id:string}>}){
 const {id}=await context.params;
 if(!idPattern.test(id))return respond({error:'Invalid order reference.'},400);
 const access=request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9._~-]{20,8192})$/)?.[1];
 if(!access)return respond({error:'Sign in to view your order impact.'},401);
 const env=await getRuntimeSupabaseEnv();
 if(!env.url||!env.anonKey||!env.serviceRoleKey)return respond({error:'Order impact temporarily unavailable.'},503);
 const customer=createClient(env.url,env.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data:{user},error:authError}=await customer.auth.getUser(access);
 if(authError||!user)return respond({error:'Sign in to view your order impact.'},401);
 const db=createClient(env.url,env.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data:order,error:orderError}=await db.from('orders')
   .select('id,user_id,status,created_at').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(orderError)return respond({error:'Order impact temporarily unavailable.'},503);
 if(!order)return respond({error:'Order not found.'},404);
 const [cfg,entry]=await Promise.all([
   db.from('zeshu_green_program').select('mode,activated_at').eq('singleton_id',1).maybeSingle(),
   db.from('zeshu_green_tree_commitments')
    .select('status,planted_at,verified_at,proof_url,native_species,planting_area')
    .eq('order_id',order.id).maybeSingle(),
 ]);
 if(cfg.error||entry.error||!cfg.data)return respond({error:'Order impact temporarily unavailable.'},503);
 const commitment=entry.data;
 if(commitment){
   const status=commitment.status==='PLEDGED'?'PLEDGED'
    :commitment.status==='PLANTED'?'REPORTED'
    :commitment.status==='VERIFIED'?'VERIFIED'
    :commitment.status==='VOID'?'VOID':'UNAVAILABLE';
   return respond({
     status,treeCount:status==='VOID'||status==='UNAVAILABLE'?0:1,
     verifiedTreeCount:status==='VERIFIED'?1:0,
     proofUrl:status==='VERIFIED'&&typeof commitment.proof_url==='string'
       &&/^https:\/\/[^\s]+$/.test(commitment.proof_url)?commitment.proof_url:null,
     plantedAt:status==='VERIFIED'?commitment.planted_at:null,
     verifiedAt:status==='VERIFIED'?commitment.verified_at:null,
     nativeSpecies:status==='VERIFIED'?commitment.native_species:null,
     plantingArea:status==='VERIFIED'?commitment.planting_area:null,
     feePaise:0,
   });
 }
 const eligibleFutureOrder=cfg.data.mode==='ACTIVE'&&Boolean(cfg.data.activated_at)
   &&new Date(order.created_at).getTime()>=new Date(cfg.data.activated_at).getTime();
 const status=order.status==='CANCELLED'?'INELIGIBLE'
  :order.status==='DELIVERED'?'NOT_RECORDED'
  :eligibleFutureOrder?'AWAITING_DELIVERY'
  :cfg.data.mode==='ACTIVE'?'INELIGIBLE'
  :cfg.data.mode==='PAUSED'?'PAUSED':'PLANNING';
 return respond({status,treeCount:0,verifiedTreeCount:0,proofUrl:null,
   plantedAt:null,verifiedAt:null,nativeSpecies:null,plantingArea:null,feePaise:0});
}
