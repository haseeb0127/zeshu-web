'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminSupabase } from '@/app/lib/browser-supabase';
import { MOVE_QUOTE_SERVICES, MOVE_QUOTE_TOWNS, type MoveQuoteService } from '@/app/lib/move-quote-enquiry';

type Enquiry = {
  id: string; service_code: MoveQuoteService; pickup_town: string; pickup_landmark: string;
  destination: string; travel_date: string; travel_time: string | null;
  contact_name: string; contact_phone: string; passengers: number | null;
  load_description: string; notes: string; status: string; created_at: string;
  admin_notes: string; last_customer_contact_at: string | null;
};

const statuses = ['NEW','REVIEWING','SOURCING','QUOTED','CLOSED','CANCELLED'] as const;

export default function MoveQuoteAdminPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [townFilter, setTownFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const isOpen = (status: string) => ['NEW','REVIEWING','SOURCING'].includes(status);
  const needsAttention = (item: Enquiry) => isOpen(item.status) && (
    (item.status === 'NEW' && Date.now() - new Date(item.created_at).getTime() >= 4 * 60 * 60 * 1000) ||
    (new Date(item.travel_date + 'T23:59:59+05:30').getTime() - Date.now() < 48 * 60 * 60 * 1000)
  );
  const urgent = rows.filter(needsAttention).length;
  const visibleRows = rows.filter(item =>
    (townFilter === 'ALL' || item.pickup_town === townFilter) &&
    (statusFilter === 'ALL' || item.status === statusFilter)
  ).sort((a, b) => (Number(needsAttention(b)) - Number(needsAttention(a))) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
  const getToken = async () => (await adminSupabase().auth.getSession()).data.session?.access_token || '';
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) { router.replace('/admin/login'); return; }
      const response = await fetch('/api/admin/move/quotes', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
      if (response.status === 403) { router.replace('/admin/login'); return; }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to load enquiries');
      setRows(Array.isArray(payload.enquiries) ? payload.enquiries : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load enquiries');
    } finally { setLoading(false); }
  }, [router]);
  useEffect(() => { void reload(); }, [reload]);

  async function changeStatus(id: string, status: string, markContacted = false) {
    setBusyId(id);
    try {
      const token = await getToken();
      if (!token) { router.replace('/admin/login'); return; }
      const response = await fetch('/api/admin/move/quotes', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, admin_notes: draftNotes[id] ?? rows.find(item => item.id === id)?.admin_notes ?? '', mark_contacted: markContacted }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Update failed');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally { setBusyId(''); }
  }

  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 md:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/dashboard" className="text-sm font-bold text-[#075E45]">← Admin dashboard</Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Move · scheduled quote enquiries</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Private customer-submitted requests across Jagtial, Dharmaram, Korutla, Metpally and Dharmapuri. Review and verify operator availability manually. A request is not a confirmed vehicle booking, provider quote, fare or payment.</p>
        </div>
        <button type="button" onClick={() => void reload()} className="rounded-xl bg-[#075E45] px-4 py-2 text-sm font-bold text-white">Refresh</button>
      </div>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Do not forward personal phone numbers to unverified operators or collect advances for unconfirmed services. Only contact customers about the enquiry they consented to. Do not activate instant dispatch, bike taxis, stranger pooling or fixed-fare claims from this inbox.</p>
      <section className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div>
          <h2 className="font-black text-emerald-950">Find operators before making booking promises</h2>
          <p className="mt-1 text-xs leading-5 text-emerald-900">No quote enquiry can be converted to a confirmed vehicle without verified fleet and driver documents, appropriate permit and written itemised operator quote. Recruitment is free during the pilot.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/earn?role=PASSENGER_FLEET_OPERATOR#join" className="rounded-xl bg-[#075E45] px-3 py-2 text-xs font-black text-white">Recruit cab / bus fleets</Link>
          <Link href="/earn?role=LOGISTICS_FLEET_OPERATOR#join" className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#075E45]">Recruit truck fleets</Link>
        </div>
      </section>
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Move hub activation requirements">
        <h2 className="font-black text-slate-900">Instant dispatch · activation remains blocked</h2>
        <p className="mt-1 text-xs leading-5 text-slate-600">Recruitment targets do not establish actual coverage. No hub can be unlocked from this page. Before customer booking, obtain transport and worker-compliance sign-off, verified operator/vehicle documents and insurance, tested online matching and pickup SLAs, safe cancellation/refund handling, and live customer support.</p>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          {[
            { name: 'Hub 1 · Jagtial / nearby Dharmaram', gate: 'Permits, available drivers, pickup tests and worker registration' },
            { name: 'Hub 2 · Korutla / Metpally', gate: 'Independent local driver coverage and verified commercial vehicles' },
            { name: 'Hub 3 · Dharmapuri', gate: 'Local operator coverage, temple/outstation serviceability and SLAs' },
          ].map(hub => <div key={hub.name} className="rounded-xl bg-slate-50 p-3">
            <p className="font-black text-slate-900">{hub.name}</p>
            <p className="mt-1 text-slate-600">{hub.gate}</p>
            <p className="mt-2 font-bold text-amber-700">Not approved for instant launch</p>
          </div>)}
        </div>
      </section>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {loading ? <p className="mt-6 text-sm">Loading enquiries…</p> : <>
        <div className="mt-5 flex flex-wrap gap-3">
          {[['Total', rows.length], ['New', rows.filter(row => row.status === 'NEW').length], ['Needs attention', urgent], ['Sourcing', rows.filter(row => row.status === 'SOURCING').length], ['Quoted', rows.filter(row => row.status === 'QUOTED').length]].map(([label,count]) =>
            <div key={String(label)} className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm"><span className="text-slate-600">{label}: </span><strong>{count}</strong></div>)}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Pickup town
            <select value={townFilter} onChange={e => setTownFilter(e.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs">
              <option value="ALL">All towns</option>
              {MOVE_QUOTE_TOWNS.map(town => <option key={town} value={town}>{town}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">Case status
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs">
              <option value="ALL">All statuses</option>
              {statuses.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <span className="text-xs font-semibold text-slate-500">{visibleRows.length} matching enquiries · most urgent first</span>
        </div>
        <div className="mt-4 grid gap-3">
          {visibleRows.map(row => <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-black">{MOVE_QUOTE_SERVICES[row.service_code]?.label || row.service_code} · {row.pickup_town} → {row.destination}</h2>
                <p className="mt-1 text-xs text-slate-500">ZMQ-{row.id.slice(0, 8).toUpperCase()} · {new Date(row.created_at).toLocaleString('en-IN')}</p>
                {needsAttention(row) && <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-900">Needs timely review · no guaranteed response SLA</p>}
                <p className="mt-2 text-sm">Journey: <strong>{row.travel_date}</strong>{row.travel_time ? ' at ' + row.travel_time : ''}</p>
                <p className="mt-1 text-sm">Customer: <strong>{row.contact_name}</strong> · <a href={'tel:+91' + row.contact_phone} className="font-bold text-[#075E45] underline">{row.contact_phone}</a> (admin only)</p>
                {row.last_customer_contact_at && <p className="mt-1 text-xs text-slate-500">Last recorded contact attempt: {new Date(row.last_customer_contact_at).toLocaleString('en-IN')}</p>}
                {row.pickup_landmark && <p className="mt-1 text-sm">Pickup landmark: {row.pickup_landmark}</p>}
                {row.passengers !== null && <p className="mt-1 text-sm">Passenger count: {row.passengers}</p>}
                {row.load_description && <p className="mt-1 whitespace-pre-wrap text-sm">Load: {row.load_description}</p>}
                {row.notes && <p className="mt-1 whitespace-pre-wrap text-sm">Notes: {row.notes}</p>}
              </div>
              <label className="text-xs font-bold text-slate-600">Status
                <select value={row.status} onChange={event => void changeStatus(row.id, event.target.value)} disabled={Boolean(busyId)}
                  className="mt-1 block rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900">
                  {statuses.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="text-xs font-black text-slate-700">Private operational notes (operator verification, itemised quote, customer follow-up)
                <textarea rows={2} maxLength={1000} value={draftNotes[row.id] ?? row.admin_notes ?? ''}
                  onChange={e => setDraftNotes(current => ({ ...current, [row.id]: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
                  placeholder="Record the contacted operator, availability, quoted charges/extras and agreed follow-up. No OTPs, licence numbers, Aadhaar or bank details." />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={!!busyId} onClick={() => void changeStatus(row.id, row.status)} className="rounded-lg bg-[#075E45] px-3 py-2 text-xs font-black text-white disabled:opacity-50">Save private notes</button>
                <button type="button" disabled={!!busyId} onClick={() => void changeStatus(row.id, row.status, true)} className="rounded-lg border border-[#075E45] bg-white px-3 py-2 text-xs font-black text-[#075E45] disabled:opacity-50">Record customer contact attempt</button>
              </div>
            </div>
          </article>)}
          {!visibleRows.length && <p className="rounded-xl bg-white p-5 text-sm text-slate-600">No enquiries match the selected filters.</p>}
        </div>
      </>}
    </div>
  </main>;
}
