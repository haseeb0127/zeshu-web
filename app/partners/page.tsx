import Link from 'next/link';
import PartnerLeadForm from '../components/PartnerLeadForm';

const opportunities = [
  { title: 'Sponsored products', body: 'Clearly labelled Sponsored placements in relevant shopping results or digital discovery. Nationwide digital campaigns can run independently from Jagtial-only physical fulfilment. Organic results remain distinguishable from paid placements.' },
  { title: 'Brand-funded cashback', body: 'Brands can fund customer rewards on eligible products so shoppers receive a visible benefit while Zeshu earns campaign revenue.' },
  { title: 'Featured collections', body: 'Time-bound festival, launch, bundle and category campaigns with clear commercial labelling where applicable.' },
  { title: 'Sampling & bundles', body: 'Brands can sponsor samples or bundles tied to genuine customer orders without forcing unrelated products into the cart.' },
  { title: 'Local supplier onboarding', body: 'Jagtial grocery, fresh-food, electronics, clothing and other eligible suppliers can be reviewed for fulfilment partnerships.' },
  { title: 'Licensed pharmacy partners', body: 'Only appropriately licensed pharmacies will be considered for medicine fulfilment. Prescription workflows remain disabled until compliance and provider operations are verified.' },
  { title: 'Recharge & bill providers', body: 'BBPS/Bharat Connect, recharge and utility providers can propose compliant API or agent-institution integrations with settlement, commission and dispute-support terms.' },
  { title: 'Mobility networks', body: 'Licensed ride aggregators, fleet operators and interoperable mobility networks can propose bike, auto, cab, rental or outstation integrations. No customer booking activates until licensing, serviceability, safety and support are verified.' },
  { title: 'Courier & logistics', body: 'Bike courier, parcel, hyperlocal logistics and cargo providers can propose API or marketplace integrations with live serviceability, tracking, proof-of-delivery, pricing and support terms.' },
  { title: 'Travel distribution', body: 'Flight, hotel, bus and authorised rail partners can propose API, white-label or affiliate distribution for India-wide travel discovery and booking.' },
];

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#f8fbf8] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-black text-[#075E45]">← Back to Zeshu</Link>
        <header className="mt-8 rounded-3xl bg-[#083b27] p-7 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#a6dfba]">Zeshu for brands & suppliers</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Grow with Zeshu</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#d9f3e3]">Commercial placements should create value for customers, not clutter. Zeshu is building transparent local promotion, cashback and supplier partnerships for eligible businesses.</p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </section>

        <section id="fashion-sellers" className="mt-6 rounded-3xl border border-fuchsia-100 bg-white p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#075E45]">Zeshu Fashion sellers</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Sell on Zeshu — keep your inventory with you</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            Zeshu is onboarding clothing manufacturers, boutiques, wholesalers and D2C brands without buying their stock. Priority categories include sarees, kurtis, women’s western wear, men’s shirts and T-shirts, jeans, kidswear, footwear and accessories.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <h3 className="font-black text-slate-900">What to include in your proposal</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                {[
                  'Catalogue/API feed or structured product file',
                  'Seller pricing, proposed commission/BFF or margin economics',
                  'Drop-shipping or direct-fulfilment capability',
                  'Return, exchange and refund responsibility',
                  'Shipping responsibility, serviceability and tracking',
                  'Settlement, tax and invoicing requirements',
                  'Permission for Zeshu to promote eligible products nationally without purchasing inventory',
                ].map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">✓</span><span>{item}</span></li>)}
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black text-slate-900">Seller growth options</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Sponsored Products','Featured Store','Featured Brand','Fashion Deals','New Launch','Telangana Spotlight','Free-Delivery Campaigns'].map((label) => (
                  <span key={label} className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">{label}</span>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Paid placements will be clearly labelled to customers. Zeshu will publish seller fees only after real network, payment, shipping, return and tax costs are known.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 md:p-8">
          <h2 className="text-xl font-black">What Zeshu will not do</h2>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
            <p>Paid placements must not be disguised as neutral recommendations.</p>
            <p>Customer personal data is not offered for sale to advertisers.</p>
            <p>Campaigns must not override product availability, safety or statutory information.</p>
            <p>Cashback claims must match the actual eligible benefit and campaign terms.</p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-6 md:p-8">
          <h2 className="text-xl font-black">Individual rider or driver?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Delivery riders, bike couriers, auto drivers, cab drivers and goods drivers should use the privacy-safe Drive & Deliver form. Do not put Aadhaar, PAN, driving-licence numbers, RC numbers, bank details or OTPs in a public enquiry.</p>
          <Link href="/earn" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">Open Drive & Deliver</Link>
        </section>

        <section className="mt-6 rounded-3xl bg-emerald-50 p-6 md:p-8">
          <h2 className="text-xl font-black">Become a Zeshu partner</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Apply directly below. Local physical-fulfilment partners should include their Jagtial capability. Recharge/bill, mobility, logistics and travel providers should include API/white-label, commission, settlement, serviceability, tracking and support terms. Sponsors should include campaign budget and the products/services they want to promote. Pharmacy or medicine-distribution applicants must include valid licence details.</p>
          <PartnerLeadForm />
        </section>
      </div>
    </main>
  );
}
