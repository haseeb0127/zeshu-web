import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/** Owner-only planning dashboard. No activation, money movement or planting claim. */
export async function GET(request:Request){
  const admin=await authorizeWhatsAppInboxAdmin(request);
  if(!admin)return out({error:'Zeshu admin sign-in required.'},403);
  const db=admin.service;
  const [program,pledged,reported,verified,voided,razorpayId]=await Promise.all([
    db.from('zeshu_green_program')
      .select('mode,activated_at,planting_partner,partner_public_website,verified_partner_agreement,live_order_payments_verified,tree_unit_budget_paise,funded_tree_quota,updated_at')
      .eq('singleton_id',1).maybeSingle(),
    db.from('zeshu_green_tree_commitments').select('id',{count:'exact',head:true}).eq('status','PLEDGED'),
    db.from('zeshu_green_tree_commitments').select('id',{count:'exact',head:true}).eq('status','PLANTED'),
    db.from('zeshu_green_tree_commitments').select('id',{count:'exact',head:true}).eq('status','VERIFIED'),
    db.from('zeshu_green_tree_commitments').select('id',{count:'exact',head:true}).eq('status','VOID'),
    getRuntimeEnvValue('RAZORPAY_KEY_ID'),
  ]);
  if(program.error||pledged.error||reported.error||verified.error||voided.error||!program.data)
    return out({error:'Tree programme readiness could not be verified. Do not announce live planting.'},503);
  const p=program.data;
  const reserved=(pledged.count||0)+(reported.count||0)+(verified.count||0);
  const quota=Math.max(0,Number(p.funded_tree_quota)||0);
  const unitCost=Number.isSafeInteger(Number(p.tree_unit_budget_paise))&&Number(p.tree_unit_budget_paise)>0
    ?Number(p.tree_unit_budget_paise):null;
  const paymentsEnvironment=razorpayId.startsWith('rzp_live_')?'LIVE'
    :razorpayId.startsWith('rzp_test_')?'TEST':'UNCONFIRMED';
  const gates={
    verifiedPlantingAgreement:p.verified_partner_agreement===true&&typeof p.planting_partner==='string'&&p.planting_partner.trim().length>=3,
    publicPartnerWebsite:typeof p.partner_public_website==='string'&&/^https:\/\/[^\s]+$/.test(p.partner_public_website),
    actualPerTreeCost:unitCost!==null&&unitCost>=100&&unitCost<=100000,
    realFundedQuota:quota>0,
    operatorVerifiedLiveOrders:p.live_order_payments_verified===true,
    paymentGatewayLive:paymentsEnvironment==='LIVE',
    explicitActivation:p.mode==='ACTIVE'&&p.activated_at!==null,
  };
  return out({
    mode:p.mode,
    activatedAt:p.activated_at,
    partner:p.planting_partner,
    partnerWebsite:p.partner_public_website,
    paymentGatewayMode:paymentsEnvironment,
    gates,
    fundedTreeQuota:quota,
    reserved,
    remainingTreeCapacity:Math.max(0,quota-reserved),
    pilotGoal:{
      eligibleDeliveredOrdersMilestone:1000,
      plannedTreesMin:1,
      plannedTreesMax:2,
      eligibleDeliveredOrdersTracked:null,
      trackingEnabled:false,
      note:'The older tree commitment count must never be displayed as progress toward 1,000 actual deliveries.',
    },
    bulkPlantingAuthorized:false,
    plantingBatchPolicy:'New PLANNING goal: consider planting 1–2 trees after the first 1,000 eligible real delivered orders. No eligible live order counter or partner arrangement has been activated. The legacy internal commitment counter is NOT an order counter and must not be used to claim the milestone. Planting, payment and activation remain separate manual decisions.',
    treeUnitBudgetPaise:unitCost,
    totalAllocatedBudgetPaise:unitCost!==null?quota*unitCost:null,
    counts:{pledged:pledged.count||0,reported:reported.count||0,verified:verified.count||0,voided:voided.count||0},
    lastConfigurationUpdate:p.updated_at,
    canAnnouncePerOrderPromise:false, // Old one-tree-per-order infrastructure is NOT the new 1–2-tree pilot.
    communicationPolicy:'Customer copy may explain the planned first 1,000 eligible deliveries and 1–2 possible trees. Do not say every order funds, reserves or plants a tree. Old per-order trigger must be redesigned and explicitly approved before any activation. No payments or carbon-offset claims.',
    changesMade:false,sendingEnabled:false,
  });
}
