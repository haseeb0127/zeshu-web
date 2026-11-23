"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminSupabase } from "../../lib/browser-supabase";

const supabase = adminSupabase();
type Row = Record<string, any>;

const CATEGORIES = ["GROCERY","FRESH","PHARMACY","MEDICINE_DISTRIBUTOR","RECHARGE_BILLS","TRAVEL","DELIVERY"];
const KINDS = ["LOCAL_VENDOR","PHARMACY","DISTRIBUTOR","API_PROVIDER","AFFILIATE","RIDER_POOL","OTHER"];
const STATUSES = ["ONBOARDING","ACTIVE","DEGRADED","DOWN","PAUSED"];

const empty = {
  name: "",
  category: "GROCERY",
  partner_kind: "LOCAL_VENDOR",
  vendor_id: "",
  priority: "100",
  status: "ONBOARDING",
  service_area: "Jagtial",
  target_prep_minutes: "10",
  auto_failover_enabled: false,
  commercial_notes: "",
};

export default function AdminPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Row[]>([]);
  const [events, setEvents] = useState<Row[]>([]);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const load = async () => {
    setLoading(true);
    const accessToken = await token();
    if (!accessToken) { router.replace("/admin/login"); return; }
    const response = await fetch("/api/admin/partners", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) { router.replace("/admin/login"); return; }
    if (!response.ok) setError(payload.error || "Partner routing data could not be loaded.");
    else {
      setPartners(Array.isArray(payload.partners) ? payload.partners : []);
      setEvents(Array.isArray(payload.events) ? payload.events : []);
      setVendors(Array.isArray(payload.vendors) ? payload.vendors : []);
      setError("");
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const byCategory = useMemo(() => CATEGORIES.map((category) => ({
    category,
    rows: partners.filter((partner) => partner.category === category).sort((a,b) => Number(a.priority || 100) - Number(b.priority || 100)),
  })), [partners]);

  const savePartner = async () => {
    setBusy("new"); setError(""); setNotice("");
    const accessToken = await token();
    const response = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        ...form,
        priority: Number(form.priority),
        target_prep_minutes: form.target_prep_minutes ? Number(form.target_prep_minutes) : null,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.error || "Partner could not be saved.");
    else {
      setNotice("Partner added to the routing registry.");
      setForm({ ...empty });
      await load();
    }
    setBusy("");
  };

  const updatePartner = async (partner: Row, patch: Record<string, unknown>) => {
    setBusy(String(partner.id)); setError(""); setNotice("");
    const accessToken = await token();
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ id: partner.id, ...patch }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.error || "Partner could not be updated.");
    else {
      setNotice("Partner routing updated.");
      await load();
    }
    setBusy("");
  };

  if (loading) return <main className="min-h-screen bg-[#f7f9f5] p-6"><div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 font-bold text-slate-500">Loading partner routing…</div></main>;

  return <main className="min-h-screen bg-[#f7f9f5] p-4 md:p-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><Link href="/admin/dashboard" className="text-xs font-black text-[#087443]">← Admin dashboard</Link><h1 className="mt-1 text-3xl font-black text-slate-950">Partner routing &amp; failover</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">Set primary and backup partners for 30-minute local delivery and resilient digital services. Lower priority number routes first.</p></div>
        <Link href="/admin/marketing" className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#087443] shadow-[0_4px_16px_rgba(19,32,25,.06)]">Partner applications</Link>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</p>}

      <section className="mb-6 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
        <h2 className="text-lg font-black">Add routing partner</h2>
        <p className="mt-1 text-xs text-slate-500">Do not mark a partner ACTIVE until commercial, compliance, capacity and integration checks are complete.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-black text-slate-600">Name<input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-black text-slate-600">Category<select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">{CATEGORIES.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-black text-slate-600">Partner type<select value={form.partner_kind} onChange={(e)=>setForm({...form,partner_kind:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">{KINDS.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-black text-slate-600">Linked local vendor<select value={form.vendor_id} onChange={(e)=>setForm({...form,vendor_id:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"><option value="">None</option>{vendors.map((v)=><option key={v.id} value={v.id}>{v.business_name}</option>)}</select></label>
          <label className="text-xs font-black text-slate-600">Priority<input type="number" min="1" max="1000" value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-black text-slate-600">Status<select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">{STATUSES.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-black text-slate-600">Service area<input value={form.service_area} onChange={(e)=>setForm({...form,service_area:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-black text-slate-600">Target prep minutes<input type="number" min="1" max="240" value={form.target_prep_minutes} onChange={(e)=>setForm({...form,target_prep_minutes:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" /></label>
          <label className="flex items-center gap-2 rounded-xl bg-[#f7f9f5] px-3 py-3 text-xs font-black text-slate-600"><input type="checkbox" checked={form.auto_failover_enabled} onChange={(e)=>setForm({...form,auto_failover_enabled:e.target.checked})} /> Allow safe failover when rules permit</label>
        </div>
        <label className="mt-3 block text-xs font-black text-slate-600">Commercial / operational notes<textarea rows={2} value={form.commercial_notes} onChange={(e)=>setForm({...form,commercial_notes:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" /></label>
        <button disabled={busy === "new" || !form.name.trim()} onClick={() => void savePartner()} className="mt-4 rounded-xl bg-[#087443] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy === "new" ? "Saving…" : "Add partner"}</button>
      </section>

      <div className="grid gap-5">
        {byCategory.map(({category,rows}) => <section key={category} className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-black text-slate-950">{category.replaceAll("_"," ")}</h2><p className="mt-1 text-xs text-slate-500">{rows.length ? `Primary: ${rows[0]?.name || "—"} · ${Math.max(0, rows.length-1)} backup(s)` : "No routing partners configured yet."}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{rows.length}</span></div>
          {rows.length > 0 && <div className="mt-4 grid gap-3 lg:grid-cols-2">{rows.map((partner,index)=><article key={partner.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#087443]">{index===0 ? "PRIMARY" : `BACKUP ${index}`}</p><h3 className="mt-1 font-black">{partner.name}</h3><p className="mt-1 text-xs text-slate-500">{partner.partner_kind} · priority {partner.priority}{partner.target_prep_minutes ? ` · prep target ${partner.target_prep_minutes}m` : ""}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${partner.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : partner.status === "DOWN" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{partner.status}</span></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((status)=><button type="button" key={status} disabled={busy===String(partner.id) || partner.status===status} onClick={()=>void updatePartner(partner,{status})} className="rounded-lg bg-slate-100 px-2.5 py-2 text-[10px] font-black text-slate-600 disabled:opacity-40">{status}</button>)}
              <button type="button" disabled={busy===String(partner.id)} onClick={()=>void updatePartner(partner,{auto_failover_enabled:!partner.auto_failover_enabled})} className={`rounded-lg px-2.5 py-2 text-[10px] font-black ${partner.auto_failover_enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{partner.auto_failover_enabled ? "Safe failover ON" : "Safe failover OFF"}</button>
            </div>
          </article>)}</div>}
        </section>)}
      </div>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
        <h2 className="font-black">Recent failover audit</h2>
        <p className="mt-1 text-xs text-slate-500">Financial retries must remain blocked after an unknown/pending transaction until the original provider returns a confirmed final status.</p>
        {events.length === 0 ? <p className="mt-3 rounded-xl bg-[#f7f9f5] p-4 text-sm text-slate-500">No failover events yet.</p> : <div className="mt-3 space-y-2">{events.slice(0,20).map((event)=><div key={event.id} className="rounded-xl border border-slate-100 p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-black">{event.category} · {event.outcome}</span><span className="text-slate-400">{new Date(event.created_at).toLocaleString()}</span></div><p className="mt-1 text-slate-600">{event.reason}</p></div>)}</div>}
      </section>
    </div>
  </main>;
}
