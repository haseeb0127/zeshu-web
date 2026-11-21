"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {adminSupabase} from '@/app/lib/browser-supabase';

const supabase=adminSupabase();
const PHRASE='DEREGISTER +91 95052 11212';
type PhoneCheck={status:string;isOnBusinessApp?:boolean|null;platformType?:string|null;error?:string};
type DeregResult={status:string;changed:boolean;reason?:string;providerHttpStatus?:number;providerErrorCode?:number;note?:string;error?:string};

/**
 * Intentional owner-operated emergency/transition action.
 * A signed-in Zeshu administrator confirms the exact number twice.
 * The server rechecks Meta ownership immediately before the single POST.
 */
export default function WhatsAppCloudApiDeregisterPage(){
 const [loading,setLoading]=useState(true);
 const [phoneStatus,setPhoneStatus]=useState<PhoneCheck|null>(null);
 const [checkError,setCheckError]=useState('');
 const [phrase,setPhrase]=useState('');
 const [acceptImpact,setAcceptImpact]=useState(false);
 const [acceptOtp,setAcceptOtp]=useState(false);
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<DeregResult|null>(null);
 const [completed,setCompleted]=useState(false);

 const token=async()=>{
  const {data}=await supabase.auth.getSession();
  if(!data.session?.access_token)throw Error('Please sign in as a Zeshu administrator.');
  return data.session.access_token;
 };
 const inspect=async()=>{
  setLoading(true);setCheckError('');
  try{
   const response=await fetch('/api/admin/whatsapp/mobile-registration',{
    headers:{Authorization:'Bearer '+await token()},cache:'no-store',
   });
   const payload:PhoneCheck=await response.json();
   if(!response.ok)throw Error(payload.error||'Meta registration check unavailable.');
   setPhoneStatus(payload);
  }catch(e){setCheckError(e instanceof Error?e.message:'Meta registration check unavailable.');}
  finally{setLoading(false);}
 };
 useEffect(()=>{void inspect();},[]);

 const submit=async()=>{
  if(busy||completed||phoneStatus?.status!=='CLOUD_API_ONLY'
    ||phrase!==PHRASE||!acceptImpact||!acceptOtp)return;
  if(!window.confirm('FINAL CONFIRMATION: deregister +91 95052 11212 from Meta Cloud API now? Zeshu will stop receiving new WhatsApp messages through Cloud API. Mobile app OTP is NOT guaranteed.'))return;
  setBusy(true);setResult(null);
  try{
   const response=await fetch('/api/admin/whatsapp/deregister-cloud-api',{
    method:'POST',cache:'no-store',
    headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'},
    body:JSON.stringify({
     action:'deregister_zeshu_cloud_api',
     confirmPhrase:PHRASE,
     acknowledgeIncomingStops:true,acknowledgeOtpNotGuaranteed:true,
    }),
   });
   const data:DeregResult=await response.json().catch(()=>({status:'UNAVAILABLE',changed:false}));
   setResult(data);
   if(response.ok&&data.status==='DEREGISTERED'&&data.changed)setCompleted(true);
  }catch{
   setResult({status:'OUTCOME_UNCERTAIN',changed:false,
    note:'Unable to confirm the result. Do not retry until the phone status is checked in Meta.'});
  }finally{setBusy(false);}
 };
 const canProceed=phoneStatus?.status==='CLOUD_API_ONLY'&&!busy&&!completed
  &&phrase===PHRASE&&acceptImpact&&acceptOtp;

 return <main className="min-h-screen bg-[#f7f9f7] p-4 text-slate-900">
  <div className="mx-auto max-w-xl space-y-5 py-8">
   <Link href="/admin/whatsapp" className="text-sm font-bold text-[#075e45]">← Back to Zeshu WhatsApp HQ</Link>
   <div className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm">
    <h1 className="text-xl font-black">Release Zeshu phone from WhatsApp Cloud API</h1>
    <p className="mt-3 text-sm leading-6 text-slate-700">
     Number: <strong>+91 95052 11212</strong>. Only use this when you intend
     to stop Cloud API messaging and attempt a separate WhatsApp Business mobile registration.
    </p>
    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
     This action will stop Zeshu receiving and sending WhatsApp messages through the current Cloud API number.
     Existing private Inbox records remain stored. It will not delete your Meta WABA,
     automatically create a mobile account, request an OTP or guarantee mobile login.
    </p>
    <div className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
     <div className="flex items-center justify-between gap-2">
      <strong>Current Meta registration</strong>
      <button type="button" onClick={()=>void inspect()} disabled={loading||busy}
       className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-50">Check again</button>
     </div>
     {loading?<p className="mt-2">Checking the exact phone with Meta…</p>
     :phoneStatus?.status==='CLOUD_API_ONLY'
       ?<p className="mt-2 font-semibold text-amber-900">Cloud API-only. Phone ownership and existing Zeshu registration confirmed.</p>
       :<p className="mt-2 font-semibold text-slate-700">
        {phoneStatus?.status||'UNKNOWN'} — Deregistration is blocked until the server can verify the phone and current platform.</p>}
     {checkError&&<p role="alert" className="mt-2 text-sm text-red-700">{checkError}</p>}
    </div>
    {!completed&&<>
     <label className="mt-5 block text-sm font-bold" htmlFor="confirm-phone">
      Type <span className="font-mono text-xs">{PHRASE}</span>
     </label>
     <input id="confirm-phone" className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
      autoComplete="off" spellCheck={false} value={phrase} onChange={e=>setPhrase(e.target.value)}
      placeholder="Type the full confirmation phrase"/>
     <label className="mt-4 flex items-start gap-3 text-sm leading-6">
      <input type="checkbox" className="mt-1.5 h-4 w-4" checked={acceptImpact} onChange={e=>setAcceptImpact(e.target.checked)}/>
      <span>I understand Zeshu's current Cloud API WhatsApp messaging will stop for this number.</span>
     </label>
     <label className="mt-3 flex items-start gap-3 text-sm leading-6">
      <input type="checkbox" className="mt-1.5 h-4 w-4" checked={acceptOtp} onChange={e=>setAcceptOtp(e.target.checked)}/>
      <span>I understand this does not guarantee that WhatsApp Business mobile will send an OTP or let me log in.</span>
     </label>
     <button type="button" onClick={()=>void submit()} disabled={!canProceed}
      className="mt-5 w-full rounded-xl bg-red-700 p-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
      {busy?'Asking Meta to deregister…':'Deregister this number from Cloud API'}
     </button>
    </>}
    {result&&<div role="status" className={'mt-5 rounded-xl border p-4 text-sm leading-6 '+(completed
      ?'border-emerald-300 bg-emerald-50 text-emerald-950'
      :'border-amber-300 bg-amber-50 text-amber-950')}>
     <p className="font-black">{completed?'Meta confirmed Cloud API deregistration':'Deregistration was not confirmed'}</p>
     <p className="mt-2">{result.note||result.status}</p>
     {!completed&&<p className="mt-2 text-xs">Status: {result.status}
      {typeof result.providerHttpStatus==='number'?' · Meta HTTP '+result.providerHttpStatus:''}
      {typeof result.providerErrorCode==='number'?' · Meta code '+result.providerErrorCode:''}
     </p>}
    </div>}
    {completed&&<p className="mt-3 text-sm leading-6">
     Your next action is to open WhatsApp Business on your phone and follow its official registration process.
     If verification remains unavailable, use WhatsApp support; do not repeatedly request OTPs.
    </p>}
   </div>
  </div>
 </main>;
}
