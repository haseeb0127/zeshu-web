"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, Headphones, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { LanguageSwitcher, useCustomerLanguage } from "../components/CustomerLanguageProvider";
import { customerSupabase } from "../lib/browser-supabase";

type ChatMessage = { role: "CUSTOMER" | "AI"; body: string };
type MoveStatus = {
  providerConfigured?: boolean;
  executionRequested?: boolean;
  customerBookingAvailable?: boolean;
  status?: string;
};

const supabase = customerSupabase();

const SERVICES = [
  { key: "Shopping & Orders", question: "What can Zeshu help me buy and how do orders work?" },
  { key: "Marketplace", question: "How do verified sellers and marketplace delivery work?" },
  { key: "Delivery & Address", question: "How do delivery areas, saved addresses and location pins work?" },
  { key: "Rides", question: "Can I book a Bike, Auto or Cab ride now?" },
  { key: "Courier & Cargo", question: "Can I send a parcel or book a mini truck now?" },
  { key: "Car Share", question: "How will Zeshu Car Share work?" },
  { key: "Travel", question: "Can I book bus, train, flight or hotel on Zeshu now?" },
  { key: "Pharmacy & Health", question: "What Pharmacy & Health services are available on Zeshu?" },
  { key: "Recharge & Bills", question: "Which recharge and bill services are available?" },
  { key: "Zeshu Cash & Referrals", question: "How do Zeshu Cash, rewards and referrals work?" },
  { key: "Payments & Refunds", question: "How do payments and refunds work?" },
  { key: "Account & Safety", question: "How does Zeshu protect my account and what should I never share?" },
];

const DEFAULT_QUESTIONS = [
  "What services are available right now?",
  "Can I book a bike ride now?",
  "Can I send a parcel now?",
  "Can I book trains on Zeshu?",
  "How do refunds work?",
  "Can I use Zeshu outside Jagtial?",
];

const SERVICE_STATUS = [
  { name: "Shopping & Orders", status: "Available now" },
  { name: "Marketplace", status: "Available where shown" },
  { name: "Recharge & Bills", status: "Discovery available" },
  { name: "Rides", status: "Coming soon" },
  { name: "Courier & Cargo", status: "Coming soon" },
  { name: "Car Share", status: "Coming soon" },
  { name: "Travel", status: "Coming soon" },
  { name: "Pharmacy & Health", status: "Coming soon" },
  { name: "Human support", status: "Available now" },
];

