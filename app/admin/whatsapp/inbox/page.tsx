"use client";

import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {adminSupabase} from '@/app/lib/browser-supabase';
import {ArrowLeft,RefreshCw,MessageCircle,ShieldCheck,FilePenLine,ChevronLeft} from 'lucide-react';

const supabase=adminSupabase();
type Thread={id:string;customer_wa_id:string;display_name:string;last_message_preview:string;last_message_at:string|null;status:string};
type Message={id:string;direction:'INBOUND';message_type:string;body:string;sent_at:string};
type Detail={thread:Thread;messages:Message[];draft:{body:string;updated_at:string}|null;canSend:false};
type WebhookReadiness={
  webhookCallbackUrl:string;webhookSecretsPresent:boolean;accountIdentifiersPresent:boolean;
  observedSignedCallbacks:number;observedMatchingAccountCallbacks:number;
  observedInboundMessageEvents:number;lastSignedCallbackAt:string|null;
  observedMessagesFieldCallbacks:number;observedPhoneMessagesCallbacks:number;
  observedCandidateMessageEvents:number;observedIgnoredMessageEvents:number;
  lastMessagesFieldCallbackAt:string|null;lastPhoneMessagesCallbackAt:string|null;
  subscriptionVerified:false;sendingEnabled:false;
};
const date=(value:string|null)=>value?new Date(value).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'';
const digits=(v:string)=>v.length>4?'••••'+v.slice(-4):'••••';
export default function ZeshuWhatsappInbox(){
  const [threads,setThreads]=useState<Thread[]>([]);
  const [webhook,setWebhook]=useState<WebhookReadiness|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const [detail,setDetail]=useState<Detail|null>(null);
  const [draft,setDraft]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [repairBusy,setRepairBusy]=useState(false);
  const [repairOutcome,setRepairOutcome]=useState('');
  const [fieldBusy,setFieldBusy]=useState(false);
  const [fieldResult,setFieldResult]=useState('');
  const [messagesRepairBusy,setMessagesRepairBusy]=useState(false);
  const [messagesRepairResult,setMessagesRepairResult]=useState('');
  const [mobileBusy,setMobileBusy]=useState(false);
  const [mobileResult,setMobileResult]=useState('');
  const auth=async()=>{
    const {data}=await supabase.auth.getSession();
    const token=data.session?.access_token;
    if(!token)throw new Error('Sign in with your Zeshu admin account.');
    return {Authorization:'Bearer '+token};
  };
  const refresh=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true);
    try{
      const headers=await auth();
      const [response,healthResponse]=await Promise.all([
        fetch('/api/admin/whatsapp/inbox',{headers,cache:'no-store'}),
        fetch('/api/admin/whatsapp/webhook-health',{headers,cache:'no-store'}),
      ]);
      const [payload,healthPayload]=await Promise.all([
        response.json().catch(()=>({})),
        healthResponse.json().catch(()=>({})),
      ]);
      if(!response.ok)throw new Error(payload.error||'Inbox is temporarily unavailable.');
      setThreads(Array.isArray(payload.conversations)?payload.conversations:[]);
      setWebhook(healthResponse.ok?healthPayload as WebhookReadiness:null);
      setError('');
    }catch(e){setError(e instanceof Error?e.message:'Inbox could not be loaded.');}
    finally{setLoading(false);}
  },[]);
  const loadThread=useCallback(async(id:string)=>{
    setSelected(id);setDetail(null);setNotice('');
    try{
      const response=await fetch('/api/admin/whatsapp/inbox/'+encodeURIComponent(id),{
        headers:await auth(),cache:'no-store',
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'Conversation unavailable.');
      setDetail(data as Detail);setDraft(typeof data.draft?.body==='string'?data.draft.body:'');
      setError('');
    }catch(e){setError(e instanceof Error?e.message:'Conversation unavailable.');}
  },[]);
  useEffect(()=>{
    void refresh();
    const timer=window.setInterval(()=>{void refresh(true);},30000);
    return()=>window.clearInterval(timer);
  },[refresh]);
  // Read only. This never triggers a WhatsApp OTP or registers/deregisters the phone.
  const repairMessagesField=async()=>{
    if(messagesRepairBusy)return;
    const agreed=window.confirm('Repair ONLY the incoming WhatsApp messages webhook field on the EXISTING Zeshu Meta app for +91 95052 11212? Zeshu will first verify the phone, WABA, app, callback and existing fields. It will never send messages, change your number, request an OTP or overwrite a different callback.');
    if(!agreed)return;
    setMessagesRepairBusy(true);setMessagesRepairResult('');
    try{
      const reply=await fetch('/api/admin/whatsapp/repair-messages-field',{
        method:'POST',cache:'no-store',
        headers:{...(await auth()),'Content-Type':'application/json'},
        body:JSON.stringify({action:'repair_existing_messages_field',
          confirmInboundOnly:true,expectedPhoneLast4:'1212'}),
      });
      const data=await reply.json().catch(()=>({}));
      const statuses:Record<string,string>={
        REPAIRED:'✅ Meta accepted the incoming messages field and a read-back confirmed it. Next, verify a genuine customer message reaches the Inbox.',
        ALREADY_READY:'✅ The incoming messages field is already subscribed to the verified Zeshu app callback. No change was needed. A real incoming customer message is still required to confirm end-to-end delivery.',
        CALLBACK_MISMATCH:'⚠️ Meta app has a different callback URL. No change was made to avoid disrupting other integrations. Review this app in Meta for Developers.',
        APP_SUBSCRIPTION_MISSING:'⚠️ Meta has no app-level WABA object subscription. This repair will not create a new one automatically. Configure it in the Zeshu Support Meta app.',
        APP_INACTIVE:'⚠️ The app-level subscription is inactive. Review Meta dashboard without deleting any existing settings.',
        WABA_UNVERIFIED:'⚠️ WABA subscription could not be verified. Try the account subscription read-only check first.',
        WABA_NOT_SUBSCRIBED:'⚠️ Existing WABA app subscription is missing. Use Check & repair incoming connection first.',
        WRONG_PHONE:'⚠️ The configured phone does not match Zeshu’s existing +91 95052 11212. No changes were made.',
        TOKEN_UNAUTHORIZED:'Meta did not authorize the existing app-level configuration. Check credentials privately in Cloudflare.',
        META_REFUSED:'Meta rejected this incoming webhook field request. Do not retry repeatedly. Review Meta app configuration.',
        FIELD_DATA_UNAVAILABLE:'Meta did not return a safe field list. No changes were made to preserve existing subscriptions.',
        MULTIPLE_SUBSCRIPTIONS:'Meta returned ambiguous app configurations. No changes were made.',
        OWNERSHIP_UNVERIFIED:'Meta could not verify the number belongs to the configured Zeshu WABA.',
        MISSING_SETTINGS:'Required Meta settings are missing in Cloudflare.',
        INVALID_CONFIG:'Existing Meta configuration requires review. No phone changes were made.',
        META_UNAVAILABLE:'Meta could not be reached. No confirmed change was made.',
        NOT_CONFIRMED:'Meta webhook field change could not be confirmed by a read-back. Check again after the provider recovers.',
      };
      setMessagesRepairResult((statuses[data.status]||'The incoming webhook setting was not verified.')
        +(data.providerHttpStatus?' · Meta HTTP '+data.providerHttpStatus:''));
      await refresh(true);
    }catch{
      setMessagesRepairResult('Unable to check the remote Meta setting. No WhatsApp message or phone registration action was initiated.');
    }finally{setMessagesRepairBusy(false);}
  };
  const inspectMobileRegistration=async()=>{
    if(mobileBusy)return;
    setMobileBusy(true);setMobileResult('');
    try{
      const response=await fetch('/api/admin/whatsapp/mobile-registration',{
        headers:await auth(),cache:'no-store',
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(result.error||'Could not check the Meta phone status.');
      const messages:Record<string,string>={
        COEXISTENCE_ACTIVE:'✅ Meta reports that this number is on Cloud API and also linked to the WhatsApp Business mobile app. The SMS OTP issue requires separate WhatsApp verification support; do not request repeated codes.',
        CLOUD_API_ONLY:'⚠️ Meta reports that this number is on Cloud API but NOT linked to WhatsApp Business mobile app. A standard mobile-app login is not the same as approved Coexistence. Do not deregister Cloud API or retry OTP repeatedly. A number migration or alternative number needs a deliberate decision.',
        APP_INDICATED:'Meta reports a Business app connection, but the API platform is not CLOUD_API. Review the account with Meta before any registration change.',
        NOT_CONFIRMED:'Meta did not confirm mobile-app registration or Cloud API coexistence. Review the phone in WhatsApp Manager.',
        OWNERSHIP_UNVERIFIED:'Meta could not verify the phone belongs to the configured Zeshu WABA. No registration was changed.',
        WRONG_NUMBER:'The configured WABA phone does not match Zeshu’s expected number. Do not make any changes.',
        MISSING_SETTINGS:'A required server-side setting is missing. Do not paste tokens or secrets here.',
        INVALID_CONFIG:'Cloudflare Meta credentials or IDs appear malformed; inspect their names without exposing their values.',
        META_UNAVAILABLE:'Meta did not return a verified phone platform status. No conclusion about mobile-app eligibility can be drawn.',
        UNSUPPORTED_FIELDS:'Meta does not support this read-only phone field combination for the current API version or permissions. No registration change was made.',
        TOKEN_UNAUTHORIZED:'Meta did not authorize the phone status check. Inspect app permissions privately, not by rotating the token without evidence.',
      };
      setMobileResult((messages[result.status]||'Could not determine phone registration status.')
       +(result.providerHttpStatus?' · Meta HTTP '+result.providerHttpStatus:'')
       +'. This check cannot unblock or request a WhatsApp OTP.');
    }catch(e){setMobileResult(e instanceof Error?e.message:'Phone check unavailable.');}
    finally{setMobileBusy(false);}
  };
  const inspectMetaMessagesField=async()=>{
    if(fieldBusy)return;
    setFieldBusy(true);setFieldResult('');
    try{
      const response=await fetch('/api/admin/whatsapp/app-webhook',{
        headers:await auth(),cache:'no-store',
      });
      const state=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(state.error||'Meta webhook fields check unavailable.');
      const explanation:Record<string,string>={
        READY:'✅ The Meta app-level messages field and Zeshu callback URL match. An actual signed incoming callback is still required to prove delivery.',
        MESSAGES_NOT_SUBSCRIBED:'⚠️ Meta app-level messages field is not subscribed. In Zeshu Support → WhatsApp → Configuration / Webhooks, subscribe to the messages field.',
        CALLBACK_MISMATCH:'⚠️ Meta app webhook URL does not match the Zeshu callback. Inspect WhatsApp → Configuration / Webhooks; do not replace it without reviewing any other app integrations.',
        INACTIVE:'⚠️ Meta app webhook subscription is inactive. Check Zeshu Support → Webhooks.',
        SUBSCRIPTION_MISSING:'⚠️ Zeshu Support has no WhatsApp Business Account object webhook subscription. Configure it in Meta app Webhooks.',
        FIELD_DATA_UNAVAILABLE:'Meta did not provide the webhook fields. Check them directly in the Zeshu Support Meta app.',
        TOKEN_UNAUTHORIZED:'Meta would not authorize the private read-only app configuration check. Review app permissions and credentials in Cloudflare; do not paste secrets here.',
        META_UNAVAILABLE:'Meta app webhook settings could not be reached. Check Meta directly or try again later.',
        MISSING_SETTINGS:'Cloudflare is missing an app webhook diagnostic setting.',
        INVALID_CONFIG:'Meta app diagnostic settings require review in Cloudflare.',
      };
      setFieldResult((explanation[state.status]||'Unable to verify the Meta app webhook configuration.')
       +(state.providerHttpStatus?' · HTTP '+state.providerHttpStatus:''));
    }catch(e){setFieldResult(e instanceof Error?e.message:'Could not check Meta webhook fields.');}
    finally{setFieldBusy(false);}
  };
  const repairInboundSubscription=async()=>{
    if(repairBusy)return;
    const agreed=window.confirm('Check the existing +91 95052 11212 Meta account and, only if not subscribed, connect its inbound webhook to Zeshu Support? This does not send messages, register the number or fix mobile-app OTP. Continue?');
    if(!agreed)return;
    setRepairBusy(true);setRepairOutcome('');setError('');
    try{
      const response=await fetch('/api/admin/whatsapp/repair-subscription',{
        method:'POST',cache:'no-store',
        headers:{...(await auth()),'Content-Type':'application/json'},
        body:JSON.stringify({action:'subscribe_existing_waba',allowInboundWebhooks:true,expectedPhoneLast4:'1212'}),
      });
      const body=await response.json().catch(()=>({}));
      if(body.status==='SUBSCRIBED'||body.status==='ALREADY_SUBSCRIBED'){
        setRepairOutcome('✅ '+(body.note||'WABA subscription verified.')+' Check Meta → WhatsApp → Configuration → messages field if signed callbacks remain at zero.');
      }else{
        setRepairOutcome('Not connected yet: '+(body.status||'UNAVAILABLE')
          +(body.diagnosticReason?' · '+body.diagnosticReason:'')
          +(body.providerHttpStatus?' · HTTP '+body.providerHttpStatus:'')
          +'. Your phone and credentials have not been changed.');
      }
      await refresh(true);
    }catch{
      setRepairOutcome('The private connection check could not complete. No message or phone registration was initiated.');
    }finally{setRepairBusy(false);}
  };
  const saveDraft=async()=>{
    if(!selected||!draft.trim()||saving)return;
    setSaving(true);setError('');setNotice('');
    try{
      const response=await fetch('/api/admin/whatsapp/inbox/'+encodeURIComponent(selected),{
        method:'POST',
        headers:{...(await auth()),'Content-Type':'application/json'},
        body:JSON.stringify({action:'save_draft',body:draft.trim()}),
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Could not save draft.');
      setNotice('Draft saved privately — not sent to WhatsApp.');
    }catch(e){setError(e instanceof Error?e.message:'Draft could not be saved.');}
    finally{setSaving(false);}
  };
  return <main className="min-h-screen bg-[#f3f7f5] text-slate-900">
    <header className="bg-[#075e45] px-4 py-4 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/whatsapp" aria-label="Back to WhatsApp HQ" className="rounded-xl bg-white/15 p-2.5"><ArrowLeft size={19}/></Link>
          <div><h1 className="text-lg font-black md:text-xl">Zeshu WhatsApp Inbox</h1>
            <p className="text-xs text-emerald-100">Private admin · mobile ready</p></div>
        </div>
        <button type="button" disabled={loading} onClick={()=>void (selected?loadThread(selected):refresh())}
          className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-bold disabled:opacity-50">
          <RefreshCw size={16}/>Refresh
        </button>
      </div>
    </header>
    <div className="mx-auto max-w-5xl px-3 py-4 md:px-5">
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="flex items-center gap-2 font-black"><ShieldCheck size={18}/>Customer messaging is OFF</p>
        <p className="mt-1 leading-5">Only messages actually received via your verified Meta webhook appear here. Replies are saved as drafts and are <strong>never sent</strong>. Do not expect mobile-app chats to sync without approved Coexistence.</p>
      </div>
      {!loading&&webhook&&
        <section aria-label="WhatsApp connection status" className="mb-4 rounded-2xl border border-amber-200 bg-white p-4 text-sm text-slate-800">
          <p className="font-black text-amber-900">{webhook.observedSignedCallbacks>0?
            'Signed Meta callbacks received · customer inbox not yet verified':'WhatsApp inbox is waiting for Meta callbacks'}</p>
          <p className="mt-2 leading-6">{webhook.observedSignedCallbacks>0
            ?'Meta has sent '+webhook.observedSignedCallbacks+' signed callback(s) to Zeshu, including '+webhook.observedMatchingAccountCallbacks+' for the configured account. '+webhook.observedInboundMessageEvents+' customer messages have been recorded. This does not prove mobile app coexistence or real customer-message delivery.'
            :'Zeshu has not recorded an authenticated callback from Meta. This does not prove your phone is disconnected: a connected number and a configured API token do not confirm webhook subscription.'}</p>
          <p className="mt-2 font-semibold">Next: verify the messages field and the mobile-app registration status without requesting any OTP.</p>
          <ol className="mt-2 list-inside list-decimal space-y-2 leading-6">
            <li>Open Meta for Developers → Zeshu Support → WhatsApp → Configuration / Webhooks.</li>
            <li>Use the callback URL shown below and the <strong>existing private Cloudflare webhook verification token</strong>. Never paste that token here.</li>
            <li>Subscribe to the WhatsApp Business Account <code>messages</code> field and verify the application is subscribed to the correct Zeshu WABA.</li>
            <li>Return here and tap Refresh to check for new signed callbacks. No customer messaging will be enabled by this check.</li>
          </ol>
          <p className="mt-3 break-all rounded-xl bg-slate-50 p-3 font-mono text-xs">{webhook.webhookCallbackUrl}</p>
          <p className="mt-2 text-xs text-slate-600">Webhook secrets: {webhook.webhookSecretsPresent?'detected':'not detected'} · Phone/account IDs: {webhook.accountIdentifiersPresent?'detected':'not detected'}</p>
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-4">
            <p className="font-black text-emerald-900">Simpler option: verify or repair the existing Meta WABA subscription</p>
            <p className="mt-1 text-xs leading-5 text-emerald-950">Zeshu first checks your exact registered phone and Meta application. Only if the WABA is not subscribed can it request an inbound-only subscription. This does not send WhatsApp messages or make the mobile app receive OTPs.</p>
            <button type="button" disabled={repairBusy} onClick={()=>void repairInboundSubscription()}
              className="mt-3 min-h-12 rounded-xl bg-[#075e45] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
              {repairBusy?'Checking Meta securely…':'Check & repair incoming connection'}
            </button>
            {repairOutcome&&<p role="status" className="mt-2 text-xs font-semibold leading-5 text-emerald-950">{repairOutcome}</p>}
            <div className="mt-4 border-t border-emerald-300 pt-3">
              <p className="font-bold text-emerald-950">Why does the Zeshu number fail to log into WhatsApp Business?</p>
              <p className="mt-1 text-xs leading-5 text-emerald-950">Check Meta's existing phone status: Cloud API-only or linked to the WhatsApp Business app. No Meta account password, OTP, additional sign-in or number re-registration is required for this read-only check.</p>
              <button type="button" disabled={mobileBusy} onClick={()=>void inspectMobileRegistration()}
               className="mt-2 rounded-xl border border-[#075e45] bg-white px-4 py-3 text-sm font-bold text-[#075e45] disabled:opacity-50">
                {mobileBusy?'Checking phone registration…':'Check WhatsApp mobile login & Cloud API status'}
              </button>
              {mobileResult&&<p role="status" className="mt-2 text-xs font-semibold leading-5 text-emerald-950">{mobileResult}</p>}
            </div>
            <div className="mt-4 border-t border-emerald-300 pt-3">
              <p className="font-bold text-emerald-950">Next: verify Meta's messages webhook field</p>
              <p className="mt-1 text-xs leading-5 text-emerald-950">Your app-to-WABA subscription may be correct while the separate messages field or callback URL is not. This additional check reads the Meta app's configuration privately without changing it.</p>
              <button type="button" disabled={fieldBusy} onClick={()=>void inspectMetaMessagesField()}
               className="mt-2 rounded-xl border border-[#075e45] bg-white px-4 py-3 text-sm font-bold text-[#075e45] disabled:opacity-50">
                {fieldBusy?'Checking Meta webhook fields…':'Check messages field & callback URL'}
              </button>
              {fieldResult&&<p role="status" className="mt-2 text-xs font-semibold leading-5 text-emerald-950">{fieldResult}</p>}
              <p className="mt-3 text-xs leading-5 text-emerald-950">If the messages field is missing, Zeshu can safely add it only when the existing app and callback are confirmed. Existing fields are preserved; different callback URLs are never overwritten.</p>
              <button type="button" disabled={messagesRepairBusy} onClick={()=>void repairMessagesField()}
               className="mt-2 min-h-12 rounded-xl bg-[#075e45] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {messagesRepairBusy?'Verifying current Meta fields…':'Verify & repair incoming messages field'}
              </button>
              {messagesRepairResult&&<p role="status" className="mt-2 text-xs font-semibold leading-5 text-emerald-950">{messagesRepairResult}</p>}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a className="rounded-xl bg-[#075e45] px-4 py-3 font-bold text-white" href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">Open Meta Developer apps ↗</a>
            <Link className="font-bold text-emerald-900 underline" href="/admin/whatsapp">View full Zeshu WhatsApp diagnostics</Link>
          </div>
        </section>}
      {!loading&&webhook&&webhook.observedSignedCallbacks>0&&
        <div className="mb-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm">
          <p className="font-bold text-emerald-900">{webhook.observedSignedCallbacks} signed Meta callbacks observed.</p>
          <p className="mt-1 text-slate-700">{webhook.observedMatchingAccountCallbacks} matched Zeshu's account. {webhook.observedInboundMessageEvents} inbound messages recorded.</p>
          <p className="mt-2 text-slate-700">Since additional message-field diagnostics launched: {webhook.observedMessagesFieldCallbacks??0} callbacks with the <code>messages</code> field; {webhook.observedPhoneMessagesCallbacks??0} contained messages for the correct Zeshu phone; {webhook.observedCandidateMessageEvents??0} candidate messages; {webhook.observedIgnoredMessageEvents??0} candidate messages filtered by strict inbox validation.</p>
          {(webhook.observedMessagesFieldCallbacks??0)===0&&<p className="mt-1 text-xs font-semibold text-amber-900">No <code>messages</code> field callbacks have been observed since these counters were installed. A previous signed callback may have concerned a different event.</p>}
          {(webhook.observedIgnoredMessageEvents??0)>0&&<p className="mt-1 text-xs font-semibold text-amber-900">Some signed message candidates were filtered. Review webhook parsing and correct account metadata before assuming the Meta subscription is broken.</p>}
          <p className="mt-1 text-xs text-slate-500">These detailed counters begin on 11 October; old callbacks cannot be classified retroactively. Receipt of a signed callback does not prove Cloud API sending, mobile app coexistence, or actual customer-message delivery.</p>
        </div>}
      {!loading&&!webhook&&<p className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">Webhook health is not available right now. The inbox is still private; check <Link href="/admin/whatsapp" className="font-bold underline">WhatsApp HQ</Link> for diagnostics.</p>}
      {error&&<p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
      {notice&&<p role="status" className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{notice}</p>}
      <div className="grid min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[300px_minmax(0,1fr)]">
        <section className={`border-r border-slate-100 ${selected?'hidden md:block':''}`}>
          <div className="border-b border-slate-100 p-4"><h2 className="font-black">Customer conversations</h2>
            <p className="text-xs text-slate-500">Inbound only · {threads.length} recent threads</p></div>
          {loading&&threads.length===0?<p className="p-5 text-sm text-slate-500">Checking for incoming messages…</p>:
            threads.length===0?<div className="space-y-2 p-5 text-center text-sm text-slate-600">
              <MessageCircle className="mx-auto text-emerald-700" size={30}/>
              <p className="font-bold">No WhatsApp messages received yet</p>
              <p>Messages appear only after Meta's webhook is subscribed, connected to the correct phone, and customers send an actual message.</p>
              <Link href="/admin/whatsapp" className="inline-block font-bold text-emerald-800 underline">Check WhatsApp readiness</Link>
            </div>:threads.map(thread=><button type="button" key={thread.id} onClick={()=>void loadThread(thread.id)}
              className={`block w-full border-b border-slate-100 p-4 text-left hover:bg-emerald-50 ${selected===thread.id?'bg-emerald-50':''}`}>
              <div className="flex items-center justify-between gap-2"><span className="truncate font-bold">{thread.display_name||'WhatsApp customer'}</span><span className="shrink-0 text-[10px] text-slate-500">{date(thread.last_message_at)}</span></div>
              <p className="mt-1 text-xs text-slate-500">Number ending {digits(thread.customer_wa_id)}</p>
              <p className="mt-2 truncate text-sm text-slate-600">{thread.last_message_preview}</p>
            </button>)}
        </section>
        <section className={`flex min-h-[470px] flex-col ${!selected?'hidden md:flex':''}`}>
          {!selected?<div className="m-auto p-6 text-center text-slate-500">Select a WhatsApp conversation to read its incoming messages.</div>:
           !detail?<div className="p-5 text-sm text-slate-500">Loading conversation…</div>:
            <>
              <div className="flex items-center gap-2 border-b border-slate-100 p-4">
                <button type="button" onClick={()=>{setSelected(null);setDetail(null);setError('');}} className="rounded-lg p-2 md:hidden" aria-label="Back to conversations"><ChevronLeft size={20}/></button>
                <div className="min-w-0"><p className="truncate font-black">{detail.thread.display_name||'WhatsApp customer'}</p>
                  <p className="text-xs text-slate-500">Number ending {digits(detail.thread.customer_wa_id)}</p></div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#edf5ed] p-3 md:p-5">
                {detail.messages.length===0?<p className="text-sm text-slate-600">No messages in this conversation.</p>:
                  detail.messages.map(m=><div key={m.id} className="max-w-[95%] rounded-2xl bg-white p-3 shadow-sm sm:max-w-[85%]">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{m.body}</p>
                    <p className="mt-1 text-right text-[10px] text-slate-500">{date(m.sent_at)} · Received</p>
                  </div>)}
              </div>
              <form onSubmit={e=>{e.preventDefault();void saveDraft();}} className="space-y-2 border-t border-slate-100 p-4">
                <label htmlFor="whatsapp-inbox-draft" className="flex items-center gap-2 text-sm font-black"><FilePenLine size={17}/>Reply draft (not sent)</label>
                <textarea id="whatsapp-inbox-draft" value={draft} onChange={e=>setDraft(e.target.value)}
                  maxLength={4000} rows={3} placeholder="Write a response to save for later review…"
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-700"/>
                <button type="submit" disabled={saving||!draft.trim()} className="w-full rounded-xl bg-[#075e45] px-4 py-3 font-bold text-white disabled:opacity-50 sm:w-auto">
                  {saving?'Saving…':'Save draft only'}
                </button>
                <p className="text-xs text-slate-500">No send action is available. We will add sending only after Cloud API ownership, webhooks, customer consent and your approval are verified.</p>
              </form>
            </>}
        </section>
      </div>
    </div>
  </main>;
}
