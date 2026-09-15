import Link from 'next/link';

const POLICIES = [
  ['Terms & Conditions', 'These terms describe use of Zeshu, product listings, checkout, delivery, and account responsibilities. Orders are accepted only after successful payment verification and provider confirmation.'],
  ['Privacy Policy', 'Zeshu uses account, delivery, order, and device information only to provide and secure the services. We do not publish private customer details or payment credentials.'],
  ['Payments Policy', 'Grocery payments are processed through the displayed payment provider. Zeshu records verified payment identifiers for order reconciliation; card, bank, and OTP details are handled by the payment provider.'],
  ['Cancellation & Refund Policy', 'Cancellation and refund availability depends on order state, payment status, inventory reservation, and the applicable workflow. A payment receipt is not by itself a promise of a refund.'],
  ['Returns & Replacement Policy', 'Report damaged, missing, or incorrect grocery items through the verified support channel as soon as possible. Eligibility depends on the item and evidence available for the order.'],
  ['Shipping & Delivery Policy', 'Delivery estimates are informational. The order timeline reflects the latest verified order status; live rider location appears only during eligible delivery states and only when real location data is available.'],
  ['Zeshu Cash Terms', 'Zeshu Cash is a promotional reward balance earned only through eligible, verified workflows. Availability, limits, expiry, and redemption are determined by the applicable server-side rules shown at checkout.'],
  ['Grievance & Support', 'For unresolved, payment, refund, safety, or account issues, use the verified support channel in your order communication and request human assistance. No ticket is created by this page.'],
  ['Seller / Vendor Policy', 'Vendors must provide accurate product, stock, and store information and follow the approved order-preparation lifecycle. Zeshu may restrict access for policy or safety reasons.'],
  ['Sponsored Advertising Policy', 'Zeshu does not currently operate a sponsored-placement system. Any future paid placement will be clearly labelled “Sponsored”.'],
];

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-[#f8fbf8] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-black text-[#087443]">← Back to Zeshu</Link>
        <header className="mt-8 rounded-3xl bg-[#083b27] p-7 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a6dfba]">Zeshu Trust Center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Policies &amp; customer information</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d9f3e3]">These are working customer-facing drafts. Where Zeshu does not yet have a published legal contact or a supported workflow, this page does not invent one.</p>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {POLICIES.map(([title, body]) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></section>)}
        </div>
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">Business/legal contact details, registered entity information, and jurisdiction-specific terms still require review before public launch.</p>
      </div>
    </main>
  );
}
