import Link from 'next/link';

const opportunities = [
  { title: 'Sponsored products', body: 'Clearly labelled Sponsored placements in relevant shopping results or category discovery. Organic results remain distinguishable from paid placements.' },
  { title: 'Brand-funded cashback', body: 'Brands can fund customer rewards on eligible products so shoppers receive a visible benefit while Zeshu earns campaign revenue.' },
  { title: 'Featured collections', body: 'Time-bound festival, launch, bundle and category campaigns with clear commercial labelling where applicable.' },
  { title: 'Sampling & bundles', body: 'Brands can sponsor samples or bundles tied to genuine customer orders without forcing unrelated products into the cart.' },
  { title: 'Local supplier onboarding', body: 'Jagtial grocery, fresh-food, electronics, clothing and other eligible suppliers can be reviewed for fulfilment partnerships.' },
  { title: 'Licensed pharmacy partners', body: 'Only appropriately licensed pharmacy partners will be considered for future medicine fulfilment. Prescription workflows remain disabled until compliance is complete.' },
];

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#f8fbf8] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-black text-[#087443]">← Back to Zeshu</Link>
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

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 md:p-8">
          <h2 className="text-xl font-black">What Zeshu will not do</h2>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
            <p>Paid placements must not be disguised as neutral recommendations.</p>
            <p>Customer personal data is not offered for sale to advertisers.</p>
            <p>Campaigns must not override product availability, safety or statutory information.</p>
            <p>Cashback claims must match the actual eligible benefit and campaign terms.</p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-emerald-50 p-6 md:p-8">
          <h2 className="text-xl font-black">Become a Zeshu partner</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Supplier and campaign onboarding is reviewed manually while the partner portal is being prepared. Include your business name, category, Jagtial service capability, GST/FSSAI/drug-licence details where applicable, product catalogue and commercial proposal.</p>
          <a href="mailto:support@zeshu.in?subject=Zeshu%20brand%20or%20supplier%20partnership" className="mt-4 inline-flex rounded-xl bg-[#087443] px-5 py-3 text-sm font-black text-white">Contact Zeshu</a>
        </section>
      </div>
    </main>
  );
}
