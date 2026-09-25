"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { LanguageSwitcher, useCustomerLanguage } from "../../components/CustomerLanguageProvider";

const rideServices = new Set(["Bike Ride", "Auto", "Cab", "Rental Car"]);
const courierServices = new Set(["Bike Courier", "Auto / Mini Truck", "Shop Delivery"]);
const travelServices = new Set(["Bus", "Train", "Flights", "Hotels", "Experiences"]);

function RequestForm() {
  const params = useSearchParams();
  const { t } = useCustomerLanguage();
  const service = params.get("service")?.trim() || "Move & Travel";
  const [submitted, setSubmitted] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [when, setWhen] = useState("");
  const [details, setDetails] = useState("");

  const kind = rideServices.has(service) ? "ride" : courierServices.has(service) ? "courier" : travelServices.has(service) ? "travel" : service === "Car Share" ? "car share" : "service";
  const bikeTaxiOnHold = service === "Bike Ride";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (bikeTaxiOnHold) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
        <CheckCircle2 className="text-[#075E45]" size={36} />
        <h1 className="mt-4 text-2xl font-black text-slate-950">{t("Your plan is ready")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t("Zeshu has captured the details on this device. No booking or payment has been made. Ask Zeshu Assistant to check current availability or help you with the next step.")}
        </p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div><strong>{t("Service")}:</strong> {t(service)}</div>
          {from && <div className="mt-1"><strong>{t("From")}:</strong> {from}</div>}
          {to && <div className="mt-1"><strong>{t("To")}:</strong> {to}</div>}
          {when && <div className="mt-1"><strong>{t("When")}:</strong> {when}</div>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/help?service=${encodeURIComponent(service)}`} className="rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white">{t("Check with Zeshu Assistant")}</Link>
          <button onClick={() => setSubmitted(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">{t("Edit plan")}</button>
        </div>
      </section>
    );
  }

  if (bikeTaxiOnHold) {
    return (
      <section className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-sm md:p-8">
        <ShieldCheck className="text-amber-700" size={36} />
        <h1 className="mt-4 text-2xl font-black text-slate-950">{t("Zeshu Bike Taxi is visible, but passenger requests are on hold")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("Telangana is finalising rules affecting passenger bike taxis, including the proposed yellow-plate requirement. Zeshu will keep this service disabled until the applicable state requirements are clear and our provider setup is compliant.")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/move" className="rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white">{t("View other services")}</Link>
          <Link href="/help?service=Bike%20Ride" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">{t("Ask Zeshu Assistant")}</Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-[#075E45]">{t(service)}</div>
      <h1 className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">{t(`Plan your ${kind} with Zeshu`)}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t("Enter what you need. Zeshu will use this to guide you to an available verified provider when one is enabled. This form does not create a paid booking.")}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">{t(kind === "travel" && service === "Hotels" ? "City / destination" : "From / pickup")}
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-3"><MapPin size={18} className="text-slate-400" /><input value={from} onChange={(e) => setFrom(e.target.value)} required className="min-w-0 flex-1 bg-transparent py-3 outline-none" placeholder={t("Enter location")} /></div>
        </label>
        <label className="text-sm font-bold text-slate-700">{t(kind === "travel" && service === "Hotels" ? "Hotel / area preference" : "To / drop")}
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-3"><MapPin size={18} className="text-slate-400" /><input value={to} onChange={(e) => setTo(e.target.value)} className="min-w-0 flex-1 bg-transparent py-3 outline-none" placeholder={t("Enter destination")} /></div>
        </label>
        <label className="text-sm font-bold text-slate-700">{t("When")}
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none" />
        </label>
        <label className="text-sm font-bold text-slate-700">{t(kind === "courier" ? "Package details" : "Preferences")}
          <input value={details} onChange={(e) => setDetails(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none" placeholder={t(kind === "courier" ? "Size, weight, item type" : "Add optional details")} />
        </label>
      </div>

      <button type="submit" className="mt-6 w-full rounded-2xl bg-[#075E45] px-5 py-3.5 text-sm font-black text-white md:w-auto">{t("Continue")}</button>
      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-900">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <span>{t("Zeshu shows a fare, ETA, ticket, vehicle or provider only when a verified live partner confirms it. Until then, you can submit a service request, but no payment or final booking is created.")}</span>
      </div>
    </form>
  );
}

export default function MoveRequestPage() {
  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/move" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]"><ArrowLeft size={17} /> Back to Move & Travel</Link>
          <LanguageSwitcher compact />
        </div>
        <Suspense fallback={<div className="rounded-3xl bg-white p-8">Loading…</div>}><RequestForm /></Suspense>
      </div>
    </main>
  );
}
