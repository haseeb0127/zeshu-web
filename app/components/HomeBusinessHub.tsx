"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Car,
  ChevronRight,
  Headphones,
  MapPin,
  Package,
  Receipt,
  Search,
  ShoppingBag,
  Store,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { useCustomerLanguage } from "@/app/components/CustomerLanguageProvider";

type Readiness = {
  request_enabled?: boolean;
  compliance_gate?: boolean;
};

type Props = {
  onShopNearby: () => void;
  onBrowseCatalog: () => void;
  onOpenServices: () => void;
  nationwideCheckoutEnabled: boolean;
};

const isAvailable = (state: Readiness | undefined) =>
  Boolean(state?.request_enabled && !state?.compliance_gate);

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

  const moveShortcuts = useMemo(() => [
    {
      label: t("Auto"),
      href: "/move/request?service=Auto",
      icon: <Car size={17} />,
      available: isAvailable(moveServices.AUTO_DRIVER),
    },
    {
      label: t("Cab"),
      href: "/move/request?service=Cab",
      icon: <Car size={17} />,
      available: isAvailable(moveServices.CAB_DRIVER),
    },
    {
      label: t("Send parcel"),
      href: "/move/request?service=Bike%20Courier",
      icon: <Package size={17} />,
      available: isAvailable(moveServices.BIKE_COURIER),
    },
    {
      label: t("Mini Truck"),
      href: "/move/request?service=Auto%20%2F%20Mini%20Truck",
      icon: <Truck size={17} />,
      available: isAvailable(moveServices.GOODS_DRIVER),
    },
  ], [moveServices, t]);

  const anyMoveAvailable = moveShortcuts.some((item) => item.available);

  return (
    <section className="mb-6 px-4 md:px-0" aria-labelledby="zeshu-home-hub-title">
      <div className="overflow-hidden rounded-[30px] border border-[#dce8df] bg-white shadow-[0_14px_44px_rgba(15,36,24,.06)]">
        <div className="bg-[linear-gradient(135deg,#064e3b_0%,#075E45_55%,#0a7251_100%)] px-5 py-6 text-white md:px-8 md:py-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-emerald-50">
              <BadgeCheck size={14} />
              {t("Everyday, simply")}
            </div>

            <h1
              id="zeshu-home-hub-title"
              className="mt-3 max-w-3xl text-[2rem] font-black leading-[1.04] tracking-[-.035em] md:text-5xl"
            >
              {t("Shop. Move. Send. Recharge. One Zeshu.")}
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-50/90 md:text-base">
              {t("Daily essentials, local movement, parcel delivery, digital services and a growing marketplace — organised in one simple place.")}
            </p>

            <div className="mt-5 flex flex-wrap gap-2" aria-label={t("Where Zeshu works")}>
              <span className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-black ring-1 ring-white/10">
                Jagtial · {t("Fast nearby")}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-black ring-1 ring-white/10">
                Telangana · {t("Move & Courier")}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-black ring-1 ring-white/10">
                India · {t("Digital services")}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={onShopNearby}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#075E45] shadow-sm transition active:scale-[.98]"
              >
                <ShoppingBag size={18} />
                {t("Shop nearby")}
              </button>
              <Link
                href="/move/request?service=Auto"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/20 transition active:scale-[.98]"
              >
                <MapPin size={18} />
                {t("Where are you going?")}
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">{t("Start here")}</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                {t("What do you need today?")}
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
              className="group rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
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
              className="group rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#075E45]"><Car size={20} /></span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">Telangana</span>
              </div>
              <h3 className="mt-3 text-base font-black text-slate-950 md:text-lg">{t("Rides & courier")}</h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">
                {t("Choose pickup and destination. Live booking opens zone by zone as verified partners are ready.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {anyMoveAvailable ? t("Available") : t("Opening soon")} <ChevronRight size={14} />
              </span>
            </Link>

            <button
              type="button"
              onClick={onOpenServices}
              className="group rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#075E45]"><Receipt size={20} /></span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">India</span>
              </div>
              <h3 className="mt-3 text-base font-black text-slate-950 md:text-lg">{t("Recharge & bills")}</h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">
                {t("Mobile, DTH and bill services where the relevant provider is available.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("Open services")} <ChevronRight size={14} />
              </span>
            </button>

            <button
              type="button"
              onClick={onBrowseCatalog}
              className="group rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#075E45]"><Store size={20} /></span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">
                  {nationwideCheckoutEnabled ? "India" : t("Growing")}
                </span>
              </div>
              <h3 className="mt-3 text-base font-black text-slate-950 md:text-lg">{t("Marketplace")}</h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">
                {t("A growing catalog from verified sellers and brands.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {nationwideCheckoutEnabled ? t("Shop India delivery") : t("Browse catalog")} <ChevronRight size={14} />
              </span>
            </button>
          </div>

          <div className="mt-5 rounded-[22px] bg-[#f5f8f6] p-3.5 md:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">Zeshu Move</p>
                <h3 className="mt-0.5 text-sm font-black text-slate-950">{t("Ride, send or move goods")}</h3>
              </div>
              <Link href="/move" className="inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("See all")} <ChevronRight size={14} />
              </Link>
            </div>

            <Link
              href="/move/request?service=Auto"
              className="mt-3 flex min-h-14 items-center gap-3 rounded-[18px] bg-white px-4 shadow-sm ring-1 ring-slate-100 transition active:scale-[.99]"
            >
              <Search size={19} className="shrink-0 text-slate-700" />
              <span className="min-w-0 flex-1 text-base font-black text-slate-950">{t("Where are you going?")}</span>
              <MapPin size={18} className="shrink-0 text-[#075E45]" />
            </Link>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {moveShortcuts.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl bg-white p-2.5 text-center shadow-sm ring-1 ring-slate-100 transition active:scale-[.98]"
                >
                  <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-[#075E45]">{item.icon}</span>
                  <p className="mt-1.5 truncate text-[10px] font-black text-slate-900">{item.label}</p>
                  <p className={`mt-0.5 text-[8px] font-black ${item.available ? "text-emerald-700" : "text-slate-400"}`}>
                    {item.available ? t("Available") : t("Opening soon")}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <section className="mt-5 border-t border-slate-100 pt-5" aria-labelledby="how-zeshu-works-title">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">{t("Simple by design")}</p>
            <h3 id="how-zeshu-works-title" className="mt-1 text-base font-black text-slate-950 md:text-lg">
              {t("How Zeshu works")}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#075E45] text-xs font-black text-white">1</span>
                <p className="mt-2 text-sm font-black text-slate-900">{t("Choose what you need")}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("Shop, ride, send or use a digital service.")}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#075E45] text-xs font-black text-white">2</span>
                <p className="mt-2 text-sm font-black text-slate-900">{t("Zeshu connects the right partner")}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("Eligible orders and requests are fulfilled by verified sellers or service partners.")}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#075E45] text-xs font-black text-white">3</span>
                <p className="mt-2 text-sm font-black text-slate-900">{t("Track and get help")}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("Orders, trips and support stay connected to your Zeshu account.")}</p>
              </div>
            </div>
          </section>

          <section className="mt-5 border-t border-slate-100 pt-5" aria-labelledby="zeshu-coverage-title" data-home-coverage="true">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">{t("Coverage")}</p>
            <h3 id="zeshu-coverage-title" className="mt-1 text-base font-black text-slate-950 md:text-lg">{t("Where Zeshu works")}</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 p-3.5">
                <p className="text-sm font-black text-slate-900">Jagtial</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("Fast local shopping and delivery for eligible nearby orders.")}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-3.5">
                <p className="text-sm font-black text-slate-900">Telangana</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("Move and courier expand zone by zone as verified partners become available.")}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-3.5">
                <p className="text-sm font-black text-slate-900">India</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("Digital services and marketplace availability vary by provider, seller and delivery coverage.")}</p>
              </div>
            </div>
          </section>

          <section className="mt-5 border-t border-slate-100 pt-5" aria-labelledby="zeshu-ecosystem-title">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{t("More from Zeshu")}</p>
            <h3 id="zeshu-ecosystem-title" className="mt-1 text-base font-black text-slate-950">
              {t("Customers, drivers, sellers and brands — one platform")}
            </h3>

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
            <span>{t("Clear service availability")}</span>
            <Link href="/policies" className="font-black text-[#075E45]">{t("Policies & Trust")}</Link>
            <Link href="/app" className="font-black text-[#075E45]">{t("Get Zeshu")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
