"use client";

import { useEffect, useRef, useState } from "react";

type Props = { supabaseClient: any; channelName: string; filter?: string; label?: string };

async function showSystemNotification(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, { body, icon: "/icon.svg", badge: "/icon.svg" });
      return;
    }
  } catch {
    // Fall back to the page notification API where supported.
  }
  try { new Notification(title, { body }); } catch { /* mobile browsers may require service-worker notifications */ }
}

export default function OrderAlertManager({ supabaseClient, channelName, filter, label = "Enable order alerts" }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const seenEvents = useRef<Map<string, number>>(new Map());
  const storageKey = `zeshu:${channelName}:alerts-enabled`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey) === "1";
    const permissionGranted = typeof Notification !== "undefined" && Notification.permission === "granted";
    if (stored || permissionGranted) {
      window.localStorage.setItem(storageKey, "1");
      setEnabled(true);
      setNotice(permissionGranted ? "Order alerts automatically enabled on this device." : "Realtime order alerts automatically enabled.");
    }
  }, [storageKey]);

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
      void showSystemNotification("Zeshu order update", "An order needs your attention.");
    }).subscribe();
    return () => { void supabaseClient.removeChannel(channel); };
  }, [enabled, channelName, filter, supabaseClient]);

  const enable = async () => {
    let permission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
    if (typeof Notification !== "undefined" && permission === "default") permission = await Notification.requestPermission();
    window.localStorage.setItem(storageKey, "1");
    setEnabled(true);
    setNotice(permission === "granted"
      ? "Order alerts enabled. They will turn on automatically after future logins."
      : permission === "denied"
        ? "Realtime alerts are on, but system notifications are blocked in browser settings."
        : "Realtime order alerts enabled on this device.");
  };

  return <div className="mb-4 flex flex-wrap items-center gap-2"><button type="button" onClick={() => void enable()} disabled={enabled} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-60">{enabled ? "Order alerts on" : label}</button>{notice && <span className="text-xs font-bold text-slate-500">{notice}</span>}</div>;
}
