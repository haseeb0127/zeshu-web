'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, House, RefreshCw } from 'lucide-react';

export default function CustomerPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Zeshu page navigation failed', error); }, [error]);
  return <main data-zeshu-recovery="client-error" className="flex min-h-[75dvh] items-center justify-center bg-[radial-gradient(ellipse_at_top,#eaf8ee,#fff_65%)] px-4 py-12 text-[#163327]">
    <section className="w-full max-w-md rounded-[28px] border border-emerald-100 bg-white px-6 py-9 text-center shadow-[0_12px_35px_rgba(7,94,69,.11)]">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-[#075e45]"><AlertTriangle size={30}/></div>
      <h1 className="text-2xl font-black">This Zeshu page needs another try</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">There was a temporary problem opening this section. You can try again or return to the homepage. We haven't confirmed a new order, booking or payment.</p>
      <div className="mt-6 grid gap-3">
        <button type="button" onClick={() => { reset(); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#075e45] px-5 font-bold text-white"><RefreshCw size={18}/> Try again</button>
        <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 font-bold text-[#075e45]"><RefreshCw size={18}/> Reload page</button>
        <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 font-bold text-slate-700"><House size={18}/> Back to Zeshu</Link>
      </div>
      <Link href="/help" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#075e45]"><ArrowLeft size={15}/> Help Center</Link>
    </section>
  </main>;
}
