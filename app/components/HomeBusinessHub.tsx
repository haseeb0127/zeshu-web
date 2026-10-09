"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Car, ChevronLeft, ChevronRight, Paintbrush, PartyPopper, Receipt, ShoppingBag, Store, Grid2X2 } from "lucide-react";
import { useCustomerLanguage } from "@/app/components/CustomerLanguageProvider";

type Readiness = { request_enabled?: boolean; matching_enabled?: boolean; compliance_gate?: boolean };
type Props = { onShopNearby: () => void; onBrowseCatalog: () => void; onOpenServices: () => void; onSelectCategory: (category: string) => void; nationwideCheckoutEnabled: boolean };
const ready = (state: Readiness | undefined) => Boolean(state?.request_enabled && state?.matching_enabled && !state?.compliance_gate);

export default function HomeBusinessHub({ onShopNearby, onBrowseCatalog, onOpenServices, onSelectCategory, nationwideCheckoutEnabled }: Props) {
  const { t } = useCustomerLanguage();
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
    { scope:"Jagtial", title:t("Shop in Jagtial"), description:t("Groceries and everyday essentials from nearby sellers."), cta:t("Shop now"), action:"shop", icon:ShoppingBag, theme:"bg-[linear-gradient(135deg,#063f31,#0a7654)]" },
    { scope:"India", title:"Zeshu Fashion", description:t("Clothing, footwear and accessories when real seller stock is available."), cta:t("Explore fashion"), action:"fashion", icon:ShoppingBag, theme:"bg-[linear-gradient(135deg,#5b214f,#b0578f)]" },
    { scope:"India", title:"Zeshu Pay", description:t("Mobile, DTH and bill services supported by available providers."), cta:t("Explore services"), action:"services", icon:Receipt, theme:"bg-[linear-gradient(135deg,#6b430d,#cf851d)]" },
    { scope:"India", title:"Zeshu Weddings", description:t("Plan celebrations and request quotes from suitable service providers."), cta:t("Explore weddings"), action:"weddings", icon:PartyPopper, theme:"bg-[linear-gradient(135deg,#71234c,#c55b7d)]" },
    { scope:"India", title:"Zeshu Interiors", description:t("Discover interior design services and request a quote."), cta:t("Explore interiors"), action:"interiors", icon:Paintbrush, theme:"bg-[linear-gradient(135deg,#304a41,#779d78)]" },
    { scope:"Telangana", title:"Zeshu Move", description:t("Check rides and courier availability for your area."), cta:anyMoveReady?t("Check availability"):t("See services"), action:"move", icon:Car, theme:"bg-[linear-gradient(135deg,#123c4a,#23839a)]" },
  ];
  const onScroll=()=>{const el=trackRef.current;if(!el)return;const items=Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));let closest=0,dist=Infinity;items.forEach((item,i)=>{const delta=Math.abs(item.offsetLeft-el.offsetLeft-el.scrollLeft);if(delta<dist){dist=delta;closest=i}});setIndex(closest)};
  const go=(next:number)=>{const el=trackRef.current;if(!el)return;const items=Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));const n=(next+items.length)%items.length;el.scrollTo({left:items[n].offsetLeft-el.offsetLeft,behavior:"smooth"});setIndex(n);};

  return <section className="zeshu-premium-home mb-5 px-4 md:px-0" aria-labelledby="zeshu-home-hub-title">
    <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_2px_10px_rgba(15,23,42,.04)] md:block md:px-5">
      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#075E45]"><BadgeCheck size={14}/>{t("One place for everyday needs")}</div>
      <h1 id="zeshu-home-hub-title" className="mt-2 text-[1.35rem] font-black leading-tight tracking-tight text-slate-950 md:text-3xl">{t("Shop, pay, move and get help with Zeshu.")}</h1>
    </div>

    <nav aria-label="Explore Zeshu departments" className="zeshu-premium-departments mb-5 grid grid-cols-5 gap-2 md:hidden">{[{label:t("Shop"),icon:ShoppingBag,action:onShopNearby,style:"bg-emerald-50 text-emerald-700"},{label:"Fashion",icon:ShoppingBag,href:"/fashion",style:"bg-pink-50 text-pink-600"},{label:"Pay",icon:Receipt,action:onOpenServices,style:"bg-blue-50 text-blue-600"},{label:"Move",icon:Car,href:"/move",style:"bg-orange-50 text-orange-600"},{label:"Services",icon:Grid2X2,href:"/professional-services",style:"bg-purple-50 text-purple-600"}].map(item=><div key={item.label} className="min-w-0 text-center">{'href' in item&&item.href?<Link href={item.href} className={`zeshu-premium-department mx-auto flex h-14 w-full items-center justify-center rounded-2xl ${item.style}`}><item.icon size={26} aria-hidden="true"/></Link>:<button type="button" onClick={item.action} className={`mx-auto flex h-14 w-full items-center justify-center rounded-2xl ${item.style}`}><item.icon size={26} aria-hidden="true"/></button>}<span className="mt-1 block text-[11px] font-bold text-slate-800">{item.label}</span></div>)}</nav>
    <div className="relative mt-0 md:mt-4">
      <div ref={trackRef} onScroll={onScroll} className="flex snap-x snap-mandatory gap-3 overflow-x-auto no-scrollbar scroll-smooth">
        {slides.map((s,i)=><article key={s.title} data-slide className={`zeshu-premium-hero relative isolate min-w-full snap-start overflow-hidden rounded-[28px] ${s.theme} min-h-[350px] px-6 py-8 text-white shadow-[0_22px_55px_rgba(0,65,40,.28)] ring-1 ring-emerald-100/50 md:min-h-[350px] md:px-9 md:py-9`}>
          {i===0&&<><div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,.18)_0%,transparent_27%,transparent_57%,rgba(255,255,255,.08)_73%,transparent_86%)]"/><div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_88%_25%,rgba(120,255,151,.35),transparent_43%),linear-gradient(110deg,rgba(0,31,24,.52)_10%,transparent_76%)]"/><div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl"/><div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent"/></>}
          <div className="relative z-10 max-w-[62%] md:max-w-[60%]">
            <span className="rounded-full bg-white/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] ring-1 ring-white/15">Zeshu · {s.scope}</span>
            <h2 className="mt-5 text-[2.15rem] font-black leading-[1.12] tracking-tight md:mt-5 md:text-5xl">{s.title}</h2><p className="mt-4 text-sm font-medium leading-6 text-white/95 md:text-base">{s.description}</p>
            <div className="mt-3 md:mt-4">
              {s.action==="shop"?<button onClick={onShopNearby} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-900 shadow-[0_10px_25px_rgba(0,0,0,.14)]">{s.cta}<ChevronRight size={15}/></button>
              :s.action==="services"?<button onClick={onOpenServices} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></button>
              :s.action==="fashion"?<Link href="/fashion" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>
              :<Link href={s.action==="weddings"?"/professional-services/weddings":s.action==="interiors"?"/professional-services/interiors":"/move"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>}
            </div>
          </div><div className="absolute -right-5 bottom-0 grid h-56 w-44 place-items-center opacity-100 md:right-8 md:bottom-1 md:h-72 md:w-64">{i===0?<img src="/zeshu-grocery-hero.svg" alt="" className="h-56 w-48 object-contain drop-shadow-[0_25px_24px_rgba(0,0,0,.48)] md:h-72 md:w-64"/>:<div className="grid h-28 w-28 place-items-center rounded-3xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-sm md:h-40 md:w-40"><s.icon size={62}/></div>}</div>
        </article>)}
      </div>
      <div className="flex items-center justify-between px-1 py-3"><div className="flex gap-1.5">{slides.map((s,i)=><button key={s.title} onClick={()=>go(i)} aria-label={`Promotion ${i+1}`} className={`h-2 rounded-full ${index===i?"w-6 bg-[#075E45]":"w-2 bg-slate-300"}`}/>)}</div><div className="flex gap-2"><button onClick={()=>go(index-1)} aria-label="Previous promotion" className="grid h-9 w-9 place-items-center rounded-full border bg-white"><ChevronLeft size={17}/></button><button onClick={()=>go(index+1)} aria-label="Next promotion" className="grid h-9 w-9 place-items-center rounded-full border bg-white"><ChevronRight size={17}/></button></div></div>
    </div>

    <div className="zeshu-premium-shop-card relative mt-4 flex min-h-40 flex-wrap items-center justify-between gap-3 overflow-hidden rounded-[26px] border border-slate-100 bg-[linear-gradient(110deg,#fff_60%,#e9f8ed)] p-5 pr-24 shadow-[0_6px_24px_rgba(0,50,30,.06)] md:p-7 md:pr-48">
      <div><p className="text-xl font-black text-slate-900">{t("Shop products")}</p><p className="mt-1 text-sm text-slate-500">{nationwideCheckoutEnabled?t("Local and eligible India delivery products."):t("Local products and eligible marketplace discovery.")}</p></div>
      <img src="/zeshu-grocery-hero.svg" alt="" className="pointer-events-none absolute -bottom-10 -right-7 h-44 w-40 object-contain opacity-95 md:-bottom-16 md:right-2 md:h-56 md:w-48" />
      <button onClick={onBrowseCatalog} className="relative z-10 rounded-2xl bg-[#006b49] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#004e37]">{t("Browse products")}</button>
    </div>
    <div className="mt-4 grid grid-cols-5 gap-1.5 md:gap-4" aria-label="Shop popular categories">{[{label:"Groceries",category:"All",emoji:"🛒",tone:"from-[#eaf7e9] to-white"},{label:"Fruits & Vegetables",category:"Fruits",emoji:"🍎",tone:"from-[#fff3e5] to-white"},{label:"Dairy",category:"Dairy",emoji:"🥛",tone:"from-[#eff8ff] to-white"},{label:"Snacks",category:"Snacks",emoji:"🍿",tone:"from-[#fff4e7] to-white"},{label:"Drinks",category:"Drinks",emoji:"🥤",tone:"from-[#edf6ff] to-white"}].map(item=><button key={item.label} type="button" onClick={()=>onSelectCategory(item.category)} className={`zeshu-premium-category flex min-w-0 flex-col items-center rounded-[22px] border border-white bg-gradient-to-b ${item.tone} px-1 py-3 text-center shadow-[0_5px_18px_rgba(16,24,40,.07)] transition active:scale-95 md:py-5`}><span aria-hidden="true" className="grid h-16 w-full place-items-center text-4xl drop-shadow-[0_6px_8px_rgba(0,0,0,.13)] md:h-24 md:text-6xl">{item.emoji}</span><span className="mt-2 text-[10px] font-extrabold leading-tight text-slate-900 sm:text-xs md:text-sm">{item.label}</span></button>)}</div>
  </section>;
}
