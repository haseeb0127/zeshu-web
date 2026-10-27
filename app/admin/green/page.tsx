"use client";
import {useCallback,useEffect,useState} from 'react';
import Link from '@/app/components/DocumentLink';
import {adminSupabase} from '@/app/lib/browser-supabase';
import {Leaf,ShieldCheck,RefreshCw,ExternalLink,CheckCircle2,AlertCircle,TreePine} from 'lucide-react';

const supabase=adminSupabase();
type Readiness={
 mode:'PLANNING'|'ACTIVE'|'PAUSED';activatedAt:string|null;partner:string|null;partnerWebsite:string|null;
 paymentGatewayMode:'LIVE'|'TEST'|'UNCONFIRMED';
 gates:{verifiedPlantingAgreement:boolean;publicPartnerWebsite:boolean;actualPerTreeCost:boolean;
 realFundedQuota:boolean;operatorVerifiedLiveOrders:boolean;paymentGatewayLive:boolean;explicitActivation:boolean};
 fundedTreeQuota:number;reserved:number;remainingTreeCapacity:number;treeUnitBudgetPaise:number|null;
 pilotGoal:{eligibleDeliveredOrdersMilestone:number;plannedTreesMin:number;plannedTreesMax:number;eligibleDeliveredOrdersTracked:null;trackingEnabled:false;note:string};
 bulkPlantingAuthorized:false;plantingBatchPolicy:string;
 totalAllocatedBudgetPaise:number|null;counts:{pledged:number;reported:number;verified:number;voided:number};
 lastConfigurationUpdate:string;canAnnouncePerOrderPromise:boolean;
 communicationPolicy:string;changesMade:false;sendingEnabled:false;
};
const money=(paise:number|null)=>paise===null?'Not confirmed':
  '₹'+(paise/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const questions=[
 {key:'verifiedPlantingAgreement',label:'Written agreement with a vetted planting partner',
 desc:'Native species, land permission, planting season, aftercare and replacement policy agreed in writing.'},
 {key:'publicPartnerWebsite',label:'Real planting partner and public website',
 desc:'Check organization identity, local ecology, planting site access, accountability and evidence samples.'},
 {key:'actualPerTreeCost',label:'Confirmed real planting and care cost per tree',
 desc:'Include site preparation, planting, multi-year care, replacement, evidence and reporting.'},
 {key:'realFundedQuota',label:'Money reserved for a fixed number of trees',
 desc:'Use a funded pilot quota rather than creating a liability on every test or cancelled order.'},
 {key:'operatorVerifiedLiveOrders',label:'Real live payment and fulfilment validated',
 desc:'Exclude TEST transactions, historic deliveries, refunds and returns.'},
 {key:'paymentGatewayLive',label:'Razorpay operating in verified LIVE mode',
 desc:'Zeshu presently uses TEST checkout; never enable live payment merely for this campaign.'},
 {key:'explicitActivation',label:'Owner explicitly approved launch',
 desc:'Activation is protected at database level; this page intentionally has no activation control.'},
] as const;
export default function AdminGreen(){
 const [info,setInfo]=useState<Readiness|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const reload=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw Error('Sign in to Zeshu Admin to view private tree programme readiness.');
   const result=await fetch('/api/admin/green',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
   const body=await result.json().catch(()=>({}));
   if(!result.ok)throw Error(body.error||'Private Zeshu Green report unavailable.');
   setInfo(body as Readiness);
  }catch(e){setInfo(null);setError(e instanceof Error?e.message:'Unable to load Green HQ.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 return <main className="min-h-screen bg-[#f4f8f2] text-[#193022]">
  <div className="mx-auto max-w-6xl px-4 pb-20 pt-5 md:px-8 md:pt-10">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center text-sm font-bold text-[#075e45] underline">← Zeshu Admin Dashboard</Link>
    <Link href="/green" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#075e45] underline">Customer Green page <ExternalLink size={15}/></Link>
   </div>
   <header className="mt-4 rounded-[28px] bg-[linear-gradient(110deg,#064c37,#0f633f)] px-5 py-7 text-white md:px-8">
    <h1 className="flex items-center gap-2 text-2xl font-black md:text-3xl"><Leaf size={30}/> Zeshu Green HQ</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50">Keep Zeshu's small first milestone financially responsible: consider planting 1–2 trees after 1,000 eligible delivered orders. This is a planning dashboard. This is a private planning dashboard: it never spends money, plants a tree, enables payments or activates the campaign.</p>
    <button type="button" disabled={loading} onClick={()=>void reload()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-extrabold disabled:opacity-50"><RefreshCw size={17}/> Refresh readiness</button>
   </header>
   {error&&<p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
   {loading&&<p role="status" className="mt-4 text-sm font-semibold">Checking live programme records…</p>}
   {info&&<>
    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5" role="status">
     <h2 className="flex items-center gap-2 text-lg font-black text-amber-950"><ShieldCheck size={22}/> Programme: {info.mode}</h2>
     <p className="mt-2 text-sm leading-6 text-amber-900">{info.canAnnouncePerOrderPromise?
      'No one-tree-per-order customer promise is authorized by this new small pilot.':
      'The first 1,000 eligible deliveries → 1–2 trees is a plan, not a pledge or a planted-tree claim. The old one-tree-per-order system is disabled and must be redesigned before activation.'}</p>
     <p className="mt-2 text-xs font-semibold text-amber-950">Payment gateway: {info.paymentGatewayMode}. No customer tree fee. No false carbon-offset or survival guarantee.</p>
    </section>
    <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Verified tree operation counts">
     {([
       ['Tree slots committed',info.reserved],
       ['Partner-reported plantings',info.counts.reported],
       ['Evidence-backed planted trees',info.counts.verified],
       ['Voided commitments',info.counts.voided],
     ] as const).map(([label,num])=><article key={label} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <TreePine className="text-emerald-700" size={24}/>
      <p className="mt-3 text-3xl font-black tabular-nums text-[#075e45]">{num.toLocaleString('en-IN')}</p>
      <h3 className="mt-1 text-xs font-bold text-slate-600">{label}</h3>
     </article>)}
    </section>
    <section className="mt-5 rounded-2xl border border-teal-200 bg-white p-5 md:p-7" aria-label="Planned first thousand eligible deliveries tree milestone">
      <h2 className="text-xl font-black text-emerald-950">First goal: 1,000 eligible deliveries → aim for 1–2 trees</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Planning only: once 1,000 genuinely eligible delivered orders have been completed after an approved start, arrange a modest planting of 1–2 suitable trees, subject to permission, care, funding and evidence. This is not one tree per order.</p>
      <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs leading-6 text-emerald-950">Real qualifying delivery progress is not yet tracked for the new pilot. Current legacy funded commitments: {info.reserved.toLocaleString('en-IN')}; verified planted trees: {info.counts.verified.toLocaleString('en-IN')}.</p>
      <p className="mt-3 text-xs font-semibold text-emerald-900">The legacy commitment counter does not track the new 1,000-order pilot. Do not use it as an order-count progress indicator.</p>
      <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-950">Planning only. Real eligible deliveries must be counted separately in the redesigned campaign. No payment, automatic planting, or per-order pledge.</p>
    </section>
    <section className="mt-5 grid gap-4 rounded-2xl border border-emerald-100 bg-white p-5 md:grid-cols-2 md:p-7">
     <div>
      <h2 className="text-lg font-black">Funded campaign budget</h2>
      <p className="mt-2 text-sm">Approved tree quota: <strong>{info.fundedTreeQuota.toLocaleString('en-IN')}</strong></p>
      <p className="mt-1 text-sm">Unallocated quota: <strong>{info.remainingTreeCapacity.toLocaleString('en-IN')}</strong></p>
      <p className="mt-1 text-sm">Tree unit cost: <strong>{money(info.treeUnitBudgetPaise)}</strong></p>
      <p className="mt-1 text-sm">Total quota budget: <strong>{money(info.totalAllocatedBudgetPaise)}</strong></p>
      <p className="mt-2 text-xs text-slate-600">Budget figures are configuration amounts, not evidence of payment or cash availability. Actual invoices and transfers require separate verification.</p>
     </div>
     <div>
      <h2 className="text-lg font-black">Planting partner</h2>
      <p className="mt-2 text-sm font-semibold">{info.partner||'No vetted partner recorded'}</p>
      {info.partnerWebsite?<a href={info.partnerWebsite} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex gap-2 text-sm font-bold text-emerald-800 underline">Visit partner website <ExternalLink size={16}/></a>:<p className="mt-1 text-sm text-slate-500">Public evidence and partner link pending.</p>}
      <p className="mt-3 text-xs text-slate-600">A partner logo or agreement is not proof a tree survived. Request species, planting site, dates, maintenance evidence and follow-up audits.</p>
     </div>
    </section>
    <section className="mt-5 rounded-2xl border border-emerald-100 bg-white p-5 md:p-7">
     <h2 className="text-xl font-black">Launch checklist — required before activating</h2>
     <div className="mt-4 grid gap-3 md:grid-cols-2">{questions.map(item=>{
      const passed=info.gates[item.key];
      return <article key={item.key} className={`flex gap-3 rounded-xl border p-4 ${passed?'border-emerald-200 bg-emerald-50':'border-amber-200 bg-amber-50/60'}`}>
       {passed?<CheckCircle2 size={23} className="shrink-0 text-emerald-700" aria-hidden="true"/>:<AlertCircle size={23} className="shrink-0 text-amber-700" aria-hidden="true"/>}
       <div><h3 className="text-sm font-black">{item.label}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{item.desc}</p></div>
      </article>;
     })}</div>
     <p className="mt-4 text-xs leading-6 text-slate-600">Planning is not a tree plantation. Partner-reported trees and independently verified plantings are separate records. Refunds and survival monitoring need human reconciliation before publishing environmental impact claims.</p>
    </section>
    <section className="mt-5 rounded-2xl border border-emerald-200 bg-[#eaf6ea] p-5">
     <h2 className="text-lg font-black">Suggested first pilot: 1–2 local trees</h2>
     <p className="mt-2 text-sm leading-6">Choose a locally suitable species and planting site with permission, watering and aftercare. You may plant 1–2 trees in your own garden if suitable; otherwise ask a local nursery or planting partner for a small quote. Fund the activity only when affordable; no hidden customer fee. Never say a tree was planted before it actually is.</p>
     <p className="mt-2 text-sm font-semibold">Owner approval and live payment verification are separate requirements. This page deliberately cannot turn the campaign on.</p>
    </section>
   </>}
  </div>
 </main>;
}
