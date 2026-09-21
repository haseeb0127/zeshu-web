"use client";

import { useEffect, useRef, useState } from "react";

type Props = { supabaseClient: any };

async function showSupportNotification() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Zeshu customer needs support", { body: "Open Support in ZESHU HQ to reply.", icon: "/icon.svg", badge: "/icon.svg" });
      return;
    }
  } catch {
    // Fall back to the page notification API where supported.
  }
  try { new Notification("Zeshu customer needs support", { body: "Open Support in ZESHU HQ to reply." }); } catch {}
}

export default function SupportAlertManager({ supabaseClient }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const seen = useRef<Set<string>>(new Set());
  const storageKey = "zeshu:admin-support-alerts:enabled";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey) === "1";
    const permissionGranted = typeof Notification !== "undefined" && Notification.permission === "granted";
    if (stored || permissionGranted) {
      window.localStorage.setItem(storageKey, "1");
      setEnabled(true);
      setNotice(permissionGranted ? "Support alerts automatically enabled on this device." : "Realtime support alerts automatically enabled.");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const channel = supabaseClient
      .channel("admin-support-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, (payload: any) => {
        const row = payload?.new || {};
        const id = String(row.id || "");
        const status = String(row.status || "");
        if (!id || !["WAITING", "OPEN"].includes(status)) return;
        const key = `${id}|${status}|${String(row.updated_at || "")}`;
        if (seen.current.has(key)) return;
        seen.current.add(key);
        if (seen.current.size > 500) {
          const first = seen.current.values().next().value;
          if (first) seen.current.delete(first);
        }
        try { navigator.vibrate?.([180, 90, 180, 90, 260]); } catch {}
        try {
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          oscillator.connect(context.destination);
          oscillator.frequency.value = 740;
          oscillator.start();
          oscillator.stop(context.currentTime + 0.18);
        } catch {}
        void showSupportNotification();
      })
      .subscribe();
    return () => { void supabaseClient.removeChannel(channel); };
  }, [enabled, supabaseClient]);

  const enable = async () => {
    let permission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
    if (typeof Notification !== "undefined" && permission === "default") permission = await Notification.requestPermission();
    window.localStorage.setItem(storageKey, "1");
    setEnabled(true);
    setNotice(permission === "granted"
      ? "Support alerts enabled. They will turn on automatically after future logins."
      : permission === "denied"
        ? "Realtime support alerts are on, but system notifications are blocked in browser settings."
        : "Realtime support alerts enabled on this device.");
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void enable()} disabled={enabled} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 disabled:opacity-60">
        {enabled ? "Support alerts on" : "Enable support alerts"}
      </button>
      {notice && <span className="text-xs font-bold text-slate-500">{notice}</span>}
    </div>
  );
}
