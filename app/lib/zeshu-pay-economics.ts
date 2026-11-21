/**
 * Offline decision aid for Zeshu Pay; NOT provider price quotes, a tax engine,
 * a settlement record, or permission to debit customer funds.
 *
 * All amounts are in integer paise. Rates are basis points (100 bps = 1%).
 * Tax, refunds, and other transaction costs are estimates entered by the owner,
 * rather than guessed from provider marketing material.
 */
export type PayUnitEconomicsInput = {
 amountPaise:number;
 providerCommissionBps:number;
 paymentGatewayBps:number;
 providerFixedPaise:number;
 gatewayFixedPaise:number;
 supportCostPaise:number;
 taxAndOtherCostPaise:number;
 cashbackPaise:number;
};
export type PayUnitEconomicsResult = {
 commissionPaise:number;
 gatewayVariablePaise:number;
 totalCostsPaise:number;
 contributionPaise:number;
 breakEvenCommissionBps:number;
 viable:boolean;
};
const paise=(v:number)=>Number.isSafeInteger(v)&&v>=0&&v<=100_000_000;
const bps=(v:number)=>Number.isSafeInteger(v)&&v>=0&&v<=10_000;
const roundRate=(amountPaise:number,rateBps:number)=>
 Math.round((amountPaise*rateBps)/10_000);

/** Strictly prevents negative or nonsensical rates/costs from being treated as profitability. */
export function estimatePayContribution(input:PayUnitEconomicsInput):PayUnitEconomicsResult{
 if(!paise(input.amountPaise)||input.amountPaise<100
  ||!bps(input.providerCommissionBps)||!bps(input.paymentGatewayBps)
  ||!paise(input.providerFixedPaise)||!paise(input.gatewayFixedPaise)
  ||!paise(input.supportCostPaise)||!paise(input.taxAndOtherCostPaise)
  ||!paise(input.cashbackPaise))
  throw new Error("INVALID_PAY_ECONOMICS_INPUT");
 const commissionPaise=roundRate(input.amountPaise,input.providerCommissionBps);
 const gatewayVariablePaise=roundRate(input.amountPaise,input.paymentGatewayBps);
 const totalCostsPaise=gatewayVariablePaise+input.providerFixedPaise
  +input.gatewayFixedPaise+input.supportCostPaise
  +input.taxAndOtherCostPaise+input.cashbackPaise;
 const contributionPaise=commissionPaise-totalCostsPaise;
 const breakEvenCommissionBps=Math.ceil((totalCostsPaise*10_000)/input.amountPaise);
 return {
  commissionPaise,gatewayVariablePaise,totalCostsPaise,contributionPaise,
  breakEvenCommissionBps,
  viable:contributionPaise>0,
 };
}
