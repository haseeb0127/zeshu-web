"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, LocateFixed, MapPin, Navigation, Phone, ShieldCheck, X } from "lucide-react";
import LocationSelector, { type LocationSelection } from "@/app/components/LocationSelector";
import { customerSupabase } from "@/app/lib/browser-supabase";

const supabase = customerSupabase();

type Props = {
  serviceLabel: string;
  serviceCode: "BIKE_COURIER" | "GOODS_DRIVER" | "AUTO_DRIVER" | "CAB_DRIVER";
};

type RequestStatus = {
  request: {
    id: string;
    service_code: string;
    status: string;
    pickup_address: string;
    dropoff_address: string;
    distance_km: number | null;
    duration_minutes: number | null;
    quoted_fare: number | null;
    platform_fee: number | null;
    search_expires_at: string;
  };
  driver: {
    id: string;
    full_name: string;
    vehicle_number: string | null;
    current_latitude: number | null;
    current_longitude: number | null;
    location_updated_at: string | null;
  } | null;
  start_otp: string | null;
};

const pretty = (value: string) => value.replaceAll("_", " ");

export default function MoveMatchingCustomer({ serviceLabel, serviceCode }: Props) {
  const [readiness, setReadiness] = useState<{ request_enabled?: boolean; compliance_gate?: boolean } | null>(null);
  const [pickup, setPickup] = useState<LocationSelection | null>(null);
  const [dropoff, setDropoff] = useState<LocationSelection | null>(null);
  const [selecting, setSelecting] = useState<"pickup" | "dropoff" | null>(null);
  const [details, setDetails] = useState("");
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [quote, setQuote] = useState<{ distance_km?: number; duration_minutes?: number; fare?: number; platform_fee?: number } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [staging, setStaging] = useState(false);

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token || "";

  useEffect(() => {
    setStaging(window.location.hostname === "zeshu-web-staging.asif-mohammed0127.workers.dev");
    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
      setAuthReady(true);
    });
    void fetch("/api/move/matching/readiness", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setReadiness(payload?.services?.[serviceCode] || {}))
      .catch(() => setReadiness({}));
  }, [serviceCode]);

  const loadStatus = async (id = requestId) => {
    if (!id) return;
    const token = await getToken();
    if (!token) return;
    const response = await fetch(`/api/move/dispatch?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) setRequestId("");
      return;
    }
    setStatus(payload as RequestStatus);
  };

  useEffect(() => {
    if (!requestId) return;
    void loadStatus(requestId);
    const timer = window.setInterval(() => void loadStatus(requestId), 3000);
    return () => window.clearInterval(timer);
  }, [requestId]);

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^\d{10}$/.test(digits)) { setError("Enter a valid 10-digit mobile number."); return; }
    setBusy("auth"); setError(""); setNotice("");
    const { error: authError } = await supabase.auth.signInWithOtp({ phone: `+91${digits}` });
    setBusy("");
    if (authError) { setError("Could not send OTP. Please try again."); return; }
    setPhone(digits); setOtpSent(true); setNotice("OTP sent securely.");
  };

  const verifyOtp = async () => {
    const digits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^\d{10}$/.test(digits) || !/^\d{6}$/.test(otp)) { setError("Enter your phone and 6-digit OTP."); return; }
    setBusy("auth"); setError("");
    const { data, error: authError } = await supabase.auth.verifyOtp({ phone: `+91${digits}`, token: otp, type: "sms" });
    setBusy("");
    if (authError || !data.user) { setError("OTP could not be verified."); return; }
    setSignedIn(true); setOtp(""); setOtpSent(false); setNotice("Signed in. You can request a match now.");
  };

  const stagingLogin = async () => {
    setBusy("auth"); setError("");
    try {
      const response = await fetch("/api/staging/test-session", { method: "POST" });
      const payload = await response.json();
      const { data, error: authError } = await supabase.auth.verifyOtp({ token_hash: String(payload.tokenHash || ""), type: "magiclink" });
      if (!response.ok || authError || !data.user) throw new Error("Staging sign-in failed.");
      setSignedIn(true); setNotice("Staging customer signed in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Staging sign-in failed.");
    } finally { setBusy(""); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pickup || !dropoff) { setError("Choose pickup and drop locations on the map."); return; }
    const token = await getToken();
    if (!token) { setSignedIn(false); setError("Sign in before requesting a match."); return; }

    setBusy("request"); setError(""); setNotice("");
    const response = await fetch("/api/move/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        service_code: serviceCode,
        pickup_address: pickup.displayAddress || pickup.addressDetails?.formattedAddress || "Selected pickup",
        pickup_latitude: pickup.latitude,
        pickup_longitude: pickup.longitude,
        dropoff_address: dropoff.displayAddress || dropoff.addressDetails?.formattedAddress || "Selected drop",
        dropoff_latitude: dropoff.latitude,
        dropoff_longitude: dropoff.longitude,
        details,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) { setError(payload.error || "Could not start matching."); return; }
    setRequestId(payload.request_id);
    setQuote(payload.quote || null);
    setNotice("Looking for the nearest verified Zeshu partner…");
  };

  const cancel = async () => {
    if (!requestId) return;
    const token = await getToken();
    setBusy("cancel"); setError("");
    const response = await fetch(`/api/move/dispatch?id=${encodeURIComponent(requestId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusy("");
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Could not cancel.");
      return;
    }
    await loadStatus(requestId);
  };

  const active = status?.request;
  const canCancel = active && ["SEARCHING","OFFERED","DRIVER_ASSIGNED","DRIVER_ARRIVING","ARRIVED"].includes(active.status);
  const terminal = active && ["COMPLETED","CANCELLED","NO_DRIVER"].includes(active.status);
  const mapDriverUrl = useMemo(() => {
    const lat = Number(status?.driver?.current_latitude);
    const lng = Number(status?.driver?.current_longitude);
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
      : "";
  }, [status?.driver?.current_latitude, status?.driver?.current_longitude]);

  if (!authReady || readiness === null) {
    return <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-slate-500">Checking live matching…</div>;
  }

  if (readiness.compliance_gate) {
    return <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><ShieldCheck className="text-amber-700"/><h2 className="mt-3 text-xl font-black">{serviceLabel} matching is built but compliance-gated</h2><p className="mt-2 text-sm leading-6 text-amber-900">Zeshu will switch on live passenger matching only after the Telangana-compliant mobility provider/aggregator setup is active. The same matching engine is already ready for this service.</p></section>;
  }

  if (!readiness.request_enabled) {
    return <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6"><ShieldCheck className="text-blue-700"/><h2 className="mt-3 text-xl font-black">Live matching is ready, but not open for requests yet</h2><p className="mt-2 text-sm leading-6 text-slate-700">Zeshu will open this when verified partners for {serviceLabel} are activated and service operations are ready. You can still register interest or contact support.</p></section>;
  }

  if (!signedIn) {
    return <section className="rounded-3xl bg-white p-6 shadow-sm">
      <Phone className="text-[#075E45]"/>
      <h2 className="mt-3 text-2xl font-black">Sign in to request {serviceLabel}</h2>
      <p className="mt-2 text-sm text-slate-600">Your phone account protects trip details and lets only you see your matched driver and trip OTP.</p>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</p>}
      {staging && <button disabled={busy === "auth"} onClick={() => void stagingLogin()} className="mt-5 w-full rounded-xl bg-emerald-700 py-3 font-black text-white">Use staging test customer</button>}
      {!staging && <>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="10-digit mobile number" className="mt-5 w-full rounded-xl border border-slate-200 p-3"/>
        {otpSent && <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" placeholder="6-digit OTP" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-center font-black tracking-[.25em]"/>}
        <button disabled={busy === "auth"} onClick={() => void (otpSent ? verifyOtp() : sendOtp())} className="mt-3 w-full rounded-xl bg-[#075E45] py-3 font-black text-white disabled:opacity-50">{busy === "auth" ? "Please wait…" : otpSent ? "Verify OTP" : "Send OTP"}</button>
      </>}
    </section>;
  }

  if (active) {
    return <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-wide text-[#075E45]">{serviceLabel}</p><h2 className="mt-1 text-2xl font-black">{pretty(active.status)}</h2></div>
        {active.quoted_fare != null && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-800">₹{Number(active.quoted_fare).toFixed(0)}</span>}
      </div>
      {["SEARCHING","OFFERED"].includes(active.status) && <div className="mt-5 rounded-2xl bg-blue-50 p-4"><div className="flex items-center gap-2 font-black text-blue-900"><LocateFixed className="animate-pulse" size={18}/>Finding nearby verified partners…</div><p className="mt-2 text-xs leading-5 text-blue-800">Zeshu starts with the nearest partners and expands the radius if nobody accepts.</p></div>}
      {active.status === "NO_DRIVER" && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"><strong>No verified partner accepted in time.</strong><p className="mt-1">You were not charged. Try again later or change the service.</p></div>}
      {status?.driver && <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-black uppercase text-slate-400">Matched partner</p>
        <p className="mt-1 text-lg font-black">{status.driver.full_name}</p>
        <p className="text-sm text-slate-600">{status.driver.vehicle_number || "Verified vehicle"}</p>
        {mapDriverUrl && <a href={mapDriverUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white"><Navigation size={14}/>View live driver location</a>}
      </div>}
      {status?.start_otp && ["DRIVER_ASSIGNED","DRIVER_ARRIVING","ARRIVED"].includes(active.status) && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center"><p className="text-xs font-black uppercase text-emerald-700">Trip start OTP</p><p className="mt-1 text-3xl font-black tracking-[.3em] text-emerald-950">{status.start_otp}</p><p className="mt-2 text-xs text-emerald-800">Share only after the correct driver and vehicle are physically with you.</p></div>}
      <div className="mt-5 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm"><div><strong>Pickup:</strong> {active.pickup_address}</div><div><strong>Drop:</strong> {active.dropoff_address}</div>{active.distance_km != null && <div><strong>Estimated route:</strong> {Number(active.distance_km).toFixed(1)} km · ~{active.duration_minutes} min</div>}{active.platform_fee != null && <div className="text-xs text-slate-500">Zeshu platform fee included: ₹{Number(active.platform_fee).toFixed(0)}</div>}</div>
      {canCancel && <button disabled={busy === "cancel"} onClick={() => void cancel()} className="mt-4 w-full rounded-xl bg-red-50 py-3 text-sm font-black text-red-700 disabled:opacity-50"><X size={15} className="mr-1 inline"/>Cancel request</button>}
      {terminal && <button onClick={() => { setRequestId(""); setStatus(null); setQuote(null); setNotice(""); }} className="mt-3 w-full rounded-xl bg-[#075E45] py-3 text-sm font-black text-white">{active.status === "COMPLETED" ? "Book another" : "Try again"}</button>}
    </section>;
  }

  return <>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    {notice && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</p>}
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black">Find a verified {serviceLabel} partner</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Choose pickup and drop on the map. Zeshu will calculate the route, show the fare, and match the nearest eligible online partner.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button type="button" onClick={() => setSelecting("pickup")} className="rounded-2xl border border-slate-200 p-4 text-left"><MapPin size={18} className="text-[#075E45]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Pickup</p><p className="mt-1 text-sm font-bold">{pickup?.displayAddress || "Choose pickup location"}</p></button>
        <button type="button" onClick={() => setSelecting("dropoff")} className="rounded-2xl border border-slate-200 p-4 text-left"><MapPin size={18} className="text-red-500"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Drop</p><p className="mt-1 text-sm font-bold">{dropoff?.displayAddress || "Choose drop location"}</p></button>
      </div>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000} placeholder="Package size, weight, item type or special instructions" className="mt-4 w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm"/>
      <button disabled={busy === "request" || !pickup || !dropoff} className="mt-4 w-full rounded-xl bg-[#075E45] py-3.5 font-black text-white disabled:opacity-50">{busy === "request" ? "Finding partners…" : "Find nearby partner"}</button>
      {quote && <p className="mt-3 text-xs text-slate-500">Previous estimate: {quote.distance_km?.toFixed?.(1)} km · ₹{quote.fare}</p>}
    </form>
    <LocationSelector
      open={Boolean(selecting)}
      initial={selecting === "pickup" ? pickup : dropoff}
      onClose={() => setSelecting(null)}
      onConfirm={(location) => {
        if (selecting === "pickup") setPickup(location);
        if (selecting === "dropoff") setDropoff(location);
        setSelecting(null);
      }}
    />
  </>;
}
