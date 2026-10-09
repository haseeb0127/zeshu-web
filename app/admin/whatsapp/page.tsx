"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { adminSupabase } from '../../lib/browser-supabase';
import { ArrowLeft, RefreshCw, ShieldCheck, MessageCircle, AlertCircle, Link2 } from 'lucide-react';

const supabase = adminSupabase();
type MetaConnection = {
  wabaId:string;phoneNumberId:string;phoneNumber:string|null;verifiedName:string|null;
  connectedAt:string;verifiedAt:string;
};
type MetaSetup = {
  configured:boolean;missingSetup:string[];appId:string|null;configId:string|null;
  graphVersion:string|null;nonce?:string;connection:MetaConnection|null;safeToSend:false;
};
type MetaJsSdk = {
  init:(opts:{appId:string;cookie:boolean;xfbml:boolean;version:string})=>void;
  login:(cb:(resp:{authResponse?:{code?:string}})=>void,
    opts:{config_id:string;response_type:'code';override_default_response_type:true;
      extras:{setup:object;feature:string;sessionInfoVersion:string;version:string}})=>void;
};
const FBWindow = () => window as Window & {FB?:MetaJsSdk;fbAsyncInit?:()=>void};
const META_SIGNUP_ORIGINS = new Set(['https://www.facebook.com','https://web.facebook.com','https://business.facebook.com']);
type Audit = {event:string;name:string|null;language:string|null;status:string;category:string|null};
type Readiness = {
  senderEnabled:boolean; uiEnabled:boolean; senderConfigured:boolean; webhookConfigured:boolean;
  cronConfigured:boolean; wabaConfigured:boolean; technicalChecksPassed:boolean;
  missingSenderConfig:string[]; missingWebhookConfig:string[];
  templateAudit:{configured:boolean;verified:boolean;templates:Audit[]};
  metrics:{queuedEvents:number;optedInAccounts:number;deliveryEvents:number}|null;
  note:string;
};

const signal = (ready:boolean) => ready ? 'READY' : 'NEEDS SETUP';
const pill = (ready:boolean) => ready
  ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';

