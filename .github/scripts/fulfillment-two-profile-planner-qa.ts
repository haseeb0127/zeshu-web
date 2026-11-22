import fs from "node:fs";
import assert from "node:assert/strict";
import { estimateFulfillmentPlanning, type FulfillmentPlanningInput } from "../../app/lib/fulfillment-economics-planner.ts";

const base: FulfillmentPlanningInput = {
  merchandiseSubtotal: 500,
  customerHandlingFee: 15,
  sellerDispatchFee: 15,
  collectedMonthlySubscriptions: 0,
  monthlyDeliveredOrders: 1,
  customerDeliveryCharge: 65,
  actualDeliveryCost: 65,
  rewardProvision: 3,
  paymentFeePercent: 2,
  returnRiskPercent: 5,
  operatingCostPercent: 3,
  otherPerOrderCost: 0,
  minimumContribution: 25,
};

const result = estimateFulfillmentPlanning(base);
assert.equal(result.valid, true);
assert.equal(result.feeRevenue, 30);
assert.equal(result.subscriptionAllocation, 0);
assert.equal(result.netDeliveryRecovery, 0);
assert.equal(result.paymentExpense, 11.6);
assert.equal(result.returnReserve, 25);
assert.equal(result.operatingReserve, 15);
assert.equal(result.estimatedContribution, -24.6);
assert.equal(result.meetsTarget, false);
assert.equal(result.targetGap, 49.6);

const sub = estimateFulfillmentPlanning({ ...base, collectedMonthlySubscriptions: 299, monthlyDeliveredOrders: 100 });
assert.equal(sub.subscriptionAllocation, 2.99);
assert.equal(sub.estimatedContribution, -21.61);

const local = estimateFulfillmentPlanning({
  ...base,
  merchandiseSubtotal: 349,
  customerHandlingFee: 10,
  sellerDispatchFee: 0,
  customerDeliveryCharge: 30,
  actualDeliveryCost: 30,
  paymentFeePercent: 2,
  returnRiskPercent: 1,
  operatingCostPercent: 3,
  minimumContribution: 0,
});
assert.equal(local.feeRevenue, 10);
assert(local.estimatedContribution < 7, "Local ₹10 fee less ₹3 reward is not net profit after rider, payment and operating costs");

assert.equal(estimateFulfillmentPlanning({ ...base, monthlyDeliveredOrders: 0 }).valid, false);
assert.equal(estimateFulfillmentPlanning({ ...base, customerHandlingFee: -2 }).valid, false);
assert.equal(estimateFulfillmentPlanning({ ...base, returnRiskPercent: 101 }).valid, false);

const page = fs.readFileSync("app/admin/fulfillment/page.tsx", "utf8");
const planner = fs.readFileSync("app/components/FulfillmentEconomicsPlanner.tsx", "utf8");
const checkout = fs.readFileSync("app/api/create-razorpay-order/route.ts", "utf8");
assert(page.includes("<FulfillmentEconomicsPlanner"), "Admin must display planning profiles");
assert(page.includes("Live nationwide profitability gate"), "Existing live nationwide settings must be clearly distinguished");
assert(planner.includes("SIMULATION ONLY"), "Planning scenarios must not look like live tariffs");
assert(planner.includes("Nothing here is saved or applied to checkout"), "Planner must disclose non-live semantics");
assert(checkout.includes("evaluateNationwideProfitability"), "National checkout safety gate must remain in place");
assert(checkout.includes("handling_fee: 0"), "Planning fees must not silently alter checkout handling charges");
console.log("FULFILLMENT_TWO_PROFILE_PLANNER_QA=PASS");
