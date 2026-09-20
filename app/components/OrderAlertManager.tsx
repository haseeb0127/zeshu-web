"use client";

import { useEffect, useRef, useState } from "react";

type Props = { supabaseClient: any; channelName: string; filter?: string; label?: string };

export default function OrderAlertManager({ supabaseClient, channelName, filter, label = "Enable order alerts" }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const seenEvents = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    if (!enabled) return;
    const channel = supabaseClient.channel(channelName).on("postgres_changes", { event: "*", schema: "public", table: "orders", ...(filter ? { filter } : {}) }, (payload: any) => {
      const row = payload?.new || {};
      const orderId = String(row.id || payload?.old?.id || "");
      if (!orderId) return;
      const stateKey = [orderId, row.status || "", row.rider_id || "", row.assigned_rider_id || "", row.vendor_id || ""].join("|");
      if (seenEvents.current.has(stateKey)) return;
      seenEvents.current.set(stateKey, Date.now());
      if (seenEvents.current.size > 500) {
        const oldest = seenEvents.current.keys().next().value;
        if (oldest) seenEvents.current.delete(oldest);
      }
      try { navigator.vibrate?.([120, 80, 120]); } catch { /* optional device capability */ }
      try { const context = new AudioContext(); const oscillator = context.createOscillator(); oscillator.connect(context.destination); oscillator.frequency.value = 880; oscillator.start(); oscillator.stop(context.currentTime + 0.12); } catch { /* audio requires a permitted browser context */ }
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Zeshu order update", { body: "An order needs your attention." });
    }).subscribe();
    return () => { void supabaseClient.removeChannel(channel); };
  }, [enabled, channelName, filter, supabaseClient]);
  const enable = async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") await Notification.requestPermission();
    setEnabled(true); setNotice("Order alerts enabled on this device.");
  };
  return <div className="mb-4 flex flex-wrap items-center gap-2"><button type="button" onClick={() => void enable()} disabled={enabled} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-60">{enabled ? "Order alerts on" : label}</button>{notice && <span className="text-xs font-bold text-slate-500">{notice}</span>}</div>;
}
