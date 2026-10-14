import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';
import {greenBatchProgress} from '@/app/lib/zeshu-green-batch';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};
const respond=(body:object,status=200)=>NextResponse.json(body,{status,headers});

/** Public aggregate-only programme disclosure. No private order IDs, partner
 * contract information or customer details may leave this endpoint. */
export async function GET(){
  const env=await getRuntimeSupabaseEnv();
  if(!env.url||!env.serviceRoleKey)return respond({error:'Tree programme information is temporarily unavailable.'},503);
  const db=createClient(env.url,env.serviceRoleKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  const [program,committed,planted,verified]=await Promise.all([
    db.from('zeshu_green_program').select('mode,activated_at,planting_partner,partner_public_website')
      .eq('singleton_id',1).maybeSingle(),
    db.from('zeshu_green_tree_commitments').select('id',{count:'exact',head:true}).neq('status','VOID'),
    db.from('zeshu_green_tree_commitments').select('id',{count:'exact',head:true}).in('status',['PLANTED','VERIFIED']),
    db.from('zeshu_green_tree_commitments').select('id',{count:'exact',head:true}).eq('status','VERIFIED'),
  ]);
  if(program.error||committed.error||planted.error||verified.error||!program.data)
    return respond({error:'Verified planting statistics are temporarily unavailable.'},503);
  const active=program.data.mode==='ACTIVE';
  return respond({
    programmeStatus:program.data.mode,
    partner:active&&program.data.planting_partner?program.data.planting_partner:null,
    partnerWebsite:active&&program.data.partner_public_website?program.data.partner_public_website:null,
    treeCommitments:committed.count||0,
    plantingBatch:greenBatchProgress(committed.count||0),
    plantingPolicy:'The 10,000-order milestone is a target for a coordinated seasonal planting campaign, not proof of 10,000 trees planted or a guarantee of one planting day. Actual planting requires a vetted partner, approved land, available funding and documented evidence.',
    plantingReported:planted.count||0,
    verifiedPlanted:verified.count||0,
    isPlantingLive:active,
    countPolicy:'Only evidence-backed VERIFIED records are reported as verified planted. No historical or TEST orders are counted.',
    message:active
      ?'A verified planting partner and funded tree quota are on file. One tree slot is reserved for each newly eligible delivered order while the funded quota lasts. Planting is verified separately.'
      :'Zeshu Green is being prepared or paused. No one-tree-per-order promise is active. Past/test orders do not count as planted trees.',
  });
}
