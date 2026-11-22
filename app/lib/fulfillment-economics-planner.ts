/**
 * Admin-only fulfillment planning math. This is NOT the customer checkout
 * pricing engine and must not be used to authorize or price a live order.
 * All fee inputs are assumed to be net of applicable taxes; tax treatment and
 * merchant-of-record responsibility must be separately verified.
 */
export type FulfillmentPlanningInput = {
  merchandiseSubtotal: number;
  customerHandlingFee: number;
  sellerDispatchFee: number;
  collectedMonthlySubscriptions: number;
  monthlyDeliveredOrders: number;
  customerDeliveryCharge: number;
  actualDeliveryCost: number;
  rewardProvision: number;
  paymentFeePercent: number;
  returnRiskPercent: number;
  operatingCostPercent: number;
  otherPerOrderCost: number;
  minimumContribution: number;
};

export type FulfillmentPlanningResult = {
  valid: boolean;
  feeRevenue: number;
  subscriptionAllocation: number;
  netDeliveryRecovery: number;
  paymentExpense: number;
  returnReserve: number;
  operatingReserve: number;
  totalCosts: number;
  estimatedContribution: number;
  targetGap: number;
  meetsTarget: boolean;
};

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function estimateFulfillmentPlanning(input: FulfillmentPlanningInput): FulfillmentPlanningResult {
  const values = Object.values(input);
  const valid = values.every(value => Number.isFinite(value) && value >= 0)
    && input.monthlyDeliveredOrders > 0
    && input.paymentFeePercent <= 100
    && input.returnRiskPercent <= 100
    && input.operatingCostPercent <= 100;

  if (!valid) {
    return {
      valid: false, feeRevenue: 0, subscriptionAllocation: 0,
      netDeliveryRecovery: 0, paymentExpense: 0, returnReserve: 0,
      operatingReserve: 0, totalCosts: 0, estimatedContribution: 0,
      targetGap: 0, meetsTarget: false,
    };
  }

  // Subscription is counted only if actually collected, not projected signups.
  // Accounting allocation is informative: it does not mean an individual order
  // earned an incremental subscription payment.
  const subscriptionAllocation = input.collectedMonthlySubscriptions / input.monthlyDeliveredOrders;
  const feeRevenue = input.customerHandlingFee + input.sellerDispatchFee;
  const netDeliveryRecovery = input.customerDeliveryCharge - input.actualDeliveryCost;

  // Assumes Zeshu processes the whole customer order. If the merchant of
  // record/payment settlement differs, verify actual PSP settlement statements.
  const paymentBase = input.merchandiseSubtotal + input.customerHandlingFee + input.customerDeliveryCharge;
  const paymentExpense = paymentBase * input.paymentFeePercent / 100;
  const returnReserve = input.merchandiseSubtotal * input.returnRiskPercent / 100;
  const operatingReserve = input.merchandiseSubtotal * input.operatingCostPercent / 100;
  const totalCosts = input.actualDeliveryCost + input.rewardProvision
    + input.otherPerOrderCost + paymentExpense + returnReserve + operatingReserve;
  const contribution = feeRevenue + subscriptionAllocation + input.customerDeliveryCharge - totalCosts;

  return {
    valid: true,
    feeRevenue: round(feeRevenue),
    subscriptionAllocation: round(subscriptionAllocation),
    netDeliveryRecovery: round(netDeliveryRecovery),
    paymentExpense: round(paymentExpense),
    returnReserve: round(returnReserve),
    operatingReserve: round(operatingReserve),
    totalCosts: round(totalCosts),
    estimatedContribution: round(contribution),
    targetGap: round(Math.max(0, input.minimumContribution - contribution)),
    meetsTarget: contribution >= input.minimumContribution,
  };
}
