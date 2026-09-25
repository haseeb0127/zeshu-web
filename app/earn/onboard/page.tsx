"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bike,
  Car,
  Check,
  CheckCircle2,
  FileCheck2,
  Package,
  ShieldCheck,
  Truck,
  UploadCloud,
} from "lucide-react";
import { riderSupabase } from "../../lib/browser-supabase";

const supabase = riderSupabase();

const SERVICES = [
  { value: "DELIVERY_RIDER", label: "Delivery Rider", note: "Shop and Zeshu order delivery", icon: Package, commercial: false },
  { value: "BIKE_COURIER", label: "Bike Courier", note: "Pickup & drop parcels by bike", icon: Bike, commercial: false },
  { value: "AUTO_DRIVER", label: "Auto Driver", note: "Passenger Auto onboarding", icon: Car, commercial: true },
  { value: "CAB_DRIVER", label: "Cab / Car Driver", note: "Passenger Cab onboarding", icon: Car, commercial: true },
  { value: "GOODS_DRIVER", label: "Goods / Mini Truck", note: "Cargo and local goods movement", icon: Truck, commercial: true },
] as const;

const DOCUMENTS = [
  ["IDENTITY", "Government ID / address proof", false, "Identity and present address verification"],
  ["DRIVING_LICENCE", "Driving licence", true, "Valid for the vehicle/class you will drive"],
  ["RC", "Vehicle RC", false, "Registration details for the vehicle"],
  ["INSURANCE", "Vehicle insurance", true, "Current vehicle insurance"],
  ["FITNESS", "Fitness certificate", true, "Required for applicable commercial vehicles"],
  ["PERMIT", "Commercial / transport permit", true, "Required for Auto, Cab and Goods services"],
  ["PUC", "PUC certificate", true, "Current pollution certificate"],
  ["BANK_PROOF", "Bank / payout proof", false, "Account used for Zeshu payouts"],
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

type Eligibility = {
  id: string;
  service_code: string;
  status: string;
};

const statusLabel = (value: string) => value.replaceAll("_", " ");

export default function DriverOnboardingPage() {
  const [phase, setPhase] = useState<"checking" | "login" | "ready">("checking");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [eligibility, setEligibility] = useState<Eligibility[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    city: "Jagtial",
    requested_services: [] as string[],
    vehicle_type: "",
    registration_type: "NON_TRANSPORT",
  });
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
    setEligibility(Array.isArray(payload.eligibility) ? payload.eligibility : []);
    if (payload.application) {
      setForm({
        full_name: payload.application.full_name || "",
        city: payload.application.city || "",
        requested_services: payload.application.requested_services || [],
        vehicle_type: payload.application.vehicle_type || "",
        registration_type: payload.application.registration_type || "NON_TRANSPORT",
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
    setBusy("otp"); setError(""); setMessage("");
    const { error: authError } = await supabase.auth.signInWithOtp({ phone: `+91${digits}` });
    setBusy("");
    if (authError) { setError("Could not send OTP."); return; }
    setPhone(digits); setOtpSent(true); setMessage("OTP sent securely.");
  };

  const verifyOtp = async () => {
    const digits = normalizedPhone();
    setBusy("otp"); setError("");
    const { data, error: authError } = await supabase.auth.verifyOtp({ phone: `+91${digits}`, token: otp, type: "sms" });
    setBusy("");
    if (authError || !data.user) { setError("OTP could not be verified."); return; }
    setPhase("checking"); await load();
  };

  const hasCommercialService = form.requested_services.some((service) =>
    service === "AUTO_DRIVER" || service === "CAB_DRIVER" || service === "GOODS_DRIVER"
  );

  const toggleService = (value: string) => {
    setForm((current) => {
      const requested = current.requested_services.includes(value)
        ? current.requested_services.filter((item) => item !== value)
        : [...current.requested_services, value];
      const commercial = requested.some((service) => ["AUTO_DRIVER", "CAB_DRIVER", "GOODS_DRIVER"].includes(service));
      return { ...current, requested_services: requested, registration_type: commercial ? "TRANSPORT" : current.registration_type };
    });
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
    setApplication(payload.application); setDocuments(payload.documents || []); setEligibility(payload.eligibility || []);
    setMessage("Step 1 complete. Upload the documents shown below.");
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
      body: JSON.stringify({
        application_id: application.id,
        document_type: documentType,
        storage_path: path,
        expiry_date: expiry[documentType] || null,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) { setError(payload.error || "Could not save document record."); return; }
    setFiles((current) => ({ ...current, [documentType]: null }));
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
    if (!response.ok) {
      setError(payload.missingDocuments?.length
        ? `Still required: ${payload.missingDocuments.map((item: string) => statusLabel(item)).join(", ")}`
        : payload.error || "Could not submit.");
      return;
    }
    setMessage("Application submitted. Zeshu will review your documents and safety checks."); await load();
  };

  const locked = Boolean(application && ["UNDER_REVIEW", "VERIFIED", "SUSPENDED"].includes(application.status));

  const visibleDocuments = useMemo(() => {
    if (!application) return DOCUMENTS;
    const services = application.requested_services || [];
    return DOCUMENTS.filter(([type]) => {
      if (type === "FITNESS" || type === "PERMIT") {
        return services.some((service) => ["AUTO_DRIVER", "CAB_DRIVER", "GOODS_DRIVER"].includes(service));
      }
      if (["DRIVING_LICENCE", "RC", "INSURANCE", "PUC"].includes(type)) {
        return application.registration_type !== "NO_VEHICLE";
      }
      return true;
    });
  }, [application]);

  const uploadedCount = visibleDocuments.filter(([type]) =>
    documents.some((item) => item.document_type === type && item.status !== "REJECTED")
  ).length;
  const approvedCount = visibleDocuments.filter(([type]) =>
    documents.some((item) => item.document_type === type && item.status === "APPROVED")
  ).length;
  const activeServices = eligibility.filter((item) => item.status === "ACTIVE").length;
  const progressStep = !application ? 1
    : ["PENDING_DOCUMENTS", "ACTION_REQUIRED"].includes(application.status) ? 2
    : application.status === "UNDER_REVIEW" ? 3
    : application.status === "VERIFIED" && activeServices === 0 ? 4
    : activeServices > 0 ? 4
    : 3;

  if (phase === "checking") return <main className="grid min-h-screen place-items-center bg-[#f6faf7]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#075E45] border-t-transparent" /></main>;

  if (phase === "login") return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <ShieldCheck className="text-[#075E45]" />
        <h1 className="mt-4 text-2xl font-black">Join Zeshu as a driver or courier</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use your mobile number to start. Your verification documents stay private and are never shown to customers.</p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-black text-slate-500">
          {["Mobile", "Profile", "Documents", "Review"].map((label, index) => <div key={label}><div className={`mx-auto grid h-7 w-7 place-items-center rounded-full ${index === 0 ? "bg-[#075E45] text-white" : "bg-slate-100"}`}>{index + 1}</div><p className="mt-1">{label}</p></div>)}
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</p>}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="10-digit mobile number" className="mt-5 w-full rounded-xl border p-3" />
        {otpSent && <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} inputMode="numeric" placeholder="6-digit OTP" className="mt-3 w-full rounded-xl border p-3 text-center font-black tracking-[.3em]" />}
        <button disabled={busy === "otp"} onClick={() => void (otpSent ? verifyOtp() : sendOtp())} className="mt-3 w-full rounded-xl bg-[#075E45] py-3 font-black text-white disabled:opacity-50">{busy === "otp" ? "Please wait…" : otpSent ? "Verify & continue" : "Send OTP"}</button>
        <Link href="/earn" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#075E45]"><ArrowLeft size={16} /> Back</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-7">
      <div className="mx-auto max-w-5xl">
        <Link href="/earn" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]"><ArrowLeft size={16} /> Drive & Deliver</Link>

        <header className="mt-5 rounded-3xl bg-[#083b27] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-200">Earn with Zeshu</p>
          <h1 className="mt-2 text-3xl font-black">Join in 4 simple steps</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d7f0df]">Choose your service, upload only the documents required for it, complete Zeshu verification, then go online when that service is activated in your area.</p>
        </header>

        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {[
            ["Service profile", 1],
            ["Documents", 2],
            ["Zeshu review", 3],
            ["Activation", 4],
          ].map(([label, step]) => {
            const n = Number(step);
            const complete = progressStep > n || (n === 4 && activeServices > 0);
            const current = progressStep === n;
            return <div key={String(label)} className={`rounded-2xl border p-3 ${current ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2">
                <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${complete ? "bg-[#075E45] text-white" : current ? "bg-emerald-200 text-emerald-950" : "bg-slate-100 text-slate-500"}`}>{complete ? <Check size={14} /> : n}</div>
                <span className="text-xs font-black">{label}</span>
              </div>
            </div>;
          })}
        </div>

        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {message && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</p>}

        <form onSubmit={save} className="mt-5 rounded-3xl bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase text-[#075E45]">Step 1</p><h2 className="text-xl font-black">Choose how you want to earn</h2></div>
            {application && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{statusLabel(application.status)}</span>}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              const selected = form.requested_services.includes(service.value);
              return <button type="button" key={service.value} disabled={locked} onClick={() => toggleService(service.value)}
                className={`rounded-2xl border p-4 text-left transition disabled:opacity-60 ${selected ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3"><Icon size={22} className="text-[#075E45]" />{selected && <CheckCircle2 size={18} className="text-[#075E45]" />}</div>
                <p className="mt-3 font-black">{service.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{service.note}</p>
                {service.commercial && <p className="mt-2 text-[10px] font-black uppercase text-amber-700">Commercial vehicle documents required</p>}
              </button>;
            })}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-black uppercase text-slate-500">Full name<input required disabled={locked} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="As per your documents" className="mt-2 w-full rounded-xl border p-3 text-sm normal-case text-slate-900 disabled:bg-slate-50" /></label>
            <label className="text-xs font-black uppercase text-slate-500">City / service area<input required disabled={locked} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Jagtial / Karimnagar / Hyderabad" className="mt-2 w-full rounded-xl border p-3 text-sm normal-case text-slate-900 disabled:bg-slate-50" /></label>
            <label className="text-xs font-black uppercase text-slate-500">Vehicle<input disabled={locked} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} placeholder="Bike / Auto / Car / Mini truck" className="mt-2 w-full rounded-xl border p-3 text-sm normal-case text-slate-900 disabled:bg-slate-50" /></label>
            <label className="text-xs font-black uppercase text-slate-500">Registration type
              <select disabled={locked || hasCommercialService} value={form.registration_type} onChange={(e) => setForm({ ...form, registration_type: e.target.value })} className="mt-2 w-full rounded-xl border bg-white p-3 text-sm normal-case text-slate-900 disabled:bg-slate-50">
                <option value="NON_TRANSPORT">Private / non-transport</option>
                <option value="TRANSPORT">Transport / commercial</option>
              </select>
            </label>
          </div>

          {hasCommercialService && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Auto, Cab or Goods selected:</strong> Zeshu will require a transport/commercial registration plus the applicable permit and fitness documents before verification.</p>}

          {!locked && <button disabled={busy === "save"} className="mt-5 w-full rounded-xl bg-[#075E45] py-3.5 font-black text-white disabled:opacity-50">{busy === "save" ? "Saving…" : application ? "Save changes & continue" : "Continue to documents"}</button>}
        </form>

        {application && <section className="mt-5 rounded-3xl bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-black uppercase text-[#075E45]">Step 2</p><h2 className="text-xl font-black">Upload only what your service needs</h2><p className="mt-1 text-sm text-slate-600">JPG, PNG or PDF up to 8 MB. Your files stay private.</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black">{uploadedCount}/{visibleDocuments.length} uploaded · {approvedCount} approved</span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#075E45]" style={{ width: `${visibleDocuments.length ? Math.round((uploadedCount / visibleDocuments.length) * 100) : 0}%` }} /></div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">{visibleDocuments.map(([type,label,requiresExpiry,why]) => {
            const record = documents.find((item) => item.document_type === type);
            const approved = record?.status === "APPROVED";
            return <div key={type} className={`rounded-2xl border p-4 ${approved ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
              <div className="flex justify-between gap-3"><div><span className="font-black">{label}</span><p className="mt-1 text-xs leading-5 text-slate-500">{why}</p></div><span className={`shrink-0 text-[10px] font-black ${approved ? "text-emerald-700" : "text-slate-500"}`}>{approved ? "APPROVED ✓" : record?.status || "REQUIRED"}</span></div>
              {record?.review_note && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{record.review_note}</p>}
              {!locked && !approved && <>
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-black"><UploadCloud size={16} />{files[type] ? files[type]?.name : "Choose file"}<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFiles((current) => ({ ...current, [type]: e.target.files?.[0] || null }))} className="hidden" /></label>
                {requiresExpiry && <label className="mt-2 block text-[10px] font-black uppercase text-slate-400">Expiry date<input type="date" value={expiry[type] || record?.expiry_date || ""} onChange={(e) => setExpiry((current) => ({ ...current, [type]: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm normal-case text-slate-900" /></label>}
                <button type="button" disabled={!files[type] || Boolean(busy)} onClick={() => void upload(type, requiresExpiry)} className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-black text-white disabled:opacity-50">{busy === type ? "Uploading…" : "Upload securely"}</button>
              </>}
            </div>;
          })}</div>

          {!locked && <button type="button" disabled={Boolean(busy) || uploadedCount < visibleDocuments.length} onClick={() => void submit()} className="mt-5 w-full rounded-xl bg-[#075E45] py-3.5 font-black text-white disabled:opacity-50">{busy === "submit" ? "Submitting…" : uploadedCount < visibleDocuments.length ? `Upload ${visibleDocuments.length - uploadedCount} more document(s)` : "Submit for Zeshu review"}</button>}
        </section>}

        {application && <section className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-5"><p className="text-xs font-black uppercase text-[#075E45]">Step 3</p><h2 className="mt-1 text-lg font-black">Zeshu review</h2><p className="mt-2 text-sm leading-6 text-slate-600">{application.status === "UNDER_REVIEW" ? "Your documents are under review. Zeshu checks identity, licence, vehicle documents, payout details and the safety checks required for your service." : application.status === "ACTION_REQUIRED" ? "One or more items need attention. Replace the marked document and submit again." : application.status === "VERIFIED" ? "Verification complete." : "Submit all required documents to begin review."}</p></div>
          <div className="rounded-3xl bg-white p-5"><p className="text-xs font-black uppercase text-[#075E45]">Step 4</p><h2 className="mt-1 text-lg font-black">Service activation</h2>{activeServices > 0 ? <p className="mt-2 flex items-center gap-2 text-sm font-black text-emerald-700"><FileCheck2 size={18} />{activeServices} service(s) active. Open the Rider dashboard and go online.</p> : <p className="mt-2 text-sm leading-6 text-slate-600">{application.status === "VERIFIED" ? "Your profile is verified. Zeshu activates eligible services when operations are ready in your area." : "Activation appears after successful verification."}</p>}</div>
        </section>}

        <section className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
          <strong>Passenger services:</strong> Auto and Cab applicants can complete document verification now, but live passenger dispatch is activated only when Zeshu's compliant passenger-service setup is ready for that area. Passenger Bike Taxi is not part of this onboarding flow.
        </section>
      </div>
    </main>
  );
}
