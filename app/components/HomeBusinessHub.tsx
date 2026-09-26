"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  const moveShortcuts = [
    {
      label: t("Auto"),
      href: "/move/request?service=Auto",
      icon: <Car size={18} />,
      available: isAvailable(moveServices.AUTO_DRIVER),
    },
    {
      label: t("Cab"),
      href: "/move/request?service=Cab",
      icon: <Car size={18} />,
      available: isAvailable(moveServices.CAB_DRIVER),
    },
    {
      label: t("Send parcel"),
      href: "/move/request?service=Bike%20Courier",
      icon: <Package size={18} />,
      available: isAvailable(moveServices.BIKE_COURIER),
    },
    {
      label: t("Mini Truck"),
      href: "/move/request?service=Auto%20%2F%20Mini%20Truck",
      icon: <Truck size={18} />,
      available: isAvailable(moveServices.GOODS_DRIVER),
    },
  ];

  return (
    <section className="mb-6 px-4 md:px-0" aria-labelledby="zeshu-home-hub-title">
      <div className="overflow-hidden rounded-[30px] border border-[#dce8df] bg-white shadow-[0_12px_40px_rgba(15,36,24,.07)]">
        <div className="bg-[#075E45] px-5 pb-5 pt-6 text-white md:px-7 md:pb-7 md:pt-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-emerald-50">
              <BadgeCheck size={14} />
              {t("Everyday, simply")}
            </div>

            <h1
              id="zeshu-home-hub-title"
              className="mt-3 text-[2rem] font-black leading-[1.04] tracking-[-.035em] md:text-5xl"
            >
              {t("Shop. Move. Send. Recharge. One Zeshu.")}
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-50/90 md:text-base">
              {t("Daily essentials, local movement, parcel delivery, digital services and a growing marketplace — organised in one simple place.")}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2" aria-label={t("Where Zeshu works")}>
              <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-100">Jagtial</p>
                <p className="mt-1 text-xs font-black">{t("Shop nearby")}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-100">Telangana</p>
                <p className="mt-1 text-xs font-black">{t("Move & Courier")}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-100">India</p>
                <p className="mt-1 text-xs font-black">{t("Digital services")}</p>
              </div>
            </div>
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
              href="/move"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0d7a59] px-4 py-3 text-sm font-black text-white ring-1 ring-white/20 transition active:scale-[.98]"
            >
              <Car size={18} />
              {t("Move & Courier")}
            </Link>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">
                {t("Start here")}
              </p>
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
              className="rounded-3xl border border-emerald-100 bg-emerald-50/65 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#075E45] text-white">
                <Zap size={20} />
              </span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[.12em] text-[#075E45]">
                Zeshu Now · Jagtial
              </p>
              <h3 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                {t("Groceries & essentials")}
              </h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-600 sm:block">
                {t("Fresh food and daily needs from nearby verified sellers.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("Shop now")} <ChevronRight size={14} />
              </span>
            </button>

            <Link
              href="/move"
              className="rounded-3xl border border-teal-100 bg-teal-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-600 text-white">
                <Car size={20} />
              </span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[.12em] text-teal-700">
                Zeshu Move · Telangana
              </p>
              <h3 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                {t("Rides & courier")}
              </h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-600 sm:block">
                {t("Choose pickup and destination. Live booking opens zone by zone as verified partners are ready.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-teal-700">
                {t("Open Move")} <ChevronRight size={14} />
              </span>
            </Link>

            <button
              type="button"
              onClick={onOpenServices}
              className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500 text-white">
                <Receipt size={20} />
              </span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[.12em] text-amber-700">
                Zeshu Digital · India
              </p>
              <h3 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                {t("Recharge & bills")}
              </h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-600 sm:block">
                {t("Mobile, DTH and bill services where the relevant provider is available.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-amber-700">
                {t("Open services")} <ChevronRight size={14} />
              </span>
            </button>

            <button
              type="button"
              onClick={onBrowseCatalog}
              className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white">
                <Store size={20} />
              </span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[.12em] text-blue-700">
                Zeshu Market
              </p>
              <h3 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                {t("Marketplace")}
              </h3>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-600 sm:block">
                {t("A growing catalog from verified sellers and brands.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-blue-700">
                {nationwideCheckoutEnabled ? t("Shop India delivery") : t("Browse catalog")} <ChevronRight size={14} />
              </span>
            </button>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#dce8df] bg-[#f8fbf9] p-3.5 md:p-4">
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
              className="mt-3 flex min-h-14 items-center gap-3 rounded-[18px] bg-white px-4 shadow-sm transition active:scale-[.99]"
            >
              <Search size={19} className="shrink-0 text-slate-700" />
              <span className="min-w-0 flex-1 text-base font-black text-slate-950">
                {t("Where are you going?")}
              </span>
              <MapPin size={18} className="shrink-0 text-[#075E45]" />
            </Link>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {moveShortcuts.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl bg-white p-2.5 text-center shadow-sm ring-1 ring-slate-100 transition active:scale-[.98]"
                >
                  <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-[#075E45]">
                    {item.icon}
                  </span>
                  <p className="mt-1.5 truncate text-[10px] font-black text-slate-900">
                    {item.label}
                  </p>
                  <p className={`mt-0.5 text-[8px] font-black ${item.available ? "text-emerald-700" : "text-slate-400"}`}>
                    {item.available ? t("Available") : t("Opening soon")}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[24px] bg-slate-950 p-4 text-white md:p-5">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-300">
              {t("Where Zeshu works")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-sm font-black">Jagtial</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  {t("Fast local shopping and delivery for eligible nearby orders.")}
                </p>
              </div>
              <div>
                <p className="text-sm font-black">Telangana</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  {t("Move and courier expand zone by zone as verified partners become available.")}
                </p>
              </div>
              <div>
                <p className="text-sm font-black">India</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  {t("Digital services and marketplace availability vary by provider, seller and delivery coverage.")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">
                {t("More from Zeshu")}
              </p>
              <h3 className="mt-1 text-base font-black text-slate-950">
                {t("Customers, drivers, sellers and brands — one platform")}
              </h3>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/earn" className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-[#075E45]">
                  <Users size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{t("Drive & Deliver")}</span>
                  <span className="block truncate text-sm font-black text-slate-900">{t("Earn with Zeshu")}</span>
                </span>
                <ChevronRight size={15} className="ml-auto shrink-0 text-slate-300" />
              </Link>

              <Link href="/partners" className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Store size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{t("For sellers")}</span>
                  <span className="block truncate text-sm font-black text-slate-900">{t("Sell on Zeshu")}</span>
                </span>
                <ChevronRight size={15} className="ml-auto shrink-0 text-slate-300" />
              </Link>

              <Link href="/partners" className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <Zap size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">{t("For brands")}</span>
                  <span className="block truncate text-sm font-black text-slate-900">{t("Promote with Zeshu")}</span>
                </span>
                <ChevronRight size={15} className="ml-auto shrink-0 text-slate-300" />
              </Link>

              <Link href="/help" className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
                  <Headphones size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">Zeshu</span>
                  <span className="block truncate text-sm font-black text-slate-900">{t("Help & Support")}</span>
                </span>
                <ChevronRight size={15} className="ml-auto shrink-0 text-slate-300" />
              </Link>
            </div>
          </div>

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
