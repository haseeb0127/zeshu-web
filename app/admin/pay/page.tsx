"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "@/app/components/DocumentLink";
import {adminSupabase} from "@/app/lib/browser-supabase";
import {estimatePayContribution} from "@/app/lib/zeshu-pay-economics";
import {ArrowLeft,CheckCircle2,ShieldCheck,RefreshCw,AlertCircle,Receipt,Smartphone} from "lucide-react";

const supabase=adminSupabase();
type Report={
 status:"DISCOVERY_ONLY";
 providers:{
  a1topup:{role:string;credentialsConfigured:boolean;codeExecutionReady:false;liveTransactionEnabled:false;executionFlagRequested:boolean;blocking:string[]};
  ezytmPlanapi:{role:string;credentialsConfigured:boolean;optionalTokenConfigured:boolean;rotatedCredentialConfirmed:boolean;discoveryCallsPermitted:boolean;providerCallPerformed:false;transactionsEnabled:false;blocking:string[]};
 };
 checkout:{gatewayEnvironment:"TEST"|"LIVE_CONFIGURED"|"UNCONFIRMED";customerRechargePaymentsEnabled:false;actualTelecomFulfilmentEnabled:false;utilityBillPaymentsEnabled:false;note:string};
 database:{rechargeTransactions:number|null};
 safeguards:Record<string,boolean>;
 approvedToGoLive:false;
 checkedAt:string;
};

const StatusLabel=({ready}:{ready:boolean})=><span className={`rounded-full px-2.5 py-1 text-xs font-black ${ready?"bg-emerald-100 text-emerald-900":"bg-amber-100 text-amber-950"}`}>{ready?"Configured":"Needs verification"}</span>;

