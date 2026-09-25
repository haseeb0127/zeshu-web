"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import LocationSelector, { type LocationSelection } from "@/app/components/LocationSelector";
import { LanguageSwitcher } from "@/app/components/CustomerLanguageProvider";
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

type Quote = {
  distance_km?: number;
  duration_minutes?: number;
  fare?: number | null;
  platform_fee?: number | null;
  driver_payout?: number | null;
  source?: string;
};

type RecentPlace = {
  latitude: number;
  longitude: number;
  displayAddress: string;
  state?: string;
  city?: string;
};

const RECENT_KEY = "zeshu-move-recent-places";
const TELANGANA_CENTER = { latitude: 17.80, longitude: 79.20 };

const pretty = (value: string) => value.replaceAll("_", " ");
const display = (location: LocationSelection | null, fallback: string) =>
  location?.displayAddress
  || location?.addressDetails?.formattedAddress
  || location?.addressDetails?.addressLine
  || fallback;

const toRecent = (location: LocationSelection): RecentPlace => ({
  latitude: location.latitude,
  longitude: location.longitude,
  displayAddress: display(location, "Selected location"),
  state: location.addressDetails?.state,
  city: location.addressDetails?.city,
});

const recentToLocation = (place: RecentPlace): LocationSelection => ({
  latitude: place.latitude,
  longitude: place.longitude,
  accuracy: null,
  source: "MANUAL_PIN",
  displayAddress: place.displayAddress,
  addressDetails: {
    formattedAddress: place.displayAddress,
    addressLine: place.displayAddress.split(",")[0]?.trim() || place.displayAddress,
    city: place.city || "",
    state: place.state || "Telangana",
    postalCode: "",
  },
});

