import Link from "next/link";
import { ArrowRight, Building2, HeartHandshake, Home, Paintbrush, PartyPopper, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Zeshu Services | Weddings & Interiors",
  description: "Explore wedding and interior services on Zeshu and request quotes as provider coverage becomes available.",
};

const services = [
  { href:"/professional-services/weddings", title:"Zeshu Weddings", eyebrow:"Wedding planning", description:"Plan your celebration and request help for planners, venues, catering, decor, photography, makeup and more.", icon:PartyPopper, items:["Wedding planners","Venues & catering","Decor & photography","Makeup & mehendi"] },
  { href:"/professional-services/interiors", title:"Zeshu Interiors", eyebrow:"Home & business interiors", description:"Share your space, requirements and budget range, then request quotes from suitable professionals as coverage becomes available.", icon:Paintbrush, items:["Full interiors","Modular kitchens","Wardrobes & furniture","Painting & renovation"] },
];

export default function ProfessionalServicesPage() {
 return <main data-zeshu-experience="glossy" className="zeshu-experience "min-h-screen bg-slate-50 text-slate-950"><section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
  <Link href="/" className="text-sm font-black text-[#075E45]">← Back to Zeshu</Link>
  <div className="zeshu-gloss-hero mt-5 rounded-3xl bg-[#075E45] p-6 text-white md:p-10"><p className="text-xs font-black uppercase tracking-[.16em] text-white/75">Zeshu Services</p><h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Get help for important projects, without guessing who to contact.</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-white/85 md:text-base">Start with Weddings and Interiors. Zeshu shows service categories and quote-request options without inventing provider availability, prices, ratings or verification.</p></div>
  <div className="mt-6 grid gap-4 md:grid-cols-2">{services.map(service=><Link key={service.href} href={service.href} className="zeshu-gloss-card group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200"><service.icon size={30} className="text-[#075E45]"/><p className="mt-4 text-xs font-black uppercase tracking-[.14em] text-[#075E45]">{service.eyebrow}</p><h2 className="mt-1 text-2xl font-black">{service.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p><div className="mt-4 flex flex-wrap gap-2">{service.items.map(item=><span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">{item}</span>)}</div><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#075E45]">Explore service <ArrowRight size={16}/></span></Link>)}</div>
  <section className="mt-6 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><ShieldCheck className="text-[#075E45]"/><h2 className="mt-3 font-black">Truthful availability</h2><p className="mt-1 text-sm leading-6 text-slate-600">Providers are shown as available or verified only when Zeshu has supporting provider data.</p></div><div className="rounded-2xl border bg-white p-5"><HeartHandshake className="text-[#075E45]"/><h2 className="mt-3 font-black">Compare before booking</h2><p className="mt-1 text-sm leading-6 text-slate-600">Start from your requirements and quotes instead of being forced into a package.</p></div><div className="rounded-2xl border bg-white p-5"><Building2 className="text-[#075E45]"/><h2 className="mt-3 font-black">Professional marketplace</h2><p className="mt-1 text-sm leading-6 text-slate-600">Zeshu provides discovery and enquiries; professionals perform the actual service.</p></div></section>
  <p className="mt-6 text-center text-xs text-slate-500"><Home size={14} className="mr-1 inline"/>Service coverage depends on customer location and onboarded professionals.</p>
 </section></main>;
}
