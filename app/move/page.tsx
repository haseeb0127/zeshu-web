"use client";

import Link from "next/link";
import { ArrowLeft, Bike, Bus, Car, Hotel, Luggage, Package, Plane, ShieldCheck, Sparkles, TrainFront, Truck, Users } from "lucide-react";
import { LanguageSwitcher, useCustomerLanguage } from "../components/CustomerLanguageProvider";

type ServiceCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const localRides: ServiceCard[] = [
  { title: "Bike Ride", description: "Fast two-wheeler ride", icon: <Bike size={22} /> },
  { title: "Auto", description: "Auto-rickshaw rides", icon: <Car size={22} /> },
  { title: "Cab", description: "Local and outstation cabs", icon: <Car size={22} /> },
  { title: "Rental Car", description: "Hourly and day rentals", icon: <Car size={22} /> },
];

const courier: ServiceCard[] = [
  { title: "Bike Courier", description: "Documents and small parcels", icon: <Package size={22} /> },
  { title: "Auto / Mini Truck", description: "Larger local deliveries", icon: <Truck size={22} /> },
  { title: "Shop Delivery", description: "Seller-to-customer delivery", icon: <Package size={22} /> },
];

const sharing: ServiceCard[] = [
  { title: "Car Share", description: "Split an intercity trip with verified co-travellers", icon: <Users size={22} /> },
];

const travel: ServiceCard[] = [
  { title: "Bus", description: "Bus discovery and booking", icon: <Bus size={22} /> },
  { title: "Train", description: "Authorized rail booking partners only", icon: <TrainFront size={22} /> },
  { title: "Flights", description: "Flight search and booking partners", icon: <Plane size={22} /> },
  { title: "Hotels", description: "Hotel discovery and booking partners", icon: <Hotel size={22} /> },
  { title: "Experiences", description: "Activities and local experiences", icon: <Luggage size={22} /> },
];

function ServiceSection({ title, cards }: { title: string; cards: ServiceCard[] }) {
  const { t } = useCustomerLanguage();
  return (
    <section className="mt-7">
      <h2 className="text-lg font-black text-slate-950 md:text-xl">{t(title)}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,.04)]">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#075E45]" aria-hidden="true">{card.icon}</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">{t("Coming soon")}</span>
            </div>
            <h3 className="mt-4 font-black text-slate-900">{t(card.title)}</h3>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{t(card.description)}</p>
            <Link href={`/help?service=${encodeURIComponent(card.title)}`} className="mt-3 inline-flex rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-[#075E45]">{t("Ask Zeshu Assistant")}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MoveTravelPage() {
  const { t } = useCustomerLanguage();

  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-6 text-slate-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]">
            <ArrowLeft size={17} aria-hidden="true" /> {t("Back to Zeshu")}
          </Link>
          <LanguageSwitcher compact />
        </div>

        <header className="mt-6 overflow-hidden rounded-[30px] bg-[#083b27] p-6 text-white shadow-xl md:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-[#c9f2d8]">
                <Sparkles size={14} aria-hidden="true" /> {t("Coming soon")}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{t("Zeshu Move & Travel")}</h1>
              <p className="mt-3 text-base font-bold text-[#d9f3e3] md:text-lg">{t("Rides, courier and travel — one trusted place.")}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#bfe2cd]">{t("We're building these services with verified, licensed or authorized partners. Booking and payment are not available yet.")}</p>
            </div>
          </div>
        </header>

        <ServiceSection title="Local rides" cards={localRides} />
        <ServiceSection title="Send & Cargo" cards={courier} />
        <ServiceSection title="Share" cards={sharing} />
        <ServiceSection title="Travel" cards={travel} />

        <section className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 md:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#075E45]"><ShieldCheck size={24} /></span>
            <div>
              <h2 className="text-lg font-black text-slate-950">{t("Safety before speed")}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{t("No ride, courier or travel payment will be enabled until provider identity, serviceability, support, refunds, and applicable compliance are verified.")}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 md:p-7">
          <h2 className="text-lg font-black text-slate-950">{t("Want to provide rides, logistics or travel?")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t("Zeshu is reviewing licensed operators, logistics companies and authorized travel partners.")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/help?service=Move%20%26%20Travel" className="inline-flex rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white">{t("Customer Help")}</Link>
            <Link href="/partners" className="inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">{t("Partner with Zeshu")}</Link>
            <Link href="/earn" className="inline-flex rounded-xl border border-[#075E45] bg-white px-4 py-3 text-sm font-black text-[#075E45]">{t("Drive & Deliver")}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
