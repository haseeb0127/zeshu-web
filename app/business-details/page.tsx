import Link from 'next/link';
import type { Metadata } from 'next';
import { ZESHU_LEGAL_BUSINESS as business } from '../lib/legal-business-details';

export const metadata: Metadata = {
  title: 'Business & GST Details | Zeshu',
  description: 'Registered Zeshu business details, marketplace activities, payment flows, delivery and customer-support policies.',
  alternates: { canonical: '/business-details' },
};

const details = [
  ['Trade name', business.tradeName],
  ['Registered legal name', business.legalName],
  ['Business constitution', business.constitution],
  ['GSTIN', business.gstin],
  ['GST registration type', business.gstRegistrationType],
  ['GST certificate effective from', business.gstEffectiveDate],
  ['Registered business address', business.registeredAddress],
  ['Website', business.website],
];

const responsibilities = [
  {
    title: 'Zeshu marketplace',
    body: 'Zeshu provides an online shopfront, order coordination, customer support and, where supported, a payment and delivery interface. Independent sellers retain their inventory, set eligible product prices and are responsible for lawful product descriptions, stock, quality, correct dispatch and product tax invoices. Zeshu remains responsible for its own legal duties and customer support obligations.',
  },
  {
    title: 'Payments and seller settlements',
    body: 'Zeshu currently uses a Razorpay TEST checkout for testing. Production gateway activation, seller-linked accounts, split settlements and automated seller payouts are not represented as operational until each feature is approved and verified. Once enabled, seller payments will follow the applicable approved gateway agreement, verified sale/refund status, statutory deductions, and separately accepted seller terms. Zeshu does not promise instant settlement or hold deposits as a bank.',
  },
  {
    title: 'Seller pricing and marketplace fees',
    body: 'The proposed model is a ₹299-per-month seller membership (including applicable GST where charged), a 14-day trial, and 0% sales commission, subject to a future published and accepted seller agreement. No automated membership billing is currently enabled. A ₹10 tax-inclusive local platform-handling fee and revised distance-based delivery model are staged but not activated. The actual checkout is authoritative for current buyer charges.',
  },
  {
    title: 'Local and nationwide shipping',
    body: 'Physical local orders are limited to supported areas of Jagtial, Telangana, using available verified sellers and appropriate delivery fulfilment. India-wide physical courier checkout is not currently enabled. Before any expansion, seller pickup locations, courier eligibility, shipment tracking, charges, returns and cold-chain restrictions must be verified.',
  },
  {
    title: 'Cancellations, returns and refunds',
    body: 'Customers can request help through Zeshu Support. Consumer rights apply regardless of whether a product was supplied by a third-party seller. Seller-fault issues such as wrong, damaged or defective goods must be corrected under applicable law and agreed seller terms. Courier claims and customer-choice returns are assessed by fault, published eligibility and law. An approved monetary refund is returned to the original payment method where supported; Zeshu Cash is not substituted without the customer choosing it.',
  },
  {
    title: 'GST and statutory roles',
    body: 'Zeshu has an issued Regular GST REG-06 certificate. Zeshu’s GSTIN identifies its registered proprietor and does not make Zeshu the seller or tax-invoice issuer for every third-party product. Sellers must provide their own statutory details and invoices where required. Additional marketplace e-commerce operator TCS registration, withholding, invoice treatment and delivery-service taxes are reviewed separately; a Regular GST certificate alone does not prove those registrations or approvals.',
  },
];

export default function BusinessDetailsPage() {
  return (
    <main className="min-h-screen bg-[#f8fbf8] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-black text-[#075E45]">← Back to Zeshu</Link>
        <header className="mt-8 rounded-3xl bg-[#083b27] p-7 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a6dfba]">Zeshu · Official business information</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Business, GST &amp; marketplace information</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#d9f3e3]">Clear legal identity and how products, payments, sellers, deliveries and customer protections are handled.</p>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <h2 className="text-lg font-black">Registered business details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl bg-[#f4f8f5] p-3">
                <dt className="text-xs font-bold text-slate-500">{label}</dt>
                <dd className="mt-1 break-words text-sm font-bold text-[#103e2e]">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-5 text-slate-600">These details are transcribed from Zeshu's issued GST REG-06 certificate. For live GST taxpayer status, use the Government of India's GST portal Search Taxpayer feature. The certificate is displayed at the registered premises as required; private KYC files are not published here.</p>
          <a href="https://www.gst.gov.in/" target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-black text-[#075E45] underline">Official GST portal</a>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2" aria-label="How Zeshu operates">
          {responsibilities.map(item => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-[#075E45]">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm md:p-7">
          <h2 className="text-lg font-black">Customer care, grievance and privacy</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">For order, delivery, payment or refund assistance, use the Help Center. For grievances and privacy requests, contact the dedicated addresses below. Never send passwords, OTPs, UPI PINs or full card details.</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[#075E45]">
            <Link href="/help" className="underline">Help Center</Link>
            <a href={'mailto:' + business.supportEmail} className="underline">{business.supportEmail}</a>
            <a href={'mailto:' + business.grievanceEmail} className="underline">{business.grievanceEmail}</a>
            <a href={'mailto:' + business.privacyEmail} className="underline">{business.privacyEmail}</a>
            <Link href="/policies" className="underline">Terms, Privacy, Refunds &amp; Delivery</Link>
          </div>
          <p className="mt-3 text-xs text-slate-600">Customer Service / Help Center: {business.supportPhone}</p>
        </section>
        <p className="mt-5 text-xs text-slate-500">Last reviewed: 23 November 2026. Service features and payment availability are confirmed at checkout, not by a future business roadmap.</p>
      </div>
    </main>
  );
}
