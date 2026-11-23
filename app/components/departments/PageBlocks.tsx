'use client';

import { useState, type ReactNode } from 'react';
import Link from '@/app/components/DocumentLink';

/** Reusable, data-driven homepage sections for the seven Zeshu departments.
 * No block fabricates an offer, verified provider, checkout or booking.
 */
export function HeroCarousel({slides}:{slides:readonly {title:string;body:string;cta?:string;href?:string}[]}) {
  const [active,setActive]=useState(0);
  if(!slides.length)return null;
  const slide=slides[Math.min(active,slides.length-1)];
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-roledescription="carousel">
    <p className="text-xs font-black uppercase tracking-widest text-[var(--zeshu-dept-accent,#075E45)]">Featured in this department</p>
    <h2 className="mt-2 text-xl font-black">{slide.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{slide.body}</p>
    {slide.href && slide.cta && <Link href={slide.href} className="mt-3 inline-block rounded-xl px-4 py-2 text-sm font-black text-white" style={{backgroundColor:'var(--zeshu-dept-accent,#075E45)'}}>{slide.cta}</Link>}
    {slides.length>1 && <div className="mt-4 flex items-center gap-3">
      <button type="button" onClick={()=>setActive((active+slides.length-1)%slides.length)} aria-label="Previous slide" className="rounded-lg border px-3 py-2 text-xs font-bold">Previous</button>
      <span className="text-xs text-slate-500">{active+1} / {slides.length}</span>
      <button type="button" onClick={()=>setActive((active+1)%slides.length)} aria-label="Next slide" className="rounded-lg border px-3 py-2 text-xs font-bold">Next</button>
    </div>}
  </section>;
}

export function CategoryIconGrid({items}:{items:readonly {label:string;icon:ReactNode;description?:string;href?:string}[]}) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{items.map(item=>{
    const content=<><span className="text-[var(--zeshu-dept-accent,#075E45)]">{item.icon}</span><h3 className="mt-3 text-sm font-black">{item.label}</h3>{item.description&&<p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>}</>;
    const className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
    return item.href?<Link key={item.label} href={item.href} className={className+" hover:border-[var(--zeshu-dept-accent,#075E45)]"}>{content}</Link>:<article key={item.label} className={className}>{content}</article>;
  })}</div>;
}

export function HorizontalDealRail({items}:{items:readonly {id:string;title:string;description:string;href:string;verified:boolean}[]}) {
  // Until a department actually has real verified offers, render nothing.
  const offers=items.filter(item=>item.verified);
  if(!offers.length)return null;
  return <section aria-label="Verified offers" className="mt-5"><h2 className="text-lg font-black">Available offers</h2><div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
    {offers.map(item=><Link href={item.href} key={item.id} className="min-w-60 snap-start rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-black">{item.title}</h3><p className="mt-1 text-xs text-slate-600">{item.description}</p></Link>)}
  </div></section>;
}

export function TwoColumnCatalogGrid({children}:{children:ReactNode}) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

export function PortfolioQuoteCard({title,description,href,verifiedPhotoUrl}:{title:string;description:string;href:string;verifiedPhotoUrl?:string}) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    {verifiedPhotoUrl && <img src={verifiedPhotoUrl} alt={title} loading="lazy" className="mb-3 aspect-[4/3] w-full rounded-xl object-cover"/>}
    <h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    <Link href={href} className="mt-3 inline-flex rounded-xl bg-[var(--zeshu-dept-accent,#075E45)] px-4 py-2 text-xs font-black text-white">Request a free quote</Link>
  </article>;
}

export function FormBookingCard({id,title,description,children}:{id?:string;title:string;description:string;children:ReactNode}) {
  return <section id={id} className="scroll-mt-36 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
    <h2 className="text-2xl font-black">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p>{children}
  </section>;
}
