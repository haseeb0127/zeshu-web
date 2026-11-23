import type { Metadata } from 'next';
import Link from '@/app/components/DocumentLink';
import GlossyArtwork from '@/app/components/GlossyArtwork';
import HomeServiceQuoteForm from '@/app/components/HomeServiceQuoteForm';
import HomeServicesMenuCatalog from '@/app/components/HomeServicesMenuCatalog';
import HomeServicePlansPreview from '@/app/components/HomeServicePlansPreview';
import { HOME_SERVICE_CATEGORIES, HOME_SERVICE_HELD_CATEGORIES } from '@/app/lib/home-services-categories';
import { ArrowRight, BadgeCheck, ClipboardCheck, House, ShieldAlert, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Zeshu Home Services | Jagtial Repairs & Beauty Enquiries',
  description: 'Ask about electrician, plumber, AC, RO repairs and beauty appointments in Jagtial. Manual quote enquiries only. No unverified bookings or charges.',
  alternates: { canonical: '/professional-services/home-services' },
};

export default function HomeServicesPage() {
  return <main data-zeshu-experience="glossy" className="zeshu-experience min-h-screen bg-[#f6faf7] text-slate-950">
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <Link href="/professional-services" className="text-sm font-black text-[#075E45]">← Zeshu Services</Link>
      <header className="zeshu-gloss-hero mt-5 overflow-hidden rounded-3xl bg-[#064934] p-6 text-white md:p-10">
        <GlossyArtwork kind="services"/>
        <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-200">Zeshu Home Services · Jagtial pilot</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black md:text-5xl">Find the right help for your home.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/85">Get an enquiry reviewed for repairs, maintenance, salon appointments or event beauty services. Zeshu does not promise verified professionals, immediate availability or a fixed visiting price until real providers are approved.</p>
        <a href="#home-quote" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#075E45]">Request a free enquiry <ArrowRight size={16}/></a>
      </header>

      <section className="mt-6" aria-label="Home service categories">
        <h2 className="text-xl font-black">Services currently accepting enquiries</h2>
        <p className="mt-1 text-sm text-slate-600">These are quote categories, not an available-technician or instant-booking list.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {HOME_SERVICE_CATEGORIES.map(item => <a href={`#service-${item.code.toLowerCase()}`} key={item.code} className="block rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <Wrench size={20} className="text-[#075E45]"/>
            <h3 className="mt-3 text-sm font-black">{item.label}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
            <p className="mt-2 text-[10px] font-bold text-[#075E45]">Quote enquiry only · explore scope</p>
          </a>)}
        </div>
      </section>

      <HomeServicesMenuCatalog />

      <section className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Customer protection">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <ClipboardCheck size={21} className="text-[#075E45]"/>
          <h2 className="mt-2 font-black">Written quote first</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">The provider must disclose any visit fee, labour, parts, taxes and applicable adjustment before a customer accepts. ₹99 is not a confirmed standard price.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <BadgeCheck size={21} className="text-[#075E45]"/>
          <h2 className="mt-2 font-black">Verification is earned</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">No provider is displayed as verified until Zeshu has completed the relevant identity, skills, reference and safety review. Enquiries do not automatically assign a worker.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <House size={21} className="text-[#075E45]"/>
          <h2 className="mt-2 font-black">Safe home visits</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">Customers may request preferred appointment arrangements. Confirm worker identity on arrival, never share OTPs or door codes, and contact support if the person or charges differ.</p>
        </div>
      </section>

      <section id="home-quote" className="mt-6 scroll-mt-16 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm md:p-8">
        <h2 className="text-2xl font-black">Request a home-service quote</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Jagtial enquiries are free. A Zeshu administrator can review your request and contact you if a suitable professional becomes available. An accepted quotation, safety checks and clear cancellation/refund terms are required before any future booking.</p>
        <HomeServiceQuoteForm />
      </section>

      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <ShieldAlert className="text-amber-800"/>
        <h2 className="mt-2 font-black text-amber-950">Services held pending extra safeguarding</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">These are not presently offered for booking or placement. Child-related and long-term household work needs stronger legal, reference, police/background and safeguarding controls; online teaching involving children is not risk-free.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOME_SERVICE_HELD_CATEGORIES.map(item => <span key={item} className="rounded-full border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950">{item}</span>)}
        </div>
      </section>

      <section id="provider-plans" className="scroll-mt-36"><HomeServicePlansPreview /></section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Are you a local service professional?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Zeshu is welcoming interest from electricians, plumbers, AC/RO technicians, salons, beauticians, mehndi and makeup artists. Provider registration and review are free during the pilot. You can submit your own service rate card and travel zone for private review. Proposed ₹299/month, ₹15/₹50 qualified lead and ₹200 credit-pack models are not being charged or activated.</p>
        <p className="mt-2 text-xs text-slate-600">Before activation, Zeshu must verify the provider's relevant credentials and serviceability. Paid plans will require separately accepted terms, fair lead definitions, GST invoices, refunds and cancellation rules.</p>
        <Link href="/partners?type=HOME_SERVICE_PRO#partner-apply" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#075E45] px-4 py-3 text-xs font-black text-white">Register partnership interest <ArrowRight size={16}/></Link>
      </section>
    </div>
  </main>;
}
