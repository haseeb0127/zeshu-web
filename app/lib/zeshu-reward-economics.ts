/**
 * Private planning model for Zeshu marketplace and services.
 * NOT a customer reward, an invoice, a payment/settlement rule, or a tree commitment.
 * All money is an integer number of paise, never gross customer GMV.
 *
 * "70% cashback / 15% maintenance / 15% Zeshu" applies only AFTER:
 * verified provider commission + net delivery margin - all operating costs,
 * existing rewards, refund reserves, and (if separately approved) tree aftercare.
 */
export type RewardEconomicsInput = {
  earnedCommissionPaise:number;
  netDeliveryMarginPaise:number; // can be negative
  paymentFeesPaise:number;
  supportCostPaise:number;
  taxAndOtherCostsPaise:number;
  refundReservePaise:number;
  existingRewardCostPaise:number;
  treeCareCostPaise:number;
};
export type RewardEconomicsResult = {
  profitBeforeTreePaise:number;
  illustrativeTreeReservePaise:number;
  distributableProfitPaise:number;
  illustrativeCustomerCashbackPaise:number;
  illustrativeMaintenancePaise:number;
  illustrativeZeshuRetainedPaise:number;
  sustainable:boolean;
  note:string;
};
const cost=(v:number)=>Number.isSafeInteger(v)&&v>=0&&v<=100_000_000;
const margin=(v:number)=>Number.isSafeInteger(v)&&Math.abs(v)<=100_000_000;
export function calculateZeshuRewardEconomics(x:RewardEconomicsInput):RewardEconomicsResult{
  if(!cost(x.earnedCommissionPaise)||!margin(x.netDeliveryMarginPaise)
    ||!cost(x.paymentFeesPaise)||!cost(x.supportCostPaise)
    ||!cost(x.taxAndOtherCostsPaise)||!cost(x.refundReservePaise)
    ||!cost(x.existingRewardCostPaise)||!cost(x.treeCareCostPaise))
    throw Error('INVALID_ZESHU_ECONOMICS_INPUT');
  const revenue=x.earnedCommissionPaise+x.netDeliveryMarginPaise;
  const operatingCosts=x.paymentFeesPaise+x.supportCostPaise+
   x.taxAndOtherCostsPaise+x.refundReservePaise+x.existingRewardCostPaise;
  const beforeTree=revenue-operatingCosts;
  // Do not assume an unfunded tree can be pledged. This is scenario math only.
  const afterTree=beforeTree-x.treeCareCostPaise;
  const available=Math.max(0,afterTree);
  const customer=Math.floor(available*70/100);
  const maintenance=Math.floor(available*15/100);
  const retained=available-customer-maintenance;
  return {
    profitBeforeTreePaise:beforeTree,
    illustrativeTreeReservePaise:x.treeCareCostPaise,
    distributableProfitPaise:afterTree,
    illustrativeCustomerCashbackPaise:customer,
    illustrativeMaintenancePaise:maintenance,
    illustrativeZeshuRetainedPaise:retained,
    sustainable:afterTree>0,
    note:'Offline scenario only. No cashback, customer wallet credit, tree allocation, paid provider call or automatic order activation.',
  };
}
