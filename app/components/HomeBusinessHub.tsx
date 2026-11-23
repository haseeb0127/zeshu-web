"use client";

import Link from "@/app/components/DocumentLink";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Car, ChevronLeft, ChevronRight, Paintbrush, PartyPopper, Receipt, ShoppingBag, ShoppingBasket, CreditCard, CarFront, Grid2X2, Bot, Sparkles, ArrowUpRight } from "lucide-react";
import ReferenceArtwork from "@/app/components/ReferenceArtwork";
import GlossyArtwork from "@/app/components/GlossyArtwork";
import DineBannerArtwork from "@/app/components/DineBannerArtwork";
import { useCustomerLanguage } from "@/app/components/CustomerLanguageProvider";

type Readiness = { request_enabled?: boolean; matching_enabled?: boolean; compliance_gate?: boolean };
type Props = { onShopNearby: () => void; onBrowseCatalog: () => void; onOpenServices: () => void; onSelectCategory: (category: string) => void; nationwideCheckoutEnabled: boolean; categoryProductCounts?: Record<string, number> };
const ready = (state: Readiness | undefined) => Boolean(state?.request_enabled && state?.matching_enabled && !state?.compliance_gate);

export default function HomeBusinessHub({ onShopNearby, onBrowseCatalog, onOpenServices, onSelectCategory, nationwideCheckoutEnabled, categoryProductCounts = {} }: Props) {
  const { t, language } = useCustomerLanguage();
  const [moveServices, setMoveServices] = useState<Record<string, Readiness>>({});
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    void fetch("/api/move/matching/readiness", { cache: "no-store" }).then(r => r.json()).then(p => {
      if (active) setMoveServices(p?.services && typeof p.services === "object" ? p.services : {});
    }).catch(() => { if (active) setMoveServices({}); });
    return () => { active = false; };
  }, []);

  const anyMoveReady = [moveServices.AUTO_DRIVER, moveServices.CAB_DRIVER, moveServices.BIKE_COURIER, moveServices.GOODS_DRIVER].some(ready);
  const slides = [
    { scope:"Jagtial", title:t("Shop in Jagtial"), description:t("Groceries and everyday essentials from nearby sellers."), cta:t("Shop now"), action:"shop", poster:"shop", icon:ShoppingBag, theme:"bg-[#044c37]" },
    { scope:"Jagtial", title:t("Zeshu Dine"), description:t("Table reservations and meal pre-orders after restaurant verification. Kitchen-confirmed serving times."), cta:t("Explore dining"), action:"dine", poster:"dine", icon:ShoppingBag, theme:"bg-[#4a2810]" },
    { scope:"India", title:t("Zeshu Fashion"), description:t("Explore clothing and accessories from independent sellers where stock is available."), cta:t("Explore fashion"), action:"fashion", poster:"fashion", icon:ShoppingBag, theme:"bg-[#074734]" },
    { scope:"India", title:t("Zeshu Pay"), description:t("Explore recharge and bill services supported by available providers."), cta:t("Explore Zeshu Pay"), action:"pay", poster:"pay", icon:Receipt, theme:"bg-[#074734]" },
    { scope:"Telangana", title:t("Zeshu Move"), description:t("Explore driver availability or request scheduled district transport quotes."), cta:anyMoveReady?t("Check availability"):t("See services"), action:"move", poster:"move", icon:Car, theme:"bg-[#074734]" },
    { scope:"India", title:t("Zeshu Services"), description:t("Discover eligible services and request quotations."), cta:t("Explore services"), action:"services", poster:"services", icon:Grid2X2, theme:"bg-[#074734]" },
    { scope:"India", title:t("Zeshu Weddings"), description:t("Plan celebrations and request quotes from suitable service providers."), cta:t("Explore weddings"), action:"weddings", poster:"weddings", icon:PartyPopper, theme:"bg-[#074734]" },
    { scope:"India", title:t("Zeshu Interiors"), description:t("Discover interior design services and request a quote."), cta:t("Explore interiors"), action:"interiors", poster:"interiors", icon:Paintbrush, theme:"bg-[#074734]" },
    { scope:"India", title:t("Customer Service"), description:t("Get help with orders, payments, delivery and your account."), cta:t("Get help"), action:"support", poster:"support", icon:Bot, theme:"bg-[#074734]" },
    { scope:"India", title:t("Zeshu App"), description:t("Shop, fashion, pay, move and services in one convenient app."), cta:t("Open app"), action:"app", poster:"app", icon:ShoppingBag, theme:"bg-[#074734]" },
  ];
  const onScroll=()=>{const el=trackRef.current;if(!el)return;const items=Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));let closest=0,dist=Infinity;items.forEach((item,i)=>{const delta=Math.abs(item.offsetLeft-el.offsetLeft-el.scrollLeft);if(delta<dist){dist=delta;closest=i}});setIndex(closest)};
  const go=(next:number)=>{const el=trackRef.current;if(!el)return;const items=Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));const n=(next+items.length)%items.length;el.scrollTo({left:items[n].offsetLeft-el.offsetLeft,behavior:"smooth"});setIndex(n);};


  return <section className="zeshu-premium-home mb-5 px-2.5 md:px-0" aria-labelledby="zeshu-home-hub-title">
    <div className="sr-only">
      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#075E45]"><BadgeCheck size={14}/>{t("One place for everyday needs")}</div>
      <h1 id="zeshu-home-hub-title" className="mt-2 text-[1.35rem] font-black leading-tight tracking-tight text-slate-950 md:text-3xl">{t("Shop, pay, move and get help with Zeshu.")}</h1>
    </div>

    <div className="mb-2 rounded-2xl border border-emerald-100 bg-white/90 p-2.5 shadow-[0_4px_12px_rgba(8,65,35,.05)] md:p-4" data-zeshu-hub="honest-service-status">
      <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#075E45] md:text-sm">{t("Everyday essentials & services")}</p>
      <nav aria-label="Explore everyday Zeshu departments" className="grid grid-cols-5 gap-1.5 md:gap-4">
        {[
          {label:t("Shop"), icon:ShoppingBasket, action:onShopNearby, status:t("Shop"), tone:"bg-[#e7f5e9] text-[#0a8547]"},
          {label:t("Meat & Fish"), icon:ShoppingBag, action:()=>document.getElementById("zeshu-meat-fish")?.scrollIntoView({behavior:"smooth",block:"start"}), status:t("Explore"), tone:"bg-[#fff0f0] text-[#ba433c]"},
          {label:t("Dine"), icon:ShoppingBag, href:"/dine", status:t("Explore"), tone:"bg-[#fff3e4] text-[#b66b16]"},
          {label:t("Pay"), icon:CreditCard, href:"/pay", status:t("Plans only"), tone:"bg-[#e9f1ff] text-[#1466ec]"},
          {label:t("Move"), icon:CarFront, href:"/move", status:anyMoveReady?t("Check availability"):t("Quote requests"), tone:"bg-[#fff2e8] text-[#ef790e]"}
        ].map(item => <div key={item.label} className="min-w-0 text-center">
          {'href' in item && item.href
            ? <Link href={item.href} className={`zeshu-premium-department mx-auto flex h-[49px] w-full items-center justify-center rounded-[17px] ${item.tone} md:h-16`} aria-label={item.label}><item.icon size={27} strokeWidth={2.5} aria-hidden="true"/></Link>
            : <button type="button" onClick={item.action} className={`zeshu-premium-department mx-auto flex h-[49px] w-full items-center justify-center rounded-[17px] ${item.tone} md:h-16`} aria-label={item.label}><item.icon size={27} strokeWidth={2.5} aria-hidden="true"/></button>}
          <span className="mt-1 block truncate text-[10px] font-extrabold leading-4 text-[#171b2d] md:text-sm">{item.label}</span>
          <span className="block truncate text-[8.5px] font-semibold text-slate-500 md:text-xs">{item.status}</span>
        </div>)}
      </nav>
      <p className="mb-2 mt-4 text-[11px] font-black uppercase tracking-wider text-[#075E45] md:text-sm">{t("Quotes & Local Pros")}</p>
      <nav aria-label="Explore professional quotes and fashion" className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
        {[
          {label:t("Weddings"), href:"/professional-services/weddings", icon:PartyPopper, status:t("Get a quote"), tone:"bg-[#fff2eb] text-[#b95b31]"},
          {label:t("Interiors"), href:"/professional-services/interiors", icon:Paintbrush, status:t("Get a quote"), tone:"bg-[#eff5ee] text-[#397149]"},
          {label:t("Home Services"), href:"/professional-services/home-services", icon:Grid2X2, status:t("Enquire only"), tone:"bg-[#e8f5fc] text-[#156f90]"},
          {label:t("Fashion"), href:"/fashion", icon:ShoppingBag, status:t("Explore listings"), tone:"bg-[#fff0f4] text-[#cb3370]"}
        ].map(item => <Link key={item.href} href={item.href} className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e8eee7] bg-white p-2 text-left shadow-sm md:px-4 md:py-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.tone} md:h-11 md:w-11`}><item.icon size={19} aria-hidden="true"/></span>
          <span className="min-w-0"><span className="block truncate text-[11px] font-black text-[#171b2d] md:text-sm">{item.label}</span><span className="block truncate text-[9px] font-medium text-slate-500 md:text-xs">{item.status}</span></span>
        </Link>)}
      </nav>
    </div>

    <div className="relative mt-0 md:mt-4">
      <div ref={trackRef} onScroll={onScroll} className="flex snap-x snap-mandatory gap-3 overflow-x-auto no-scrollbar scroll-smooth">
        {slides.map((s,i) => <article key={s.title} data-slide data-glossy-banner={s.poster} className={`zeshu-premium-hero relative isolate min-w-full snap-start overflow-hidden rounded-[24px] ${s.theme} h-[245px] min-h-[245px] px-5 py-4 text-white shadow-[0_12px_26px_rgba(0,65,40,.16)] md:min-h-[350px] md:rounded-[30px] md:px-9 md:py-9`}>
          {s.poster==="dine" ? <DineBannerArtwork/> : <GlossyArtwork kind={s.poster as "shop"|"fashion"|"pay"|"move"|"services"|"weddings"|"interiors"|"support"|"app"} loading={i===0?"eager":"lazy"}/>}
          {/* The full glossy promotion is tappable, including the illustration.
              Use document links to avoid the reproduced Next.js Android navigation crash. */}
          {s.action==="shop"
            ? <button type="button" aria-label="Open Zeshu Shop" onClick={onShopNearby}
                className="absolute inset-0 z-[1] cursor-pointer rounded-[24px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-white"/>
              : <Link href={s.action==="weddings"?"/weddings":s.action==="interiors"?"/interiors":s.action==="services"?"/services":s.action==="pay"?"/pay":s.action==="support"?"/help":s.action==="app"?"/app":s.action==="fashion"?"/fashion":s.action==="dine"?"/dine":"/move"}
                aria-label={`Open ${s.title}`} className="absolute inset-0 z-[1] cursor-pointer rounded-[24px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-white"><span className="sr-only">{s.title}</span></Link>}
          <div className="pointer-events-none relative z-10 max-w-[62%] md:max-w-[60%]">
            <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.15em] ring-1 ring-white/10 md:text-[11px]">Zeshu · {s.scope}</span>
            <h2 className="mt-2 text-[34px] font-black leading-[1.04] tracking-tight md:mt-5 md:text-5xl">
              {i===0 && language==='en' ? <><span className="block">Shop in</span>{" "}<span className="block text-[#a6eb4a]">Jagtial</span></> : s.title}
            </h2>
            <p className="mt-2.5 max-w-[165px] text-[11.5px] font-semibold leading-[1.45] text-white/95 md:mt-4 md:max-w-none md:text-base">{s.description}</p>
            <div className="pointer-events-none mt-3 md:mt-5">
              {s.action==="shop" ? <button onClick={onShopNearby} className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-[18px] bg-white px-5 text-xs font-black text-[#142034] shadow-[0_8px_16px_rgba(0,0,0,.14)] md:min-h-11 md:text-sm">{s.cta}<ChevronRight size={16}/></button>
                :s.action==="pay" ? <Link href="/pay" className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>
                :s.action==="fashion" ? <Link href="/fashion" className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>
                :<Link href={s.action==="weddings"?"/professional-services/weddings":s.action==="interiors"?"/professional-services/interiors":s.action==="services"?"/professional-services":s.action==="support"?"/help":s.action==="app"?"/app":s.action==="dine"?"/dine":"/move"} className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>}
            </div>
          </div>
          <span className="pointer-events-none absolute bottom-1.5 right-2 z-[2] rounded-full bg-[#003b2a]/65 px-2 py-0.5 text-[8px] font-semibold text-white/95 md:text-[10px]">Illustrative artwork</span>
        </article>)}
      </div>
      <div className="flex items-center justify-between px-1 py-2 md:py-3">
        <div className="flex gap-[5px]">{slides.map((s,i)=><button type="button" key={s.title} onClick={()=>go(i)} aria-label={`Promotion ${i+1}`} aria-current={index===i?'true':undefined} className={`h-[7px] rounded-full transition-all ${index===i?"w-[22px] bg-[#075E45]":"w-[7px] bg-[#d4d9e3]"}`}/>)}</div>
        <div className="flex gap-2">
          <button type="button" onClick={()=>go(index-1)} aria-label="Previous promotion" className="grid h-[34px] w-[34px] place-items-center rounded-full border-[1.5px] border-[#253447] bg-white text-[#182336]"><ChevronLeft size={21}/></button>
          <button type="button" onClick={()=>go(index+1)} aria-label="Next promotion" className="grid h-[34px] w-[34px] place-items-center rounded-full border-[1.5px] border-[#253447] bg-white text-[#182336]"><ChevronRight size={21}/></button>
        </div>
      </div>
    </div>

    <div className="zeshu-premium-shop-card relative mt-1.5 flex h-[117px] min-h-[117px] items-center overflow-hidden rounded-[24px] border border-[#f1f4f0] bg-[linear-gradient(100deg,#fff_55%,#f3f8ef)] px-5 py-2 shadow-[0_6px_22px_rgba(16,24,40,.07)] md:mt-4 md:min-h-44 md:px-7 md:py-7">
      <div className="relative z-10 max-w-[61%]">
        <p className="text-[21px] font-black leading-6 tracking-tight text-[#151a2c] md:text-2xl">{t("Shop products")}</p>
        <p className="mt-1 text-[11px] font-medium leading-[1.35] text-[#677083] md:text-sm">{nationwideCheckoutEnabled?t("Local and eligible India delivery products."):t("Local products and eligible marketplace discovery.")}</p>
        <button onClick={onBrowseCatalog} className="mt-2 inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#007849] px-3 text-[11px] font-black text-white shadow-[0_5px_13px_rgba(0,95,55,.15)] md:mt-4 md:px-5 md:py-3 md:text-sm">{t("Browse products")}<ChevronRight size={15}/></button>
      </div>
      <ReferenceArtwork slice="basket" className="pointer-events-none absolute bottom-0 right-0 h-[117px] w-[35%] md:h-44 md:w-[35%]" />
    </div>

    <div className="mt-2.5 grid grid-cols-5 gap-1 md:mt-4 md:gap-4" aria-label="Shop popular categories">
      {[
        { label:"Groceries",category:"All",slice:"grocery" },
        { label:"Fruits & Vegetables",category:"Fruits",slice:"fruit" },
        { label:"Dairy",category:"Dairy",slice:"dairy" },
        { label:"Snacks",category:"Snacks",slice:"snacks" },
        { label:"Drinks",category:"Drinks",slice:"drinks" }
      ].map(item => <button key={item.label} type="button" onClick={()=>onSelectCategory(item.category)} className="zeshu-premium-category flex min-w-0 flex-col items-center overflow-hidden rounded-[17px] border border-[#f0f1f0] bg-white px-0.5 pb-2.5 pt-1.5 text-center shadow-[0_3px_11px_rgba(17,24,39,.075)] transition active:scale-[.98] md:rounded-[22px] md:py-5">
        <ReferenceArtwork slice={item.slice as "grocery"|"fruit"|"dairy"|"snacks"|"drinks"} className="h-[56px] w-full md:h-24" />
        <span className="mt-1 block min-h-[28px] text-[10px] font-extrabold leading-[1.25] text-[#1c2537] md:text-sm">{t(item.label)}</span>
      </button>)}
    </div>
    <section id="zeshu-meat-fish" className="mt-3 rounded-[22px] border border-emerald-100 bg-[linear-gradient(115deg,#f5fbf6,#ffffff)] p-3 shadow-[0_3px_12px_rgba(17,24,39,.045)] md:mt-5 md:p-5" aria-label={t("Fresh meat & fish")}>
      <div className="flex flex-wrap items-end justify-between gap-1.5">
        <h3 className="text-[15px] font-black tracking-tight text-[#153d2a] md:text-xl">{t("Fresh meat & fish")}</h3>
        <p className="text-[10px] font-semibold text-slate-500 md:text-xs">{t("Jagtial only · Verified sellers and safe delivery required")}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 md:gap-4">
        {[
          { id: "Chicken", icon: "🍗" },
          { id: "Mutton", icon: "🥩" },
          { id: "Fish & Seafood", icon: "🐟" },
        ].map(item => {
          const hasProducts = Number(categoryProductCounts[item.id] || 0) > 0;
          return <button key={item.id} type="button" onClick={() => onSelectCategory(item.id)} aria-label={t(item.id)}
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-[#e6eee8] bg-white px-1.5 py-3 text-center shadow-[0_3px_10px_rgba(17,24,39,.04)] transition hover:border-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 active:scale-[.98] md:py-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f1f8f2] text-[28px] md:h-16 md:w-16 md:text-4xl" aria-hidden="true">{item.icon}</span>
            <span className="text-[11px] font-black leading-4 text-[#1d2934] md:text-sm">{t(item.id)}</span>
            <span className={`text-[9px] font-semibold md:text-xs ${hasProducts ? "text-emerald-700" : "text-amber-700"}`}>{hasProducts ? t("Browse products") : t("Opening soon")}</span>
          </button>;
        })}
      </div>
    </section>
    <button type="button" data-zeshu-home-assistant="true" onClick={()=>window.dispatchEvent(new Event("zeshu:open-assistant"))}
     className="zeshu-gloss-card group mt-3 flex w-full items-center gap-3 rounded-[22px] border border-emerald-100 bg-white px-3.5 py-3 text-left shadow-md md:mt-5 md:px-5 md:py-4">
      <span className="zeshu-gloss-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"><Bot size={25}/></span>
      <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-sm font-black text-[#075e45]"><Sparkles size={15}/>{t("Ask Zeshu Assistant")}</span><span className="mt-1 block text-[11px] font-medium text-slate-600">{t("Shopping, orders, services and support")}</span></span>
      <ArrowUpRight size={20} className="shrink-0 text-[#075e45]"/>
    </button>
  </section>;
}
