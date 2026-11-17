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
      treePerEligibleDeliveredOrder:1,
      eligibleDeliveredOrdersTracked:null,
      trackingEnabled:false,
      fundingConfirmed:false,
      plantingPartnerConfirmed:Boolean(program.data.planting_partner),
      note:'One tree per eligible completed delivery order is a programme goal, not an active funded commitment. Do not count, reserve or claim trees until funding, partner, permissions, care and order-level tracking are approved.',
    },
    plantingPolicy:'Zeshu goal: fund one tree for each eligible completed delivery order without adding a customer checkout fee. The programme remains PLANNING until per-order funding, a suitable local planting partner, land permissions, long-term care and order-level reconciliation are confirmed. Cancellations, refunds and TEST orders do not qualify. Legacy pledge counters are not counts of qualifying customer orders.',
    plantingReported:planted.count||0,
    verifiedPlanted:verified.count||0,
    isPlantingLive:active,
    countPolicy:'Only evidence-backed VERIFIED records are reported as verified planted. No historical or TEST orders are counted.',
    message:active
      ?'An older funded commitment programme is active but must not be represented as the new 1–2-tree pilot. Planting is verified separately.'
      :'Zeshu Green is preparing a one-tree-per-eligible-delivered-order goal. It is not yet funded or live: no tree is reserved or planted for a new checkout. Cancellations, refunds and TEST orders do not count.',
  });
}
