import GlossyArtwork from "@/app/components/GlossyArtwork";
import Link from "next/link";
import ProfessionalEnquiryForm from "@/app/components/ProfessionalEnquiryForm";
import { ArrowRight, Camera, Flower2, Heart, MapPin, PartyPopper, Utensils } from "lucide-react";

export const metadata={title:"Zeshu Weddings | Plan & Request Quotes",description:"Explore wedding planning services and request quotes through Zeshu as provider coverage becomes available."};
const categories=[["Wedding planners",PartyPopper],["Venues & catering",Utensils],["Decor & flowers",Flower2],["Photography & video",Camera]];
export default function WeddingsPage(){return <main data-zeshu-experience="glossy" className="zeshu-experience min-h-screen bg-rose-50/40"><section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
<Link href="/professional-services" className="text-sm font-black text-[#075E45]">← Zeshu Services</Link>
<div className="zeshu-gloss-hero mt-5 rounded-3xl bg-[linear-gradient(135deg,#6f1d46,#a83265)] p-6 text-white md:p-10">
<GlossyArtwork kind="weddings"/><p className="text-xs font-black uppercase tracking-[.16em] text-white/75">Zeshu Weddings</p><h1 className="mt-2 max-w-3xl text-3xl font-black md:text-5xl">Plan the wedding. Compare the right help.</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-white/85 md:text-base">Tell Zeshu what you need, where the event is and your budget range. Quote requests will be matched only where suitable professionals have actually been onboarded.</p></div>
<div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">{categories.map(([name,Icon])=><div key={String(name)} className="zeshu-gloss-card rounded-2xl border border-rose-100 bg-white p-4">{typeof Icon!=="string"&&<Icon className="text-[#075E45]" size={22}/>}<h2 className="mt-3 text-sm font-black">{name as string}</h2></div>)}</div>
<section className="zeshu-gloss-card mt-6 rounded-3xl border bg-white p-6"><Heart className="text-[#075E45]"/><h2 className="mt-3 text-2xl font-black">Request wedding quotes</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">The first release is enquiry-based while Zeshu onboards professionals. No provider, price, rating or availability is fabricated.</p><ProfessionalEnquiryForm service="WEDDING"/><div className="mt-5 flex flex-wrap gap-3"><Link href="/help" className="inline-flex items-center gap-2 rounded-xl bg-[#075E45] px-5 py-3 text-sm font-black text-white">Contact Zeshu about your wedding <ArrowRight size={16}/></Link><Link href="/partners" className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-black text-slate-800">Are you a wedding professional?</Link></div></section>
<p className="mt-5 text-xs font-semibold text-slate-500"><MapPin size={14} className="mr-1 inline"/>Coverage is shown only where Zeshu has onboarded service providers.</p>
</section></main>}
