"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Car, ChevronLeft, ChevronRight, Paintbrush, PartyPopper, Receipt, ShoppingBag, Store } from "lucide-react";
import { useCustomerLanguage } from "@/app/components/CustomerLanguageProvider";

type Readiness = { request_enabled?: boolean; matching_enabled?: boolean; compliance_gate?: boolean };
type Props = { onShopNearby: () => void; onBrowseCatalog: () => void; onOpenServices: () => void; nationwideCheckoutEnabled: boolean };
const ready = (state: Readiness | undefined) => Boolean(state?.request_enabled && state?.matching_enabled && !state?.compliance_gate);

export default function HomeBusinessHub({ onShopNearby, onBrowseCatalog, onOpenServices, nationwideCheckoutEnabled }: Props) {
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
  const go=(next:number)=>{const el=trackRef.current;if(!el)return;const items=Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));const n=(next+items.length)%items.length;el.scrollTo({left:items[n].offsetLeft-el.offsetLeft,behavior:"smooth"});setIndex(n);};

  return <section className="mb-5 px-4 md:px-0" aria-labelledby="zeshu-home-hub-title">
    <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_2px_10px_rgba(15,23,42,.04)] md:block md:px-5">
      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#075E45]"><BadgeCheck size={14}/>{t("One place for everyday needs")}</div>
      <h1 id="zeshu-home-hub-title" className="mt-2 text-[1.35rem] font-black leading-tight tracking-tight text-slate-950 md:text-3xl">{t("Shop, pay, move and get help with Zeshu.")}</h1>
    </div>

    <div className="relative mt-0 md:mt-4">
      <div ref={trackRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto no-scrollbar">
        {slides.map((s,i)=><article key={s.title} data-slide className={`relative min-w-full snap-start overflow-hidden rounded-[28px] ${s.theme} min-h-[270px] px-6 py-7 text-white shadow-[0_12px_30px_rgba(0,65,40,.14)] md:min-h-[310px] md:px-9 md:py-9`}>
          <div className="relative z-10 max-w-[65%] md:max-w-[64%]">
            <span className="rounded-full bg-white/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] ring-1 ring-white/15">Zeshu · {s.scope}</span>
            <h2 className="mt-4 text-[2rem] font-black leading-tight tracking-tight md:mt-5 md:text-5xl">{s.title}</h2><p className="mt-3 text-sm font-medium leading-6 text-white/90 md:text-base">{s.description}</p>
            <div className="mt-3 md:mt-4">
              {s.action==="shop"?<button onClick={onShopNearby} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></button>
              :s.action==="services"?<button onClick={onOpenServices} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></button>
              :s.action==="fashion"?<Link href="/fashion" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>
              :<Link href={s.action==="weddings"?"/professional-services/weddings":s.action==="interiors"?"/professional-services/interiors":"/move"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>}
            </div>
          </div><div className="absolute -right-4 bottom-1 grid h-48 w-40 place-items-center opacity-95 md:right-8 md:bottom-4 md:h-64 md:w-56">{i===0?<img src="/zeshu-bag-logo.svg" alt="" className="h-40 w-32 rotate-[-7deg] object-contain drop-shadow-[0_14px_14px_rgba(0,0,0,.25)] md:h-56 md:w-48"/>:<div className="grid h-28 w-28 place-items-center rounded-3xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-sm md:h-40 md:w-40"><s.icon size={62}/></div>}</div>
        </article>)}
      </div>
      <div className="flex items-center justify-between px-1 py-3"><div className="flex gap-1.5">{slides.map((s,i)=><button key={s.title} onClick={()=>go(i)} aria-label={`Promotion ${i+1}`} className={`h-2 rounded-full ${index===i?"w-6 bg-[#075E45]":"w-2 bg-slate-300"}`}/>)}</div><div className="flex gap-2"><button onClick={()=>go(index-1)} aria-label="Previous promotion" className="grid h-9 w-9 place-items-center rounded-full border bg-white"><ChevronLeft size={17}/></button><button onClick={()=>go(index+1)} aria-label="Next promotion" className="grid h-9 w-9 place-items-center rounded-full border bg-white"><ChevronRight size={17}/></button></div></div>
    </div>

    <div className="mt-4 flex min-h-36 flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-100 bg-[linear-gradient(110deg,#fff_60%,#e9f8ed)] p-5 shadow-[0_6px_24px_rgba(0,50,30,.06)] md:p-7">
      <div><p className="text-sm font-black text-slate-900">{t("Shop products")}</p><p className="mt-1 text-xs text-slate-500">{nationwideCheckoutEnabled?t("Local and eligible India delivery products."):t("Local products and eligible marketplace discovery.")}</p></div>
      <button onClick={onBrowseCatalog} className="rounded-2xl bg-[#006b49] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#004e37]">{t("Browse products")}</button>
    </div>
  </section>;
}
