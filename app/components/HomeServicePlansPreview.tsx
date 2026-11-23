'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomeServicePlansPreview() {
  const [quick, setQuick] = useState(6);
  const [premium, setPremium] = useState(2);
  const leadCost = quick * 15 + premium * 50;
  const difference = Math.abs(299 - leadCost);
  return <section className="mt-7 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm md:p-8" aria-label="Proposed provider plans">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="text-xs font-black uppercase tracking-widest text-[#075E45]">For independent professionals</p><h2 className="mt-2 text-2xl font-black">Flexible plans for busy and seasonal pros</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Register free during the pilot. The following are proposed future platform fees, <strong>not current offers, charges or subscriptions</strong>. Providers keep control of their service rates.</p></div>
      <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">Proposed · not active</span>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      <article className="rounded-2xl border border-emerald-100 bg-[#f6faf7] p-5">
        <p className="text-xs font-black uppercase tracking-wider text-[#075E45]">Seasonal / part-time</p><p className="mt-2 text-3xl font-black">₹200 <span className="text-sm font-semibold text-slate-500">proposed credit pack</span></p>
        <p className="mt-2 text-sm text-slate-700">₹15 per accepted qualified quick job or ₹50 per accepted qualified premium placement; a ₹200 pack covers up to 13 quick jobs or 4 premium placements. No monthly expiry proposed.</p>
        <p className="mt-2 text-xs font-semibold text-amber-900">Prepaid credits are NOT available until payment, GST, RBI/PPI, refund and accounting reviews are completed. No balance is being collected.</p>
      </article>
      <article className="rounded-2xl border border-emerald-100 bg-[#edf8f1] p-5">
        <p className="text-xs font-black uppercase tracking-wider text-[#075E45]">Year-round / high-volume</p><p className="mt-2 text-3xl font-black">₹299 <span className="text-sm font-semibold text-slate-500">proposed monthly</span></p>
        <p className="mt-2 text-sm text-slate-700">No per-booking platform fee on eligible genuine opportunities during the subscription period, subject to published fair-use terms. Professional service prices remain provider-set.</p>
        <p className="mt-2 text-xs font-semibold text-slate-600">No automatic upgrade, charge or renewal without affirmative agreement. Pricing subject to final GST and contract review.</p>
      </article>
    </div>
    <div className="mt-5 rounded-2xl border border-slate-200 p-4 md:p-5">
      <h3 className="font-black">Compare future fee models</h3>
      <p className="mt-1 text-xs text-slate-500">Illustrative monthly platform charges only, not service earnings. Amounts are proposed GST-inclusive figures; eligibility and fair-use rules are not yet final.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Quick bookings: {quick}<input type="range" min="0" max="50" value={quick} onChange={e => setQuick(Number(e.target.value))} className="mt-2 w-full accent-[#075E45]"/></label>
        <label className="text-sm font-semibold">Premium placements: {premium}<input type="range" min="0" max="20" value={premium} onChange={e => setPremium(Number(e.target.value))} className="mt-2 w-full accent-[#075E45]"/></label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Pay per qualified lead</p><p className="mt-1 text-xl font-black">₹{leadCost}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Monthly</p><p className="mt-1 text-xl font-black">₹299</p></div>
      </div>
      <p className="mt-3 text-sm font-bold text-[#075E45]">{leadCost === 299 ? 'Both models would cost the same.' : `${leadCost < 299 ? 'Pay per qualified lead' : 'Monthly'} would save ₹${difference} in this example.`}</p>
      <p className="mt-1 text-xs text-slate-500">Recommendations are advisory only. Any future paid plan will require explicit opt-in. Qualified leads exclude duplicates, fake requests and unserviceable contacts, with a documented dispute/refund policy.</p>
    </div>
    <Link href="/partners?type=HOME_SERVICE_PRO#partner-apply" className="mt-5 inline-flex rounded-xl bg-[#075E45] px-5 py-3 text-sm font-black text-white">Register free partner interest</Link>
  </section>;
}
