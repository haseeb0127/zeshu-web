import Link from "next/link";
import { Bike, Car, Package, ShieldCheck, WalletCards } from "lucide-react";

const benefits = [
  ["Keep more of every earning", "Zeshu is designing a low-fee model instead of depending on high per-trip commissions."],
  ["No exclusivity", "Captain onboarding is designed so eligible riders can choose when to work and may use other platforms subject to applicable rules."],
  ["Clear earnings", "Before an accepted job, the Captain experience will show the customer fare, Zeshu fee and expected Captain earning."],
  ["One Captain profile", "Delivery, courier and eligible passenger services can share one verified profile, with each service activated separately."],
];

export default function CaptainPage() {
  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/move" className="text-sm font-black text-[#075E45]">← Back to Zeshu Move</Link>
        <header className="mt-6 rounded-[30px] bg-[#083b27] p-7 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#bde8cc]">Zeshu Captain</p>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">Earn more. Choose your work.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#d7f0df]">Register for Zeshu delivery, courier and—where legally activated—Bike, Auto or Cab trips. Joining interest is free. No passenger service is activated until its Telangana/provider requirements are cleared.</p>
          <Link href="/earn" className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-[#075E45]">Join Zeshu Captain</Link>
        </header>

        <section className="mt-7 grid gap-3 md:grid-cols-2">
          {benefits.map(([title, body]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>)}
        </section>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[["Delivery", Package],["Bike", Bike],["Auto", Car],["Cab", Car]].map(([name, Icon]) => { const I=Icon as typeof Bike; return <div key={String(name)} className="rounded-2xl bg-white p-5 shadow-sm"><I className="text-[#075E45]" /><h2 className="mt-3 font-black">{name}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{name === "Delivery" ? "First launch track" : "Activates only after service-specific approval"}</p></div> })}
        </section>

        <section className="mt-7 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex gap-3"><WalletCards className="shrink-0 text-[#075E45]" /><div><h2 className="font-black">Low-fee launch target</h2><p className="mt-2 text-sm leading-6 text-slate-600">The software is being prepared around an 8% platform-fee planning target, with promotional 0% periods possible later. This is not yet a public commercial promise: taxes, insurance, payment, provider and statutory costs must be validated first.</p></div></div>
        </section>

        <section className="mt-4 rounded-3xl bg-amber-50 p-6">
          <div className="flex gap-3"><ShieldCheck className="shrink-0 text-amber-700" /><p className="text-sm leading-6 text-slate-700">Never submit Aadhaar, PAN, driving-licence numbers, RC numbers, bank details or OTPs in a public form. Sensitive verification will use a secured onboarding flow before activation.</p></div>
        </section>
      </div>
    </main>
  );
}
