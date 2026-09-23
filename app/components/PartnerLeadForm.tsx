"use client";

import React, { useState } from "react";

const TYPES = [
  ["LOCAL_VENDOR", "Local vendor / supplier"],
  ["LICENSED_PHARMACY", "Licensed pharmacy"],
  ["MEDICINE_DISTRIBUTOR", "Medicine distributor"],
  ["RECHARGE_BILLS", "Recharge / bills provider"],
  ["TRAVEL", "Travel booking provider"],
  ["SPONSOR", "Sponsor / advertiser"],
  ["OTHER", "Mobility / logistics / other partnership"],
] as const;

const emptyForm = {
  partner_type: "LOCAL_VENDOR",
  business_name: "",
  contact_person: "",
  contact_phone: "",
  contact_email: "",
  city: "",
  website: "",
  licence_or_gst: "",
  proposal: "",
  company_fax: "",
  consent: false,
};

export default function PartnerLeadForm() {
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Partnership request could not be submitted.");
      setNotice("Request received. Zeshu will review the business, compliance and commercial fit before activation.");
      setForm({ ...emptyForm });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Partnership request could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm md:grid-cols-2">
      <label className="text-sm font-black text-slate-700">Partnership type
        <select value={form.partner_type} onChange={(event) => setForm({ ...form, partner_type: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold">
          {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="text-sm font-black text-slate-700">Business name
        <input required maxLength={160} value={form.business_name} onChange={(event) => setForm({ ...form, business_name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="Business / brand / agency" />
      </label>
      <label className="text-sm font-black text-slate-700">Contact person
        <input required maxLength={120} value={form.contact_person} onChange={(event) => setForm({ ...form, contact_person: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="Name" />
      </label>
      <label className="text-sm font-black text-slate-700">Phone
        <input inputMode="tel" maxLength={40} value={form.contact_phone} onChange={(event) => setForm({ ...form, contact_phone: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="+91…" />
      </label>
      <label className="text-sm font-black text-slate-700">Email
        <input type="email" maxLength={180} value={form.contact_email} onChange={(event) => setForm({ ...form, contact_email: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="business@example.com" />
      </label>
      <label className="text-sm font-black text-slate-700">City / service area
        <input maxLength={120} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="Jagtial / Telangana / India-wide" />
      </label>
      <label className="text-sm font-black text-slate-700">Website
        <input maxLength={500} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="https://…" />
      </label>
      <label className="text-sm font-black text-slate-700">GST / licence / authorization
        <input maxLength={240} value={form.licence_or_gst} onChange={(event) => setForm({ ...form, licence_or_gst: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="GSTIN, drug licence, API/agent authorization, etc." />
      </label>
      <label className="md:col-span-2 text-sm font-black text-slate-700">Commercial proposal
        <textarea maxLength={2400} rows={5} value={form.proposal} onChange={(event) => setForm({ ...form, proposal: event.target.value })} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="Products/services, coverage, expected commission or margin, settlement cycle, API/white-label availability, minimum commitment and support details." />
      </label>

      <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.company_fax} onChange={(event) => setForm({ ...form, company_fax: event.target.value })} />

      <label className="md:col-span-2 flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        <input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} className="mt-1 h-4 w-4 accent-[#087443]" />
        <span>I confirm these business details are accurate and Zeshu may contact me about this partnership. Submission does not guarantee onboarding, listing, payment activation or campaign approval.</span>
      </label>

      {error && <p role="alert" className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {notice && <p role="status" className="md:col-span-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</p>}

      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <button disabled={busy || !form.consent} type="submit" className="rounded-xl bg-[#087443] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit partnership request"}</button>
        <span className="text-xs text-slate-500">For urgent commercial enquiries: support@zeshu.in</span>
      </div>
    </form>
  );
}
