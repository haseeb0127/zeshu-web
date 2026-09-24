"use client";

import React, { useState } from "react";
import { useCustomerLanguage } from "./CustomerLanguageProvider";

const roles = [
  ["DELIVERY_RIDER", "Zeshu Delivery Rider"],
  ["BIKE_COURIER", "Bike Courier"],
  ["AUTO_DRIVER", "Auto Driver"],
  ["CAB_DRIVER", "Cab / Car Driver"],
  ["GOODS_DRIVER", "Goods / Mini Truck Driver"],
  ["FLEET_OPERATOR", "Fleet / Transport Operator"],
] as const;

const emptyForm = {
  role: "DELIVERY_RIDER",
  name: "",
  phone: "",
  email: "",
  city: "",
  vehicle_type: "",
  registration_type: "NO_VEHICLE",
  has_driving_licence: false,
  has_vehicle_documents: false,
  notes: "",
  company_fax: "",
  consent: false,
};

export default function DriverRiderInterestForm() {
  const { t } = useCustomerLanguage();
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/partners/driver-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Application could not be submitted.");
      setNotice(payload.message || "Interest received.");
      setForm({ ...emptyForm });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm md:grid-cols-2">
      <label className="text-sm font-black text-slate-700">{t("I want to join as")}
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold">
          {roles.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
        </select>
      </label>
      <label className="text-sm font-black text-slate-700">{t("Name")}
        <input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3" />
      </label>
      <label className="text-sm font-black text-slate-700">{t("Phone")}
        <input required inputMode="tel" maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3" />
      </label>
      <label className="text-sm font-black text-slate-700">{t("Email (optional)")}
        <input type="email" maxLength={180} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3" />
      </label>
      <label className="text-sm font-black text-slate-700">{t("City / service area")}
        <input required maxLength={120} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3" placeholder={t("Jagtial / Karimnagar / Hyderabad")} />
      </label>
      <label className="text-sm font-black text-slate-700">{t("Vehicle")}
        <input maxLength={80} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3" placeholder={t("Bike / Auto / Car / Mini truck")} />
      </label>
      <label className="text-sm font-black text-slate-700">{t("Current registration")}
        <select value={form.registration_type} onChange={(e) => setForm({ ...form, registration_type: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3">
          <option value="NO_VEHICLE">{t("I do not have a vehicle yet")}</option>
          <option value="TRANSPORT">{t("Transport / commercial registration")}</option>
          <option value="NON_TRANSPORT">{t("Private / non-transport registration")}</option>
        </select>
      </label>
      <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        <p className="font-black text-slate-800">{t("Privacy first")}</p>
        <p className="mt-1">{t("Do not enter your driving-licence number, RC number, Aadhaar, PAN, bank details or OTP here. Zeshu will request documents only through a secured verification flow if onboarding opens.")}</p>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 text-xs leading-5 text-slate-600">
        <input type="checkbox" checked={form.has_driving_licence} onChange={(e) => setForm({ ...form, has_driving_licence: e.target.checked })} className="mt-1 h-4 w-4 accent-[#087443]" />
        <span>{t("I currently hold a valid driving licence for the vehicle/class I intend to use.")}</span>
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 text-xs leading-5 text-slate-600">
        <input type="checkbox" checked={form.has_vehicle_documents} onChange={(e) => setForm({ ...form, has_vehicle_documents: e.target.checked })} className="mt-1 h-4 w-4 accent-[#087443]" />
        <span>{t("I can provide applicable RC, insurance, fitness, permit and PUC documents if required for my service.")}</span>
      </label>
      <label className="md:col-span-2 text-sm font-black text-slate-700">{t("Anything else Zeshu should know?")}
        <textarea rows={4} maxLength={1200} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3" placeholder={t("Experience, preferred area, fleet size, EV, availability, etc.")} />
      </label>
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.company_fax} onChange={(e) => setForm({ ...form, company_fax: e.target.value })} />
      <label className="md:col-span-2 flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-slate-700">
        <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1 h-4 w-4 accent-[#087443]" />
        <span>{t("I confirm these details are accurate and Zeshu may contact me about onboarding. This is an interest form only; it does not mean I am approved to carry passengers, parcels or goods.")}</span>
      </label>
      {error && <p role="alert" className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {notice && <p role="status" className="md:col-span-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</p>}
      <button disabled={busy || !form.consent} className="md:col-span-2 rounded-xl bg-[#087443] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? t("Submitting…") : t("Register my interest")}</button>
    </form>
  );
}
