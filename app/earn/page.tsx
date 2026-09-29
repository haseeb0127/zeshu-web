"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bike,
  Car,
  CheckCircle2,
  MessageCircle,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
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

const launchAdvantages = [
  {
    title: "Local-first matching",
    body: "Zeshu is building density in Jagtial first so available drivers and nearby customers can be matched reliably before wider expansion.",
  },
  {
    title: "Transparent economics",
    body: "Commission, payout timing and any launch incentive must be shown clearly before a driver activates. No hidden deduction claims.",
  },
  {
    title: "Flexible availability",
    body: "Verified drivers can choose when to go online or offline once their service is approved and live.",
  },
  {
    title: "Support when it matters",
    body: "Driver onboarding, document, safety and account-specific issues can move from Zeshu Assistant to human support.",
  },
];

const recruitmentChannels = [
  "Auto and taxi stands in Jagtial",
  "Local driver, courier and job WhatsApp groups",
  "Petrol pumps, mechanics, tyre shops and vehicle-service partners",
  "Existing delivery riders and genuine driver referrals",
];

const driverShareUrl = `https://wa.me/?text=${encodeURIComponent(
  "Zeshu is accepting interest from Auto, Cab, Courier, Delivery and Goods driver partners for the Jagtial pilot. Apply securely at https://zeshu.in/drive"
)}`;

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
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/earn/onboard" className="inline-flex rounded-xl bg-white px-4 py-3 text-sm font-black text-[#075E45]">{t("Start secure driver verification")}</Link>
            <a href={driverShareUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-black text-white">
              <MessageCircle size={17} aria-hidden="true" /> {t("Share with a driver")}
            </a>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.14em] text-[#075E45]">
                <MapPin size={15} aria-hidden="true" /> {t("Jagtial founding driver network")}
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{t("Build driver supply before expanding the map")}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{t("Zeshu is prioritising a dense local pilot instead of collecting inactive registrations across Telangana. Auto, Cab, Courier, Delivery and Goods applicants can register now. Passenger Bike Taxi remains unavailable for activation while the applicable Telangana position is unresolved.")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="#join" className="rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white">{t("Join the pilot")}</Link>
                <Link href="/help?service=Drive%20%26%20Deliver" className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-800">{t("Ask about onboarding")}</Link>
              </div>
            </div>
            <div className="rounded-2xl bg-[#f6faf7] p-5">
              <p className="text-sm font-black text-slate-900">{t("Where Zeshu will recruit first")}</p>
              <div className="mt-3 grid gap-2">
                {recruitmentChannels.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-600">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#087443]" aria-hidden="true" />
                    <span>{t(item)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <article key={role.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#075E45]" aria-hidden="true">{role.icon}</span>
              <h2 className="mt-4 font-black">{t(role.title)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t(role.body)}</p>
            </article>
          ))}
        </section>

        <section className="mt-7">
          <h2 className="text-xl font-black text-slate-950">{t("Why a driver should join Zeshu")}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {launchAdvantages.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-black text-slate-900">{t(item.title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(item.body)}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{t("Registering does not guarantee trips, earnings, incentives or immediate activation. Zeshu will publish actual commercial terms only when a service is ready to operate.")}</p>
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

        <section id="join" className="mt-7 scroll-mt-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{t("Register interest / fleet partnership")}</h2>
              <p className="mt-1 text-sm text-slate-600">{t("Start with basic contact and vehicle information. Sensitive documents belong only in the secure verification flow.")}</p>
            </div>
            <a href={driverShareUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black text-white">
              <MessageCircle size={17} aria-hidden="true" /> {t("Invite another driver")}
            </a>
          </div>
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
