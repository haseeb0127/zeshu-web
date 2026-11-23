'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MOVE_QUOTE_SERVICE_CODES, MOVE_QUOTE_SERVICES, MOVE_QUOTE_TOWNS,
  getIndiaTodayISO, validateMoveQuote, type MoveQuoteService,
} from '@/app/lib/move-quote-enquiry';

type Result = { reference: string; message: string };
const services = MOVE_QUOTE_SERVICE_CODES;
const initial = {
  pickup_town: 'Jagtial',
  pickup_landmark: '',
  destination: '',
  travel_date: '',
  travel_time: '',
  contact_name: '',
  contact_phone: '',
  passengers: '',
  load_description: '',
  notes: '',
  website: '',
  consent: false,
};

function RequestQuoteForm() {
  const params = useSearchParams();
  const preselected = params.get('service') || '';
  const [service, setService] = useState<MoveQuoteService>(
    services.includes(preselected as MoveQuoteService) ? preselected as MoveQuoteService : 'OUTSTATION_CAB',
  );
  const [form, setForm] = useState(initial);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const today = useMemo(() => getIndiaTodayISO(), []);
  useEffect(()=>{
    const pickup=params.get('pickup_town')||'';
    const drop=params.get('destination')||'';
    if(MOVE_QUOTE_TOWNS.includes(pickup as typeof MOVE_QUOTE_TOWNS[number]) && drop.length>=3 && drop.length<=200) {
      setForm(prev=>({...prev,pickup_town:pickup,destination:drop}));
    }
  },[params]);

  useEffect(() => {
    let active = true;
    fetch('/api/move/quotes', { cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(payload => { if (active) setReady(payload?.accepting_requests === true); })
      .catch(() => { if (active) setReady(false); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  const field = (key: keyof typeof initial, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || busy) return;
    const payload = {
      ...form, service_code: service,
      passengers: form.passengers ? Number(form.passengers) : null,
    };
    const validation = validateMoveQuote(payload);
    if (!validation.ok) { setError(validation.error); return; }
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/move/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.saved) throw new Error(data?.error || 'Could not save this enquiry.');
      setResult({ reference: data.reference, message: data.message });
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save this enquiry.'); }
    finally { setBusy(false); }
  };

  if (result) return <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm md:p-9" aria-live="polite">
    <p className="text-xs font-black uppercase tracking-widest text-[#075E45]">Enquiry saved · not a booking</p>
    <h1 className="mt-3 text-2xl font-black">Your scheduled transport request was received</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">{result.message}</p>
    <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-[#075E45]">Reference: {result.reference}</p>
    <p className="mt-4 text-sm text-slate-600">Zeshu can review the details and contact you if a suitable verified operator is available. No vehicle has been reserved and no money has been taken. Do not send any advance or sensitive documents to an unverified operator.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <Link href="/move" className="rounded-xl bg-[#075E45] px-4 py-3 text-sm font-bold text-white">Back to Zeshu Move</Link>
      <Link href="/help" className="rounded-xl border border-emerald-200 px-4 py-3 text-sm font-bold text-[#075E45]">Customer support</Link>
    </div>
  </section>;

  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
    <p className="text-xs font-black uppercase tracking-[.15em] text-[#075E45]">Jagtial district · scheduled transport enquiries</p>
    <h1 className="mt-2 text-2xl font-black md:text-3xl">Request an operator quote</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Outstation cabs, possible return-leg cabs, mini and large trucks, or whole-bus hire. We collect your trip details to review with eligible providers. A request is free and does not guarantee a quotation, fare, driver or confirmed booking. No payment is collected here.</p>
    {checking && <p className="mt-4 text-sm font-semibold text-slate-600">Checking enquiry availability…</p>}
    {!checking && !ready && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The enquiry inbox is temporarily unavailable. No details have been sent. Please use <Link href="/help" className="font-black underline">Zeshu Help</Link> instead.</p>}
    <form onSubmit={event => void submit(event)} className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">Vehicle / service
        <select value={service} onChange={event => setService(event.target.value as MoveQuoteService)} required
          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3">
          {services.map(code => <option key={code} value={code}>{MOVE_QUOTE_SERVICES[code].label}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold text-slate-700">Pickup town
        <select value={form.pickup_town} onChange={event => field('pickup_town',event.target.value)} required
          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3">
          {MOVE_QUOTE_TOWNS.map(town => <option key={town} value={town}>{town}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold text-slate-700">Pickup landmark (optional)
        <input maxLength={160} value={form.pickup_landmark} onChange={e => field('pickup_landmark',e.target.value)} placeholder="Shop, stand, venue or area"
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>
      <label className="text-sm font-bold text-slate-700">Destination / drop-off
        <input required minLength={3} maxLength={200} value={form.destination} onChange={e => field('destination',e.target.value)} placeholder="E.g., Karimnagar, Hyderabad or function hall"
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>
      <label className="text-sm font-bold text-slate-700">Journey date
        <input required type="date" min={today} value={form.travel_date} onChange={e => field('travel_date',e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>
      <label className="text-sm font-bold text-slate-700">Preferred departure time (optional)
        <input type="time" value={form.travel_time} onChange={e => field('travel_time',e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>
      {service === 'CHARTER_BUS' || service === 'OUTSTATION_CAB' || service === 'RETURN_CAB' ? <label className="text-sm font-bold text-slate-700">Passengers {service === 'CHARTER_BUS' ? '(required)' : '(optional)'}
        <input type="number" min={1} max={70} required={service === 'CHARTER_BUS'} value={form.passengers} onChange={e => field('passengers',e.target.value)} placeholder="Approximate group size"
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label> : null}
      {(service === 'MINI_TRUCK' || service === 'LARGE_TRUCK') && <label className="text-sm font-bold text-slate-700">Goods and estimated load
        <input required minLength={5} maxLength={500} value={form.load_description} onChange={e => field('load_description',e.target.value)} placeholder="Approximate weight, cartons, loading requirements"
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>}
      <label className="text-sm font-bold text-slate-700">Your name
        <input required minLength={2} maxLength={100} autoComplete="name" value={form.contact_name} onChange={e => field('contact_name',e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>
      <label className="text-sm font-bold text-slate-700">Contact mobile (India)
        <input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={form.contact_phone} onChange={e => field('contact_phone',e.target.value)} placeholder="10-digit mobile number"
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>
      <label className="text-sm font-bold text-slate-700 md:col-span-2">Trip notes {service === 'RETURN_CAB' ? '(include return-date flexibility)' : '(optional)'}
        <textarea rows={3} required={service === 'RETURN_CAB'} maxLength={900} value={form.notes} onChange={e => field('notes',e.target.value)} placeholder="Dates, return preferences, stops, bus seating or accessibility needs"
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>
      <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => field('website',e.target.value)}/></label></div>
      <label className="flex items-start gap-2 text-xs leading-5 text-slate-700 md:col-span-2">
        <input type="checkbox" required checked={form.consent} onChange={e => field('consent',e.target.checked)} className="mt-1"/>
        <span>I agree that Zeshu may store these details and contact me about this quotation enquiry. My details will not be sent to an unverified operator. I understand this is not a booking or payment. See <Link href="/policies#privacy" className="font-bold text-[#075E45] underline">Privacy Policy</Link>.</span>
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <button type="submit" disabled={checking || !ready || busy} className="rounded-xl bg-[#075E45] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Saving request…' : 'Request a free quote'}</button>
      </div>
    </form>
  </section>;
}

export default function MoveQuotePage() {
  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 md:px-8">
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/move" className="text-sm font-black text-[#075E45]">← Back to Zeshu Move</Link>
        <span className="text-xs font-bold text-slate-600">One Zeshu account · enquiries are free</span>
      </div>
      <Suspense fallback={<p className="rounded-2xl bg-white p-6 text-slate-600">Loading quote form…</p>}>
        <RequestQuoteForm />
      </Suspense>
    </div>
  </main>;
}
