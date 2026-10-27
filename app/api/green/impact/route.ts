import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';

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
    pilotGoal:{
      eligibleDeliveredOrdersMilestone:1000,
      plannedTreesMin:1,
      plannedTreesMax:2,
      eligibleDeliveredOrdersTracked:null,
      trackingEnabled:false,
      note:'The 1,000-order pilot has no approved live qualifying-order tracker yet. Old tree commitments are not customer orders.',
    },
    plantingPolicy:'The new planned first milestone is 1,000 genuinely eligible delivered orders followed by consideration of 1–2 trees, subject to funding, a suitable planting site, care and evidence. No planted or reserved tree is attributed to each order. Legacy pledge counters are not counts of qualifying orders.',
    plantingReported:planted.count||0,
    verifiedPlanted:verified.count||0,
    isPlantingLive:active,
    countPolicy:'Only evidence-backed VERIFIED records are reported as verified planted. No historical or TEST orders are counted.',
    message:active
      ?'An older funded commitment programme is active but must not be represented as the new 1–2-tree pilot. Planting is verified separately.'
      :'Zeshu Green is planning a small first milestone: explore 1–2 trees after 1,000 eligible future live delivered orders. No tree is currently reserved or planted for any new checkout, and past/TEST orders do not count.',
  });
}
