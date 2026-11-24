import type { Metadata } from 'next';
import Link from '@/app/components/DocumentLink';
import { ArrowRight, BadgeCheck, ClipboardCheck, HeartHandshake, LockKeyhole, Store } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Zeshu Pharmacy | Verified Local Pharmacy Partner Pilot in Jagtial',
  description: 'Zeshu is preparing a Jagtial-first network of independently licensed pharmacies. Pharmacy partner enquiries are open; medicine ordering, prescriptions, payments and delivery are not live.',
  alternates: { canonical: '/pharmacy' },
  robots: { index: true, follow: true },
};

const steps = [
  { title: 'Find verified local shops', body: 'Only pharmacy premises with independently checked retail drug licences and registered pharmacist supervision will qualify.' },
  { title: 'Let a pharmacist review', body: 'If prescription ordering is legally approved later, only the licensed pharmacy will confirm availability, prescription validity and lawful pricing.' },
  { title: 'Pay only for a confirmed order', body: 'Future medicine payment and delivery require approved procedures. No medicines or prescription images can be submitted today.' },
];
const checks = [
  'Retail drug licence and premises checked against Telangana Drugs Control Administration records',
  'Registered pharmacist credentials and dispensing accountability confirmed',
  'Schedule H1, Schedule X and controlled-drug delivery exclusions reviewed with local regulator',
  'Prescription confidentiality, lawful retention, receipts, refunds and safe dispensing reviewed',
  'Same-district serviceability, sealed handling and temperature-sensitive product restrictions verified',
];

export default function PharmacyPage() {
  return <main className="min-h-screen bg-[#f4f9f6] text-slate-900">
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <Link href="/" className="text-sm font-bold text-[#075e45]">← Back to Zeshu</Link>
      <header className="mt-5 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#053b2c,#087b59)] px-6 py-9 text-white shadow-xl md:px-10">
        <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-100">Zeshu Pharmacy · Jagtial-first partner pilot</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight md:text-5xl">Trusted local pharmacies. Responsible medicine access.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 md:text-base">We are preparing an asset-light network where independently licensed Jagtial medical shops own stock, verify prescriptions and issue their own bills. Zeshu will not dispense or warehouse medicines.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/partners?type=LICENSED_PHARMACY#partner-apply" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#075e45]">Apply as a licensed pharmacy <ArrowRight size={16}/></Link>
          <Link href="/help" className="rounded-xl border border-white/60 px-5 py-3 text-sm font-bold text-white">Customer help</Link>
        </div>
      </header>
      <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="flex items-center gap-2 font-black text-amber-950"><LockKeyhole size={19}/> Medicine ordering is not live</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">Do not upload prescriptions, patient details or health records to this site or its partnership form. No medicine orders, delivery promises, online drug payments, pharmacist approvals or pharmacy subscription charges are active.</p>
      </section>
      <section className="mt-7">
        <h2 className="text-2xl font-black">How future Zeshu Pharmacy will work</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {steps.map((item,index)=><article key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <span className="inline-grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-sm font-black text-[#075e45]">{index+1}</span>
            <h3 className="mt-3 font-black">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
          </article>)}
        </div>
      </section>
      <section className="mt-7 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-emerald-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-xl font-black"><Store className="text-[#075e45]" size={22}/> Founding medical shop proposal</h2>
          <p className="mt-3 text-3xl font-black text-[#075e45]">₹299 <span className="text-sm font-bold text-slate-500">/ month</span></p>
          <p className="mt-2 text-sm font-bold text-slate-800">0% Zeshu sales commission · introductory pilot proposed</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">A future ₹299/month, tax-inclusive membership is under review; no payment, free-trial entitlement or 25-order threshold is active. Delivery, payment-provider and other statutory costs would be disclosed separately. No retailer is charged without a signed agreement and compliant invoicing.</p>
          <Link href="/partners?type=LICENSED_PHARMACY#partner-apply" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#075e45] px-5 py-3 text-sm font-bold text-white">Register your pharmacy interest <ArrowRight size={16}/></Link>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-xl font-black"><ClipboardCheck className="text-[#075e45]" size={22}/> Verification checklist</h2>
          <ul className="mt-3 space-y-3">{checks.map(item=><li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700"><BadgeCheck className="mt-1 shrink-0 text-[#075e45]" size={16}/><span>{item}</span></li>)}</ul>
        </article>
      </section>
      <section className="mt-6 rounded-2xl bg-[#e5f2eb] p-5">
        <h2 className="flex items-center gap-2 font-black text-[#075e45]"><HeartHandshake size={19}/> Pharmacy-led care, not instant-delivery advertising</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">We will not advertise guaranteed 30-minute medicine delivery, particular prescription-drug discounts, brand substitutions or a live catalogue before a verified local partner, lawful fulfilment process and dispatch capacity exist.</p>
        <p className="mt-3 text-xs text-slate-600">For an immediate health concern or urgent medicine need, contact a licensed local pharmacy or medical professional directly rather than relying on this pre-launch page.</p>
      </section>
    </div>
  </main>;
}
