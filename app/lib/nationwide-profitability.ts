export type NationwideProfitabilityInput = {
  merchandiseRevenue: number;
  productCost: number;
  packagingCost: number;
  handlingCost: number;
  courierCost: number;
  customerShippingCharge: number;
  paymentFeePercent: number;
  returnRtoAllowancePercent: number;
  operatingCostPercent: number;
  discountCost?: number;
  additionalCost?: number;
  minimumContributionRupees: number;
  minimumMarginPercent: number;
};

export type NationwideProfitabilityResult = {
  eligible: boolean;
  contributionRupees: number;
  marginPercent: number;
  totalFulfillmentCost: number;
  reason: 'ELIGIBLE' | 'INVALID_INPUT' | 'CONTRIBUTION_TOO_LOW' | 'MARGIN_TOO_LOW';
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function evaluateNationwideProfitability(input: NationwideProfitabilityInput): NationwideProfitabilityResult {
  const values = [
    input.merchandiseRevenue,
    input.productCost,
    input.packagingCost,
    input.handlingCost,
    input.courierCost,
    input.customerShippingCharge,
    input.paymentFeePercent,
    input.returnRtoAllowancePercent,
    input.operatingCostPercent,
    input.discountCost ?? 0,
    input.additionalCost ?? 0,
    input.minimumContributionRupees,
    input.minimumMarginPercent,
  ];

  if (
    values.some((value) => !Number.isFinite(value) || value < 0)
    || input.paymentFeePercent > 100
    || input.returnRtoAllowancePercent > 100
    || input.operatingCostPercent > 100
    || input.minimumMarginPercent > 100
  ) {
    return {
      eligible: false,
      contributionRupees: 0,
      marginPercent: 0,
      totalFulfillmentCost: 0,
      reason: 'INVALID_INPUT',
    };
  }

  const grossCollected = input.merchandiseRevenue + input.customerShippingCharge;
  const paymentFee = grossCollected * input.paymentFeePercent / 100;
  const returnRtoAllowance = input.merchandiseRevenue * input.returnRtoAllowancePercent / 100;
  const operatingCost = input.merchandiseRevenue * input.operatingCostPercent / 100;
  const totalFulfillmentCost =
    input.productCost
    + input.packagingCost
    + input.handlingCost
    + input.courierCost
    + paymentFee
    + returnRtoAllowance
    + operatingCost
    + (input.discountCost ?? 0)
    + (input.additionalCost ?? 0);

  const contribution = grossCollected - totalFulfillmentCost;
  const marginPercent = grossCollected > 0 ? contribution / grossCollected * 100 : 0;
  const contributionRupees = roundMoney(contribution);
  const roundedMargin = roundMoney(marginPercent);

  if (contributionRupees < input.minimumContributionRupees) {
    return {
      eligible: false,
      contributionRupees,
      marginPercent: roundedMargin,
      totalFulfillmentCost: roundMoney(totalFulfillmentCost),
      reason: 'CONTRIBUTION_TOO_LOW',
    };
  }

  if (roundedMargin < input.minimumMarginPercent) {
    return {
      eligible: false,
      contributionRupees,
      marginPercent: roundedMargin,
      totalFulfillmentCost: roundMoney(totalFulfillmentCost),
      reason: 'MARGIN_TOO_LOW',
    };
  }

  return {
    eligible: true,
    contributionRupees,
    marginPercent: roundedMargin,
    totalFulfillmentCost: roundMoney(totalFulfillmentCost),
    reason: 'ELIGIBLE',
  };
}

export const customerProfitabilityMessage = (
  reason: NationwideProfitabilityResult['reason'],
  addMoreRupees?: number,
) => {
  if (reason === 'ELIGIBLE') return 'India delivery available';
  if (Number.isFinite(addMoreRupees) && Number(addMoreRupees) > 0) {
    return `Add ₹${Math.ceil(Number(addMoreRupees))} more to unlock India delivery`;
  }
  return 'This item is available for local delivery only';
};