export default function WhatsAppReadinessPage() {
  const [data,setData]=useState<Readiness|null>(null);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState('');
  const [meta,setMeta]=useState<MetaSetup|null>(null);
  const [metaBusy,setMetaBusy]=useState(false);
  const [sdkReady,setSdkReady]=useState(false);
  const [connectStatus,setConnectStatus]=useState('');
  const connectLock=useRef(false);
  const metaSessionRef=useRef<{
    nonce:string;code:string|null;ids:{wabaId:string;phoneNumberId:string}|null;
    cleanup:()=>void;
  }|null>(null);
  const reload=useCallback(async()=>{
    setBusy(true);setError('');
    try {
      const {data: session}=await supabase.auth.getSession();
      const token=session.session?.access_token;
      if (!token) throw new Error('Admin sign-in required.');

      const headers={Authorization:`Bearer ${token}`};
      const [response,metaResponse]=await Promise.all([
        fetch('/api/admin/support/whatsapp-readiness',{headers,cache:'no-store'}),
        fetch('/api/admin/whatsapp/connect',{headers,cache:'no-store'}),
      ]);
      const [payload,metaPayload]=await Promise.all([
        response.json().catch(()=>({})),metaResponse.json().catch(()=>({})),
      ]);
      if (!response.ok) throw new Error(payload.error||'Could not inspect WhatsApp readiness.');
      if (!metaResponse.ok) throw new Error(metaPayload.error||'Could not check Meta connection.');
      setData(payload as Readiness);
      setMeta(metaPayload as MetaSetup);
    } catch(e) {setError(e instanceof Error?e.message:'WhatsApp readiness unavailable.');}
    finally {setBusy(false);}
  },[]);
  useEffect(()=>{void reload();},[reload]);

  // Meta's official JavaScript SDK loads from facebook.net; no browser automation
  // subscriptions or customer notifications are involved in this admin login.
  useEffect(()=>{
    if (!meta?.configured || !meta.appId || !meta.graphVersion) return;
    const fb=FBWindow();
    const initialize=()=>{
      if (!fb.FB) return;
      fb.FB.init({appId:meta.appId!,cookie:true,xfbml:false,version:meta.graphVersion!});
      setSdkReady(true);
    };
    if (fb.FB) {initialize();return;}
    fb.fbAsyncInit=initialize;
    if (!document.getElementById('facebook-jssdk')) {
      const script=document.createElement('script');
      script.id='facebook-jssdk';
      script.src='https://connect.facebook.net/en_US/sdk.js';
      script.async=true;
      script.defer=true;
      script.onerror=()=>setConnectStatus('Meta login could not load. Try opening this page directly in Chrome.');
      document.head.appendChild(script);
    }
    return ()=>{fb.fbAsyncInit=undefined;};
  },[meta?.configured,meta?.appId,meta?.graphVersion]);

  useEffect(()=>()=>{metaSessionRef.current?.cleanup();},[]);
  const connectMeta=async()=>{
    if (connectLock.current || !meta?.configured || !meta.nonce || !meta.configId || !sdkReady) return;
    const fb=FBWindow().FB;
    if(!fb) return;
    connectLock.current=true;
    setMetaBusy(true);setConnectStatus('Opening Meta authorization…');
    let timer:ReturnType<typeof setTimeout>;
    const release=()=>{
      window.removeEventListener('message',onMetaMessage);
      clearTimeout(timer);
      connectLock.current=false;setMetaBusy(false);
      metaSessionRef.current=null;
    };
    const attempt={nonce:meta.nonce,code:null as string|null,
      ids:null as {wabaId:string;phoneNumberId:string}|null,cleanup:release};
    metaSessionRef.current=attempt;
    const complete=async()=>{
      if (!attempt.code || !attempt.ids || !connectLock.current) return;
      // Clear the code immediately, preventing duplicate attempts on
      // repeated Meta postMessages or multiple Facebook Login callbacks.
      const code=attempt.code;attempt.code=null;
      setConnectStatus('Verifying WhatsApp Business Account ownership with Meta…');
      try{
        const {data:session}=await supabase.auth.getSession();
        const token=session.session?.access_token;
        if(!token) throw Error('Admin session expired.');
        const response=await fetch('/api/admin/whatsapp/connect',{
          method:'POST',credentials:'same-origin',
          headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({...attempt.ids,code,nonce:attempt.nonce}),
        });
        const body=await response.json().catch(()=>({}));
        if(!response.ok) throw Error(body.error||'Meta connection could not be verified.');
        setConnectStatus('Meta WhatsApp account connected and verified. Customer sending remains OFF.');
        release();
        void reload();
      }catch(e){
        setConnectStatus(e instanceof Error?e.message:'Meta connection failed.');
        release();
      }
    };
    function onMetaMessage(event:MessageEvent) {
      if(!META_SIGNUP_ORIGINS.has(event.origin) || !connectLock.current) return;
      try{
        const message=typeof event.data==='string'?JSON.parse(event.data):event.data;
        if(!message || message.type!=='WA_EMBEDDED_SIGNUP') return;
        if(message.event==='CANCEL'){
          setConnectStatus('Meta authorization was cancelled. No connection saved.');release();return;
        }
        if(message.event==='FINISH'){
          const id=message.data;
          if(!id || !/^[0-9]{5,32}$/.test(id.waba_id) || !/^[0-9]{5,32}$/.test(id.phone_number_id)) {
            setConnectStatus('Meta did not return both account and phone IDs. No connection saved.');
            release();return;
          }
          attempt.ids={wabaId:id.waba_id,phoneNumberId:id.phone_number_id};
          void complete();
        }
      }catch{/* Ignore unrelated events. */}
    }
    window.addEventListener('message',onMetaMessage);
    timer=setTimeout(()=>{
      setConnectStatus('Meta authorization timed out. Refresh and try again.');
      release();
    },180000);
    try{
      fb.login((resp)=>{
        const code=resp?.authResponse?.code;
        if (typeof code==='string' && code.length>7) {attempt.code=code;void complete();}
        else {setConnectStatus('Meta login closed or did not authorize access.');release();}
      },{
        config_id:meta.configId,response_type:'code',override_default_response_type:true,
        extras:{setup:{},feature:'whatsapp_embedded_signup',sessionInfoVersion:'3',version:'v4'},
      });
    }catch{
      setConnectStatus('Meta authorization popup could not open. Use Chrome and allow pop-ups.');release();
    }
  };

  const statuses=[
    {label:'Meta Business Account ID',ok:!!data?.wabaConfigured},
    {label:'Sender credentials and templates configured',ok:!!data?.senderConfigured},
    {label:'Webhook secrets configured',ok:!!data?.webhookConfigured},
    {label:'Protected cron credential',ok:!!data?.cronConfigured},
    {label:'Both Meta utility templates approved and compatible',ok:!!data?.templateAudit?.verified},
  ];
  return <main className="min-h-screen bg-[#f6f9f5] text-slate-900">
    <header className="bg-[#075e45] px-5 py-5 text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div className="flex items-center gap-3"><Link href="/admin/dashboard" aria-label="Back to Zeshu HQ" className="rounded-xl bg-white/15 p-2.5"><ArrowLeft size={20}/></Link><div><h1 className="text-xl font-black">WhatsApp HQ</h1><p className="text-xs font-semibold text-emerald-100">Zeshu support · read-only readiness</p></div></div>
        <button onClick={()=>void reload()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-black disabled:opacity-50"><RefreshCw size={16}/>{busy?'Checking…':'Refresh'}</button>
      </div>
    </header>
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
      {data&&<>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 font-black text-amber-950"><ShieldCheck size={20}/>Customer sending remains OFF</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">This page only checks readiness. It never sends messages or turns on automation. You must approve a consented pilot before the first WhatsApp message.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-lg bg-white px-3 py-2">Backend sender: {data.senderEnabled?'ON (review required)':'OFF'}</span>
            <span className="rounded-lg bg-white px-3 py-2">Customer opt-in UI: {data.uiEnabled?'ON (review required)':'OFF'}</span>
          </div>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black"><Link2 size={20}/>Connect your Meta account directly</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Authorize Zeshu through Meta's official WhatsApp Embedded Signup. This connection requires no TinyFish browser service. It verifies ownership of the selected WhatsApp Business Account and phone number, then stores the token encrypted on the server.</p>
          {meta?.connection ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-black text-emerald-900">Meta WhatsApp account connected</p>
            <p className="mt-1 text-xs text-emerald-800">Sender: {meta.connection.verifiedName||'Verified business'} · {meta.connection.phoneNumber||'Phone verified with Meta'}</p>
            <p className="mt-1 text-xs text-emerald-800">WABA: {meta.connection.wabaId} · Phone ID: {meta.connection.phoneNumberId}</p>
            <p className="mt-2 text-xs font-bold text-emerald-900">Connection only: no messages, charges, webhook subscriptions or automated sends were started.</p>
          </div> : null}
          {meta?.configured ? <div className="mt-4">
            <button type="button" onClick={()=>void connectMeta()} disabled={metaBusy || !sdkReady || busy}
              className="rounded-xl bg-[#075e45] px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-50">
              {metaBusy ? 'Connecting securely…' : !sdkReady ? 'Loading Meta login…' : meta.connection ? 'Reconnect Meta business' : 'Connect Meta securely'}
            </button>
            <p className="mt-2 text-xs text-slate-500">You'll choose your existing Zeshu WhatsApp account in Meta. Only an authorized Zeshu administrator can complete this step.</p>
          </div> : <div className="mt-4 rounded-xl bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-900">Meta Developer App configuration needed</p>
            <p className="mt-1 text-xs text-amber-900">Set up Facebook Login for Business (WhatsApp Embedded Signup v4), and enter the missing configuration into Cloudflare Worker settings. The button unlocks automatically once those values are present.</p>
            <p className="mt-3 break-words font-mono text-xs leading-6 text-amber-800">{meta?.missingSetup.join(' · ')||'Checking server configuration…'}</p>
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-black text-[#075e45] underline">Open Meta for Developers ↗</a>
          </div>}
          {connectStatus&&<p role="status" aria-live="polite" className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-800">{connectStatus}</p>}
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Integration checklist</h2>
          <p className="mt-1 text-xs text-slate-500">A green template means Meta returned approved Utility status for the exact name and language, with no unsupported variables.</p>
          <div className="mt-4 space-y-3">{statuses.map(s=><div key={s.label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3"><span className="text-sm font-semibold">{s.label}</span><span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black ${pill(s.ok)}`}>{signal(s.ok)}</span></div>)}</div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Configured secrets do not prove that Meta webhooks are subscribed or the sender phone is ready. These must be tested before launch.</p>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Meta message templates</h2>
          <p className="mt-1 text-xs text-slate-500">Support replies and resolved-case notifications must use approved Utility templates. Promotional or variable-requiring templates are not compatible with the current sender.</p>
          <div className="mt-4 space-y-3">{data.templateAudit.templates.map(row=><div key={row.event} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-black text-slate-700">{row.event==='SUPPORT_REPLY'?'Support reply':'Case resolved'}</span><span className={`rounded-lg px-2.5 py-1 text-[10px] font-black ${pill(row.status==='APPROVED')}`}>{row.status.replaceAll('_',' ')}</span></div>
            <p className="mt-2 break-all font-mono text-xs">{row.name||'Template name not configured'}</p>
            <p className="mt-1 text-xs text-slate-500">Language: {row.language||'not set'} · Category: {row.category||'unknown'}</p>
          </div>)}</div>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black"><MessageCircle size={20}/>Support pipeline</h2>
          {data.metrics ? <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[
              ['Outbox records',data.metrics.queuedEvents],['Opted-in accounts',data.metrics.optedInAccounts],['Webhook status events',data.metrics.deliveryEvents],
            ].map(([label,count])=><div key={String(label)} className="rounded-xl bg-slate-50 p-3"><div className="text-2xl font-black">{count}</div><p className="mt-1 text-[10px] font-bold text-slate-500">{label}</p></div>)}</div>
          : <p className="mt-3 text-sm text-slate-500">Database statistics are unavailable.</p>}
          <p className="mt-4 flex items-start gap-2 text-xs text-slate-600"><AlertCircle size={16} className="shrink-0"/>No delivery claim is made until Meta delivery callbacks and verified recipient consent are tested.</p>
        </section>
        {(data.missingSenderConfig.length>0 || data.missingWebhookConfig.length>0 || !data.wabaConfigured) && <section className="rounded-2xl border border-amber-100 bg-white p-5">
          <h2 className="font-black">Secure setup still needed</h2><p className="mt-2 text-sm text-slate-600">Enter these values only in Cloudflare Worker secrets/variables, never in chat or GitHub:</p>
          <p className="mt-3 break-words font-mono text-xs leading-6 text-amber-800">{Array.from(new Set([...data.missingSenderConfig,...data.missingWebhookConfig,...(!data.wabaConfigured?['WHATSAPP_BUSINESS_ACCOUNT_ID']:[])])).join(' · ')}</p>
        </section>}
      </>}
      {!busy&&!data&&!error&&<p className="rounded-xl bg-white p-5 text-sm">No readiness data available.</p>}
    </div>
  </main>;
}
