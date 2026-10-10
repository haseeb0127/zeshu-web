"use client";

import { useCallback, useEffect, useState } from 'react';
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
  encryptionKeyStatus:'NOT_VISIBLE_IN_ACTIVE_WORKER'|'FILTERED_BY_RUNTIME_ENV'|'INVALID_BASE64_OR_LENGTH'|'VALID_IN_ACTIVE_WORKER';
};
type OwnedStatus = {
  status:'VERIFIED'|'MISSING_SETTINGS'|'TOKEN_UNAUTHORIZED'|'TOKEN_FORMAT_INVALID'|'PHONE_NOT_IN_ACCOUNT'|
    'META_UNAVAILABLE'|'INVALID_CONFIG';
  diagnosticReason?:'NETWORK_OR_TIMEOUT'|'GRAPH_RATE_LIMITED'|'GRAPH_UPSTREAM_ERROR'|
    'GRAPH_ENDPOINT_NOT_FOUND'|'GRAPH_BAD_REQUEST'|'GRAPH_HTTP_ERROR'|
    'GRAPH_INVALID_RESPONSE'|'GRAPH_PAGINATION_LIMIT'|'GRAPH_REDIRECT'|null;
  providerHttpStatus?:number|null;providerErrorCode?:number|null;
  networkFailureKind?:'TIMEOUT'|'FETCH_REJECTED'|null;
  metaGraphReachable?:boolean|null;
  networkAttempts?:number|null;
  exactMetaEndpointReachableWithoutAuth?:boolean|null;
  missing:string[];verified:boolean;
  phoneNumber:string|null;verifiedName:string|null;
  senderEnabled:false;customerMessagingAuthorized:false;note:string;
};
type WebhookHealth={
  webhookCallbackUrl:string;webhookSecretsPresent:boolean;
  accountIdentifiersPresent:boolean;
  observedSignedCallbacks:number;observedMatchingAccountCallbacks:number;
  observedInboundMessageEvents:number;
  lastSignedCallbackAt:string|null;lastMatchingAccountCallbackAt:string|null;
  lastInboundMessageAt:string|null;subscriptionVerified:false;sendingEnabled:false;
};
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
  const [owned,setOwned]=useState<OwnedStatus|null>(null);
  const [health,setHealth]=useState<WebhookHealth|null>(null);
  const reload=useCallback(async()=>{
    setBusy(true);setError('');
    try {
      const {data: session}=await supabase.auth.getSession();
      const token=session.session?.access_token;
      if (!token) throw new Error('Admin sign-in required.');

      const headers={Authorization:`Bearer ${token}`};
      const [response,metaResponse,ownedResponse,healthResponse]=await Promise.all([
        fetch('/api/admin/support/whatsapp-readiness',{headers,cache:'no-store'}),
        fetch('/api/admin/whatsapp/connect',{headers,cache:'no-store'}),
        fetch('/api/admin/whatsapp/own-account',{headers,cache:'no-store'}),
        fetch('/api/admin/whatsapp/webhook-health',{headers,cache:'no-store'}),
      ]);
      const [payload,metaPayload,ownedPayload,healthPayload]=await Promise.all([
        response.json().catch(()=>({})),metaResponse.json().catch(()=>({})),
        ownedResponse.json().catch(()=>({})),healthResponse.json().catch(()=>({})),
      ]);
      if (!response.ok) throw new Error(payload.error||'Could not inspect WhatsApp readiness.');
      if (!metaResponse.ok) throw new Error(metaPayload.error||'Could not check Meta connection.');
      setData(payload as Readiness);
      setMeta(metaPayload as MetaSetup);
      setOwned(ownedResponse.ok?(ownedPayload as OwnedStatus):null);
      setHealth(healthResponse.ok?(healthPayload as WebhookHealth):null);
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
      <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black"><MessageCircle size={20}/>Zeshu WhatsApp Support Inbox</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">A private, mobile-friendly inbox for genuine incoming Cloud API messages. Currently read-only: customer replies can be saved as unsent drafts, but never transmitted.</p>
          <Link href="/admin/whatsapp/inbox" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#075e45] px-5 py-3 text-sm font-black text-white">Open WhatsApp Inbox →</Link>
        </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">Incoming webhook connection</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The inbox currently has no customer messages. Webhooks must be subscribed in Meta before new messages arrive; the existence of a Cloudflare secret does not confirm that Meta is sending callbacks.
        </p>
        {!health?<p className="mt-3 text-sm text-amber-800">Webhook health information is currently unavailable.</p>:
        <>
          <div className="mt-3 space-y-2 text-sm">
            <p>Webhook verification keys: <strong>{health.webhookSecretsPresent?'Configured':'Missing'}</strong></p>
            <p>Account and phone IDs: <strong>{health.accountIdentifiersPresent?'Configured':'Missing'}</strong></p>
            <p>Signed Meta callbacks observed: <strong>{health.observedSignedCallbacks}</strong></p>
            <p>Callbacks for Zeshu account: <strong>{health.observedMatchingAccountCallbacks}</strong></p>
            <p>Inbound messages observed: <strong>{health.observedInboundMessageEvents}</strong></p>
          </div>
          <p className="mt-3 break-all rounded-xl bg-slate-50 p-3 font-mono text-xs">{health.webhookCallbackUrl}</p>
          {health.lastSignedCallbackAt
            ? <p className="mt-2 text-xs text-slate-600">Last signed callback: {new Date(health.lastSignedCallbackAt).toLocaleString('en-IN')}</p>
            : <p className="mt-2 text-sm font-semibold text-amber-800">No authenticated Meta callback has been recorded yet. Check Meta's Webhooks → WhatsApp Business Account → messages subscription. Do not send a test message without approval.</p>}
          <p className="mt-2 text-xs leading-5 text-slate-500">Subscription itself has not been confirmed through Meta's API. Do not confuse a verified callback with permission to send customer messages.</p>
        </>}
      </section>
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
          <h2 className="flex items-center gap-2 text-lg font-black"><Link2 size={20}/>Connect Zeshu's own WhatsApp Business account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Meta's WhatsApp Embedded Signup is restricted to approved Business Solution Providers and Tech Providers. Zeshu does not need that partner onboarding flow just to manage its own business phone. Use the official WhatsApp Cloud API with Zeshu's existing Meta business account instead — no TinyFish required.</p>
          {owned?.verified ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-black text-emerald-900">Existing Zeshu WhatsApp account verified with Meta ✅</p>
            <p className="mt-2 text-sm text-emerald-900">{owned.verifiedName||'Zeshu'} · {owned.phoneNumber||'WhatsApp phone verified'}</p>
            <p className="mt-2 text-xs text-emerald-900">This is a read-only check. No WhatsApp messages, charges or subscriptions were initiated. Customer sending remains OFF.</p>
          </div> : <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-black text-amber-950">Direct Cloud API connection {owned?.status==='MISSING_SETTINGS'?'needs setup':'not yet verified'}</p>
            {owned?.status==='MISSING_SETTINGS' ? <p className="mt-2 break-words font-mono text-xs leading-6 text-amber-950">Cloudflare settings needed: {owned.missing.join(' · ')}</p> : null}
            {owned?.status==='TOKEN_FORMAT_INVALID' ? <p className="mt-2 text-sm text-amber-950">The saved Meta access token has an invalid character or includes extra formatting (such as spaces, quotes, a line break or the wrong token type). Check the original system-user token privately in Cloudflare; no token content is shown here. Do not generate a new number.</p> : null}
            {owned?.status==='TOKEN_UNAUTHORIZED' ? <p className="mt-2 text-sm text-amber-950">Meta refused account access. Confirm that the System User has access to this Zeshu WhatsApp Business Account and that the token has the necessary WhatsApp permissions.</p> : null}
            {owned?.status==='PHONE_NOT_IN_ACCOUNT' ? <p className="mt-2 text-sm text-amber-950">The configured phone number is not listed under the selected WhatsApp Business Account. Check both IDs in Meta.</p> : null}
            {owned?.status==='META_UNAVAILABLE' ? <div className="mt-2 text-sm leading-6 text-amber-950">
              <p>{owned.diagnosticReason==='GRAPH_BAD_REQUEST'||owned.diagnosticReason==='GRAPH_ENDPOINT_NOT_FOUND'
                ? 'Meta rejected this business account lookup. Check that the WhatsApp Business Account ID belongs to the first Zeshu account with your phone number, and that the Graph API version is supported. Do not replace credentials without checking the error details.'
                : owned.diagnosticReason==='NETWORK_OR_TIMEOUT'
                  ? 'The Zeshu server could not reach Meta or the request timed out. This is not evidence that your WhatsApp token is wrong.'
                  : owned.diagnosticReason==='GRAPH_RATE_LIMITED'
                    ? 'Meta is rate-limiting this verification request. Wait before retrying; do not generate a new token.'
                    : owned.diagnosticReason==='GRAPH_UPSTREAM_ERROR'
                      ? 'Meta returned a server error. Try again later; no changes to your credentials are needed yet.'
                      : owned.diagnosticReason==='GRAPH_INVALID_RESPONSE'
                        ? 'Meta returned an unexpected response. The issue may be upstream rather than your account configuration.'
                        : 'Meta account verification did not complete. Review the diagnostic category below before changing credentials.'}</p>
              <p className="mt-2 break-words font-mono text-xs">Safe diagnostic: {owned.diagnosticReason||'NOT_CLASSIFIED'}
                {typeof owned.providerHttpStatus==='number'?' · HTTP '+owned.providerHttpStatus:''}
                {typeof owned.providerErrorCode==='number'?' · Meta code '+owned.providerErrorCode:''}
              </p>
              {owned.diagnosticReason==='NETWORK_OR_TIMEOUT'&&
                <p className="mt-2 font-mono text-xs leading-5">
                  Cloudflare request: {owned.networkFailureKind==='TIMEOUT'?'TIMED OUT':owned.networkFailureKind==='FETCH_REJECTED'?'FETCH REJECTED':'UNKNOWN'}
                  {' · '}Meta public endpoint: {owned.metaGraphReachable===true?'REACHABLE':owned.metaGraphReachable===false?'UNREACHABLE':'NOT CHECKED'}
                  {owned.exactMetaEndpointReachableWithoutAuth===true?' · Exact Graph endpoint without token: REACHABLE':owned.exactMetaEndpointReachableWithoutAuth===false?' · Exact Graph endpoint without token: UNREACHABLE':''}
                  {typeof owned.networkAttempts==='number'?' · Attempts: '+owned.networkAttempts:''}
                </p>}
              <p className="mt-1 text-xs">Only the status and numeric error code are shown. Never share your token or App Secret.</p>
            </div> : null}
            {owned?.status==='INVALID_CONFIG' ? <p className="mt-2 text-sm text-amber-950">One of the Cloudflare values has an invalid format. Please check the names and IDs privately.</p> : null}
            {!owned ? <p className="mt-2 text-sm text-amber-950">Account verification is temporarily unavailable; the existing website is unaffected.</p> : null}
          </div>}
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <p><strong>1.</strong> In Meta Business Settings, open <strong>Users → System users</strong>. Grant a Zeshu system user access to the existing Zeshu WhatsApp Business Account and Zeshu Support app, then generate a server-side token with <code>whatsapp_business_management</code> and <code>whatsapp_business_messaging</code>.</p>
            <p><strong>2.</strong> Find the existing WhatsApp Business Account ID and its <strong>Phone number ID</strong> in Meta WhatsApp Manager / the app's WhatsApp API Setup. Do not create a new number or business.</p>
            <p><strong>3.</strong> Save <code>WHATSAPP_ACCESS_TOKEN</code> as a <strong>Cloudflare Secret</strong>, and <code>WHATSAPP_BUSINESS_ACCOUNT_ID</code> and <code>WHATSAPP_PHONE_NUMBER_ID</code> as Cloudflare variables on the actual production Worker. Keep your existing <code>WHATSAPP_GRAPH_API_VERSION</code>. Do not paste tokens in this chat.</p>
            <p><strong>4.</strong> Deploy the secret configuration to the active Worker version, then tap <strong>Refresh</strong> above. Zeshu will verify the phone's membership in your WhatsApp account without sending messages.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="https://business.facebook.com/settings/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-300 px-4 py-2 text-xs font-black text-[#075e45]">Open Meta Business Settings ↗</a>
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-300 px-4 py-2 text-xs font-black text-[#075e45]">Open Meta Developer app ↗</a>
          </div>
          <p className="mt-3 text-xs text-slate-500">A verified Cloud API connection is not proof that templates, webhooks, consent or sending are ready. No message sending will be enabled without explicit approval.</p>
          {meta?.connection && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">An earlier Meta partner-style connection record exists. Your Zeshu-owned Cloud API setup is checked independently.</p>}
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
