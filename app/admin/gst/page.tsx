"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminSupabase } from "../../lib/browser-supabase";

const supabase = adminSupabase();

type Readiness = {
  business_profile_active: boolean;
  vendor_profiles: number;
  vendor_profiles_verified: number;
  product_tax_profiles: number;
  product_tax_profiles_reviewed: number;
  itc_invoice_count: number;
  itc_eligible_unclaimed: number;
};

function previousMonth() {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function GstAdminPage() {
  const router = useRouter();
  const [month, setMonth] = useState(previousMonth());
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const token = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const load = async () => {
    setLoading(true);
    const accessToken = await token();
    if (!accessToken) {
      router.replace("/admin/login");
      return;
    }
    const response = await fetch("/api/admin/gst/report", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      router.replace("/admin/login");
      return;
    }
    if (!response.ok) setError(payload.error || "GST readiness could not be loaded.");
    else {
      setReadiness(payload.readiness || null);
      setProfile(payload.profile || null);
      setError("");
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const productCoverage = useMemo(() => {
    if (!readiness?.product_tax_profiles) return 0;
    return Math.round((readiness.product_tax_profiles_reviewed / readiness.product_tax_profiles) * 100);
  }, [readiness]);

  const download = async () => {
    setDownloading(true); setError("");
    const accessToken = await token();
    const response = await fetch(`/api/admin/gst/report?month=${encodeURIComponent(month)}&format=csv`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "GST report could not be generated.");
      setDownloading(false);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zeshu-gst-sales-${month}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  if (loading) return <main className="min-h-screen bg-[#f7f9f5] p-6"><div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-sm font-bold text-slate-500">Loading GST workspace…</div></main>;

  return <main className="min-h-screen bg-[#f7f9f5] p-4 md:p-6">
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <Link href="/admin/dashboard" className="text-xs font-black text-[#087443]">← Admin dashboard</Link>
        <h1 className="mt-1 text-3xl font-black text-slate-950">GST workspace</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Monthly bookkeeping, tax-data readiness and legal input-tax-credit tracking. Zeshu does not auto-file GST returns or claim ITC without review.</p>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="GST profile" value={profile ? "Active" : "Not set"} good={Boolean(profile)} />
        <Metric label="Vendor tax profiles" value={`${readiness?.vendor_profiles_verified || 0}/${readiness?.vendor_profiles || 0} verified`} good={(readiness?.vendor_profiles || 0) > 0 && readiness?.vendor_profiles === readiness?.vendor_profiles_verified} />
        <Metric label="Product GST coverage" value={`${productCoverage}%`} good={productCoverage === 100} />
        <Metric label="Potential ITC records" value={String(readiness?.itc_eligible_unclaimed || 0)} good={(readiness?.itc_eligible_unclaimed || 0) === 0} />
      </section>

      <section className="mt-5 rounded-3xl border border-[#dde7df] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2"><FileSpreadsheet className="text-[#087443]" /><h2 className="text-lg font-black">Monthly GST sales sheet</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Exports immutable order tax snapshots. Missing GSTIN, HSN or reviewed GST rate is flagged instead of guessed.</p></div>
          <div className="flex flex-wrap items-end gap-2"><label className="text-xs font-black text-slate-600">Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" /></label><button onClick={() => void download()} disabled={downloading || !month} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#087443] px-4 py-2 text-sm font-black text-white disabled:opacity-50"><Download size={16} />{downloading ? "Preparing…" : "Download CSV"}</button></div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-emerald-800"><ShieldCheck size={20} /><h2 className="font-black">Smart GST savings — legal only</h2></div><ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-950"><li>Track eligible input tax credit from genuine business purchase invoices.</li><li>Flag missing supplier GSTIN/invoice details before the filing period closes.</li><li>Use the correct filing frequency when eligible, including QRMP if it fits the final GST profile.</li><li>Never hide sales, create fake invoices or claim ITC without valid supporting documents.</li></ul></div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5"><div className="flex items-center gap-2 text-amber-800"><TriangleAlert size={20} /><h2 className="font-black">Before automatic monthly email</h2></div><p className="mt-3 text-sm leading-6 text-amber-950">Complete Zeshu GST registration, activate the business GST profile, verify vendor invoicing models and review product HSN/GST rates. After that the monthly pack can be emailed automatically to support@zeshu.in for filing review.</p></div>
      </section>
    </div>
  </main>;
}

function Metric({ label, value, good }: { label: string; value: string; good: boolean }) {
  return <div className="rounded-2xl border border-[#dde7df] bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${good ? "text-[#087443]" : "text-slate-900"}`}>{value}</p></div>;
}
