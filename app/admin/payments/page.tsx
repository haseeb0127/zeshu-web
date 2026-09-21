"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { adminSupabase } from "../../lib/browser-supabase";

const supabase = adminSupabase();

type Rail = "UPI" | "RUPAY_DEBIT" | "DEBIT_CARD" | "CREDIT_CARD" | "NET_BANKING" | "WALLET";

type GatewayProfile = {
  provider: "razorpay" | "cashfree" | "phonepe" | "paytm";
  display_name: string;
  routing_enabled: boolean;
  health_status: "ONBOARDING" | "ACTIVE" | "DEGRADED" | "DOWN" | "PAUSED";
  priority: number;
  supported_rails: Rail[];
  upi_fee_bps: number | null;
  rupay_debit_fee_bps: number | null;
  debit_card_fee_bps: number | null;
  credit_card_fee_bps: number | null;
  net_banking_fee_bps: number | null;
  wallet_fee_bps: number | null;
  fixed_fee_paise: number;
  rolling_success_rate_bps: number | null;
  rolling_latency_ms: number | null;
  last_metrics_at: string | null;
  configured: boolean;
};

type Attempt = {
  id: string;
  provider: string;
  amount_paise: number;
  status: string;
  payment_rail: string | null;
  selected_reason: string | null;
  created_at: string;
};

const RAILS: Array<{ key: Rail; label: string; fee: keyof GatewayProfile }> = [
  { key: "UPI", label: "UPI", fee: "upi_fee_bps" },
  { key: "RUPAY_DEBIT", label: "RuPay debit", fee: "rupay_debit_fee_bps" },
  { key: "DEBIT_CARD", label: "Debit card", fee: "debit_card_fee_bps" },
  { key: "CREDIT_CARD", label: "Credit card", fee: "credit_card_fee_bps" },
  { key: "NET_BANKING", label: "Net banking", fee: "net_banking_fee_bps" },
  { key: "WALLET", label: "Wallet", fee: "wallet_fee_bps" },
];

const bpsToPercent = (value: number | null) => value == null ? "" : String(value / 100);
const percentToBps = (value: string) => {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) : null;
};

