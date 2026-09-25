"use client";

import Link from "next/link";
import { ArrowLeft, Bike, Car, CheckCircle2, Package, ShieldCheck, Truck, Users } from "lucide-react";
import DriverRiderInterestForm from "../components/DriverRiderInterestForm";
import { LanguageSwitcher, useCustomerLanguage } from "../components/CustomerLanguageProvider";

const roles = [
  { title: "Delivery Rider", body: "Local Zeshu order delivery and seller-to-customer fulfilment.", icon: <Bike size={22} /> },
  { title: "Bike Courier", body: "Secure document verification is available for parcel delivery onboarding.", icon: <Package size={22} /> },
  { title: "Auto Driver", body: "Complete identity, DL, RC, insurance, fitness and permit verification now; live passenger activation remains compliance/provider gated.", icon: <Car size={22} /> },
  { title: "Cab / Car Driver", body: "Secure verification is available now; live dispatch starts only after the compliant mobility setup is enabled.", icon: <Car size={22} /> },
  { title: "Goods Driver", body: "Auto, mini-truck and cargo delivery using the applicable goods-vehicle permits.", icon: <Truck size={22} /> },
  { title: "Fleet Operator", body: "Licensed transport, mobility or logistics fleets can partner with Zeshu.", icon: <Users size={22} /> },
];

const readiness = [
  "Identity and contact verification",
  "Driving licence for the relevant vehicle class where required",
  "Vehicle RC and applicable commercial / transport registration",
  "Valid insurance, PUC and fitness certificate where applicable",
  "Passenger or goods permit required for the service and route",
  "Bank and payout verification only through a secured onboarding flow",
  "Safety, support and grievance process before activation",
];

export default function EarnWithZeshuPage() {
  const { t } = useCustomerLanguage();

  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-6 text-slate-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/move" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]">
            <ArrowLeft size={17} aria-hidden="true" /> {t("Back to Move & Travel")}
          </Link>
          <LanguageSwitcher compact />
        </div>

        <header className="mt-6 rounded-[30px] bg-[#083b27] p-6 text-white shadow-xl md:p-9">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#bde8cc]">{t("Earn with Zeshu")}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{t("Drive & Deliver with Zeshu")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d7f0df]">{t("Register your interest for delivery, courier, auto, cab, goods transport or fleet partnerships. Zeshu will activate only the services that pass document, safety, provider and legal checks.")}</p>
          <Link href="/earn/onboard" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-black text-[#075E45]">{t("Start secure driver verification")}</Link>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <article key={role.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#075E45]" aria-hidden="true">{role.icon}</span>
              <h2 className="mt-4 font-black">{t(role.title)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t(role.body)}</p>
            </article>
          ))}
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6">
            <h2 className="text-xl font-black">{t("What Zeshu will verify before activation")}</h2>
            <div className="mt-4 grid gap-3">
              {readiness.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-[#087443]" aria-hidden="true" />
                  <span>{t(item)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck size={24} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-black">{t("Important launch rule")}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">{t("Submitting interest does not authorize passenger rides, parcel transport or commercial vehicle use. Zeshu will keep a service disabled until the required licence, permit, insurance, serviceability and support controls are verified.")}</p>
                <p className="mt-3 text-xs leading-5 text-slate-600">{t("Do not upload or type Aadhaar, PAN, driving-licence numbers, RC numbers, bank details, OTPs or other sensitive documents into this public form.")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <h2 className="text-xl font-black">{t("Ready with your documents?")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{t("Individual Auto, Cab, Delivery, Bike Courier and Goods applicants can now use the secure verification flow. Passenger Bike Taxi is not available in this flow while Telangana rules remain pending.")}</p>
          <Link href="/earn/onboard" className="mt-4 inline-flex rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white">{t("Verify securely")}</Link>
        </section>

        <section className="mt-7">
          <h2 className="mb-3 text-xl font-black">{t("Register interest / fleet partnership")}</h2>
          <DriverRiderInterestForm />
        </section>

        <section className="mt-7 rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-black">{t("Need help before applying?")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t("Ask Zeshu Assistant about delivery rider, courier, auto, cab, goods driver or fleet onboarding. A human can take over for document, safety or account-specific questions.")}</p>
          <Link href="/help?service=Drive%20%26%20Deliver" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">{t("Ask Zeshu Assistant")}</Link>
        </section>
      </div>
    </main>
  );
}
