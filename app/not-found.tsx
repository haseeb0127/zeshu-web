import Link from 'next/link';
import { Compass, Home, LifeBuoy } from 'lucide-react';
export default function ZeshuNotFound() {
  return <main data-zeshu-recovery="not-found" className="flex min-h-[75dvh] items-center justify-center bg-[radial-gradient(ellipse_at_top,#eaf8ee,#fff_65%)] px-4 py-12 text-[#163327]">
    <section className="w-full max-w-md rounded-[28px] border border-emerald-100 bg-white px-6 py-9 text-center shadow-[0_12px_35px_rgba(7,94,69,.11)]">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-[#075e45]"><Compass size={30}/></div>
      <h1 className="text-2xl font-black">This Zeshu page isn't available</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">The link may have changed. Continue shopping or use Customer Service for help. No order or payment has been created by this page.</p>
      <div className="mt-6 grid gap-3">
        <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#075e45] px-5 font-bold text-white"><Home size={18}/> Go to Zeshu Home</Link>
        <Link href="/help" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 font-bold text-[#075e45]"><LifeBuoy size={18}/> Help Center</Link>
      </div>
    </section>
  </main>;
}
