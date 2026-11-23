"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MapPin, Navigation, Package, X } from "lucide-react";
import { riderSupabase } from "@/app/lib/browser-supabase";

const supabase = riderSupabase();

type Offer = {
  id: string;
  distance_to_pickup_km: number | null;
  expires_at: string;
  request: {
    id: string;
    service_code: string;
    pickup_address: string;
    dropoff_address: string;
    distance_km: number | null;
    duration_minutes: number | null;
    quoted_fare: number | null;
    driver_payout: number | null;
    details: string | null;
  };
};

type Trip = {
  id: string;
  service_code: string;
  status: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  distance_km: number | null;
  duration_minutes: number | null;
  quoted_fare: number | null;
  driver_payout: number | null;
  details: string | null;
};

const label = (value: string) => value.replaceAll("_", " ");

export default function MoveMatchingRiderPanel({ online }: { online: boolean }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const token = async () => (await supabase.auth.getSession()).data.session?.access_token || "";

  const load = useCallback(async () => {
    if (!online) {
      setOffers([]);
      return;
    }
    const accessToken = await token();
    if (!accessToken) return;
    const response = await fetch("/api/move/dispatch/rider", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return;
    setOffers(Array.isArray(payload.offers) ? payload.offers : []);
    setTrip(payload.active_trip || null);
  }, [online]);

  useEffect(() => {
    void load();
    if (!online) return;
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [load, online]);

  const act = async (action: string, payload: Record<string, unknown>) => {
    setBusy(action); setError("");
    const accessToken = await token();
    const response = await fetch("/api/move/dispatch/rider", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) { setError(result.error || "Move action failed."); return; }
    if (action === "START") setOtp("");
    await load();
  };

  const navigate = (lat: number, lng: number) => window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`,
    "_blank",
    "noopener,noreferrer",
  );

  if (!online && !trip) return null;
  if (!trip && offers.length === 0) return null;

  return (
    <section className="mb-6 rounded-[26px] border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center gap-2">
        <Package size={19} className="text-emerald-700" />
        <h2 className="font-black text-slate-900">Zeshu Move Matching</h2>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}

      {trip && (
        <article className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{label(trip.service_code)}</p>
              <h3 className="mt-1 text-lg font-black">{label(trip.status)}</h3>
            </div>
            {trip.driver_payout != null && <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">Earn ₹{Number(trip.driver_payout).toFixed(0)}</span>}
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <div><p className="text-[10px] font-black uppercase text-slate-400">Pickup</p><p className="font-bold text-slate-800">{trip.pickup_address}</p></div>
            <div><p className="text-[10px] font-black uppercase text-slate-400">Drop</p><p className="font-bold text-slate-800">{trip.dropoff_address}</p></div>
            {trip.details && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{trip.details}</p>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["DRIVER_ASSIGNED","DRIVER_ARRIVING","ARRIVED"].includes(trip.status) && <button onClick={() => navigate(Number(trip.pickup_latitude), Number(trip.pickup_longitude))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-xs font-black text-white"><Navigation size={15}/> Navigate pickup</button>}
            {trip.status === "IN_PROGRESS" && <button onClick={() => navigate(Number(trip.dropoff_latitude), Number(trip.dropoff_longitude))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-xs font-black text-white"><Navigation size={15}/> Navigate drop</button>}
            {trip.status === "DRIVER_ASSIGNED" && <button disabled={Boolean(busy)} onClick={() => void act("ARRIVING", { request_id: trip.id })} className="rounded-xl bg-blue-600 px-3 py-3 text-xs font-black text-white disabled:opacity-50">On my way</button>}
            {["DRIVER_ASSIGNED","DRIVER_ARRIVING"].includes(trip.status) && <button disabled={Boolean(busy)} onClick={() => void act("ARRIVED", { request_id: trip.id })} className="rounded-xl bg-amber-500 px-3 py-3 text-xs font-black text-white disabled:opacity-50">I arrived</button>}
          </div>
          {trip.status === "ARRIVED" && <div className="mt-3 flex gap-2"><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" maxLength={6} placeholder="Customer OTP" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-center font-black tracking-[.25em]" /><button disabled={otp.length !== 6 || Boolean(busy)} onClick={() => void act("START", { request_id: trip.id, otp })} className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50">Start</button></div>}
          {trip.status === "IN_PROGRESS" && <button disabled={Boolean(busy)} onClick={() => void act("COMPLETE", { request_id: trip.id })} className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-50"><CheckCircle2 size={16} className="mr-2 inline"/>Complete trip</button>}
          {["DRIVER_ASSIGNED","DRIVER_ARRIVING","ARRIVED"].includes(trip.status) && <button disabled={Boolean(busy)} onClick={() => { if (confirm("Release this request so Zeshu can rematch another driver?")) void act("CANCEL", { request_id: trip.id }); }} className="mt-2 w-full rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 disabled:opacity-50"><X size={14} className="mr-1 inline"/>Release request</button>}
        </article>
      )}

      {!trip && offers.map((offer) => (
        <article key={offer.id} className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-black uppercase text-emerald-700">{label(offer.request.service_code)}</p><p className="mt-1 text-lg font-black">New nearby request</p></div>
            {offer.request.driver_payout != null && <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">₹{Number(offer.request.driver_payout).toFixed(0)}</span>}
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0"/><span><strong>Pickup:</strong> {offer.request.pickup_address}</span></div>
            <div className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0"/><span><strong>Drop:</strong> {offer.request.dropoff_address}</span></div>
            <p className="text-xs font-bold text-slate-500">Pickup ~{Number(offer.distance_to_pickup_km || 0).toFixed(1)} km away · Trip ~{Number(offer.request.distance_km || 0).toFixed(1)} km</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button disabled={Boolean(busy)} onClick={() => void act("DECLINE", { offer_id: offer.id })} className="rounded-xl bg-slate-100 py-3 text-sm font-black text-slate-700 disabled:opacity-50">Decline</button>
            <button disabled={Boolean(busy)} onClick={() => void act("ACCEPT", { offer_id: offer.id })} className="rounded-xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50">Accept</button>
          </div>
        </article>
      ))}
    </section>
  );
}
