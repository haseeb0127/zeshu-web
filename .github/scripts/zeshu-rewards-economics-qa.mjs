import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateZeshuRewardEconomics as calc} from '../../app/lib/zeshu-reward-economics.ts';

const input={
 earnedCommissionPaise:4000,netDeliveryMarginPaise:-1000,
 paymentFeesPaise:500,supportCostPaise:200,taxAndOtherCostsPaise:300,
 refundReservePaise:300,existingRewardCostPaise:200,treeCareCostPaise:0,
};
const liveScenario=calc(input);
assert.equal(liveScenario.profitBeforeTreePaise,1500);
assert.equal(liveScenario.distributableProfitPaise,1500);
assert.equal(liveScenario.illustrativeCustomerCashbackPaise,1050);
assert.equal(liveScenario.illustrativeMaintenancePaise,225);
assert.equal(liveScenario.illustrativeZeshuRetainedPaise,225);
assert.equal(liveScenario.illustrativeCustomerCashbackPaise+
 liveScenario.illustrativeMaintenancePaise+liveScenario.illustrativeZeshuRetainedPaise,1500);
const tree=calc({...input,treeCareCostPaise:1000});
assert.equal(tree.distributableProfitPaise,500);
assert.equal(tree.illustrativeCustomerCashbackPaise,350);
assert.equal(tree.illustrativeMaintenancePaise,75);
assert.equal(tree.illustrativeZeshuRetainedPaise,75);
const noCommission=calc({...input,earnedCommissionPaise:0,netDeliveryMarginPaise:0});
assert.equal(noCommission.sustainable,false);
assert.equal(noCommission.illustrativeCustomerCashbackPaise,0);
const tooMuchTree=calc({...input,treeCareCostPaise:2000});
assert.equal(tooMuchTree.sustainable,false);
assert.equal(tooMuchTree.illustrativeCustomerCashbackPaise,0);
const rounding=calc({...input,earnedCommissionPaise:2501});
assert.equal(rounding.illustrativeCustomerCashbackPaise+
 rounding.illustrativeMaintenancePaise+rounding.illustrativeZeshuRetainedPaise,
 Math.max(0,rounding.distributableProfitPaise));
for(const illegal of [-1,NaN,Infinity,1.5,200_000_000])
 assert.throws(()=>calc({...input,earnedCommissionPaise:illegal}),/INVALID_ZESHU_ECONOMICS_INPUT/);
assert.throws(()=>calc({...input,netDeliveryMarginPaise:Infinity}),/INVALID_ZESHU_ECONOMICS_INPUT/);

const route=readFileSync('app/api/admin/rewards/readiness/route.ts','utf8');
assert(route.includes('authorizeWhatsAppInboxAdmin(request)'),'Admin-only status required');
assert(route.includes("profitShare70PercentActive:false"),'Do not misrepresent cashback as live');
assert(route.includes("customerCashbackActivatedByThisReport:false"),'Calculator is never a payout');
assert(route.includes("treeCommitmentsCreatedByThisReport:0"),'No auto tree commitments');
assert(!route.includes("method:'POST'")&&!route.includes('.insert(')&&!route.includes('.update('),
 'Readiness must not write customer or provider records');

const page=readFileSync('app/admin/rewards/page.tsx','utf8');
assert(page.includes('calculateZeshuRewardEconomics'));
assert(page.includes('70% customer cashback / 15% maintenance / 15% Zeshu'));
assert(page.includes('treeProgram.status'));
assert(page.includes('No rewards or tree commitments are created by this page.'));
const dashboard=readFileSync('app/admin/dashboard/page.tsx','utf8');
assert(dashboard.includes('href="/admin/rewards"'),'Provide owner shortcut');
const green=readFileSync('app/green/page.tsx','utf8');
assert(green.includes('GreenPausedPage'),'Owner Green pause remains untouched');
console.log('PASS: No-loss 70/15/15 economics, tree cost first, private funding status, no live payout or planting.');
