'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminSupabase } from '@/app/lib/browser-supabase';
import { MOVE_QUOTE_SERVICES, type MoveQuoteService } from '@/app/lib/move-quote-enquiry';

type Enquiry = {
  id: string; service_code: MoveQuoteService; pickup_town: string; pickup_landmark: string;
  destination: string; travel_date: string; travel_time: string | null;
  contact_name: string; contact_phone: string; passengers: number | null;
  load_description: string; notes: string; status: string; created_at: string;
};

const statuses = ['NEW','REVIEWING','SOURCING','QUOTED','CLOSED','CANCELLED'] as const;

export default function MoveQuoteAdminPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
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

  async function changeStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const token = await getToken();
      if (!token) { router.replace('/admin/login'); return; }
      const response = await fetch('/api/admin/move/quotes', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
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
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {loading ? <p className="mt-6 text-sm">Loading enquiries…</p> : <>
        <div className="mt-5 flex flex-wrap gap-3">
          {[['Total', rows.length], ['New', rows.filter(row => row.status === 'NEW').length], ['Sourcing', rows.filter(row => row.status === 'SOURCING').length], ['Quoted', rows.filter(row => row.status === 'QUOTED').length]].map(([label,count]) =>
            <div key={String(label)} className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm"><span className="text-slate-600">{label}: </span><strong>{count}</strong></div>)}
        </div>
        <div className="mt-5 grid gap-3">
          {rows.map(row => <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-black">{MOVE_QUOTE_SERVICES[row.service_code]?.label || row.service_code} · {row.pickup_town} → {row.destination}</h2>
                <p className="mt-1 text-xs text-slate-500">ZMQ-{row.id.slice(0, 8).toUpperCase()} · {new Date(row.created_at).toLocaleString('en-IN')}</p>
                <p className="mt-2 text-sm">Journey: <strong>{row.travel_date}</strong>{row.travel_time ? ' at ' + row.travel_time : ''}</p>
                <p className="mt-1 text-sm">Customer: <strong>{row.contact_name}</strong> · {row.contact_phone}</p>
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
          </article>)}
          {!rows.length && <p className="rounded-xl bg-white p-5 text-sm text-slate-600">No scheduled transport enquiries received yet.</p>}
        </div>
      </>}
    </div>
  </main>;
}