export default function AdminPaymentsPage() {
  const [profiles, setProfiles] = useState<GatewayProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [routerMode, setRouterMode] = useState("off");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Admin session expired. Sign in again.");
      const response = await fetch("/api/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Payment gateway status could not be loaded.");
      setProfiles(Array.isArray(payload.profiles) ? payload.profiles : []);
      setAttempts(Array.isArray(payload.recent_attempts) ? payload.recent_attempts : []);
      setRouterMode(String(payload.router_mode || "off"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Payment gateway status could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const configuredCount = useMemo(() => profiles.filter((profile) => profile.configured).length, [profiles]);
  const routedCount = useMemo(() => profiles.filter((profile) => profile.routing_enabled).length, [profiles]);

  const updateProfile = (provider: string, patch: Partial<GatewayProfile>) => {
    setProfiles((current) => current.map((profile) => profile.provider === provider ? { ...profile, ...patch } : profile));
  };

  const saveProfile = async (profile: GatewayProfile) => {
    setSaving(profile.provider);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Admin session expired. Sign in again.");
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Gateway settings could not be saved.");
      if (payload.profile) updateProfile(profile.provider, payload.profile);
      setRouterMode(String(payload.router_mode || routerMode));
      setNotice(`${profile.display_name} settings saved.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gateway settings could not be saved.");
      await load();
    } finally {
      setSaving("");
    }
  };

  return <div className="min-h-screen bg-[#f7f9f5] text-slate-900">
    <header className="sticky top-0 z-20 bg-[#087443] px-5 py-4 text-white shadow-[0_8px_24px_rgba(8,116,67,.16)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" aria-label="Back to admin dashboard" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="font-black tracking-tight">Payments HQ</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Gateway readiness & routing</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-50"><RefreshCw size={15} />Refresh</button>
      </div>
    </header>

    <main className="mx-auto max-w-7xl p-5">
      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{notice}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
          <p className="text-xs font-black uppercase text-slate-400">Router mode</p>
          <p className="mt-2 text-2xl font-black uppercase">{routerMode}</p>
          <p className="mt-2 text-xs text-slate-500">{routerMode === "off" ? "Customer payments still use the existing Razorpay flow." : routerMode === "observe" ? "Zeshu can compare gateways without changing customer payments." : "Smart routing is enabled for eligible configured gateways."}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
          <p className="text-xs font-black uppercase text-slate-400">Configured gateways</p>
          <p className="mt-2 text-2xl font-black">{configuredCount}/{profiles.length || 4}</p>
          <p className="mt-2 text-xs text-slate-500">A gateway is configured only when its server-side merchant credentials are present.</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
          <p className="text-xs font-black uppercase text-slate-400">Routing candidates</p>
          <p className="mt-2 text-2xl font-black">{routedCount}</p>
          <p className="mt-2 text-xs text-slate-500">Profile toggles do nothing while the global router mode is OFF.</p>
        </div>
      </section>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0" size={18} /><p><strong>Safe rollout:</strong> record merchant-specific commercial rates only after approval. Never choose a gateway only because it looks cheaper; Zeshu routing prioritizes payment health and successful completion before cost.</p></div>
      </div>

      {loading ? <div className="grid min-h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#087443] border-t-transparent" /></div> :
        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          {profiles.map((profile) => <div key={profile.provider} className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100"><CreditCard size={20} /></div>
                <div><h2 className="font-black">{profile.display_name}</h2><p className="text-xs font-bold text-slate-400">{profile.provider}</p></div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${profile.configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{profile.configured ? "CREDENTIALS READY" : "ONBOARDING"}</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-black text-slate-600">Health
                <select value={profile.health_status} onChange={(e) => updateProfile(profile.provider, { health_status: e.target.value as GatewayProfile["health_status"] })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold">
                  {["ONBOARDING","ACTIVE","DEGRADED","DOWN","PAUSED"].map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </label>
              <label className="text-xs font-black text-slate-600">Priority
                <input type="number" min={1} max={1000} value={profile.priority} onChange={(e) => updateProfile(profile.provider, { priority: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-black text-slate-600">Fixed fee ₹
                <input type="number" min={0} step="0.01" value={(profile.fixed_fee_paise || 0) / 100} onChange={(e) => updateProfile(profile.provider, { fixed_fee_paise: Math.max(0, Math.round(Number(e.target.value || 0) * 100)) })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm" />
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {RAILS.map((rail) => <div key={rail.key} className="rounded-xl border border-slate-100 p-3">
                <label className="flex items-center gap-2 text-xs font-black text-slate-700">
                  <input type="checkbox" checked={profile.supported_rails.includes(rail.key)} onChange={(e) => updateProfile(profile.provider, { supported_rails: e.target.checked ? Array.from(new Set([...profile.supported_rails, rail.key])) : profile.supported_rails.filter((item) => item !== rail.key) })} />
                  {rail.label}
                </label>
                <label className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Approved fee %
                  <input type="number" min={0} max={100} step="0.01" value={bpsToPercent(profile[rail.fee] as number | null)} onChange={(e) => updateProfile(profile.provider, { [rail.fee]: percentToBps(e.target.value) } as Partial<GatewayProfile>)} placeholder="Not set" className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700" />
                </label>
              </div>)}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f7f9f5] p-3">
              <div>
                <label className="flex items-center gap-2 text-xs font-black"><input type="checkbox" checked={profile.routing_enabled} disabled={!profile.configured} onChange={(e) => updateProfile(profile.provider, { routing_enabled: e.target.checked })} />Eligible for router</label>
                <p className="mt-1 text-[10px] text-slate-500">{profile.rolling_success_rate_bps == null ? "No live routing metrics yet." : `Success ${(profile.rolling_success_rate_bps / 100).toFixed(2)}% · ${profile.rolling_latency_ms ?? "—"} ms`}</p>
              </div>
              <button type="button" disabled={saving === profile.provider} onClick={() => void saveProfile(profile)} className="inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save size={14} />{saving === profile.provider ? "Saving…" : "Save"}</button>
            </div>
          </div>)}
        </section>}

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
        <h2 className="font-black">Recent routed payment attempts</h2>
        <p className="mt-1 text-xs text-slate-500">This stays empty until the new router is actually used. Existing Razorpay orders are not rewritten into this ledger.</p>
        {attempts.length === 0 ? <p className="mt-4 rounded-xl bg-[#f7f9f5] p-4 text-sm text-slate-500">No smart-router attempts yet — this is the expected safe state.</p> :
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b"><th className="p-3">Time</th><th className="p-3">Gateway</th><th className="p-3">Method</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Reason</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt.id} className="border-b"><td className="p-3">{new Date(attempt.created_at).toLocaleString()}</td><td className="p-3 font-black">{attempt.provider}</td><td className="p-3">{attempt.payment_rail || "—"}</td><td className="p-3">₹{(Number(attempt.amount_paise || 0) / 100).toFixed(2)}</td><td className="p-3 font-black">{attempt.status}</td><td className="p-3">{attempt.selected_reason || "—"}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
  </div>;
}
