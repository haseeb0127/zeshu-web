"use client";

import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from '@/app/components/DocumentLink';
import {adminSupabase} from '@/app/lib/browser-supabase';
import {calculateZeshuRewardEconomics} from '@/app/lib/zeshu-reward-economics';
import {ArrowLeft,Calculator,Leaf,RefreshCw,ShieldCheck} from 'lucide-react';

const supabase=adminSupabase();
type Readiness={
 currentRewards:{ledgerPresent:true;creditedEntries:number;creditedValueRupees:number;orderRewardEntries:number;categoryCampaignsEnabled:number;historicalRecordsMayBeTest:true;profitShare70PercentActive:false};
 proposedModel:{customerSharePercent:70;maintenancePercent:15;zeshuRetainedPercent:15;onlyPositiveVerifiedNetContribution:true};
 treeProgram:{status:string;verifiedPartnerAgreement:boolean;fundedQuota:number;careCostVerified:boolean;orderLevelPlantingActive:false};
 checkoutMode:string;customerCashbackActivatedByThisReport:false;paymentOrProviderCallsPerformed:false;
};
const initial={
 earnedCommission:"40",netDeliveryMargin:"-10",paymentFees:"5",supportCost:"2",
 taxAndOtherCosts:"3",refundReserve:"3",existingRewardCost:"2",treeCareCost:"0",
};
type Field=keyof typeof initial;
const fieldItems:Array<{key:Field;label:string;help:string}>= [
 {key:'earnedCommission',label:'Verified Zeshu commission / sponsor funding (₹)',help:'Revenue actually earned after seller/provider settlement; not the customer order value'},
 {key:'netDeliveryMargin',label:'Net delivery income or shortfall (₹)',help:'Customer delivery fee minus delivery partner cost; negative amounts allowed'},
 {key:'paymentFees',label:'Payment processing costs (₹)',help:'Gateway/platform fees and applicable tax on fees'},
 {key:'supportCost',label:'Customer support and operating costs (₹)',help:'Realistic cost allocation for this transaction'},
 {key:'taxAndOtherCosts',label:'Taxes and other costs (₹)',help:'Applicable taxes and unrecovered transaction costs'},
 {key:'refundReserve',label:'Returns, refunds and fraud reserve (₹)',help:'Conservative buffer for pending liabilities'},
 {key:'existingRewardCost',label:'Already promised Zeshu Cash / referral rewards (₹)',help:'Prevent double-paying legacy tiers and profit-share cashback'},
 {key:'treeCareCost',label:'Hypothetical planted-tree and aftercare cost (₹)',help:'Scenario only; Green is paused and no tree is pledged by this input'},
];
const money=(paise:number)=>new Intl.NumberFormat('en-IN',{
 style:'currency',currency:'INR',maximumFractionDigits:2,minimumFractionDigits:2,
}).format(paise/100);
export default function RewardsEconomicsPage(){
 const [report,setReport]=useState<Readiness|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [scenario,setScenario]=useState(initial);
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw Error('Zeshu administrator sign-in is required.');
   const res=await fetch('/api/admin/rewards/readiness',{
    headers:{Authorization:'Bearer '+session.access_token},cache:'no-store',
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(body.error||'Unable to inspect rewards funding.');
   setReport(body as Readiness);
  }catch(e){setReport(null);setError(e instanceof Error?e.message:'Rewards check unavailable.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const result=useMemo(()=>{
  try{
   const n=(k:Field)=>{
    const text=scenario[k].trim();
    if(text==='')return NaN;
    return Math.round(Number(text)*100);
   };
   return calculateZeshuRewardEconomics({
    earnedCommissionPaise:n('earnedCommission'),
    netDeliveryMarginPaise:n('netDeliveryMargin'),
    paymentFeesPaise:n('paymentFees'),supportCostPaise:n('supportCost'),
    taxAndOtherCostsPaise:n('taxAndOtherCosts'),refundReservePaise:n('refundReserve'),
    existingRewardCostPaise:n('existingRewardCost'),treeCareCostPaise:n('treeCareCost'),
   });
  }catch{return null;}
 },[scenario]);
 return <main className="min-h-screen bg-[#f4f8f3] px-4 pb-20 text-[#173325] sm:px-8">
  <div className="mx-auto max-w-5xl pt-6 sm:pt-10">
   <Link href="/admin/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-[#075e45]"><ArrowLeft size={17}/> Back to Zeshu HQ</Link>
   <header className="mt-4 rounded-[30px] bg-[linear-gradient(110deg,#07553d,#0b7048)] p-6 text-white sm:p-9">
    <div className="flex items-center gap-3"><Calculator size={26}/><h1 className="text-2xl font-black sm:text-3xl">Zeshu Cash · Profit-aware rewards</h1></div>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50">Admin-only financial planning. Check the proposed 70% customer cashback / 15% maintenance / 15% Zeshu share from positive, verified contribution profit—not from the total order value. No rewards or tree commitments are created by this page.</p>
    <button type="button" disabled={loading} onClick={()=>void load()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 px-4 text-sm font-black disabled:opacity-50"><RefreshCw size={16}/> Refresh live readiness</button>
   </header>
   {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</p>}
   {loading&&<p role="status" className="mt-5 text-sm font-semibold">Checking existing rewards without moving money…</p>}
   {report&&<>
    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-label="Current rewards activation state">
     <h2 className="flex items-center gap-2 font-black text-amber-950"><ShieldCheck size={20}/> 70% profit-share is NOT active</h2>
     <p className="mt-2 text-sm leading-6 text-amber-950">The existing Zeshu Cash ledger contains {report.currentRewards.creditedEntries} reward entries (total nominal credits ₹{report.currentRewards.creditedValueRupees.toFixed(2)}), including {report.currentRewards.orderRewardEntries} delivered-order reward entry/entries. Historical entries may be from TEST orders and are not evidence of cash earned. Active category-funded campaigns: {report.currentRewards.categoryCampaignsEnabled}.</p>
     <p className="mt-2 text-xs font-bold">Gateway configuration: {report.checkoutMode}. Real supplier margin, refunds, funding and legal treatment must be verified before enabling any new profit-share payouts.</p>
    </section>
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
     <h2 className="flex items-center gap-2 font-black"><Leaf className="text-emerald-700" size={20}/> Zeshu Green: {report.treeProgram.status}</h2>
     <p className="mt-2 text-sm leading-6 text-slate-600">The one-tree-per-eligible-completed-order idea is not active. Verified partner agreement: {report.treeProgram.verifiedPartnerAgreement?'yes':'no'}. Funded tree quota: {report.treeProgram.fundedQuota}. Tree-care cost verified: {report.treeProgram.careCostVerified?'yes':'no'}. No customer order should be told a tree has been reserved or planted.</p>
     <Link href="/admin/green" className="mt-3 inline-block text-sm font-bold text-[#075e45] underline">Open Green readiness</Link>
    </section>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
     <h2 className="text-lg font-black">Per-order economics · Example only</h2>
     <p className="mt-2 text-sm leading-6 text-slate-600">Adjust all amounts using real supplier and fulfilment data. Figures are never applied to a customer's wallet. If margin is zero or negative, the profit-share reward must be zero rather than placing Zeshu in debt.</p>
     <div className="mt-5 grid gap-4 sm:grid-cols-2">{fieldItems.map(({key,label,help})=>
      <label key={key} className="block text-xs font-bold text-slate-700">{label}
       <input aria-label={label} type="number" inputMode="decimal" step="0.01"
        min={key==='netDeliveryMargin'?-1000000:0} max={1000000}
        value={scenario[key]}
        onChange={e=>setScenario(old=>({...old,[key]:e.target.value}))}
        className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-bold focus:outline-2 focus:outline-[#075e45]"/>
       <span className="mt-1 block font-normal leading-5 text-slate-500">{help}</span>
      </label>)}</div>
     {!result?<p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">Enter valid amounts for all fields.</p>:
      <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
       <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Scenario results · not a cashback promise</p>
       <p className="mt-2 text-sm text-emerald-950">Net contribution before tree reserve: <strong>{money(result.profitBeforeTreePaise)}</strong></p>
       <p className="mt-1 text-sm text-emerald-950">Hypothetical tree reserve: <strong>{money(result.illustrativeTreeReservePaise)}</strong></p>
       <p className="mt-1 text-sm text-emerald-950">Available after all costs: <strong>{money(result.distributableProfitPaise)}</strong></p>
       <div className="mt-4 grid gap-3 sm:grid-cols-3">{([
        ['Customer 70% (illustrative)',result.illustrativeCustomerCashbackPaise],
        ['Maintenance 15%',result.illustrativeMaintenancePaise],
        ['Zeshu retained 15%',result.illustrativeZeshuRetainedPaise],
       ] as const).map(([label,value])=><div key={label} className="rounded-xl bg-white p-4">
        <p className="text-xs font-bold text-emerald-900">{label}</p>
        <p className="mt-2 text-xl font-black text-[#075e45]">{money(value)}</p>
       </div>)}</div>
       <p className="mt-3 text-xs leading-5 text-emerald-950">{result.sustainable?'The example has positive margin. It is not verified revenue or a funded reward.':'This scenario has no distributable positive margin; new cashback must not be promised.'}</p>
      </div>}
    </section>
    <section className="mt-5 rounded-2xl bg-white p-5 text-sm leading-7 text-slate-600">
     <h2 className="font-black text-[#173325]">Conditions before customer cashback on eligible orders</h2>
     <p className="mt-2">Confirm genuine captured/settled payments, seller commission, fulfilment costs, GST/taxes, refund reserves and legacy rewards. Credit only after eligible delivery, never for TEST transactions, refunded or cancelled orders. Use the existing non-withdrawable Zeshu Cash ledger with capped redemption, not direct bank or UPI transfers. Review marketplace rewards treatment with a CA before broader use.</p>
     <p className="mt-3 font-semibold text-amber-900">This dashboard performs no payments, WhatsApp sends, planting, customer reward issuance or billable API calls.</p>
    </section>
   </>}
  </div>
 </main>;
}
