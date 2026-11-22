"use client";

import { useEffect, useMemo, useState } from "react";
import {
  estimateFulfillmentPlanning,
  type FulfillmentPlanningInput,
} from "@/app/lib/fulfillment-economics-planner";

type Props = {
  liveNationalMinimum: number;
  livePaymentFeePercent: number;
  liveRtoPercent: number;
  liveOperatingPercent: number;
  nationwideCheckoutEnabled: boolean;
};

const localDefaults: FulfillmentPlanningInput = {
  merchandiseSubtotal: 349,
  customerHandlingFee: 10,
  sellerDispatchFee: 0,
  collectedMonthlySubscriptions: 0,
  monthlyDeliveredOrders: 2250,
  customerDeliveryCharge: 0,
  actualDeliveryCost: 30,
  rewardProvision: 3,
  paymentFeePercent: 2,
  returnRiskPercent: 1,
  operatingCostPercent: 3,
  otherPerOrderCost: 0,
  minimumContribution: 0,
};

const nationwideDefaults: FulfillmentPlanningInput = {
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

const rupees = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fields: { key: keyof FulfillmentPlanningInput; label: string; hint?: string }[] = [
  { key: "merchandiseSubtotal", label: "Customer basket value ₹" },
  { key: "customerHandlingFee", label: "Proposed customer handling ₹" },
  { key: "sellerDispatchFee", label: "Proposed seller dispatch fee ₹" },
  { key: "collectedMonthlySubscriptions", label: "Subscription revenue actually collected / month ₹", hint: "Enter 0 until subscription payments are real and reconciled." },
  { key: "monthlyDeliveredOrders", label: "Delivered orders / month" },
  { key: "customerDeliveryCharge", label: "Customer delivery charge ₹" },
  { key: "actualDeliveryCost", label: "Courier / rider expense ₹" },
  { key: "rewardProvision", label: "Cashback / Zeshu Cash provision ₹" },
  { key: "paymentFeePercent", label: "Actual payment processing allowance %" },
  { key: "returnRiskPercent", label: "Refund / RTO risk allowance %" },
  { key: "operatingCostPercent", label: "Operations allowance %" },
  { key: "otherPerOrderCost", label: "Packaging, support and other costs ₹" },
  { key: "minimumContribution", label: "Contribution target ₹" },
];

function ScenarioCard({
  label,
  description,
  value,
  onChange,
  operationalNote,
}: {
  label: string;
  description: string;
  value: FulfillmentPlanningInput;
  onChange: (next: FulfillmentPlanningInput) => void;
  operationalNote: string;
}) {
  const estimate = useMemo(() => estimateFulfillmentPlanning(value), [value]);
  const setField = (key: keyof FulfillmentPlanningInput, input: string) =>
    onChange({ ...value, [key]: input === "" ? NaN : Number(input) });

  return <article className="rounded-3xl border border-[#dce9de] bg-white p-4 md:p-5">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-base font-black text-[#075E45]">{label}</h3>
      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">SIMULATION ONLY</span>
    </div>
    <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
    <p className="mt-2 text-[11px] font-semibold text-amber-800">{operationalNote}</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {fields.map(field => <label key={field.key} className="text-[11px] font-bold text-[#53635a]">
        {field.label}
        <input type="number" min="0" step="0.01" value={Number.isFinite(value[field.key]) ? value[field.key] : ""} onChange={event => setField(field.key, event.target.value)}
          className="mt-1 block w-full rounded-lg border border-[#dae6dc] bg-[#fbfdfb] px-2.5 py-2 text-sm font-bold text-[#14251b] outline-none focus:border-[#087443]"/>
        {field.hint && <span className="mt-1 block text-[10px] font-medium leading-4 text-slate-500">{field.hint}</span>}
      </label>)}
    </div>
    <div className="mt-4 rounded-2xl bg-[#f5f8f4] p-3">
      {!estimate.valid
        ? <p className="text-sm font-bold text-red-700">Enter valid non-negative amounts, percentages up to 100 and at least one delivered order.</p>
        : <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black text-[#53635a]">Estimated contribution after modeled costs</p>
            <p className={`text-xl font-black ${estimate.meetsTarget ? "text-[#075E45]" : "text-red-700"}`}>{rupees(estimate.estimatedContribution)}</p>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {estimate.meetsTarget ? "Meets this illustrative target" : `Below target by ${rupees(estimate.targetGap)}`}
            {" · "}Subscription allocated: {rupees(estimate.subscriptionAllocation)}/order
          </p>
          <div className="mt-2 grid gap-1 text-[11px] text-slate-600 sm:grid-cols-2">
            <p>Fees from customer + seller: {rupees(estimate.feeRevenue)}</p>
            <p>Delivery recovery after courier/rider: {rupees(estimate.netDeliveryRecovery)}</p>
            <p>Payment expense: {rupees(estimate.paymentExpense)}</p>
            <p>Refund / RTO reserve: {rupees(estimate.returnReserve)}</p>
            <p>Operations reserve: {rupees(estimate.operatingReserve)}</p>
          </div>
        </>}
    </div>
  </article>;
}

export default function FulfillmentEconomicsPlanner({
  liveNationalMinimum,
  livePaymentFeePercent,
  liveRtoPercent,
  liveOperatingPercent,
  nationwideCheckoutEnabled,
}: Props) {
  const [local, setLocal] = useState(localDefaults);
  const [national, setNational] = useState(nationwideDefaults);

  useEffect(() => {
    setNational(current => ({
      ...current,
      minimumContribution: Number.isFinite(liveNationalMinimum) ? liveNationalMinimum : 25,
      paymentFeePercent: Number.isFinite(livePaymentFeePercent) ? livePaymentFeePercent : 2,
      returnRiskPercent: Number.isFinite(liveRtoPercent) ? liveRtoPercent : 5,
      operatingCostPercent: Number.isFinite(liveOperatingPercent) ? liveOperatingPercent : 3,
    }));
  }, [liveNationalMinimum, livePaymentFeePercent, liveRtoPercent, liveOperatingPercent]);

  return <section className="mt-5 rounded-3xl border border-[#dce7dd] bg-[linear-gradient(135deg,#eff8f0,#f8faf6)] p-4 md:p-5" aria-label="Local and nationwide economics planner" data-admin-fulfillment-planner="true">
    <h2 className="text-lg font-black text-[#153b29]">Two-profile fulfilment planner</h2>
    <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-600">
      Private, editable what-if comparison only. Nothing here is saved or applied to checkout, subscriptions, Zeshu Cash, seller payouts or shipping. Customer fees below are proposed amounts, not current prices. Nationwide checkout is {nationwideCheckoutEnabled ? "currently enabled" : "currently safely disabled"}.
    </p>
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      <ScenarioCard
        label="1. Local Jagtial · Zeshu Move"
        description="Use real rider wages, packaging, payment and support costs. Example starts with an uncollected subscription allocation of zero. Current checkout does NOT charge the proposed ₹10 handling fee."
        value={local}
        onChange={setLocal}
        operationalNote="Local contribution target is a planning decision, not a permission to run at a loss. Zero commission and SaaS funding must be verified."
      />
      <ScenarioCard
        label="2. Nationwide · prepaid pilot"
        description="Shipmozo first candidate, iThink fallback / future COD. Example uses ₹15 buyer + ₹15 seller fees and equal ₹65 courier charge / delivery recovery. This is NOT a live courier quote."
        value={national}
        onChange={setNational}
        operationalNote="₹25 target and percentage allowances start from live nationwide settings. Existing shipping activation and margin gates remain untouched."
      />
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-600">
      Assumptions: Zeshu processes the full basket payment, all entered fees are net of applicable tax, and risk reserves are applied to merchandise value. This model excludes merchandise commissions, product-margin settlement, subscription acquisition/servicing costs and any unlisted taxes. Reconcile actual merchant-of-record, GST treatment and seller payouts before using these estimates for pricing.
    </p>
  </section>;
}
