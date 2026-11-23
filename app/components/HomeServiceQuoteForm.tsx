'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { HOME_SERVICE_CATEGORIES, type HomeServiceCode } from '@/app/lib/home-services-categories';
import { getIndiaTodayISO } from '@/app/lib/move-quote-enquiry';

const categories = HOME_SERVICE_CATEGORIES;

export default function HomeServiceQuoteForm() {
  const [category, setCategory] = useState<HomeServiceCode>('ELECTRICIAN');
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/professional-services/enquiries', { cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(result => { if (alive) setAvailable(result?.home_services_enquiries_enabled === true); })
      .catch(() => { if (alive) setAvailable(false); })
      .finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !available) return;
    setBusy(true); setError('');
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/professional-services/enquiries', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          ...data, service_type: 'HOME_SERVICES', service_category: category,
          city: 'Jagtial', consent: data.consent === 'on',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Could not submit your request.');
      setSaved(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your request.');
    } finally { setBusy(false); }
  }

  if (saved) return <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-slate-800">
    <p className="text-sm font-black text-[#075E45]">Enquiry saved · not a confirmed booking</p>
    <p className="mt-2 text-sm leading-6">Zeshu can review your request and contact you if a suitably screened professional becomes available. No provider, visit, price, advance or booking has been confirmed.</p>
    <button type="button" onClick={() => setSaved(false)} className="mt-3 rounded-xl bg-[#075E45] px-4 py-2 text-xs font-bold text-white">Request another quote</button>
  </div>;

  return <form onSubmit={e => void submit(e)} className="mt-5 grid gap-4" aria-label="Request a home-service quote">
    {checking && <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm">Checking enquiry availability…</p>}
    {!checking && !available && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">Home-service enquiries are temporarily unavailable. No details have been sent. Use <Link href="/help" className="font-bold underline">Zeshu Help</Link> for assistance.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Type of service
        <select required value={category} onChange={e => setCategory(e.target.value as HomeServiceCode)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-3">
          {categories.map(entry => <option key={entry.code} value={entry.code}>{entry.label}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700">Service town
        <input value="Jagtial, Telangana" readOnly className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-100 p-3"/>
      </label>
      <label className="text-sm font-semibold text-slate-700">Your name
        <input required name="customer_name" maxLength={100} minLength={2} autoComplete="name" className="mt-1 block w-full rounded-xl border border-slate-300 p-3"/>
      </label>
      <label className="text-sm font-semibold text-slate-700">Indian mobile number
        <input required name="contact_phone" type="tel" inputMode="tel" autoComplete="tel" minLength={10} maxLength={20} placeholder="10-digit mobile" className="mt-1 block w-full rounded-xl border border-slate-300 p-3"/>
      </label>
      <label className="text-sm font-semibold text-slate-700">Preferred visit / appointment date (optional)
        <input name="requested_date" type="date" min={getIndiaTodayISO()} className="mt-1 block w-full rounded-xl border border-slate-300 p-3"/>
      </label>
      <label className="text-sm font-semibold text-slate-700">Approximate budget (optional to discuss)
        <select name="budget_range" required defaultValue="Discuss with professional" className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-3">
          {['Discuss with professional','Under ₹500','₹500–₹2,000','₹2,000–₹5,000','₹5,000+'].map(v => <option key={v}>{v}</option>)}
        </select>
      </label>
    </div>
    <label className="text-sm font-semibold text-slate-700">Describe the work needed (without sharing sensitive information)
      <textarea name="project_details" required minLength={10} maxLength={2000} rows={4} placeholder="Issue, suitable time, area/landmark in Jagtial. Do not share door PINs, OTPs, Aadhaar, school details or private ID documents." className="mt-1 block w-full rounded-xl border border-slate-300 p-3"/>
    </label>
    <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <label className="flex items-start gap-2 text-xs leading-5 text-slate-700">
      <input required type="checkbox" name="consent" className="mt-1"/>
      <span>I agree to Zeshu storing this request and contacting me about this service enquiry. Details are not automatically shared with unverified workers. This is not a confirmed booking and no money is collected. See <Link href="/policies#privacy" className="font-bold text-[#075E45] underline">Privacy Policy</Link>.</span>
    </label>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
    <div>
      <button type="submit" disabled={busy || checking || !available} className="rounded-xl bg-[#075E45] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Request a free quote'}</button>
      <p className="mt-2 text-xs leading-5 text-slate-500">No ₹99 inspection or other visit fee is confirmed here. The professional must disclose any charge and whether it is adjustable before you accept a visit.</p>
    </div>
  </form>;
}
