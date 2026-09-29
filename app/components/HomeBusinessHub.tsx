"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Car,
  ChevronLeft,
  ChevronRight,
  Headphones,
  MapPin,
  Package,
  Plane,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { useCustomerLanguage } from "@/app/components/CustomerLanguageProvider";

type Readiness = {
  request_enabled?: boolean;
  matching_enabled?: boolean;
  compliance_gate?: boolean;
};

type Props = {
  onShopNearby: () => void;
  onBrowseCatalog: () => void;
  onOpenServices: () => void;
  nationwideCheckoutEnabled: boolean;
};

const isMatchingReady = (state: Readiness | undefined) =>
  Boolean(state?.request_enabled && state?.matching_enabled && !state?.compliance_gate);

export default function HomeBusinessHub({
  onShopNearby,
  onBrowseCatalog,
  onOpenServices,
  nationwideCheckoutEnabled,
}: Props) {
  const { t } = useCustomerLanguage();
  const [moveServices, setMoveServices] = useState<Record<string, Readiness>>({});

  useEffect(() => {
    let active = true;
    void fetch("/api/move/matching/readiness", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setMoveServices(
          payload?.services && typeof payload.services === "object"
            ? payload.services
            : {},
        );
      })
      .catch(() => {
        if (active) setMoveServices({});
      });

    return () => {
      active = false;
    };
  }, []);

  const anyMoveReady = [
    moveServices.AUTO_DRIVER,
    moveServices.CAB_DRIVER,
    moveServices.BIKE_COURIER,
    moveServices.GOODS_DRIVER,
  ].some(isMatchingReady);

  const moveStatus = (state: Readiness | undefined) =>
    isMatchingReady(state) ? t("Check availability") : t("Opening soon");

  const promoTrackRef = useRef<HTMLDivElement>(null);
  const [promoIndex, setPromoIndex] = useState(0);

  const promoSlides = [
    {
      scope: "Jagtial",
      eyebrow: t("Local shopping"),
      title: t("Shop in Jagtial"),
      description: t("Browse available groceries and everyday essentials from nearby sellers."),
      cta: t("Shop now"),
      action: "shop",
      Icon: ShoppingBag,
      theme: "bg-[linear-gradient(135deg,#063f31_0%,#075E45_58%,#0a7654_100%)]",
      chips: [t("Groceries & essentials"), t("Shopping & delivery")],
    },
    {
      scope: "Telangana",
      eyebrow: t("Move with Zeshu"),
      title: t("Move & Travel"),
      description: t("Rides, courier and travel — one trusted place."),
      cta: t("Check availability"),
      action: "move",
      Icon: Car,
      theme: "bg-[linear-gradient(135deg,#123c4a_0%,#175d6d_58%,#23839a_100%)]",
      chips: [t("Auto"), t("Cab"), t("Courier"), t("Travel")],
    },
    {
      scope: "India",
      eyebrow: t("Bills & Services"),
      title: t("Recharge & bills"),
      description: t("Explore mobile, DTH and bill services supported by available providers."),
      cta: t("Explore services"),
      action: "services",
      Icon: Receipt,
      theme: "bg-[linear-gradient(135deg,#6b430d_0%,#a36313_58%,#cf851d_100%)]",
      chips: [t("India-wide services"), t("Digital services")],
    },
    {
      scope: "India",
      eyebrow: t("Fashion"),
      title: t("Zeshu Fashion"),
      description: t("Clothing, footwear and accessories from seller-owned inventory."),
      cta: t("Explore fashion"),
      action: "fashion",
      Icon: ShoppingBag,
      theme: "bg-[linear-gradient(135deg,#5b214f_0%,#8a3d73_58%,#b0578f_100%)]",
      chips: [t("Women"), t("Men"), t("Kids"), t("Footwear")],
    },
    {
      scope: "India",
      eyebrow: t("Marketplace"),
      title: t("Marketplace"),
      description: t("Browse products from verified sellers as the Zeshu catalog expands."),
      cta: t("Browse catalog"),
      action: "catalog",
      Icon: Store,
      theme: "bg-[linear-gradient(135deg,#392b5a_0%,#5a4183_58%,#755ca0_100%)]",
      chips: [t("Verified where applicable"), t("Clear availability")],
    },
  ];

  const goToPromo = (index: number) => {
    const track = promoTrackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-promo-slide]"));
    const nextIndex = (index + slides.length) % slides.length;
    const target = slides[nextIndex];
    if (!target) return;
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setPromoIndex(nextIndex);
  };

  const syncPromoIndex = () => {
    const track = promoTrackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-promo-slide]"));
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    setPromoIndex(bestIndex);
  };

  return (
    <section className="mb-5 px-4 md:px-0" aria-labelledby="zeshu-home-hub-title" data-marketplace-layout="professional">
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_2px_10px_rgba(15,23,42,.04)] md:px-5 md:py-5">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#075E45]">
            <BadgeCheck size={14} />
            {t("One place for everyday needs")}
          </div>
          <h1
            id="zeshu-home-hub-title"
            className="mt-2 max-w-4xl text-[1.35rem] font-black leading-[1.12] tracking-[-.025em] text-slate-950 md:text-3xl"
          >
            {t("Shop, move, send and manage everyday services with Zeshu.")}
          </h1>
        </div>

        <div className="relative" aria-roledescription="carousel" aria-label={t("Explore Zeshu")}>
          <div
            ref={promoTrackRef}
            onScroll={syncPromoIndex}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto no-scrollbar"
          >
            {promoSlides.map((slide, index) => (
              <article
                key={slide.title}
                data-promo-slide
                data-promo-scope={slide.scope}
                aria-label={`${index + 1} / ${promoSlides.length}: ${slide.title}`}
                className={`relative min-w-full snap-start overflow-hidden rounded-2xl ${slide.theme} px-5 py-5 text-white md:px-7 md:py-7`}
              >
                <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" aria-hidden="true" />
                <span className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-black/10" aria-hidden="true" />
                <div className="relative z-10 max-w-[78%] md:max-w-[68%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-white ring-1 ring-white/15">
                      Zeshu · {slide.scope}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[.12em] text-white/75">{slide.eyebrow}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black leading-[1.05] tracking-[-.03em] md:text-4xl">{slide.title}</h2>
                  <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-white/85 md:text-sm md:leading-6">{slide.description}</p>
                  <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
                    {slide.chips.map((chip) => (
                      <span key={chip} className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black text-white/90 ring-1 ring-white/10">{chip}</span>
                    ))}
                  </div>
                  <div className="mt-4">
                    {slide.action === "shop" ? (
                      <button type="button" onClick={onShopNearby} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-900 shadow-sm transition active:scale-[.98]">
                        <ShoppingBag size={16} /> {slide.cta} <ChevronRight size={15} />
                      </button>
                    ) : slide.action === "services" ? (
                      <button type="button" onClick={onOpenServices} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-900 shadow-sm transition active:scale-[.98]">
                        <Receipt size={16} /> {slide.cta} <ChevronRight size={15} />
                      </button>
                    ) : slide.action === "catalog" ? (
                      <button type="button" onClick={onBrowseCatalog} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-900 shadow-sm transition active:scale-[.98]">
                        <Store size={16} /> {slide.cta} <ChevronRight size={15} />
                      </button>
                    ) : slide.action === "fashion" ? (
                      <Link href="/fashion" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-900 shadow-sm transition active:scale-[.98]">
                        <ShoppingBag size={16} /> {slide.cta} <ChevronRight size={15} />
                      </Link>
                    ) : (
                      <Link href="/move" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-900 shadow-sm transition active:scale-[.98]">
                        <Car size={16} /> {slide.cta} <ChevronRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
                <div className="absolute right-5 top-1/2 hidden h-28 w-28 -translate-y-1/2 place-items-center rounded-2xl bg-white/12 text-white ring-1 ring-white/15 md:grid" aria-hidden="true">
                  <slide.Icon size={52} strokeWidth={1.6} />
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 px-1 py-3">
            <div className="flex items-center gap-1.5" aria-label={t("Explore Zeshu")}>
              {promoSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => goToPromo(index)}
                  aria-label={`${t("Explore Zeshu")} ${index + 1}`}
                  aria-current={promoIndex === index ? "true" : undefined}
                  className={`h-2 rounded-full transition-all ${promoIndex === index ? "w-6 bg-[#075E45]" : "w-2 bg-slate-300"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => goToPromo(promoIndex - 1)} aria-label="Previous promotion" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-[.96]">
                <ChevronLeft size={17} />
              </button>
              <button type="button" onClick={() => goToPromo(promoIndex + 1)} aria-label="Next promotion" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-[.96]">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,.04)] md:p-5" aria-labelledby="home-fashion-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">{t("Fashion")}</p>
              <h2 id="home-fashion-title" className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">{t("Explore Zeshu Fashion")}</h2>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{t("Seller-owned fashion catalogues, shown only when real stock and fulfilment are ready.")}</p>
            </div>
            <Link href="/fashion" className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#075E45] px-3 py-2 text-xs font-black text-white">
              {t("View fashion")} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label={t("Fashion categories")}>
            {[
              ["👗", t("Sarees")],
              ["🧥", t("Kurtis")],
              ["👚", t("Women’s western wear")],
              ["👕", t("Men’s shirts & T-shirts")],
              ["👖", t("Jeans")],
              ["🧒", t("Kidswear")],
              ["👟", t("Footwear")],
              ["👜", t("Accessories")],
            ].map(([icon, label]) => (
              <Link key={label} href="/fashion" className="min-w-[96px] rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center transition hover:border-emerald-200 hover:bg-emerald-50/50">
                <span className="block text-xl" aria-hidden="true">{icon}</span>
                <span className="mt-1.5 block text-[10px] font-black leading-3 text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,.04)] md:p-5" aria-labelledby="home-move-launcher-title">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">{t("Move with Zeshu")}</p>
                <h2 id="home-move-launcher-title" className="mt-1 text-xl font-black tracking-tight text-slate-950">{t("Need a ride or want to send something?")}</h2>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide text-[#075E45] shadow-sm">Telangana</span>
            </div>

            <Link
              href="/move/request?service=Auto"
              className="mt-4 flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left transition hover:border-emerald-200 hover:bg-white active:scale-[.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#075E45]">
                <Search size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{t("Pickup now")}</span>
                <span className="mt-0.5 block truncate text-lg font-black text-slate-950">{t("Where are you going?")}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-slate-400" />
            </Link>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <Link href="/move/request?service=Auto" className="rounded-xl border border-slate-100 bg-white px-2 py-3 text-center transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[.98]">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-lg" aria-hidden="true">🛺</span>
                <span className="mt-1.5 block text-[10px] font-black text-slate-800">{t("Auto")}</span>
                <span className="mt-1 block text-[8px] font-bold leading-3 text-slate-400">{moveStatus(moveServices.AUTO_DRIVER)}</span>
              </Link>
              <Link href="/move/request?service=Cab" className="rounded-xl border border-slate-100 bg-white px-2 py-3 text-center transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[.98]">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-lg" aria-hidden="true">🚕</span>
                <span className="mt-1.5 block text-[10px] font-black text-slate-800">{t("Cab")}</span>
                <span className="mt-1 block text-[8px] font-bold leading-3 text-slate-400">{moveStatus(moveServices.CAB_DRIVER)}</span>
              </Link>
              <Link href="/move/request?service=Bike%20Courier" className="rounded-xl border border-slate-100 bg-white px-2 py-3 text-center transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[.98]">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-[#9a6700]" aria-hidden="true"><Package size={18} /></span>
                <span className="mt-1.5 block text-[10px] font-black text-slate-800">{t("Courier")}</span>
                <span className="mt-1 block text-[8px] font-bold leading-3 text-slate-400">{moveStatus(moveServices.BIKE_COURIER)}</span>
              </Link>
              <Link href="/move/request?service=Auto%20%2F%20Mini%20Truck" className="rounded-xl border border-slate-100 bg-white px-2 py-3 text-center transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[.98]">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-700" aria-hidden="true"><Truck size={18} /></span>
                <span className="mt-1.5 block text-[10px] font-black text-slate-800">{t("Mini Truck")}</span>
                <span className="mt-1 block text-[8px] font-bold leading-3 text-slate-400">{moveStatus(moveServices.GOODS_DRIVER)}</span>
              </Link>
              <Link href="/move/request?service=Rental%20Car" className="rounded-xl border border-slate-100 bg-white px-2 py-3 text-center transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[.98]">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700" aria-hidden="true"><Car size={18} /></span>
                <span className="mt-1.5 block text-[10px] font-black text-slate-800">{t("Rental")}</span>
                <span className="mt-1 block text-[8px] font-bold leading-3 text-slate-400">{t("Opening soon")}</span>
              </Link>
              <Link href="/move" className="rounded-xl border border-slate-100 bg-white px-2 py-3 text-center transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[.98]">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-700" aria-hidden="true"><Plane size={18} /></span>
                <span className="mt-1.5 block text-[10px] font-black text-slate-800">{t("Travel")}</span>
                <span className="mt-1 block text-[8px] font-bold leading-3 text-slate-400">{t("Opening soon")}</span>
              </Link>
            </div>

            <div className="mt-3 flex items-start gap-2 text-[11px] font-semibold leading-5 text-slate-500">
              <MapPin size={14} className="mt-0.5 shrink-0 text-[#075E45]" />
              <p>{anyMoveReady ? t("Availability depends on verified Zeshu partners near your pickup.") : t("Choose a service to see the latest availability for your area.")}</p>
            </div>
          </section>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">{t("Choose a service")}</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                {t("What would you like to do?")}
              </h2>
            </div>
            <Link href="/help" className="shrink-0 text-xs font-black text-[#075E45]">
              {t("Need help?")}
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={onShopNearby}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#075E45]"><Zap size={20} /></span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700">Jagtial</span>
              </div>
              <h3 className="mt-3 text-base font-black text-slate-950 md:text-lg">{t("Groceries & essentials")}</h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">
                {t("Fresh food and daily needs from nearby verified sellers.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("Shop now")} <ChevronRight size={14} />
              </span>
            </button>

            <Link
              href="/move"
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#075E45]"><Car size={20} /></span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">Telangana</span>
              </div>
              <h3 className="mt-3 text-base font-black text-slate-950 md:text-lg">{t("Rides & courier")}</h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">
                {t("Choose pickup and destination, then see what is available in your area.")}
              </p>
              <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
                {[t("Auto"), t("Cab"), t("Send parcel"), t("Mini Truck")].map((label) => (
                  <span key={label} className="rounded-full bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-500">{label}</span>
                ))}
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {anyMoveReady ? t("Check availability") : t("Opening soon")} <ChevronRight size={14} />
              </span>
            </Link>

            <button
              type="button"
              onClick={onOpenServices}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#075E45]"><Receipt size={20} /></span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">India</span>
              </div>
              <h3 className="mt-3 text-base font-black text-slate-950 md:text-lg">{t("Recharge & bills")}</h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">
                {t("Explore mobile, DTH and bill services supported by available providers.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("Explore services")} <ChevronRight size={14} />
              </span>
            </button>

            <button
              type="button"
              onClick={onBrowseCatalog}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#075E45]"><Store size={20} /></span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">
                  {nationwideCheckoutEnabled ? "India" : t("Marketplace")}
                </span>
              </div>
              <h3 className="mt-3 text-base font-black text-slate-950 md:text-lg">{t("Marketplace")}</h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">
                {t("Browse products from verified sellers as the Zeshu catalog expands.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("Browse catalog")} <ChevronRight size={14} />
              </span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,.03)]">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#075E45] shadow-sm"><ShieldCheck size={18} /></span>
              <div>
                <p className="text-sm font-black text-slate-900">{t("Clear availability")}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {t("Zeshu connects customers with eligible sellers and service partners. Availability is shown by service and location so you can see what is ready before you order or request it.")}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-600">
              <span className="rounded-full bg-white px-2.5 py-1.5">{t("Verified where applicable")}</span>
              <span className="rounded-full bg-white px-2.5 py-1.5">{t("Clear availability")}</span>
              <span className="rounded-full bg-white px-2.5 py-1.5">{t("Customer support")}</span>
            </div>
          </div>

          <section className="mt-5 border-t border-slate-100 pt-5" aria-labelledby="zeshu-ecosystem-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{t("Work with Zeshu")}</p>
                <h3 id="zeshu-ecosystem-title" className="mt-1 text-base font-black text-slate-950">
                  {t("For customers, drivers, sellers and brands")}
                </h3>
              </div>
              <Link href="/policies" className="text-[11px] font-black text-[#075E45]">{t("Trust Center")}</Link>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Link href="/earn" className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 transition hover:bg-slate-50">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#075E45]"><Users size={18} /></span>
                <span className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{t("Drive & Deliver")}</span><span className="block truncate text-sm font-black text-slate-900">{t("Earn with Zeshu")}</span></span>
              </Link>
              <Link href="/partners" className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 transition hover:bg-slate-50">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#075E45]"><Store size={18} /></span>
                <span className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{t("For sellers")}</span><span className="block truncate text-sm font-black text-slate-900">{t("Sell on Zeshu")}</span></span>
              </Link>
              <Link href="/partners" className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 transition hover:bg-slate-50">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#075E45]"><Zap size={18} /></span>
                <span className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{t("For brands")}</span><span className="block truncate text-sm font-black text-slate-900">{t("Promote with Zeshu")}</span></span>
              </Link>
              <Link href="/help" className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 transition hover:bg-slate-50">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#075E45]"><Headphones size={18} /></span>
                <span className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">Zeshu</span><span className="block truncate text-sm font-black text-slate-900">{t("Help & Support")}</span></span>
              </Link>
            </div>
          </section>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-[10px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} className="text-[#075E45]" />{t("Verified partners where applicable")}</span>
            <Link href="/policies" className="font-black text-[#075E45]">{t("Policies & Trust")}</Link>
            <Link href="/app" className="font-black text-[#075E45]">{t("Get Zeshu")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
