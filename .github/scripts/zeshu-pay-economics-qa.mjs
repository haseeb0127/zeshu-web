import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {estimatePayContribution} from '../../app/lib/zeshu-pay-economics.ts';

const base={
 amountPaise:19900,
 providerCommissionBps:200,
 paymentGatewayBps:180,
 providerFixedPaise:0,gatewayFixedPaise:0,
 supportCostPaise:50,taxAndOtherCostPaise:0,cashbackPaise:0,
};
const e=estimatePayContribution(base);
assert.equal(e.commissionPaise,398,'₹199 at 2% = ₹3.98');
assert.equal(e.gatewayVariablePaise,358,'₹199 at 1.8% rounds to ₹3.58');
assert.equal(e.totalCostsPaise,408);
assert.equal(e.contributionPaise,-10);
assert.equal(e.viable,false);
assert.equal(e.breakEvenCommissionBps,206);
const profitable=estimatePayContribution({...base,providerCommissionBps:350});
assert.equal(profitable.commissionPaise,697);
assert.equal(profitable.contributionPaise,289);
assert.equal(profitable.viable,true);
const fixed=estimatePayContribution({...base,providerFixedPaise:35,gatewayFixedPaise:20,taxAndOtherCostPaise:42,cashbackPaise:100});
assert.equal(fixed.totalCostsPaise,605);
assert.equal(fixed.contributionPaise,-207);
const invalidCases=[
 {...base,amountPaise:0},
 {...base,amountPaise:-100},
 {...base,providerCommissionBps:10001},
 {...base,providerCommissionBps:NaN},
 {...base,gatewayFixedPaise:-10},
 {...base,amountPaise:19900.5},
 {...base,taxAndOtherCostPaise:Infinity},
];
invalidCases.forEach(input=>assert.throws(()=>estimatePayContribution(input),/INVALID_PAY_ECONOMICS_INPUT/));
const admin=readFileSync('app/admin/pay/page.tsx','utf8');
assert(admin.includes('estimatePayContribution('),'Only pure offline calculation allowed in admin');
assert(admin.includes('examples, not A1Topup or Ezytm rates'),'Commission rate must not masquerade as real provider quote');
assert(admin.includes('Nothing here contacts a provider'),'No provider requests from simulator');
const payPublic=readFileSync('app/pay/page.tsx','utf8');
assert(payPublic.includes('Discovery only'),'Public Pay must still be discovery-only');
const liveRecharge=readFileSync('app/api/process-recharge/route.ts','utf8');
assert(liveRecharge.includes("fulfillment: 'UNAVAILABLE'")&&liveRecharge.includes('status: 503'),
 'No live recharge activation');
const green=readFileSync('app/green/page.tsx','utf8');
assert(green.includes('Zeshu Green is on hold'),'Green must remain paused');
console.log('PASS: offline margin decisions, paise rounding, zero live provider requests, Green freeze and safe Pay launch gates.');