export default function HelpPage() {
  const { t } = useCustomerLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState("");
  const [supportCategory, setSupportCategory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_QUESTIONS.slice(0, 3));
  const [contextUsed, setContextUsed] = useState<string[]>([]);
  const [handoffCreated, setHandoffCreated] = useState(false);
  const [needsHuman, setNeedsHuman] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [serviceHint, setServiceHint] = useState("Customer support");
  const [moveStatus, setMoveStatus] = useState<Record<string, MoveStatus>>({});

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session?.access_token));
    });

    const params = new URLSearchParams(window.location.search);
    const service = params.get("service")?.trim().slice(0, 80);
    if (service) {
      setServiceHint(service);
      setQuestion(`I need help with ${service}`);
    }

    void fetch("/api/move/readiness", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (active && payload?.services) setMoveStatus(payload.services);
      })
      .catch(() => undefined);

    return () => { active = false; };
  }, []);

  const moveSummary = useMemo(() => {
    const rows = Object.values(moveStatus);
    if (!rows.length) return t("Move & Travel is being prepared with verified providers.");
    const live = rows.filter((row) => row.customerBookingAvailable === true).length;
    return live > 0
      ? t("Some Move & Travel services are available. Ask Zeshu Assistant for the latest status.")
      : t("Move & Travel is currently discovery-only. Booking and payment are not enabled yet.");
  }, [moveStatus, t]);

  const ask = async (override?: string) => {
    const nextQuestion = (override ?? question).trim();
    if (!nextQuestion || busy) return;

    const history = messages.slice(-16);
    setQuestion("");
    setBusy(true);
    setNeedsHuman(false);
    setHandoffCreated(false);
    setContextUsed([]);
    setSupportCategory("");
    setMessages((current) => [...current, { role: "CUSTOMER", body: nextQuestion }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(Boolean(session?.access_token));
      const response = await fetch("/api/support/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ message: nextQuestion, history }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Zeshu Assistant is temporarily unavailable.");

      const answer = String(payload?.answer || "I could not answer that safely.");
      setMessages((current) => [...current, { role: "AI", body: answer }]);
      setSource(payload?.source === "ai" ? "AI" : "Guided help");
      setSupportCategory(typeof payload?.support_category === "string" ? payload.support_category : "");
      setSuggestions(Array.isArray(payload?.suggested_questions) ? payload.suggested_questions.slice(0, 3).map(String) : []);
      setContextUsed(Array.isArray(payload?.context_used) ? payload.context_used.map(String) : []);
      setNeedsHuman(payload?.resolved !== true);
      setHandoffCreated(Boolean(payload?.handoff?.created));
    } catch (error) {
      setMessages((current) => [...current, {
        role: "AI",
        body: error instanceof Error ? error.message : "Zeshu Assistant is temporarily unavailable.",
      }]);
      setNeedsHuman(true);
      setSuggestions([]);
      setSource("");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask();
  };

  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-6 text-slate-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]">
            <ArrowLeft size={17} aria-hidden="true" /> {t("Back to Zeshu")}
          </Link>
          <LanguageSwitcher compact />
        </div>

        <header className="mt-6 rounded-[30px] bg-[#083b27] p-6 text-white shadow-xl md:p-9">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10"><Headphones size={25} /></span>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-[#c9f2d8]">
                <Sparkles size={13} /> {t("Smart help")}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{t("Zeshu Help Center")}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d9f3e3] md:text-base">
                {t("Ask about shopping, sellers, orders, rides, courier, cargo, car share, travel, recharge, bills, payments, refunds, rewards, account help and safety.")}
              </p>
              <p className="mt-2 text-xs font-bold text-[#bfe2cd]">{moveSummary}</p>
            </div>
          </div>
        </header>

        <section className="mt-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">{t("Choose a topic")}</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {SERVICES.map((service) => (
              <button
                type="button"
                key={service.key}
                disabled={busy}
                onClick={() => void ask(service.question)}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm disabled:opacity-50"
              >
                {t(service.key)}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-900">{t("Current service status")}</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">{t("See what is usable now before you start.")}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#075E45]">{t("Support available")}</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_STATUS.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f9f5] px-3 py-3">
                <span className="text-xs font-black text-slate-700">{t(item.name)}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.status === "Available now" ? "bg-emerald-100 text-emerald-800" : item.status === "Available where shown" || item.status === "Discovery available" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{t(item.status)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#075E45]"><Bot size={22} /></span>
              <div>
                <p className="font-black text-slate-900">Zeshu Assistant</p>
                <p className="text-xs font-medium text-slate-500">
                  {signedIn ? t("Signed in — private account facts can be checked when needed.") : t("You can ask general questions without signing in.")}
                </p>
              </div>
            </div>
<div className="flex flex-wrap items-center gap-2">
              {supportCategory && <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600 shadow-sm">{t(supportCategory)}</span>}
              {source && <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#075E45]">{source}</span>}
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {DEFAULT_QUESTIONS.map((item) => (
                <button type="button" key={item} disabled={busy} onClick={() => void ask(item)} className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-[#075E45] shadow-sm disabled:opacity-50">
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto rounded-2xl bg-white/70 p-3" aria-live="polite">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`rounded-2xl p-3 text-sm leading-6 ${message.role === "CUSTOMER" ? "ml-7 bg-[#075E45] text-white" : "mr-7 bg-white text-slate-700 shadow-sm"}`}>
                  <p className={`mb-1 text-[10px] font-black uppercase tracking-wider ${message.role === "CUSTOMER" ? "text-emerald-100" : "text-[#075E45]"}`}>
                    {message.role === "CUSTOMER" ? t("You") : "Zeshu Assistant"}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                </div>
              ))}
            </div>
          )}

          {contextUsed.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t("Checked live")}</span>
            {contextUsed.map((item) => <span key={item} className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-emerald-700">{item.replaceAll("_", " ")}</span>)}
          </div>}

          {suggestions.length > 0 && messages.length > 0 && !busy && <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestions.map((item) => <button type="button" key={item} onClick={() => void ask(item)} className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-[#075E45] shadow-sm">{item}</button>)}
          </div>}

          <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={question}
              maxLength={1200}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t("Ask anything about Zeshu…")}
              className="min-w-0 flex-1 rounded-xl border border-emerald-100 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-400"
            />
            <button type="submit" disabled={busy || !question.trim()} className="rounded-xl bg-[#075E45] px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              {busy ? t("Checking…") : t("Send")}
            </button>
          </form>

          <p className="mt-2 text-[10px] leading-4 text-slate-400">{t("Never share OTPs, passwords, card numbers, CVV or UPI PIN in chat.")}</p>

          {handoffCreated && <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-black text-blue-900">{t("Zeshu Support has received this issue with the chat context attached.")}</p>
            <Link href={`/?support=${encodeURIComponent(serviceHint)}`} className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white">{t("Open support conversation")}</Link>
          </div>}

          {needsHuman && !handoffCreated && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-900">{signedIn ? t("This needs Zeshu Support.") : t("Sign in to open a private support conversation.")}</p>
            <Link href={`/?support=${encodeURIComponent(serviceHint)}`} className="mt-3 inline-flex rounded-xl bg-white px-4 py-2.5 text-xs font-black text-amber-900 shadow-sm">{signedIn ? t("Contact Zeshu Support") : t("Sign in & contact support")}</Link>
          </div>}
        </section>

        <section className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="font-black text-blue-950">{t("Need a person?")}</h2>
              <p className="mt-2 text-sm leading-6 text-blue-800">{t("Human support is available for every Zeshu service. Signed-in customers can open a private conversation for orders, payments, marketplace, rides, courier, car share, travel, recharge/bills, account or safety issues.")}</p>
            </div>
            <Link href="/?support=Customer%20support" className="inline-flex shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">{signedIn ? t("Open human support") : t("Sign in & contact support")}</Link>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 text-[#075E45]" size={21} />
              <div><h2 className="font-black text-slate-900">{t("Human support when needed")}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t("Refund decisions, disputed payments, safety incidents, lost or damaged deliveries, provider disputes and protected account changes are handed to a person.")}</p></div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-[#075E45]" size={21} />
              <div><h2 className="font-black text-slate-900">{t("Safe by default")}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t("Zeshu Assistant never needs your OTP, password, card CVV or UPI PIN and never pretends a payment, refund or booking succeeded.")}</p></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
