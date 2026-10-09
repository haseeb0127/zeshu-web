"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "@/app/components/DocumentLink";
import { usePathname } from "next/navigation";
import { Bot, MessageCircle, Send, Sparkles, X, ShieldCheck, ArrowUpRight } from "lucide-react";
import { customerSupabase } from "@/app/lib/browser-supabase";
import { useCustomerLanguage } from "@/app/components/CustomerLanguageProvider";

type Message = { role: "CUSTOMER" | "AI"; body: string };
const supported = (path: string) => path === "/" || ["/app", "/services", "/fashion"].includes(path) || path.startsWith("/move") || path.startsWith("/professional-services");
const prompts = ["How do I order groceries in Jagtial?", "Which Zeshu services are available?", "How can I get help with an order?"];
const translations = {
 en: ["Ask Zeshu", "Zeshu Assistant", "Shopping, services and support", "Ask about products, orders and services.", "Ask Zeshu a question…", "Checking…", "Never share OTPs, passwords, card numbers or UPI PINs.", "Open Help Center", "Guided help", "AI help", "Support request received."],
 hi: ["Zeshu से पूछें", "Zeshu Assistant", "शॉपिंग, सेवाएँ और सहायता", "प्रोडक्ट, ऑर्डर और सेवाओं के बारे में पूछें।", "अपना सवाल लिखें…", "जाँच हो रही है…", "OTP, पासवर्ड या भुगतान PIN न बताएं।", "हेल्प सेंटर खोलें", "गाइडेड सहायता", "AI सहायता", "आपका सहायता अनुरोध प्राप्त हुआ।"],
 te: ["Zeshu ని అడగండి", "Zeshu Assistant", "షాపింగ్, సేవలు, సహాయం", "వస్తువులు, ఆర్డర్లు, సేవల గురించి అడగండి.", "మీ ప్రశ్న టైప్ చేయండి…", "తనిఖీ చేస్తోంది…", "OTP, పాస్‌వర్డ్ లేదా చెల్లింపు PIN చెప్పవద్దు.", "సహాయ కేంద్రం తెరవండి", "సహాయ సూచనలు", "AI సహాయం", "మీ సహాయ అభ్యర్థన అందింది."],
 ur: ["Zeshu سے پوچھیں", "Zeshu Assistant", "خریداری، خدمات، مدد", "مصنوعات، آرڈرز اور خدمات کے بارے میں پوچھیں۔", "اپنا سوال لکھیں…", "چیک کیا جا رہا ہے…", "OTP، پاس ورڈ یا ادائیگی PIN شیئر نہ کریں۔", "ہیلپ سینٹر کھولیں", "رہنمائی", "AI مدد", "آپ کی مدد کی درخواست موصول ہو گئی۔"]
} as const;
export default function ZeshuAssistantWidget() {
 const pathname = usePathname() || "/";
 const {language} = useCustomerLanguage();
 const t = translations[language] || translations.en;
 const [open,setOpen] = useState(false);
 const [value,setValue] = useState("");
 const [busy,setBusy] = useState(false);
 const [messages,setMessages] = useState<Message[]>([]);
 const [suggestions,setSuggestions] = useState<string[]>(prompts);
 const [source,setSource] = useState("");
 const [handoff,setHandoff] = useState(false);
 const inputRef=useRef<HTMLInputElement>(null);
 const scrollRef=useRef<HTMLDivElement>(null);
 const active=supported(pathname);
 useEffect(() => {const show=()=>setOpen(true);window.addEventListener("zeshu:open-assistant",show);return()=>window.removeEventListener("zeshu:open-assistant",show)},[]);
 useEffect(()=>{if(open&&active)inputRef.current?.focus()},[open,active]);
 useEffect(()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight})},[messages,busy]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[]);
 const ask=useCallback(async (text:string)=>{
   const message=text.trim().slice(0,1200);if(!message||busy)return;
   const history=messages.slice(-16);
   setMessages(old=>[...old,{role:"CUSTOMER",body:message}]);setValue("");setBusy(true);setHandoff(false);setSource("");
   try{
     const {data:{session}}=await customerSupabase().auth.getSession();
     const response=await fetch("/api/support/assistant",{method:"POST",headers:{"Content-Type":"application/json",...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify({message,history})});
     const json=await response.json().catch(()=>({}));
     if(!response.ok)throw Error(typeof json.error==="string"?json.error:"Zeshu Assistant is temporarily unavailable.");
     setMessages(old=>[...old,{role:"AI",body:typeof json.answer==="string"?json.answer:"Please open Zeshu Help Center for assistance."}]);
     setSource(json.source==="ai"?t[9]:t[8]);setHandoff(json.handoff?.created===true);
     setSuggestions(Array.isArray(json.suggested_questions)?json.suggested_questions.filter((x:unknown):x is string=>typeof x==="string").slice(0,3):[]);
   }catch(e){setMessages(old=>[...old,{role:"AI",body:e instanceof Error?e.message:"Please open the Help Center."}]);setSuggestions([]);}
   finally{setBusy(false)}
 },[busy,messages,t]);
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();void ask(value)};
 if(!active)return null;
 return <>
  <button type="button" data-zeshu-assistant-launcher="true" aria-label={open?"Close Zeshu Assistant":"Open Zeshu Assistant"} aria-controls="zeshu-assistant-panel" aria-expanded={open} onClick={()=>setOpen(v=>!v)}
   className="zeshu-chat-orb fixed bottom-[calc(5.8rem+env(safe-area-inset-bottom))] right-3 z-[39] inline-flex h-12 items-center gap-2 rounded-full px-3.5 text-sm font-black text-white lg:bottom-6 lg:right-6 lg:h-14 lg:px-5">
   {open?<X size={21}/>:<MessageCircle size={22}/>}<span className="hidden sm:inline">{t[0]}</span>
  </button>
  {open&&<section id="zeshu-assistant-panel" role="dialog" aria-label="Zeshu Assistant" aria-modal="false"
   className="zeshu-chat-panel fixed bottom-[calc(9.7rem+env(safe-area-inset-bottom))] right-3 z-[81] flex max-h-[min(68dvh,570px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-[25px] border border-emerald-100 bg-white text-slate-900 lg:bottom-[6.5rem] lg:right-6 lg:max-h-[min(78dvh,640px)]">
    <header className="flex items-center gap-3 bg-[linear-gradient(120deg,#064932,#0c9064,#05523c)] px-4 py-4 text-white">
     <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15"><Bot size={25}/></span>
     <div className="min-w-0 flex-1"><h2 className="text-base font-black">{t[1]}</h2><p className="text-xs text-emerald-100">{t[2]}</p></div>
     <button type="button" aria-label="Close Zeshu Assistant" onClick={()=>setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><X size={20}/></button>
    </header>
    <div ref={scrollRef} role="log" aria-live="polite" aria-label="Assistant conversation" className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f2faf5,#fff)] p-4">
     {!messages.length&&<div className="zeshu-gloss-card rounded-2xl border border-emerald-100 bg-white p-4"><Sparkles size={20} className="mb-2 text-emerald-700"/><p className="text-sm font-semibold">{t[3]}</p><p className="mt-2 text-xs text-slate-500">{t[6]}</p></div>}
     {messages.map((m,i)=><div key={i} className={`max-w-[94%] rounded-2xl px-3.5 py-3 text-[13px] leading-5 shadow-sm ${m.role==="CUSTOMER"?"ml-auto bg-[#075e45] text-white":"mr-auto border border-emerald-100 bg-white text-slate-800"}`}><p className="whitespace-pre-wrap break-words">{m.body}</p></div>)}
     {busy&&<p role="status" className="text-xs font-semibold text-emerald-700">{t[5]}</p>}
     {source&&<p className="text-[10px] font-bold text-slate-500">{source}</p>}
     {handoff&&<p className="rounded-xl bg-emerald-50 p-2 text-xs text-emerald-800"><ShieldCheck size={13} className="mr-1 inline"/>{t[10]}</p>}
    </div>
    {suggestions.length>0&&<div className="flex shrink-0 gap-2 overflow-x-auto border-t border-emerald-100 bg-white px-3 py-2 no-scrollbar">{suggestions.map(s=><button type="button" key={s} disabled={busy} onClick={()=>void ask(s)} className="shrink-0 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 disabled:opacity-50">{s}</button>)}</div>}
    <form onSubmit={submit} className="flex shrink-0 items-center gap-2 border-t border-emerald-100 bg-white p-3"><input ref={inputRef} maxLength={1200} value={value} onChange={e=>setValue(e.target.value)} aria-label="Ask Zeshu Assistant" placeholder={t[4]} autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-emerald-100 bg-[#f7faf8] px-3 py-3 text-sm"/><button type="submit" disabled={!value.trim()||busy} aria-label="Send question" className="zeshu-chat-orb grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white disabled:opacity-40"><Send size={18}/></button></form>
    <Link href="/help" onClick={()=>setOpen(false)} className="flex items-center justify-center gap-1 bg-emerald-50 py-2 text-xs font-black text-emerald-800">{t[7]}<ArrowUpRight size={13}/></Link>
  </section>}
 </>;
}
