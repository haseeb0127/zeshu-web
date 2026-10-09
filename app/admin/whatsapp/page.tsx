"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminSupabase } from '../../lib/browser-supabase';
import { ArrowLeft, RefreshCw, ShieldCheck, MessageCircle, AlertCircle } from 'lucide-react';

const supabase = adminSupabase();
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
  const reload=useCallback(async()=>{
    setBusy(true);setError('');
    try {
      const {data: session}=await supabase.auth.getSession();
      const token=session.session?.access_token;
      if (!token) throw new Error('Admin sign-in required.');
      const response=await fetch('/api/admin/support/whatsapp-readiness',{
        headers:{Authorization:`Bearer ${token}`},cache:'no-store',
      });
      const payload=await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(payload.error||'Could not inspect WhatsApp readiness.');
      setData(payload as Readiness);
    } catch(e) {setError(e instanceof Error?e.message:'WhatsApp readiness unavailable.');}
    finally {setBusy(false);}
  },[]);
  useEffect(()=>{void reload();},[reload]);

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
