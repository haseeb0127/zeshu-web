"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { riderSupabase } from "../../lib/browser-supabase";

const supabase = riderSupabase();

const SERVICES = [
  ["DELIVERY_RIDER", "Delivery Rider"],
  ["BIKE_COURIER", "Bike Courier"],
  ["AUTO_DRIVER", "Auto Driver"],
  ["CAB_DRIVER", "Cab / Car Driver"],
  ["GOODS_DRIVER", "Goods / Mini Truck Driver"],
] as const;

const DOCUMENTS = [
  ["IDENTITY", "Government identity proof", false],
  ["DRIVING_LICENCE", "Driving licence", true],
  ["RC", "Vehicle RC", false],
  ["INSURANCE", "Vehicle insurance", true],
  ["FITNESS", "Fitness certificate", true],
  ["PERMIT", "Commercial / transport permit", true],
  ["PUC", "PUC certificate", true],
  ["BANK_PROOF", "Bank / payout proof", false],
] as const;

type DriverApplication = {
  id: string;
  full_name: string;
  city: string;
  requested_services: string[];
  vehicle_type: string | null;
  registration_type: string;
  status: string;
};

type DriverDocument = {
  id: string;
  document_type: string;
  status: string;
  expiry_date: string | null;
  review_note: string | null;
};

