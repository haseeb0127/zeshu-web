"use client";

import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {adminSupabase} from '@/app/lib/browser-supabase';
import {ArrowLeft,RefreshCw,MessageCircle,ShieldCheck,FilePenLine,ChevronLeft} from 'lucide-react';

const supabase=adminSupabase();
type Thread={id:string;customer_wa_id:string;display_name:string;last_message_preview:string;last_message_at:string|null;status:string};
type Message={id:string;direction:'INBOUND';message_type:string;body:string;sent_at:string};
type Detail={thread:Thread;messages:Message[];draft:{body:string;updated_at:string}|null;canSend:false};
const date=(value:string|null)=>value?new Date(value).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'';
const digits=(v:string)=>v.length>4?'••••'+v.slice(-4):'••••';
export default function ZeshuWhatsappInbox(){
  const [threads,setThreads]=useState<Thread[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [detail,setDetail]=useState<Detail|null>(null);
  const [draft,setDraft]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const auth=async()=>{
    const {data}=await supabase.auth.getSession();
    const token=data.session?.access_token;
    if(!token)throw new Error('Sign in with your Zeshu admin account.');
    return {Authorization:'Bearer '+token};
  };
  const refresh=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true);
    try{
      const response=await fetch('/api/admin/whatsapp/inbox',{headers:await auth(),cache:'no-store'});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||'Inbox is temporarily unavailable.');
      setThreads(Array.isArray(payload.conversations)?payload.conversations:[]);
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
