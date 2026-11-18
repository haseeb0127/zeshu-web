"use client";

import Link from "next/link";
import { ArrowLeft, Bike, Package, ShieldCheck, MapPin, Clock3, CheckCircle2 } from "lucide-react";
import { LanguageSwitcher, useCustomerLanguage } from "../components/CustomerLanguageProvider";

export default function ZeshuBikePage() {
  const { t } = useCustomerLanguage();
  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-6 text-slate-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/move" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]">
            <ArrowLeft size={17} aria-hidden="true" /> {t("Back to Zeshu Move")}
          </Link>
          <LanguageSwitcher compact />
        </div>

        <header className="relative mt-6 overflow-hidden rounded-[30px] bg-[#083b27] p-6 text-white shadow-xl md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-[#c9f2d8]">
              <Bike size={15} /> {t("Jagtial-first bike network")}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{t("Zeshu Bike")}</h1>
            <p className="mt-3 text-base font-bold text-[#d9f3e3] md:text-lg">{t("Local deliveries today. Safer rides when approved.")}</p>
            <p className="mt-3 text-sm leading-6 text-[#bfe2cd]">
              {t("One place for bike couriers, delivery partners and future passenger rides. We are building reliable local rider supply in Jagtial before opening live dispatch.")}
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm md:p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-[#075E45]"><Package size={25}/></span>
            <h2 className="mt-4 text-xl font-black">{t("Bike Courier & Delivery")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t("For documents, small parcels and local shop deliveries. Zeshu is recruiting verified riders in Jagtial. Customer dispatch opens only after active rider coverage, service-area checks, reliable quotes and support are ready.")}</p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700">
              <li className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 text-emerald-700"/> {t("Secure rider verification")}</li>
              <li className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 text-emerald-700"/> {t("Pickup and drop tracking when enabled")}</li>
              <li className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 text-emerald-700"/> {t("Clear delivery price before confirmation")}</li>
            </ul>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-950">{t("Recruitment is open; live Bike Courier dispatch is not yet enabled. Do not promise a rider or delivery time until a verified partner accepts the job.")}</p>
            <Link href="/earn?role=BIKE_COURIER#join" className="mt-4 inline-flex rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white">{t("Join as a Bike Courier")}</Link>
          </article>

          <article className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm md:p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-800"><Bike size={25}/></span>
            <h2 className="mt-4 text-xl font-black">{t("Bike Taxi — future launch")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t("We are collecting founding rider interest for a future passenger-bike service. This is not a ride-booking service yet.")}</p>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
              <strong>{t("Passenger bookings are disabled.")}</strong> {t("Activation requires written confirmation of Telangana aggregator authorisation, eligible transport registration and permits, commercial insurance, vehicle fitness, safety systems and worker protections. Gig-worker registration alone is not a passenger transport permit. Do not convert a private vehicle or pay an agent based on this interest form.")}
            </div>
            <Link href="/earn?role=BIKE_RIDE_INTEREST#join" className="mt-4 inline-flex rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-black text-amber-900">{t("Register founding rider interest")}</Link>
          </article>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><ShieldCheck className="text-[#075E45]"/><h3 className="mt-2 font-black">{t("Verified before activation")}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{t("Identity, licence, vehicle, insurance and service-specific documents are reviewed securely.")}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><MapPin className="text-[#075E45]"/><h3 className="mt-2 font-black">{t("Jagtial pilot first")}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{t("Build dependable rider density locally before expanding to more areas.")}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><Clock3 className="text-[#075E45]"/><h3 className="mt-2 font-black">{t("Honest availability")}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{t("No invented fares, ETAs, drivers or confirmed bookings.")}</p></div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/earn/onboard" className="rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white">{t("Secure rider verification")}</Link>
          <Link href="/help?service=Bike%20Courier" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">{t("Ask Zeshu Assistant")}</Link>
        </div>
      </div>
    </main>
  );
}