export default function ZeshuPayAdmin(){
 const [report,setReport]=useState<Report|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 // Illustrative scenario inputs only: never persisted, sent to a provider or billed.
 const [scenario,setScenario]=useState({
  amount:"199",commission:"2",gatewayRate:"1.8",
  providerFixed:"0",gatewayFixed:"0",support:"0.50",taxAndOther:"0",cashback:"0",
 });
 const estimate=useMemo(()=>{
  try{
   const n=(key:keyof typeof scenario)=>{
    const v=scenario[key].trim();
    return v===""?NaN:Number(v);
   };
   const money=(key:keyof typeof scenario)=>Math.round(n(key)*100);
   const rate=(key:keyof typeof scenario)=>Math.round(n(key)*100);
   return estimatePayContribution({
    amountPaise:money("amount"),providerCommissionBps:rate("commission"),
    paymentGatewayBps:rate("gatewayRate"),providerFixedPaise:money("providerFixed"),
    gatewayFixedPaise:money("gatewayFixed"),supportCostPaise:money("support"),
    taxAndOtherCostPaise:money("taxAndOther"),cashbackPaise:money("cashback"),
   });
  }catch{return null;}
 },[scenario]);
 const moneyDisplay=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);
 const field=(key:keyof typeof scenario,title:string,step="0.01")=><label className="block text-xs font-bold text-slate-700">
  {title}
  <input aria-label={title} type="number" inputMode="decimal" min="0" max={key==="amount"?"1000000":key==="commission"||key==="gatewayRate"?"100":"1000000"} step={step}
   value={scenario[key]} onChange={e=>setScenario(previous=>({...previous,[key]:e.target.value}))}
   className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-[#075e45]"/>
 </label>;
 const reload=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw Error("Sign in with your Zeshu administrator account.");
   const result=await fetch("/api/admin/pay/readiness",{
    cache:"no-store",headers:{Authorization:"Bearer "+session.access_token},
   });
   const body=await result.json().catch(()=>({}));
   if(!result.ok)throw Error(body.error||"Pay readiness is unavailable.");
   setReport(body as Report);
  }catch(e){setReport(null);setError(e instanceof Error?e.message:"Pay readiness is unavailable.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 return <main className="min-h-screen bg-[#f5f8f5] px-4 pb-20 text-slate-900 sm:px-8">
  <div className="mx-auto max-w-5xl pt-6 sm:pt-10">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <Link href="/admin/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#075e45]"><ArrowLeft size={17}/>Back to Zeshu HQ</Link>
    <Link href="/pay" className="text-sm font-bold text-[#075e45] underline">See customer Pay page</Link>
   </div>
   <header className="mt-4 rounded-3xl bg-[#06563d] p-6 text-white sm:p-8">
    <div className="flex items-center gap-2"><Receipt size={25}/><h1 className="text-2xl font-black">Zeshu Pay · Provider readiness</h1></div>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/90">Existing selected aggregator stack: A1Topup for recharge fulfilment, Ezytm PlanAPI for plan and bill-information discovery. This dashboard never contacts a paid provider API, makes a payment or activates anything.</p>
    <button onClick={()=>void reload()} disabled={loading} type="button" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 text-sm font-black text-white disabled:opacity-50"><RefreshCw size={17}/> Refresh safe status</button>
   </header>
   {loading&&<p role="status" className="mt-5 text-sm font-semibold">Checking configuration without calling providers…</p>}
   {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</p>}
   {report&&<>
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
     <h2 className="flex items-center gap-2 text-lg font-black text-amber-950"><ShieldCheck size={22}/> No live recharge or bill payments</h2>
     <p className="mt-2 text-sm leading-6 text-amber-950">Only service discovery is available. A Razorpay TEST checkout is not a completed recharge or paid bill. Zeshu needs provider transaction formats, settlement references, consumer receipts, duplicate prevention and refunds verified before any real payment can start.</p>
    </section>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
     <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="A1Topup readiness">
      <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-black">A1Topup</h2><StatusLabel ready={report.providers.a1topup.credentialsConfigured}/></div>
      <p className="mt-1 text-xs font-semibold text-slate-600">{report.providers.a1topup.role}</p>
      <p className="mt-3 text-sm font-bold text-amber-900">Live fulfilment: blocked pending verification</p>
      <ul className="mt-3 list-inside list-disc space-y-2 text-xs leading-5 text-slate-600">{report.providers.a1topup.blocking.map((item,i)=><li key={i}>{item}</li>)}</ul>
      {report.providers.a1topup.executionFlagRequested&&<p className="mt-3 text-xs font-black text-red-700">Execution was requested in server settings, but the provider adapter still rejects live requests.</p>}
     </section>
     <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Ezytm PlanAPI readiness">
      <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-black">Ezytm · PlanAPI</h2><StatusLabel ready={report.providers.ezytmPlanapi.credentialsConfigured}/></div>
      <p className="mt-1 text-xs font-semibold text-slate-600">{report.providers.ezytmPlanapi.role}</p>
      <p className="mt-3 text-sm font-semibold">Previously exposed credential rotation: <strong className="text-amber-900">{report.providers.ezytmPlanapi.rotatedCredentialConfirmed?"Owner-attested":"Not yet confirmed"}</strong></p>
      {!report.providers.ezytmPlanapi.discoveryCallsPermitted&&<p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">PlanAPI discovery calls are currently blocked until previously exposed credentials are rotated and their replacement confirmed in Cloudflare. This protects provider balance and customer data.</p>}
      {report.providers.ezytmPlanapi.discoveryCallsPermitted&&<p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-900">PlanAPI credential checks permit read-only lookups. This does not establish contract approval, quota availability or bill-payment processing.</p>}
      <p className="mt-2 text-xs text-slate-600">Optional provider token present: {report.providers.ezytmPlanapi.optionalTokenConfigured?"Yes":"No / not required for all services"}</p>
      <ul className="mt-3 list-inside list-disc space-y-2 text-xs leading-5 text-slate-600">{report.providers.ezytmPlanapi.blocking.map((item,i)=><li key={i}>{item}</li>)}</ul>
     </section>
    </div>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5" aria-label="Illustrative Zeshu Pay margin calculator">
      <h2 className="text-lg font-black">Recharge profitability · decision aid</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Enter your actual written provider commission and payment costs to evaluate a hypothetical transaction. The numbers shown initially are <strong>examples, not A1Topup or Ezytm rates</strong>. Nothing here contacts a provider, changes billing, stores the input, or switches Pay live.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
       {field("amount","Customer recharge amount (₹)")}
       {field("commission","Provider commission (%)")}
       {field("gatewayRate","Payment processor fee (%)")}
       {field("providerFixed","Provider fixed cost (₹)")}
       {field("gatewayFixed","Gateway fixed cost (₹)")}
       {field("support","Support / operational cost (₹)")}
       {field("taxAndOther","Tax and other allocated costs (₹)")}
       {field("cashback","Optional cashback (₹)")}
      </div>
      {estimate?<>
       <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Estimated commission</p><p className="mt-1 font-black">{moneyDisplay(estimate.commissionPaise)}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Estimated transaction costs</p><p className="mt-1 font-black">{moneyDisplay(estimate.totalCostsPaise)}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Net contribution</p><p className={`mt-1 font-black ${estimate.viable?"text-emerald-700":"text-red-700"}`}>{moneyDisplay(estimate.contributionPaise)}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Break-even commission at these costs</p><p className="mt-1 font-black">{(estimate.breakEvenCommissionBps/100).toFixed(2)}%</p></div>
       </div>
       <p className="mt-3 text-xs leading-5 text-slate-600">{estimate.viable?"Illustrative positive contribution only; verify refunds, settlement costs, taxes and fixed overhead before launch.":"This example does not cover estimated costs. Do not offer cashback or subsidise this transaction without a funded plan."}</p>
      </>:<p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">Please enter valid non-negative amounts, a recharge of at least ₹1, and percentage rates from 0 to 100.</p>}
      <p className="mt-2 text-xs text-slate-500">The model excludes unentered costs and assumes the provider pays the commission on the recharge face value. Zeshu currently charges no real recharge customers.</p>
    </section>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2"><Smartphone size={20} className="text-[#075e45]"/><h2 className="text-lg font-black">Transaction safety</h2></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
       <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Razorpay environment</p><p className="mt-1 font-black">{report.checkout.gatewayEnvironment}</p></div>
       <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Recorded recharge transactions</p><p className="mt-1 font-black">{report.database.rechargeTransactions===null?"Unavailable":report.database.rechargeTransactions}</p></div>
       <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Provider fulfilment</p><p className="mt-1 font-black text-amber-950">OFF</p></div>
      </div>
      <h3 className="mt-5 flex items-center gap-2 text-sm font-black"><AlertCircle size={17} className="text-amber-600"/> Requirements before a live launch</h3>
      <ol className="mt-2 list-inside list-decimal space-y-2 text-sm leading-6 text-slate-700">
       <li>Verify A1Topup operator codes, request format, callback and settlement contract.</li>
       <li>Rotate PlanAPI credentials and confirm read-only provider coverage with approved test credits.</li>
       <li>Implement a verified pending/unknown state ledger, exact idempotency and independent payment + provider reconciliation.</li>
       <li>Confirm the regulated bill-payment partnership, customer fees, refund SLA and explicit live-launch approval.</li>
      </ol>
      <p className="mt-5 text-xs font-medium text-slate-500">Last checked: {new Date(report.checkedAt).toLocaleString("en-IN")}. Configuration presence is not proof of provider approval, actual recharge success or signed receipts.</p>
    </section>
   </>}
  </div>
 </main>;
}
