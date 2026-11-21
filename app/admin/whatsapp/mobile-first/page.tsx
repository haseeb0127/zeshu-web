"use client";

import {useState} from 'react';
import Link from 'next/link';
import {adminSupabase} from '@/app/lib/browser-supabase';
import {ArrowLeft,AlertTriangle,ShieldCheck} from 'lucide-react';

const PHONE='+91 95052 11212';

export default function MobileFirstWhatsAppTransition(){
 const [number,setNumber]=useState('');
 const [impact,setImpact]=useState(false);
 const [otpRisk,setOtpRisk]=useState(false);
 const [retain,setRetain]=useState(false);
 const [busy,setBusy]=useState(false);
 const [outcome,setOutcome]=useState('');
 const [done,setDone]=useState(false);
 const ready=!busy&&!done&&number===PHONE&&impact&&otpRisk&&retain;
 const submit=async()=>{
  if(!ready)return;
  const answer=window.confirm(
   'FINAL CONFIRMATION: Request Meta to DEREGISTER '+PHONE+
   ' from Cloud API now? Incoming WhatsApp messages will stop reaching the Zeshu Inbox.'+
   ' The mobile app OTP could still fail, and reconnecting Cloud API/Coexistence is NOT guaranteed.'+
   ' This will NOT delete your WABA or stored conversations.'
  );
  if(!answer)return;
  setBusy(true);setOutcome('');
  try{
   const {data:{session},error}=await adminSupabase().auth.getSession();
   if(error||!session?.access_token)throw new Error('Please sign in as Zeshu administrator.');
   const response=await fetch('/api/admin/whatsapp/mobile-first',{
    method:'POST',cache:'no-store',
    headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
    body:JSON.stringify({
     action:'deregister_cloud_api_for_mobile_first',
     confirmedPhone:number,
     acceptCustomerMessagingInterruption:impact,
     acceptNoOtpGuarantee:otpRisk,
     preserveZeshuDataAndCredentials:retain,
    }),
   });
   const data=await response.json().catch(()=>({}));
   if(response.ok&&data.status==='DEREGISTERED'){
    setDone(true);
    setOutcome('Meta accepted deregistration. The Cloud API number was released, but mobile login is NOT yet verified. Open WhatsApp Business on your phone and register this same number. If OTP is still blocked, do not repeat requests or delete your Meta account. Zeshu conversations, webhook code, and Cloudflare credentials were preserved.');
   }else{
    const status=typeof data.status==='string'?data.status:'UNVERIFIED';
    const provider=typeof data.graphCode==='number'?' · Meta code '+data.graphCode:'';
    setOutcome('Deregistration NOT confirmed: '+status+provider+'. '+(
     typeof data.note==='string'?data.note:'No other settings were deleted.'
    )+' If the network outcome is unknown, first inspect WhatsApp Manager; do not repeat the action immediately.');
   }
  }catch(e){
   setOutcome('The operation could not be confirmed: '+(e instanceof Error?e.message:'Unknown connection issue')+
    '. Please inspect the phone in Meta before trying anything again.');
  }finally{setBusy(false);}
 };
 return <main className="min-h-screen bg-[#f7f8f4] text-slate-900">
  <header className="bg-[#075e45] px-4 py-5 text-white">
   <div className="mx-auto flex max-w-2xl items-center gap-3">
    <Link href="/admin/whatsapp" aria-label="Back to WhatsApp HQ"
     className="rounded-xl bg-white/15 p-3"><ArrowLeft size={20}/></Link>
    <div><h1 className="text-xl font-black">WhatsApp mobile-first transition</h1>
     <p className="mt-1 text-xs text-emerald-100">Zeshu Admin only · one-time Meta operation</p></div>
   </div>
  </header>
  <div className="mx-auto max-w-2xl space-y-5 p-4 pb-12 md:p-7">
   <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
    <div className="flex items-center gap-2 font-black text-amber-950"><AlertTriangle size={22}/>Important: customer WhatsApp interruption</div>
    <p className="mt-3 text-sm leading-6 text-amber-950">
     This releases <strong>{PHONE}</strong> from Meta Cloud API so you can attempt to register
     that number in the WhatsApp Business mobile app FIRST. Existing incoming customer
     messages will stop reaching the Zeshu website until the API is reconnected.
     <strong> Meta may still delay or refuse mobile OTPs, and future same-number Coexistence is not guaranteed.</strong>
    </p>
    <p className="mt-2 text-sm leading-6 text-amber-950">
     This is NOT Delete Phone Number or Delete WhatsApp Business Account.
     We keep your website, account information, API configuration and saved Inbox history
     for a possible supported reconnection.
    </p>
   </section>
   <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="text-lg font-black">Before releasing the number</h2>
    <p className="mt-2 text-sm text-slate-600">
     Keep your SIM active and WhatsApp Business installed. Avoid further OTP retries
     if WhatsApp has rate-limited verification. You may need Meta support even after
     Cloud API deregistration.
    </p>
    <label htmlFor="wa-confirm-phone" className="mt-5 block text-sm font-bold">
     Type the complete existing Zeshu WhatsApp number
    </label>
    <input id="wa-confirm-phone" value={number} onChange={e=>setNumber(e.target.value)}
     placeholder="+91 95052 11212" autoComplete="off" inputMode="tel"
     className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
     disabled={busy||done}/>
    <div className="mt-5 space-y-4 text-sm leading-6">
     <label className="flex items-start gap-3">
      <input type="checkbox" checked={impact} onChange={e=>setImpact(e.target.checked)}
       disabled={busy||done} className="mt-1.5 h-5 w-5 accent-amber-700"/>
      <span>I understand Cloud API customer messaging and Zeshu Inbox delivery will be interrupted.</span>
     </label>
     <label className="flex items-start gap-3">
      <input type="checkbox" checked={otpRisk} onChange={e=>setOtpRisk(e.target.checked)}
       disabled={busy||done} className="mt-1.5 h-5 w-5 accent-amber-700"/>
      <span>I understand WhatsApp Business mobile OTP and later Coexistence may still fail.</span>
     </label>
     <label className="flex items-start gap-3">
      <input type="checkbox" checked={retain} onChange={e=>setRetain(e.target.checked)}
       disabled={busy||done} className="mt-1.5 h-5 w-5 accent-amber-700"/>
      <span>Keep Zeshu's WABA, website configuration, credentials and stored message history.</span>
     </label>
    </div>
    <button type="button" disabled={!ready} onClick={()=>void submit()}
     className="mt-6 min-h-14 w-full rounded-xl bg-amber-700 px-4 py-4 text-base font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">
     {busy?'Requesting deregistration from Meta…':done?'Meta accepted the request':
      'Deregister this Cloud API phone for mobile setup'}
    </button>
    {outcome&&<p role="status" className={"mt-4 rounded-xl p-4 text-sm leading-6 font-semibold "+(
     done?'bg-emerald-50 text-emerald-900':'bg-amber-50 text-amber-950'
    )}>{outcome}</p>}
   </section>
   <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
    <h2 className="flex items-center gap-2 text-base font-black"><ShieldCheck size={20}/>After mobile registration</h2>
    <p className="mt-2">
     Once WhatsApp Business opens successfully on your phone, return to Zeshu.
     We'll inspect supported WhatsApp Business App Coexistence enrollment before
     reconnecting Cloud API. Do not click Meta's Delete Number or create a new
     WhatsApp Business Account just to restart this process.
    </p>
    <Link href="/admin/whatsapp" className="mt-3 inline-block font-bold underline">
     Back to Zeshu WhatsApp HQ
    </Link>
   </section>
  </div>
 </main>;
}
