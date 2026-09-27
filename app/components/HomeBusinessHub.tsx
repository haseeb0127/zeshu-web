"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Car,
  ChevronRight,
  Headphones,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
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

  const anyMoveAvailable = [
    moveServices.AUTO_DRIVER,
    moveServices.CAB_DRIVER,
    moveServices.BIKE_COURIER,
    moveServices.GOODS_DRIVER,
  ].some(isAvailable);

  return (
    <section className="mb-6 px-4 md:px-0" aria-labelledby="zeshu-home-hub-title">
      <div className="overflow-hidden rounded-[30px] border border-[#dce8df] bg-white shadow-[0_14px_44px_rgba(15,36,24,.06)]">
        <div className="bg-[linear-gradient(135deg,#063f31_0%,#075E45_58%,#0a7654_100%)] px-5 py-6 text-white md:px-8 md:py-9">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-emerald-50 ring-1 ring-white/15">
              <BadgeCheck size={14} />
              {t("One place for everyday needs")}
            </div>

            <h1
              id="zeshu-home-hub-title"
              className="mt-3 max-w-3xl text-[2rem] font-black leading-[1.04] tracking-[-.035em] md:text-5xl"
            >
              {t("Shop, move, send and manage everyday services with Zeshu.")}
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-50/90 md:text-base">
              {t("Local shopping in Jagtial, Move & Courier across supported Telangana zones, and digital services across India where providers are available.")}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2" aria-label={t("Where Zeshu works")}>
              <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                <p className="text-xs font-black">Jagtial</p>
                <p className="mt-0.5 truncate text-[9px] font-bold text-emerald-50/80">{t("Shopping & delivery")}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                <p className="text-xs font-black">Telangana</p>
                <p className="mt-0.5 truncate text-[9px] font-bold text-emerald-50/80">{t("Move & Courier")}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                <p className="text-xs font-black">India</p>
                <p className="mt-0.5 truncate text-[9px] font-bold text-emerald-50/80">{t("Digital services")}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={onShopNearby}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#075E45] shadow-sm transition active:scale-[.98]"
              >
                <ShoppingBag size={18} />
                {t("Shop essentials")}
              </button>
              <Link
                href="/move"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/20 transition active:scale-[.98]"
              >
                <Car size={18} />
                {t("Move & Courier")}
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
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
                {t("Choose pickup and destination, then see what is available in your area.")}
              </p>
              <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
                {[t("Auto"), t("Cab"), t("Send parcel"), t("Mini Truck")].map((label) => (
                  <span key={label} className="rounded-full bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-500">{label}</span>
                ))}
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {anyMoveAvailable ? t("Available now") : t("Check availability")} <ChevronRight size={14} />
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
                {t("Explore mobile, DTH and bill services supported by available providers.")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#075E45]">
                {t("Explore services")} <ChevronRight size={14} />
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

          <div className="mt-5 rounded-[22px] border border-emerald-100 bg-emerald-50/55 p-4">
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
