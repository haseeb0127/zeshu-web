"use client";
import {useEffect,useState} from 'react';
import Link from '@/app/components/DocumentLink';
import {Leaf,TreePine,ExternalLink,ShieldCheck} from 'lucide-react';
import {useCustomerLanguage} from '@/app/components/CustomerLanguageProvider';
import {customerSupabase} from '@/app/lib/browser-supabase';

type GreenStatus='PLANNING'|'PAUSED'|'ACTIVE';
type Impact={programmeStatus:GreenStatus;isPlantingLive:boolean};
type OrderImpact={
 programmeStatus:GreenStatus;
 orderStatus:string;
 commitmentStatus:'NONE'|'PLEDGED'|'PLANTED'|'VERIFIED'|'VOID';
 treeCount:number;
 treeEvidence:{
  evidenceUrl:string;nativeSpecies:string;plantingArea:string;
  plantedAt:string;verifiedAt:string;
 }|null;
};

/** No claim can be derived solely from cart quantity, payment, or delivery status. */
export function GreenCartNotice(){
 const {t}=useCustomerLanguage();
 const [impact,setImpact]=useState<Impact|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/green/impact',{signal:controller.signal,cache:'no-store'})
   .then(async r=>r.ok?await r.json():null)
   .then(data=>{if(!controller.signal.aborted)setImpact(data);})
   .catch(()=>{});
  return ()=>controller.abort();
 },[]);
 const active=impact?.programmeStatus==='ACTIVE'&&impact.isPlantingLive===true;
 return <section aria-label="Zeshu Green cart information" data-green-cart-note="true"
  className="rounded-2xl border border-[#c8dfd0] bg-[linear-gradient(120deg,#f0f9ed,#fcfff7)] p-4 text-[#15442f] shadow-sm">
   <div className="flex items-start gap-3">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#dcefdc]"><TreePine size={22} aria-hidden="true"/></span>
    <div className="min-w-0 flex-1">
     <h3 className="text-sm font-black">{t('Zeshu Green · 1 order, 1 tree goal')}</h3>
     <p className="mt-1 text-xs font-semibold leading-5">
      {active?t('One funded tree slot may be reserved after an eligible order is delivered.')
       :t('Our goal: one tree per eligible delivered order. Planting has not started yet.')}
     </p>
     <p className="mt-1 text-[11px] leading-4 text-[#4b6b57]">
      {t('One per order, not per product. No extra charge. A tree is not planted when you pay.')}
     </p>
     <Link href="/green" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#075e45] underline underline-offset-2">{t('How tree planting works')} <ExternalLink size={12} aria-hidden="true"/></Link>
    </div>
   </div>
  </section>;
}

export function GreenOrderReceipt({orderId}:{orderId:string}){
 const {t}=useCustomerLanguage();
 const [impact,setImpact]=useState<OrderImpact|null>(null);
 const [state,setState]=useState<'loading'|'ready'|'unavailable'>('loading');
 useEffect(()=>{
  const controller=new AbortController();
  setImpact(null);setState('loading');
  const load=async()=>{
   try{
    const sb=customerSupabase();
    const {data:{session}}=await sb.auth.getSession();
    if(!session?.access_token){setState('unavailable');return;}
    const res=await fetch('/api/green/order?orderId='+encodeURIComponent(orderId),{
     headers:{Authorization:'Bearer '+session.access_token},cache:'no-store',signal:controller.signal,
    });
    if(!res.ok)throw Error('Order impact unavailable.');
    const body=await res.json();
    if(controller.signal.aborted)return;
    setImpact(body as OrderImpact);setState('ready');
   }catch{if(!controller.signal.aborted)setState('unavailable');}
  };
  void load();
  return ()=>controller.abort();
 },[orderId]);
 const status=impact?.commitmentStatus??'NONE';
 const live=impact?.programmeStatus==='ACTIVE';
 const verified=status==='VERIFIED'&&impact?.treeCount===1&&!!impact.treeEvidence;
 return <section data-green-order-receipt="true" className="mt-3 rounded-2xl border border-[#cfdfd0] bg-[#f2f8ef] p-3 text-left">
  <div className="flex items-center gap-2 text-sm font-black text-[#075e45]"><Leaf size={19} aria-hidden="true"/>{t('Zeshu Green · Your order impact')}</div>
  {state==='loading'&&<p className="mt-2 text-xs text-slate-600">{t('Checking your tree status…')}</p>}
  {state==='unavailable'&&<p className="mt-2 text-xs text-slate-600">{t('Tree status is temporarily unavailable. Your payment and order are not affected.')}</p>}
  {state==='ready'&&impact&&<>
   {verified?<><p className="mt-2 text-sm font-black text-emerald-900">{t('1 tree planted and verified for this order')}</p>
     <p className="mt-1 text-xs text-emerald-950">{impact.treeEvidence?.nativeSpecies} · {impact.treeEvidence?.plantingArea}</p>
     {impact.treeEvidence?.evidenceUrl&&<a href={impact.treeEvidence.evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#075e45] underline">{t('View planting evidence')} <ExternalLink size={13}/></a>}
    </>:status==='PLANTED'?<p className="mt-2 text-sm font-bold text-emerald-950">{t('1 tree reported planted · awaiting evidence verification')}</p>
    :status==='PLEDGED'?<p className="mt-2 text-sm font-bold text-emerald-950">{t('1 funded tree slot reserved · planting pending')}</p>
    :status==='VOID'?<p className="mt-2 text-xs text-slate-700">{t('This order has no active tree commitment.')}</p>
    :<p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{live
      ?t('No tree commitment is linked to this order yet. Only qualifying delivered orders after launch can count.')
      :t('Tree initiative is in planning. No tree has been planted or reserved for this order.')}</p>}
   <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-4 text-[#526d59]"><ShieldCheck className="mt-0.5 shrink-0" size={13}/>{t('One tree per eligible delivered order, not per item. Paying alone does not plant a tree.')}</p>
  </>}
  <Link href="/green" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#075e45] underline underline-offset-2">{t('View Zeshu Green progress')} <ExternalLink size={12}/></Link>
 </section>;
}
