"use client";

import {useState} from 'react';
import {Calculator,TreePine} from 'lucide-react';

/**
 * Private, purely local Zeshu Green scenario calculator.
 * Does not read live orders, persist entries, activate the programme,
 * create funded commitments, donate, charge customers or contact providers.
 */
const INR=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2});
const amount=(n:number)=>Number.isFinite(n)?INR.format(n):'—';
const whole=(n:number)=>Number.isFinite(n)?Math.floor(n).toLocaleString('en-IN'):'—';
const clamp=(value:string,max:number)=>value===''?0:Math.min(max,Math.max(0,Number(value)||0));

export default function GreenPilotCalculator({programmeMode}:{programmeMode:'PAUSED'|'PLANNING'|'ACTIVE'}){
  const [orders,setOrders]=useState(20);
  const [contribution,setContribution]=useState(100);
  const [treeCost,setTreeCost]=useState(150);
  const [monthlyCap,setMonthlyCap]=useState(1500);
  const [spendFraction,setSpendFraction]=useState(20);

  const required=orders*treeCost;
  const marginPool=orders*contribution;
  const budgetFromMargin=marginPool*spendFraction/100;
  const available=Math.min(monthlyCap,budgetFromMargin);
  const affordable=treeCost>0?Math.min(orders,Math.floor(available/treeCost)):0;
  const allOrdersFunded=orders>0&&treeCost>0&&required<=available&&contribution>=treeCost;
  const fullPromiseAllowed=allOrdersFunded&&programmeMode==='ACTIVE';
  const remainingAfterAll=marginPool-required;
  const label='block text-xs font-extrabold leading-5 text-slate-700';
  const input='mt-1 w-full min-h-11 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-base font-bold tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return <section data-green-budget-planner aria-label="Zeshu Green private pilot budget calculator"
    className="mt-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm md:p-7">
    <h2 className="flex items-center gap-2 text-xl font-black text-[#075e45]"><Calculator size={23}/> One tree per order — business budget simulator</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">
      Try hypothetical monthly numbers before promising a tree. Your contribution per order must be
      what Zeshu really keeps after seller payouts, delivery, payment fees, returns, taxes, cashback,
      support and operating costs. Tree cost must include planting, aftercare, replacements and proof.
    </p>
    <p className="mt-2 text-xs font-semibold text-amber-800">
      Illustrative inputs only. These are not actual orders, partner quotes, available cash or approved spending.
      Nothing you enter is stored or sent to Zeshu, Meta or any planting provider.
    </p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className={label}>Eligible completed orders per month
        <input aria-label="Hypothetical eligible completed monthly orders" type="number" min="0" max="100000"
          inputMode="numeric" className={input} value={orders}
          onChange={e=>setOrders(Math.floor(clamp(e.target.value,100000)))}/>
      </label>
      <label className={label}>Net contribution Zeshu earns per eligible order (₹)
        <input aria-label="Net contribution per order before tree cost in rupees" type="number" min="0" max="100000" step="1"
          inputMode="decimal" className={input} value={contribution}
          onChange={e=>setContribution(clamp(e.target.value,100000))}/>
      </label>
      <label className={label}>True planting + care + evidence cost per tree (₹)
        <input aria-label="All-inclusive real tree cost in rupees" type="number" min="1" max="100000" step="1"
          inputMode="decimal" className={input} value={treeCost}
          onChange={e=>setTreeCost(clamp(e.target.value,100000))}/>
      </label>
      <label className={label}>Hypothetical monthly spending limit (₹)
        <input aria-label="Hypothetical monthly tree budget limit in rupees" type="number" min="0" max="10000000" step="1"
          inputMode="decimal" className={input} value={monthlyCap}
          onChange={e=>setMonthlyCap(clamp(e.target.value,10000000))}/>
      </label>
      <label className={label}>Maximum share of net contribution for trees (%)
        <input aria-label="Percentage of positive net contribution allocated to trees" type="number" min="0" max="100" step="1"
          inputMode="numeric" className={input} value={spendFraction}
          onChange={e=>setSpendFraction(clamp(e.target.value,100))}/>
      </label>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-xs text-slate-600">Cost for 1 tree per order</p>
        <p className="mt-1 text-xl font-black tabular-nums">{amount(required)}</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-xs text-slate-600">Budget allowed by these assumptions</p>
        <p className="mt-1 text-xl font-black tabular-nums">{amount(available)}</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-xs text-slate-600">Trees affordable within this budget</p>
        <p className="mt-1 flex items-center gap-2 text-xl font-black tabular-nums">
          <TreePine size={20} className="text-emerald-700"/>{whole(affordable)}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-xs text-slate-600">Net contribution left if all trees funded</p>
        <p className="mt-1 text-xl font-black tabular-nums">{amount(remainingAfterAll)}</p>
      </div>
    </div>
    <div role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-slate-700">
      {orders===0?'Enter a positive number of genuine completed orders to model a pilot.'
        :treeCost===0?'Enter a non-zero all-inclusive planting cost. A zero-cost tree is not assumed.'
        :allOrdersFunded
          ?'Under these hypothetical assumptions, one tree per eligible order fits within the entered monthly cap and margin allocation. Actual funding, partner, verification, eligibility tracking and owner approval still need to be established.'
          :'Under these hypothetical assumptions, a universal one-tree-per-order promise is NOT affordable. Reduce the pilot size, improve margin, secure external sponsorship or negotiate a verified lower lifecycle planting cost before announcing the promise.'}
      <p className="mt-2 font-bold">Programme status: {programmeMode}. {fullPromiseAllowed
        ?'The scenario is affordable on paper, but does not attest real funding or successful planting.'
        :'This simulator cannot activate Zeshu Green, charge a customer or create a planting commitment.'}</p>
    </div>
  </section>;
}
