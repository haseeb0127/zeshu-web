"use client";

import React, { useEffect, useState } from "react";
import { HOME_SERVICE_CATEGORIES, type HomeServiceCode } from "@/app/lib/home-services-categories";
import { HOME_SERVICE_MENUS } from "@/app/lib/home-services-menu";

const TYPES = [
  ["LOCAL_VENDOR", "Seller / manufacturer / wholesaler"],
  ["LICENSED_PHARMACY", "Licensed pharmacy"],
  ["MEDICINE_DISTRIBUTOR", "Medicine distributor"],
  ["RECHARGE_BILLS", "Recharge / bills provider"],
  ["MOBILITY", "Mobility / ride operator"],
  ["LOGISTICS_COURIER", "Courier / logistics provider"],
  ["TRAVEL", "Travel booking provider"],
  ["SPONSOR", "Sponsor / advertiser"],
  ["HOME_SERVICE_PRO", "Home-service professional / salon"],
  ["OTHER", "Other partnership"],
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
  const [homeCategory, setHomeCategory] = useState<HomeServiceCode>("AC_REPAIR");
  const [homePlan, setHomePlan] = useState("UNDECIDED");
  const [homeRadius, setHomeRadius] = useState("5");
  const [homeTravelFee, setHomeTravelFee] = useState("");
  const [homeRates, setHomeRates] = useState<Record<string, string>>({});
  const [homeExtras, setHomeExtras] = useState("");
  const isHomePro = form.partner_type === "HOME_SERVICE_PRO";
  const isPharmacy = form.partner_type === "LICENSED_PHARMACY";
  const [pharmacyAcknowledged,setPharmacyAcknowledged] = useState(false);
  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    if (type && TYPES.some(([code]) => code === type)) {
      setForm(current => ({ ...current, partner_type: type, city: (type === "HOME_SERVICE_PRO" || type === "LICENSED_PHARMACY") ? "Jagtial" : current.city }));
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (isPharmacy && !pharmacyAcknowledged) {
        throw new Error("Please confirm this is a licensed pharmacy applying for private verification, not a medicine order.");
      }
      // Home-service rate cards are private partnership proposals, not public
      // rates, confirmed bookings, a plan purchase or a wallet top-up.
      let proposal = form.proposal.trim();
      if (isHomePro) {
        const selectedMenu = HOME_SERVICE_MENUS[homeCategory];
        const rows: string[] = [];
        for (const item of selectedMenu) {
          if (item.pricing !== "UPFRONT") continue;
          const value = (homeRates[item.name] || "").trim();
          if (!value) continue;
          if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100000) {
            throw new Error("Enter a whole-rupee service rate between ₹1 and ₹100,000.");
          }
          rows.push(item.name + ": ₹" + value + " (proposed upfront rate)");
        }
        if (homeTravelFee && (!/^\d+$/.test(homeTravelFee) || Number(homeTravelFee) > 1000)) {
          throw new Error("Extra travel fee must be a whole rupee amount from ₹0 to ₹1,000.");
        }
        const category = HOME_SERVICE_CATEGORIES.find(item => item.code === homeCategory);
        proposal = [
          "[HOME SERVICES — PROPOSAL ONLY / NO PAYMENT AUTHORISED]",
          "Category: " + (category?.label || homeCategory),
          "Plan preference (not purchase): " + homePlan,
          "Free travel radius: " + homeRadius + " km",
          "Extra travel per km beyond free radius: " + (homeTravelFee ? "₹" + homeTravelFee : "Not specified"),
          "Provider-defined sample service rates:",
          ...(rows.length ? rows : ["To be discussed; no service rate submitted"]),
          "Extra scope, materials, product brand, visit minimum: " + (homeExtras.trim() || "To be confirmed"),
          "Other provider notes: " + (proposal || "None"),
        ].join("\n");
      }
      if (proposal.length > 2400) throw new Error("Your rate card and notes exceed the 2,400-character limit. Shorten your notes.");
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, proposal }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Partnership request could not be submitted.");
      setNotice("Request received. Zeshu will review the business, compliance and commercial fit before activation.");
      setForm({ ...emptyForm });
      setPharmacyAcknowledged(false);
      setHomeRates({});
      setHomeExtras("");
      setHomeTravelFee("");
      setHomePlan("UNDECIDED");
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
        <input maxLength={120} required={isPharmacy} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="Jagtial / Telangana / India-wide" />
      </label>
      <label className="text-sm font-black text-slate-700">Website
        <input maxLength={500} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder="https://…" />
      </label>
      <label className="text-sm font-black text-slate-700">GST / licence / authorization
        <input maxLength={240} value={form.licence_or_gst} onChange={(event) => setForm({ ...form, licence_or_gst: event.target.value })} required={isPharmacy} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder={isPharmacy ? "Your retail drug licence number (Form 20/21)" : "GSTIN, drug licence, API/agent authorization, etc."} />
      </label>
      {isPharmacy && <fieldset className="md:col-span-2 rounded-2xl border border-emerald-200 bg-[#f5fbf7] p-4">
        <legend className="px-2 text-sm font-black text-[#075E45]">Licensed Jagtial pharmacy — interest only</legend>
        <p className="text-sm leading-6 text-slate-700">Enter the actual retail drug licence number above and shop city. Zeshu privately checks Form 20/21, pharmacy premises and registered pharmacist credentials before any approval. This is not a medicine order or an active ₹299 subscription. Never upload or paste prescriptions, patient names, medical histories or personal health details here.</p>
        <label className="mt-3 flex items-start gap-2 text-sm font-semibold text-slate-800">
          <input type="checkbox" required checked={pharmacyAcknowledged} onChange={e=>setPharmacyAcknowledged(e.target.checked)} className="mt-1 accent-emerald-700"/>
          <span>I represent a licensed retail pharmacy and consent to Zeshu contacting me for private licence and pharmacist verification. No patient data is supplied.</span>
        </label>
      </fieldset>}
      {isHomePro && <fieldset className="md:col-span-2 rounded-2xl border border-emerald-200 bg-[#f5fbf7] p-4">
        <legend className="px-2 text-sm font-black text-[#075E45]">Home-service rate card &amp; coverage (private review only)</legend>
        <p className="mb-3 text-xs leading-5 text-slate-600">Select a standard service category, propose your own labour rates, and set travel coverage. You are not accepting a paid plan. Prices and verification badges will not be shown to customers without a separate approval process.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black text-slate-700">Your primary service
            <select value={homeCategory} onChange={e => { setHomeCategory(e.target.value as HomeServiceCode); setHomeRates({}); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
              {HOME_SERVICE_CATEGORIES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-black text-slate-700">Preferred future plan (not an order)
            <select value={homePlan} onChange={e => setHomePlan(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <option value="UNDECIDED">Not sure / free pilot only</option>
              <option value="PAY_PER_QUALIFIED_LEAD">₹15 / ₹50 qualified opportunities (proposed)</option>
              <option value="MONTHLY_299">₹299 monthly (proposed)</option>
              <option value="SEASONAL_CREDIT_INTEREST">₹200 seasonal credit interest (not available)</option>
            </select>
          </label>
          <label className="text-xs font-black text-slate-700">Free travel zone
            <select value={homeRadius} onChange={e => setHomeRadius(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <option value="0">No free travel zone</option><option value="3">Within 3 km</option><option value="5">Within 5 km</option><option value="10">Within 10 km</option><option value="15">Within 15 km</option>
            </select>
          </label>
          <label className="text-xs font-black text-slate-700">Optional additional travel charge (₹/km)
            <input type="number" inputMode="numeric" min={0} max={1000} step={1} value={homeTravelFee} onChange={e => setHomeTravelFee(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm" placeholder="Only beyond free zone"/>
          </label>
        </div>
        <p className="mt-4 text-xs font-black text-slate-800">Propose rates for defined services (₹, optional)</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {HOME_SERVICE_MENUS[homeCategory].filter(item => item.pricing === "UPFRONT").map(item => <label key={item.name} className="rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700">
            {item.name}
            <span className="mt-1 block font-normal leading-4 text-slate-500">{item.scope}</span>
            <input type="number" inputMode="numeric" min={1} max={100000} step={1} value={homeRates[item.name] || ""} onChange={e => setHomeRates(prev => ({ ...prev, [item.name]: e.target.value }))} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Your upfront price in ₹"/>
          </label>)}
        </div>
        <label className="mt-3 block text-xs font-black text-slate-700">Brand, parts exclusions, travel or minimum visit details
          <textarea maxLength={350} rows={2} value={homeExtras} onChange={e => setHomeExtras(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium" placeholder="e.g. 5 km free; no parts included; facials use listed product brand"/>
        </label>
        <p className="mt-2 text-xs leading-5 text-slate-600">For major repairs, bridal packages or custom work, final prices must follow inspection or consultation and written customer approval. Do not submit government ID scans, OTPs or a home address here.</p>
      </fieldset>}
      <label className="md:col-span-2 text-sm font-black text-slate-700">{isHomePro ? "Other service details (optional)" : "Commercial proposal"}
        <textarea maxLength={2400} rows={5} value={form.proposal} onChange={(event) => setForm({ ...form, proposal: event.target.value })} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-medium" placeholder={isHomePro ? "Describe experience, qualifications, availability and anything a customer should know. No ID images or private household details." : "Products/services, catalogue or API feed, seller pricing, commission or margin, fulfilment, returns, shipping, settlements and national promotion permission."} />
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
        <span className="text-xs text-slate-500">For commercial enquiries: support@zeshu.in</span>
      </div>
    </form>
  );
}