export default function MoveMatchingCustomer({ serviceLabel, serviceCode }: Props) {
  const [readiness, setReadiness] = useState<{ request_enabled?: boolean; matching_enabled?: boolean; compliance_gate?: boolean } | null>(null);
  const [pickup, setPickup] = useState<LocationSelection | null>(null);
  const [dropoff, setDropoff] = useState<LocationSelection | null>(null);
  const [selecting, setSelecting] = useState<"pickup" | "dropoff" | null>(null);
  const [details, setDetails] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [staging, setStaging] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "ready" | "blocked" | "idle">("detecting");
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([]);

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token || "";

  const reverseLookup = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
        { headers: { "Accept-Language": "en-IN,en;q=0.9" } },
      );
      if (!response.ok) return null;
      const result = await response.json();
      const raw = result?.address && typeof result.address === "object" ? result.address : {};
      const city = String(raw.city || raw.town || raw.village || raw.municipality || raw.county || "");
      const state = String(raw.state || "");
      const postalCode = String(raw.postcode || "");
      const addressLine = [raw.house_number, raw.road, raw.neighbourhood || raw.suburb].filter(Boolean).join(", ");
      const formattedAddress = String(result?.display_name || "").trim();
      return {
        formattedAddress,
        addressLine: addressLine || formattedAddress.split(",").slice(0, 2).join(", ").trim(),
        city,
        state,
        postalCode,
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setStaging(window.location.hostname === "zeshu-web-staging.asif-mohammed0127.workers.dev");
    try {
      const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(parsed)) setRecentPlaces(parsed.slice(0, 4));
    } catch {
      setRecentPlaces([]);
    }

    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
      setAuthReady(true);
    });

    void fetch("/api/move/matching/readiness", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setReadiness(payload?.services?.[serviceCode] || {}))
      .catch(() => setReadiness({}));

    if (!navigator.geolocation) {
      setGpsStatus("blocked");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);
        const accuracy = Number(position.coords.accuracy);
        const initial: LocationSelection = {
          latitude,
          longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          source: "DEVICE",
          displayAddress: "Current location",
        };
        setPickup(initial);
        setGpsStatus("ready");
        void reverseLookup(latitude, longitude).then((addressDetails) => {
          if (!addressDetails) return;
          setPickup((current) => current ? {
            ...current,
            displayAddress: addressDetails.formattedAddress || "Current location",
            addressDetails,
          } : current);
        });
      },
      () => setGpsStatus("blocked"),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
    );
  }, [reverseLookup, serviceCode]);

  const loadStatus = useCallback(async (id: string) => {
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
  }, []);

  useEffect(() => {
    if (!requestId) return;
    void loadStatus(requestId);
    const timer = window.setInterval(() => void loadStatus(requestId), 3000);
    return () => window.clearInterval(timer);
  }, [loadStatus, requestId]);

  const loadQuote = useCallback(async () => {
    if (!signedIn || !pickup || !dropoff || !readiness?.request_enabled || readiness.compliance_gate) {
      setQuote(null);
      return;
    }
    setBusy((current) => current || "quote");
    const token = await getToken();
    const response = await fetch("/api/move/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        service_code: serviceCode,
        pickup_latitude: pickup.latitude,
        pickup_longitude: pickup.longitude,
        pickup_state: pickup.addressDetails?.state,
        dropoff_latitude: dropoff.latitude,
        dropoff_longitude: dropoff.longitude,
        dropoff_state: dropoff.addressDetails?.state,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy((current) => current === "quote" ? "" : current);
    if (response.ok) setQuote(payload.quote || null);
    else if (!payload.compliance_gate) setError(payload.error || "Could not calculate the route estimate.");
  }, [dropoff, pickup, readiness?.compliance_gate, readiness?.request_enabled, serviceCode, signedIn]);

  useEffect(() => {
    if (pickup && dropoff && signedIn) void loadQuote();
  }, [dropoff, loadQuote, pickup, signedIn]);

  const saveRecent = (location: LocationSelection) => {
    const next = toRecent(location);
    const items = [next, ...recentPlaces.filter((place) => place.displayAddress !== next.displayAddress)].slice(0, 4);
    setRecentPlaces(items);
    try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(items)); } catch { /* local history is optional */ }
  };

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
    setSignedIn(true); setOtp(""); setOtpSent(false); setNotice("Signed in.");
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

  const submit = async () => {
    if (!pickup || !dropoff) { setError("Choose pickup and destination."); return; }
    const token = await getToken();
    if (!token) { setSignedIn(false); setError("Sign in before requesting a match."); return; }

    setBusy("request"); setError(""); setNotice("");
    const response = await fetch("/api/move/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        service_code: serviceCode,
        pickup_address: display(pickup, "Selected pickup"),
        pickup_latitude: pickup.latitude,
        pickup_longitude: pickup.longitude,
        pickup_state: pickup.addressDetails?.state,
        dropoff_address: display(dropoff, "Selected destination"),
        dropoff_latitude: dropoff.latitude,
        dropoff_longitude: dropoff.longitude,
        dropoff_state: dropoff.addressDetails?.state,
        details,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) { setError(payload.error || "Could not start matching."); return; }
    setRequestId(payload.request_id);
    setQuote(payload.quote || quote);
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
  const canCancel = active && ["SEARCHING", "OFFERED", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "ARRIVED"].includes(active.status);
  const terminal = active && ["COMPLETED", "CANCELLED", "NO_DRIVER"].includes(active.status);

  const mapCenter = useMemo(() => {
    const driverLat = Number(status?.driver?.current_latitude);
    const driverLng = Number(status?.driver?.current_longitude);
    if (Number.isFinite(driverLat) && Number.isFinite(driverLng)) return { latitude: driverLat, longitude: driverLng };
    if (pickup && dropoff) return { latitude: (pickup.latitude + dropoff.latitude) / 2, longitude: (pickup.longitude + dropoff.longitude) / 2 };
    if (pickup) return { latitude: pickup.latitude, longitude: pickup.longitude };
    return TELANGANA_CENTER;
  }, [dropoff, pickup, status?.driver?.current_latitude, status?.driver?.current_longitude]);

  const mapPreviewUrl = useMemo(() => {
    const delta = pickup && dropoff ? Math.max(0.035, Math.min(0.25, Math.max(Math.abs(pickup.latitude - dropoff.latitude), Math.abs(pickup.longitude - dropoff.longitude)) * 1.6)) : 0.025;
    const bbox = [mapCenter.longitude - delta, mapCenter.latitude - delta, mapCenter.longitude + delta, mapCenter.latitude + delta].join(",");
    const marker = `${mapCenter.latitude},${mapCenter.longitude}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
  }, [dropoff, mapCenter.latitude, mapCenter.longitude, pickup]);

  const mapDriverUrl = useMemo(() => {
    const lat = Number(status?.driver?.current_latitude);
    const lng = Number(status?.driver?.current_longitude);
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
      : "";
  }, [status?.driver?.current_latitude, status?.driver?.current_longitude]);

  if (!authReady || readiness === null) {
    return <div className="fixed inset-0 z-[120] grid place-items-center bg-[#eff6f1]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#075E45] border-t-transparent" /></div>;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-[#e9f0eb] text-slate-950">
      <iframe
        title="Zeshu Move map"
        src={mapPreviewUrl}
        className="absolute inset-0 h-full w-full border-0"
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/5" />

      <div className="absolute left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex items-center justify-between gap-3">
        <Link href="/move" className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-900 shadow-lg" aria-label="Back to Move"><ArrowLeft size={21} /></Link>
        <div className="rounded-full bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">Zeshu Move</p>
          <p className="text-sm font-black">{serviceLabel}</p>
        </div>
        <div className="rounded-full bg-white shadow-lg"><LanguageSwitcher compact /></div>
      </div>

      {pickup && <div className="pointer-events-none absolute left-1/2 top-[34%] z-10 -translate-x-1/2">
        <div className="rounded-full bg-[#075E45] px-4 py-2 text-xs font-black text-white shadow-lg">Pickup point</div>
        <div className="mx-auto h-7 w-1 bg-[#075E45]" />
        <div className="mx-auto h-5 w-5 rounded-full border-4 border-white bg-[#075E45] shadow" />
      </div>}

      <div className="absolute inset-x-0 bottom-0 z-20 max-h-[68dvh] overflow-y-auto rounded-t-[32px] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_50px_rgba(15,23,42,.18)] md:left-1/2 md:right-auto md:w-[520px] md:-translate-x-1/2">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

        {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-xs font-bold leading-5 text-red-700">{error}</p>}
        {notice && <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-800">{notice}</p>}

        {active ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#075E45]">{serviceLabel}</p>
                <h1 className="mt-1 text-2xl font-black">{pretty(active.status)}</h1>
              </div>
              {active.quoted_fare != null && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-800">₹{Number(active.quoted_fare).toFixed(0)}</span>}
            </div>

            {["SEARCHING", "OFFERED"].includes(active.status) && <div className="mt-4 rounded-2xl bg-blue-50 p-4"><div className="flex items-center gap-2 font-black text-blue-900"><LocateFixed className="animate-pulse" size={18} />Finding nearby verified partners…</div><p className="mt-1 text-xs leading-5 text-blue-800">Starting with the closest available partners, then expanding the search radius.</p></div>}
            {active.status === "NO_DRIVER" && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"><strong>No verified partner accepted in time.</strong><p className="mt-1">You were not charged. Try again when more partners are online.</p></div>}

            {status?.driver && <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Your verified partner</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div><p className="text-lg font-black">{status.driver.full_name}</p><p className="text-sm text-slate-600">{status.driver.vehicle_number || "Verified vehicle"}</p></div>
                {mapDriverUrl && <a href={mapDriverUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"><Navigation size={14} />Track</a>}
              </div>
            </div>}

            {status?.start_otp && ["DRIVER_ASSIGNED", "DRIVER_ARRIVING", "ARRIVED"].includes(active.status) && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-center"><p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Start OTP</p><p className="mt-1 text-3xl font-black tracking-[.3em] text-emerald-950">{status.start_otp}</p><p className="mt-1 text-[11px] text-emerald-800">Share only after you verify the correct partner and vehicle.</p></div>}

            <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex gap-2"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#075E45]" /><span>{active.pickup_address}</span></div>
              <div className="ml-1 h-5 border-l-2 border-dashed border-slate-300" />
              <div className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-red-500" /><span>{active.dropoff_address}</span></div>
              {active.distance_km != null && <p className="mt-1 text-xs font-bold text-slate-500">{Number(active.distance_km).toFixed(1)} km · ~{active.duration_minutes} min</p>}
            </div>

            {canCancel && <button disabled={busy === "cancel"} onClick={() => void cancel()} className="mt-4 w-full rounded-2xl bg-red-50 py-3.5 text-sm font-black text-red-700 disabled:opacity-50"><X size={15} className="mr-1 inline" />Cancel request</button>}
            {terminal && <button onClick={() => { setRequestId(""); setStatus(null); setQuote(null); setNotice(""); setDropoff(null); }} className="mt-3 w-full rounded-2xl bg-[#075E45] py-3.5 text-sm font-black text-white">{active.status === "COMPLETED" ? "Book another" : "Try again"}</button>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#075E45]">Pickup now</p>
                <button type="button" onClick={() => setSelecting("pickup")} className="mt-1 max-w-[280px] truncate text-left text-sm font-black text-slate-800">
                  {gpsStatus === "detecting" && !pickup ? "Finding your location…" : display(pickup, gpsStatus === "blocked" ? "Set pickup location" : "Current location")}
                </button>
              </div>
              <button type="button" onClick={() => setSelecting("pickup")} className="rounded-full bg-emerald-50 p-3 text-[#075E45]" aria-label="Change pickup"><LocateFixed size={18} /></button>
            </div>

            {!dropoff ? (
              <>
                <button type="button" onClick={() => setSelecting("dropoff")} className="mt-4 flex min-h-16 w-full items-center gap-3 rounded-[22px] bg-slate-100 px-4 text-left shadow-inner">
                  <Search size={24} className="shrink-0 text-slate-900" />
                  <span className="text-xl font-black text-slate-950">Where are you going?</span>
                  <ChevronRight className="ml-auto text-slate-400" />
                </button>

                {recentPlaces.length > 0 && <div className="mt-5">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Recent</p>
                  <div className="mt-2 divide-y divide-slate-100">
                    {recentPlaces.map((place) => <button key={place.displayAddress} type="button" onClick={() => setDropoff(recentToLocation(place))} className="flex w-full items-center gap-3 py-3 text-left">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100"><Clock3 size={17} /></div>
                      <div className="min-w-0"><p className="truncate text-sm font-black">{place.displayAddress.split(",")[0]}</p><p className="truncate text-xs text-slate-500">{place.displayAddress}</p></div>
                      <ChevronRight size={17} className="ml-auto shrink-0 text-slate-300" />
                    </button>)}
                  </div>
                </div>}

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-center"><p className="text-lg">🛺</p><p className="mt-1 text-[10px] font-black">Auto</p></div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-center"><p className="text-lg">🚕</p><p className="mt-1 text-[10px] font-black">Cab</p></div>
                  <div className="rounded-2xl bg-amber-50 p-3 text-center"><p className="text-lg">📦</p><p className="mt-1 text-[10px] font-black">Courier</p></div>
                </div>
              </>
            ) : (
              <>
                <div className="mt-4 rounded-[22px] border border-slate-200 p-4">
                  <button type="button" onClick={() => setSelecting("pickup")} className="flex w-full items-start gap-3 text-left">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#075E45]" />
                    <div className="min-w-0"><p className="text-[10px] font-black uppercase text-slate-400">Pickup</p><p className="truncate text-sm font-bold">{display(pickup, "Choose pickup")}</p></div>
                  </button>
                  <div className="ml-1.5 my-1 h-5 border-l-2 border-dashed border-slate-300" />
                  <button type="button" onClick={() => setSelecting("dropoff")} className="flex w-full items-start gap-3 text-left">
                    <MapPin size={17} className="mt-0.5 shrink-0 text-red-500" />
                    <div className="min-w-0"><p className="text-[10px] font-black uppercase text-slate-400">Destination</p><p className="truncate text-sm font-bold">{display(dropoff, "Choose destination")}</p></div>
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-black"><Clock3 size={14} />Now</div>
                  <button type="button" onClick={() => setShowDetails((value) => !value)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black">{showDetails ? "Hide note" : serviceCode === "BIKE_COURIER" || serviceCode === "GOODS_DRIVER" ? "Add package details" : "Add note"}</button>
                </div>

                {showDetails && <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={2} maxLength={1000} placeholder={serviceCode === "BIKE_COURIER" || serviceCode === "GOODS_DRIVER" ? "Package size, weight, item type…" : "Optional trip note"} className="mt-3 w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-[#075E45]" />}

                {readiness.compliance_gate && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-black text-amber-950"><ShieldCheck size={18} />{serviceLabel} live matching is compliance-gated</div><p className="mt-1 text-xs leading-5 text-amber-900">The Uber-style matching flow is ready. Live passenger requests will open after the Telangana-compliant mobility provider setup is enabled.</p></div>}

                {!readiness.compliance_gate && !readiness.request_enabled && <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="font-black text-blue-950">Launching in this zone</p><p className="mt-1 text-xs leading-5 text-blue-800">The matching system is ready. Customer requests open only when verified partners are active nearby, so Zeshu does not promise a ride or delivery that cannot be fulfilled.</p></div>}

                {!readiness.compliance_gate && readiness.request_enabled && !signedIn && <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2"><Phone size={17} className="text-[#075E45]" /><p className="font-black">Sign in to see fare & match</p></div>
                  {staging ? <button disabled={busy === "auth"} onClick={() => void stagingLogin()} className="mt-3 w-full rounded-xl bg-[#075E45] py-3 text-sm font-black text-white">Use staging test customer</button> : <>
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="numeric" placeholder="10-digit mobile number" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm" />
                    {otpSent && <input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="6-digit OTP" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-center font-black tracking-[.25em]" />}
                    <button disabled={busy === "auth"} onClick={() => void (otpSent ? verifyOtp() : sendOtp())} className="mt-2 w-full rounded-xl bg-[#075E45] py-3 text-sm font-black text-white disabled:opacity-50">{busy === "auth" ? "Please wait…" : otpSent ? "Verify OTP" : "Send OTP"}</button>
                  </>}
                </div>}

                {!readiness.compliance_gate && readiness.request_enabled && signedIn && <div className="mt-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-sm font-black">{serviceLabel}</p><p className="mt-1 text-xs text-slate-500">{quote?.distance_km != null ? `${Number(quote.distance_km).toFixed(1)} km · ~${quote.duration_minutes} min` : busy === "quote" ? "Calculating route…" : "Route estimate"}</p></div>
                      <div className="text-right"><p className="text-xl font-black">{quote?.fare != null ? `₹${Number(quote.fare).toFixed(0)}` : "—"}</p>{quote?.platform_fee != null && <p className="text-[10px] text-slate-400">includes ₹{Number(quote.platform_fee).toFixed(0)} Zeshu fee</p>}</div>
                    </div>
                  </div>
                  <button disabled={busy === "request" || busy === "quote" || !pickup || !dropoff || quote?.fare == null} onClick={() => void submit()} className="mt-3 w-full rounded-2xl bg-[#075E45] py-4 text-base font-black text-white disabled:opacity-50">{busy === "request" ? "Finding nearby partners…" : quote?.fare != null ? `Confirm ${serviceLabel} · ₹${Number(quote.fare).toFixed(0)}` : "Waiting for fare estimate"}</button>
                  <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">No payment is captured by this matching flow yet. Only verified eligible partners are considered.</p>
                </div>}
              </>
            )}
          </>
        )}
      </div>

      <LocationSelector
        open={Boolean(selecting)}
        initial={selecting === "pickup" ? pickup : dropoff || pickup}
        mode="move"
        heading={selecting === "pickup" ? "Choose pickup point" : "Where are you going?"}
        onClose={() => setSelecting(null)}
        onConfirm={(location) => {
          if (selecting === "pickup") setPickup(location);
          if (selecting === "dropoff") {
            setDropoff(location);
            saveRecent(location);
          }
          setSelecting(null);
          setError("");
        }}
      />
    </div>
  );
}
