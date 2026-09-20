"use client";

import { useEffect, useRef, useState } from "react";

type Props = { supabaseClient: any };

export default function SupportAlertManager({ supabaseClient }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const seen = useRef<Set<string>>(new Set());

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
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Zeshu customer needs support", { body: "Open Support in ZESHU HQ to reply." });
        }
      })
      .subscribe();
    return () => { void supabaseClient.removeChannel(channel); };
  }, [enabled, supabaseClient]);

  const enable = async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setEnabled(true);
    setNotice("Customer-support alerts enabled on this device.");
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
