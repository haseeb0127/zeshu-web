import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/** Admin-only, read-only unit-economics readiness. No customer wallet writes. */
export async function GET(request:Request){
  const admin=await authorizeWhatsAppInboxAdmin(request);
  if(!admin)return out({error:'Zeshu admin sign-in required.'},403);
  const db=admin.service;
  const [rewards,activeCampaigns,green,razorpay]=await Promise.all([
    db.from('customer_reward_ledger').select('amount,event_type'),
    db.from('category_reward_rules').select('id',{count:'exact',head:true}).eq('enabled',true),
    db.from('zeshu_green_program').select('mode,verified_partner_agreement,funded_tree_quota,tree_unit_budget_paise').eq('singleton_id',1).maybeSingle(),
    getRuntimeEnvValue('RAZORPAY_KEY_ID'),
  ]);
  if(rewards.error||activeCampaigns.error||green.error||!green.data)
    return out({error:'Reward and tree funding readiness cannot be verified.'},503);
  const p=green.data;
  const total=(rewards.data||[]).reduce((sum,row)=>sum+Number(row.amount||0),0);
  const existingOrderRewardCount=(rewards.data||[]).filter(row=>row.event_type==='ORDER_REWARD').length;
  const checkoutMode=razorpay.startsWith('rzp_test_')?'TEST':razorpay.startsWith('rzp_live_')?'LIVE_CONFIGURED':'UNKNOWN';
  return out({
    currentRewards:{
      ledgerPresent:true,
      creditedEntries:(rewards.data||[]).length,
      creditedValueRupees:Math.round(total*100)/100,
      orderRewardEntries:existingOrderRewardCount,
      categoryCampaignsEnabled:activeCampaigns.count||0,
      historicalRecordsMayBeTest:true,
      profitShare70PercentActive:false,
    },
    proposedModel:{customerSharePercent:70,maintenancePercent:15,zeshuRetainedPercent:15,
      onlyPositiveVerifiedNetContribution:true,
      paymentsMustBeSettled:true,
      refundsAndCancelledOrdersExcluded:true,
      otherPromotionsMustBeBudgeted:true,
      redemptionIsClosedLoopPendingLegalReview:true,
    },
    treeProgram:{status:p.mode,verifiedPartnerAgreement:p.verified_partner_agreement===true,
      fundedQuota:p.funded_tree_quota||0,
      careCostVerified:p.tree_unit_budget_paise!==null&&p.tree_unit_budget_paise>0,
      orderLevelPlantingActive:false,
    },
    checkoutMode,
    customerCashbackActivatedByThisReport:false,
    treeCommitmentsCreatedByThisReport:0,
    paymentOrProviderCallsPerformed:false,
    note:'Legacy small delivered-order rewards exist. This private calculator and readiness report do not enable new reward payouts, tree planting or customer claims. The owner-paused Green programme remains paused.',
  });
}
