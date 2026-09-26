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
      icon: <Car size={20} />,
      available: isAvailable(moveServices.AUTO_DRIVER),
    },
    {
      label: t("Cab"),
      href: "/move/request?service=Cab",
      icon: <Car size={20} />,
      available: isAvailable(moveServices.CAB_DRIVER),
    },
    {
      label: t("Send parcel"),
      href: "/move/request?service=Bike%20Courier",
      icon: <Package size={20} />,
      available: isAvailable(moveServices.BIKE_COURIER),
    },
    {
      label: t("Mini Truck"),
      href: "/move/request?service=Auto%20%2F%20Mini%20Truck",
      icon: <Truck size={20} />,
      available: isAvailable(moveServices.GOODS_DRIVER),
    },
  ];

  return (
    <section className="mb-6 px-4 md:px-0" aria-labelledby="zeshu-home-hub-title">
      <div className="overflow-hidden rounded-[30px] border border-[#dbe9df] bg-white shadow-[0_12px_38px_rgba(20,43,29,.07)]">
        <div className="bg-gradient-to-br from-[#075E45] via-[#0b704f] to-[#0f7d58] p-5 text-white md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-emerald-50">
                <BadgeCheck size={14} />
                Zeshu
              </div>
              <h1
                id="zeshu-home-hub-title"
                className="mt-3 max-w-3xl text-2xl font-black leading-tight tracking-tight md:text-4xl"
              >
                {t("One Zeshu. Four simple ways to get what you need.")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-emerald-50/90 md:text-base">
                {t("Shop, move, send, recharge and more — all in one Zeshu.")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-100">Jagtial</p>
                <p className="mt-1 text-xs font-black">{t("Fast nearby")}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-100">Telangana</p>
                <p className="mt-1 text-xs font-black">{t("Move & Travel")}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-100">India</p>
                <p className="mt-1 text-xs font-black">{t("Recharge & Bills")}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] bg-white p-3 text-slate-950 shadow-lg">
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">Zeshu Move</p>
                <p className="text-sm font-black">{t("Ride, send & travel")}</p>
              </div>
              <Link href="/move" className="inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("See all")} <ChevronRight size={14} />
              </Link>
            </div>

            <Link
              href="/move/request?service=Auto"
              className="flex min-h-14 items-center gap-3 rounded-[18px] bg-[#f3f6f4] px-4 transition active:scale-[.99]"
            >
              <Search size={20} className="shrink-0 text-slate-800" />
              <span className="min-w-0 flex-1 text-base font-black">
                {t("Where are you going?")}
              </span>
              <MapPin size={18} className="shrink-0 text-[#075E45]" />
            </Link>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {moveShortcuts.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-100 bg-white p-2.5 text-center shadow-sm transition active:scale-[.98]"
                >
                  <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-[#075E45]">
                    {item.icon}
                  </span>
                  <p className="mt-1.5 truncate text-[10px] font-black text-slate-900 md:text-xs">
                    {item.label}
                  </p>
                  <p className={`mt-0.5 text-[8px] font-black ${item.available ? "text-emerald-700" : "text-slate-400"}`}>
                    {item.available ? t("Available") : t("Opening soon")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={onShopNearby}
              className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#075E45] text-white">
                <Zap size={20} />
              </span>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#075E45]">Zeshu Now</p>
                <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-[#075E45]">Jagtial</span>
              </div>
              <h2 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                {t("Fast nearby")}
              </h2>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-600 sm:block">
                {t("Groceries, fresh food and daily essentials from nearby verified sellers.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("Shop nearby")} <ChevronRight size={14} />
              </span>
            </button>

            <Link
              href="/move"
              className="rounded-3xl border border-teal-100 bg-teal-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-600 text-white">
                <Car size={20} />
              </span>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-teal-700">Zeshu Move</p>
                <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-teal-700">Telangana</span>
              </div>
              <h2 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                {t("Move & Travel")}
              </h2>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-600 sm:block">
                {t("Rides, courier and travel — one trusted place.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-teal-700">
                {t("Open Move & Travel")} <ChevronRight size={14} />
              </span>
            </Link>

            <button
              type="button"
              onClick={onBrowseCatalog}
              className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white">
                <ShoppingBag size={20} />
              </span>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-blue-700">
                  {t("Shop Everything")}
                </p>
                <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-blue-700">
                  {nationwideCheckoutEnabled ? "India" : t("Growing")}
                </span>
              </div>
              <h2 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                {t("Shop Everything")}
              </h2>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-600 sm:block">
                {t("Marketplace range grows as verified sellers join Zeshu.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-blue-700">
                {t("Browse catalog")} <ChevronRight size={14} />
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenServices}
              className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500 text-white">
                <Receipt size={20} />
              </span>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-amber-700">
                  {t("Book & Pay")}
                </p>
                <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-amber-700">India</span>
              </div>
              <h2 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                {t("Recharge & Bills")}
              </h2>
              <p className="mt-1 hidden text-xs font-medium leading-5 text-slate-600 sm:block">
                {t("Recharge, bills and digital services in one place.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-amber-700">
                {t("Open services")} <ChevronRight size={14} />
              </span>
            </button>
          </div>

          <div className="mt-4 grid gap-2 rounded-2xl bg-[#f6f8f6] p-3 sm:grid-cols-3">
            <Link href="/earn" className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-left shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-[#075E45]">
                <Users size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
                  {t("Drive & Deliver")}
                </span>
                <span className="block truncate text-sm font-black text-slate-900">
                  {t("Earn with Zeshu")}
                </span>
              </span>
              <ChevronRight size={15} className="ml-auto shrink-0 text-slate-300" />
            </Link>

            <Link href="/partners" className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-left shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Store size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
                  {t("Shop Everything")}
                </span>
                <span className="block truncate text-sm font-black text-slate-900">
                  {t("Brands & Suppliers")}
                </span>
              </span>
              <ChevronRight size={15} className="ml-auto shrink-0 text-slate-300" />
            </Link>

            <Link href="/help" className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-left shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <Headphones size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Zeshu
                </span>
                <span className="block truncate text-sm font-black text-slate-900">
                  {t("Help & Support")}
                </span>
              </span>
              <ChevronRight size={15} className="ml-auto shrink-0 text-slate-300" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
