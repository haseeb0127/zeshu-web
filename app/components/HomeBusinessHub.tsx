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
        {slides.map((s,i)=><article key={s.title} data-slide className={`relative min-w-full snap-start overflow-hidden rounded-2xl ${s.theme} px-5 py-4 text-white md:px-7 md:py-7`}>
          <div className="max-w-[78%] md:max-w-[68%]">
            <span className="rounded-full bg-white/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] ring-1 ring-white/15">Zeshu · {s.scope}</span>
            <h2 className="mt-2 text-2xl font-black md:mt-3 md:text-4xl">{s.title}</h2><p className="mt-2 text-xs font-semibold leading-5 text-white/85 md:text-sm">{s.description}</p>
            <div className="mt-3 md:mt-4">
              {s.action==="shop"?<button onClick={onShopNearby} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></button>
              :s.action==="services"?<button onClick={onOpenServices} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></button>
              :s.action==="fashion"?<Link href="/fashion" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>
              :<Link href={s.action==="weddings"?"/professional-services/weddings":s.action==="interiors"?"/professional-services/interiors":"/move"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900">{s.cta}<ChevronRight size={15}/></Link>}
            </div>
          </div><div className="absolute right-5 top-1/2 hidden h-28 w-28 -translate-y-1/2 place-items-center rounded-2xl bg-white/12 md:grid"><s.icon size={52}/></div>
        </article>)}
      </div>
      <div className="flex items-center justify-between px-1 py-3"><div className="flex gap-1.5">{slides.map((s,i)=><button key={s.title} onClick={()=>go(i)} aria-label={`Promotion ${i+1}`} className={`h-2 rounded-full ${index===i?"w-6 bg-[#075E45]":"w-2 bg-slate-300"}`}/>)}</div><div className="flex gap-2"><button onClick={()=>go(index-1)} aria-label="Previous promotion" className="grid h-9 w-9 place-items-center rounded-full border bg-white"><ChevronLeft size={17}/></button><button onClick={()=>go(index+1)} aria-label="Next promotion" className="grid h-9 w-9 place-items-center rounded-full border bg-white"><ChevronRight size={17}/></button></div></div>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div><p className="text-sm font-black text-slate-900">{t("Shop products")}</p><p className="mt-1 text-xs text-slate-500">{nationwideCheckoutEnabled?t("Local and eligible India delivery products."):t("Local products and eligible marketplace discovery.")}</p></div>
      <button onClick={onBrowseCatalog} className="rounded-xl bg-[#075E45] px-4 py-2.5 text-xs font-black text-white">{t("Browse products")}</button>
    </div>
  </section>;
}
