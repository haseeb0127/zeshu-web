import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0'};
const json=(body:object,status=200)=>NextResponse.json(body,{status,headers});
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/** Private per-order planting evidence: customer can see only THEIR OWN order. */
export async function GET(request:Request){
 const url=new URL(request.url);
 const id=url.searchParams.get('orderId')||'';
 if(!uuid.test(id))return json({error:'Invalid order reference.'},400);
 const authorization=request.headers.get('Authorization')||'';
 const token=authorization.startsWith('Bearer ')?authorization.slice(7).trim():'';
 if(!token)return json({error:'Sign in to view your order impact.'},401);
 const env=await getRuntimeSupabaseEnv();
 if(!env.url||!env.anonKey||!env.serviceRoleKey)return json({error:'Order impact temporarily unavailable.'},503);
 const auth=createClient(env.url,env.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data:{user},error:authError}=await auth.auth.getUser(token);
 if(authError||!user)return json({error:'Sign in to view your order impact.'},401);
 const service=createClient(env.url,env.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data:order,error:orderError}=await service.from('orders').select('id,status,created_at')
   .eq('id',id).eq('user_id',user.id).maybeSingle();
 if(orderError)return json({error:'Order impact temporarily unavailable.'},503);
 if(!order)return json({error:'Order unavailable.'},404);
 const [program,pledge]=await Promise.all([
  service.from('zeshu_green_program').select('mode,activated_at').eq('singleton_id',1).maybeSingle(),
  service.from('zeshu_green_tree_commitments')
    .select('status,planted_at,verified_at,proof_url,native_species,planting_area')
    .eq('order_id',order.id).maybeSingle(),
 ]);
 if(program.error||pledge.error||!program.data)return json({error:'Order impact temporarily unavailable.'},503);
 const status=pledge.data?.status;
 // Never treat a cancelled/voided or test/historical order as a planted tree.
 const verified=status==='VERIFIED'&&typeof pledge.data?.proof_url==='string'
   &&/^https:\/\/[^\s]+$/i.test(pledge.data?.proof_url)
   &&!!pledge.data?.verified_at;
 return json({
  programmeStatus:program.data.mode,
  orderStatus:order.status,
  commitmentStatus:status==='PLEDGED'||status==='PLANTED'||status==='VERIFIED'||status==='VOID'?status:'NONE',
  treeCount:verified?1:0,
  treeEvidence:verified?{
    evidenceUrl:pledge.data.proof_url,
    nativeSpecies:pledge.data?.native_species,
    plantingArea:pledge.data?.planting_area,
    plantedAt:pledge.data?.planted_at,
    verifiedAt:pledge.data.verified_at,
  }:null,
  programmeLink:'/green',
  policy:'One eligible delivered order may reserve one funded tree slot after launch; it is not one tree per item. No tree is planted merely on payment. Only independently evidenced trees are called verified planted. Historical/TEST/refunded orders do not count.',
 });
}