export default function DriverOnboardingPage() {
  const [phase, setPhase] = useState<"checking" | "login" | "ready">("checking");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [form, setForm] = useState({ full_name: "", city: "Jagtial", requested_services: [] as string[], vehicle_type: "", registration_type: "NO_VEHICLE" });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = async () => (await supabase.auth.getSession()).data.session?.access_token || "";

  const load = async () => {
    const accessToken = await token();
    if (!accessToken) { setPhase("login"); return; }
    const response = await fetch("/api/driver/onboarding", { headers: { Authorization: `Bearer ${accessToken}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Could not load verification."); setPhase("ready"); return; }
    setApplication(payload.application || null);
    setDocuments(Array.isArray(payload.documents) ? payload.documents : []);
    if (payload.application) {
      setForm({
        full_name: payload.application.full_name || "",
        city: payload.application.city || "",
        requested_services: payload.application.requested_services || [],
        vehicle_type: payload.application.vehicle_type || "",
        registration_type: payload.application.registration_type || "NO_VEHICLE",
      });
    }
    setPhase("ready");
  };

  useEffect(() => { void load(); }, []);

  const normalizedPhone = () => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  };

  const sendOtp = async () => {
    const digits = normalizedPhone();
    if (!/^\d{10}$/.test(digits)) { setError("Enter a valid 10-digit mobile number."); return; }
    setBusy("otp"); setError("");
    const { error: authError } = await supabase.auth.signInWithOtp({ phone: `+91${digits}` });
    setBusy("");
    if (authError) { setError("Could not send OTP."); return; }
    setPhone(digits); setOtpSent(true); setMessage("OTP sent.");
  };

  const verifyOtp = async () => {
    const digits = normalizedPhone();
    setBusy("otp"); setError("");
    const { data, error: authError } = await supabase.auth.verifyOtp({ phone: `+91${digits}`, token: otp, type: "sms" });
    setBusy("");
    if (authError || !data.user) { setError("OTP could not be verified."); return; }
    setPhase("checking"); await load();
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.requested_services.length) { setError("Choose at least one service."); return; }
    setBusy("save"); setError(""); setMessage("");
    const response = await fetch("/api/driver/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify({ action: "SAVE", ...form }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) { setError(payload.error || "Could not save profile."); return; }
    setApplication(payload.application); setDocuments(payload.documents || []); setMessage("Profile saved. Upload the required documents.");
  };

  const upload = async (documentType: string, requiresExpiry: boolean) => {
    if (!application || !files[documentType]) return;
    const file = files[documentType]!;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError("Use a JPG, PNG or PDF up to 8 MB."); return;
    }
    if (requiresExpiry && !expiry[documentType]) { setError("Enter the document expiry date."); return; }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setPhase("login"); return; }
    setBusy(documentType); setError(""); setMessage("");
    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "bin";
    const path = `${userData.user.id}/${application.id}/${documentType}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("driver-verification").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setBusy(""); setError("Secure upload failed."); return; }

    const response = await fetch("/api/driver/onboarding/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify({ application_id: application.id, document_type: documentType, storage_path: path, expiry_date: expiry[documentType] || null }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) { setError(payload.error || "Could not save document record."); return; }
    setMessage("Document uploaded securely."); await load();
  };

  const submit = async () => {
    setBusy("submit"); setError(""); setMessage("");
    const response = await fetch("/api/driver/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify({ action: "SUBMIT" }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) { setError(payload.missingDocuments?.length ? `Still required: ${payload.missingDocuments.join(", ")}` : payload.error || "Could not submit."); return; }
    setMessage("Submitted for Zeshu verification."); await load();
  };

  const locked = Boolean(application && ["UNDER_REVIEW", "VERIFIED", "SUSPENDED"].includes(application.status));
  const visibleDocuments = application ? DOCUMENTS.filter(([type]) => {
    const services = application.requested_services || [];
    if (type === "FITNESS" || type === "PERMIT") {
      return services.some((service) => ["AUTO_DRIVER", "CAB_DRIVER", "GOODS_DRIVER"].includes(service));
    }
    if (["DRIVING_LICENCE", "RC", "INSURANCE", "PUC"].includes(type)) {
      return application.registration_type !== "NO_VEHICLE";
    }
    return true;
  }) : DOCUMENTS;

  if (phase === "checking") return <main className="grid min-h-screen place-items-center bg-[#f6faf7]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#075E45] border-t-transparent" /></main>;

  if (phase === "login") return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <ShieldCheck className="text-[#075E45]" />
        <h1 className="mt-4 text-2xl font-black">Secure driver verification</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with your mobile number. Verification files stay private and are never shown to customers.</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="10-digit mobile number" className="mt-5 w-full rounded-xl border p-3" />
        {otpSent && <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} maxLength={6} inputMode="numeric" placeholder="6-digit OTP" className="mt-3 w-full rounded-xl border p-3 text-center font-black tracking-[.3em]" />}
        <button disabled={busy === "otp"} onClick={() => void (otpSent ? verifyOtp() : sendOtp())} className="mt-3 w-full rounded-xl bg-[#075E45] py-3 font-black text-white disabled:opacity-50">{busy === "otp" ? "Please wait…" : otpSent ? "Verify OTP" : "Send OTP"}</button>
        <Link href="/earn" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#075E45]"><ArrowLeft size={16} /> Back</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-7">
      <div className="mx-auto max-w-5xl">
        <Link href="/earn" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]"><ArrowLeft size={16} /> Drive & Deliver</Link>
        <header className="mt-5 rounded-3xl bg-[#083b27] p-6 text-white">
          <h1 className="text-3xl font-black">Zeshu Driver Verification</h1>
          <p className="mt-2 text-sm leading-6 text-[#d7f0df]">Auto, Cab and Courier applicants can complete verification. Passenger Bike Taxi onboarding remains disabled while Telangana rules are pending.</p>
        </header>

        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {message && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</p>}

        <form onSubmit={save} className="mt-5 grid gap-4 rounded-3xl bg-white p-6 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center justify-between"><h2 className="text-xl font-black">1. Service profile</h2>{application && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{application.status.replaceAll("_", " ")}</span>}</div>
          <input required disabled={locked} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="rounded-xl border p-3 disabled:bg-slate-50" />
          <input required disabled={locked} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City / service area" className="rounded-xl border p-3 disabled:bg-slate-50" />
          <input disabled={locked} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} placeholder="Bike / Auto / Car / Mini truck" className="rounded-xl border p-3 disabled:bg-slate-50" />
          <select disabled={locked} value={form.registration_type} onChange={(e) => setForm({ ...form, registration_type: e.target.value })} className="rounded-xl border bg-white p-3 disabled:bg-slate-50"><option value="NO_VEHICLE">No vehicle yet</option><option value="TRANSPORT">Transport / commercial</option><option value="NON_TRANSPORT">Private / non-transport</option></select>
          <div className="md:col-span-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SERVICES.map(([value,label]) => <label key={value} className="flex items-center gap-2 rounded-xl border p-3 text-sm font-bold"><input type="checkbox" disabled={locked} checked={form.requested_services.includes(value)} onChange={() => setForm((current) => ({ ...current, requested_services: current.requested_services.includes(value) ? current.requested_services.filter((item) => item !== value) : [...current.requested_services, value] }))} />{label}</label>)}</div>
          {!locked && <button disabled={busy === "save"} className="md:col-span-2 rounded-xl bg-[#075E45] py-3 font-black text-white disabled:opacity-50">{busy === "save" ? "Saving…" : "Save verification profile"}</button>}
        </form>

        {application && <section className="mt-5 rounded-3xl bg-white p-6">
          <h2 className="text-xl font-black">2. Required documents</h2>
          <p className="mt-2 text-sm text-slate-600">Do not type document numbers into the website. Upload only through this secure area.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">{visibleDocuments.map(([type,label,requiresExpiry]) => {
            const record = documents.find((item) => item.document_type === type);
            return <div key={type} className="rounded-2xl border p-4">
              <div className="flex justify-between gap-3"><span className="font-black">{label}</span><span className="text-xs font-black text-slate-500">{record?.status || "NOT UPLOADED"}</span></div>
              {record?.review_note && <p className="mt-2 text-xs text-amber-800">{record.review_note}</p>}
              {!locked && record?.status !== "APPROVED" && <>
                <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFiles((current) => ({ ...current, [type]: e.target.files?.[0] || null }))} className="mt-3 block w-full text-xs" />
                {requiresExpiry && <input type="date" value={expiry[type] || record?.expiry_date || ""} onChange={(e) => setExpiry((current) => ({ ...current, [type]: e.target.value }))} className="mt-2 w-full rounded-lg border p-2 text-sm" />}
                <button type="button" disabled={!files[type] || Boolean(busy)} onClick={() => void upload(type, requiresExpiry)} className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{busy === type ? "Uploading…" : "Upload securely"}</button>
              </>}
            </div>;
          })}</div>
          {!locked && <button type="button" disabled={Boolean(busy)} onClick={() => void submit()} className="mt-5 w-full rounded-xl bg-[#075E45] py-3 font-black text-white disabled:opacity-50">{busy === "submit" ? "Submitting…" : "Submit for Zeshu review"}</button>}
        </section>}

        <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <strong>Bike Taxi:</strong> passenger-bike activation is not part of this flow. Bike Courier is separate and can proceed through document verification.
        </section>
      </div>
    </main>
  );
}
