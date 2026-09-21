"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Save, ShieldCheck, Truck, TriangleAlert } from "lucide-react";
import { adminSupabase } from "../../lib/browser-supabase";

const supabase = adminSupabase();

type Row = Record<string, any>;

export default function FulfillmentAdminPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Row | null>(null);
  const [products, setProducts] = useState<Row[]>([]);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [courierConnected, setCourierConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const accessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const request = async (method: "GET" | "PATCH", body?: any) => {
    const token = await accessToken();
    if (!token) {
      router.replace("/admin/login");
      throw new Error("Admin session expired.");
    }
    const response = await fetch("/api/admin/fulfillment", {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) router.replace("/admin/login");
    if (!response.ok) throw new Error(payload.error || "Fulfillment request failed.");
    return payload;
  };

  const load = async () => {
    setLoading(true);
    try {
      const payload = await request("GET");
      setSettings(payload.settings || null);
      setProducts(Array.isArray(payload.products) ? payload.products : []);
      setVendors(Array.isArray(payload.vendors) ? payload.vendors : []);
      setCourierConnected(payload.courier_connected === true);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Fulfillment data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateProduct = (id: string, key: string, value: any) => {
    setProducts((current) => current.map((product) => product.id === id
      ? key.startsWith("profitability.")
        ? { ...product, profitability: { ...(product.profitability || {}), [key.slice("profitability.".length)]: value } }
        : { ...product, [key]: value }
      : product));
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving("settings"); setError(""); setNotice("");
    try {
      const payload = await request("PATCH", { action: "settings", ...settings });
      setSettings(payload.settings);
      setCourierConnected(payload.courier_connected === true);
      setNotice("Fulfillment profitability settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Settings could not be saved.");
    } finally { setSaving(""); }
  };

  const saveVendor = async (vendor: Row) => {
    setSaving(`vendor:${vendor.id}`); setError(""); setNotice("");
    try {
      const payload = await request("PATCH", { action: "vendor", vendor_id: vendor.id, local_30_min_enabled: vendor.local_30_min_enabled });
      setVendors((current) => current.map((row) => row.id === vendor.id ? { ...row, ...payload.vendor } : row));
      setNotice("Vendor Fresh setting saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Vendor setting could not be saved.");
    } finally { setSaving(""); }
  };

  const saveProduct = async (product: Row) => {
    setSaving(`product:${product.id}`); setError(""); setNotice("");
    try {
      await request("PATCH", {
        action: "product",
        product_id: product.id,
        delivery_mode: product.delivery_mode,
        fresh_eligible: product.fresh_eligible,
        nationwide_shipping_enabled: product.nationwide_shipping_enabled,
        requires_cold_chain: product.requires_cold_chain,
        packed_weight_grams: product.packed_weight_grams,
        package_length_cm: product.package_length_cm,
        package_width_cm: product.package_width_cm,
        package_height_cm: product.package_height_cm,
        shipping_class: product.shipping_class,
        min_nationwide_quantity: product.min_nationwide_quantity,
        min_nationwide_order_value: product.min_nationwide_order_value,
        handling_minutes: product.handling_minutes,
        cost_price: product.profitability?.cost_price,
        packaging_cost: product.profitability?.packaging_cost,
        handling_cost: product.profitability?.handling_cost,
        return_risk_percent: product.profitability?.return_risk_percent,
        min_contribution_rupees: product.profitability?.min_contribution_rupees,
        min_margin_percent: product.profitability?.min_margin_percent,
      });
      setNotice(`${product.name} fulfillment settings saved.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Product fulfillment could not be saved.");
    } finally { setSaving(""); }
  };

  const indiaCandidates = useMemo(() => products.filter((product) => product.nationwide_shipping_enabled).length, [products]);
  const freshCandidates = useMemo(() => products.filter((product) => product.delivery_mode === "LOCAL_30_MIN" && product.fresh_eligible).length, [products]);

  if (loading) return <main className="min-h-screen bg-[#f7f9f5] p-6"><div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 font-bold text-slate-500">Loading fulfillment workspace…</div></main>;

  return <main className="min-h-screen bg-[#f7f9f5] p-4 md:p-6 text-[#132019]">
    <div className="mx-auto max-w-7xl">
      <div className="mb-5">
        <Link href="/admin/dashboard" className="text-xs font-black text-[#087443]">← Admin dashboard</Link>
        <h1 className="mt-1 text-3xl font-black">Delivery & profitability</h1>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">Control 30-minute Fresh, India delivery candidates, packed weights and private profitability inputs. Nationwide checkout cannot be enabled without a real courier-rate connection.</p>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</div>}

      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="30-min Fresh candidates" value={String(freshCandidates)} />
        <Metric label="India candidates" value={String(indiaCandidates)} />
        <Metric label="Courier connection" value={courierConnected ? "Connected" : "Not connected"} />
        <Metric label="India checkout" value={settings?.nationwide_checkout_enabled ? "Enabled" : "Safely off"} />
      </section>

      <section className="mt-5 rounded-3xl border border-[#dde7df] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-lg font-black">Profitability gate</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">India-wide shipping is offered only after product cost, packaging, payment cost, courier quote, operating allowance and return/RTO allowance still leave the configured contribution and margin.</p></div>
          <button onClick={() => void saveSettings()} disabled={saving === "settings"} className="inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><Save size={16}/>{saving === "settings" ? "Saving…" : "Save settings"}</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Min contribution ₹" value={settings?.default_min_contribution_rupees ?? 25} onChange={(value) => setSettings((current) => current ? { ...current, default_min_contribution_rupees: value } : current)} />
          <NumberField label="Min margin %" value={settings?.default_min_margin_percent ?? 5} onChange={(value) => setSettings((current) => current ? { ...current, default_min_margin_percent: value } : current)} />
          <NumberField label="Payment fee %" value={settings?.payment_fee_percent ?? 2} onChange={(value) => setSettings((current) => current ? { ...current, payment_fee_percent: value } : current)} />
          <NumberField label="RTO allowance %" value={settings?.default_rto_allowance_percent ?? 5} onChange={(value) => setSettings((current) => current ? { ...current, default_rto_allowance_percent: value } : current)} />
          <NumberField label="Operating cost %" value={settings?.default_operating_cost_percent ?? 3} onChange={(value) => setSettings((current) => current ? { ...current, default_operating_cost_percent: value } : current)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Toggle label="Nationwide checkout" checked={settings?.nationwide_checkout_enabled === true} disabled={!courierConnected} onChange={(checked) => setSettings((current) => current ? { ...current, nationwide_checkout_enabled: checked } : current)} />
          <Toggle label="Free India shipping allowed" checked={settings?.free_shipping_enabled === true} onChange={(checked) => setSettings((current) => current ? { ...current, free_shipping_enabled: checked } : current)} />
        </div>
        {!courierConnected && <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900"><TriangleAlert className="mt-0.5 shrink-0" size={18}/>India checkout is intentionally locked until a real courier serviceability + rate provider is configured. No fake shipping price will be used.</div>}
      </section>

      <section className="mt-5 rounded-3xl border border-[#dde7df] bg-white p-5">
        <div className="flex items-center gap-2"><Truck size={20} className="text-[#087443]"/><h2 className="text-lg font-black">Vendor 30-minute Fresh availability</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{vendors.map((vendor) => <div key={vendor.id} className="rounded-2xl bg-[#f7f9f5] p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black">{vendor.business_name || "Vendor"}</p><p className="text-xs text-slate-500">{vendor.is_open ? "Store open" : "Store closed"} · {vendor.admin_suspended ? "Suspended" : "Active"}</p></div><input type="checkbox" checked={vendor.local_30_min_enabled === true} disabled={vendor.admin_suspended} onChange={(event) => setVendors((current) => current.map((row) => row.id === vendor.id ? { ...row, local_30_min_enabled: event.target.checked } : row))} className="h-5 w-5 accent-[#087443]" /></div><button onClick={() => void saveVendor(vendor)} disabled={saving === `vendor:${vendor.id}`} className="mt-3 w-full rounded-xl border border-[#cfe8d7] px-3 py-2 text-xs font-black text-[#087443] disabled:opacity-50">Save Fresh setting</button></div>)}</div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center gap-2"><PackageCheck size={20} className="text-[#087443]"/><h2 className="text-lg font-black">Product delivery rules</h2></div>
        <div className="grid gap-4 xl:grid-cols-2">{products.map((product) => <ProductPanel key={product.id} product={product} saving={saving === `product:${product.id}`} onChange={(key, value) => updateProduct(product.id, key, value)} onSave={() => void saveProduct(product)} />)}</div>
      </section>

      <div className="mt-6 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><ShieldCheck className="mt-0.5 shrink-0" size={19}/><span>Cost price and margin inputs live in a private fulfillment table. They are not returned by the public product catalog or shown to customers.</span></div>
    </div>
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#dde7df] bg-white p-4"><p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function NumberField({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return <label className="text-xs font-black text-slate-600">{label}<input type="number" min="0" step="0.01" value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-[#dde7df] px-3 py-2.5 text-sm font-bold" /></label>;
}

function Toggle({ label, checked, disabled = false, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black ${disabled ? "border-slate-200 bg-slate-50 text-slate-400" : "border-[#dde7df] bg-white"}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#087443]" />{label}</label>;
}

function ProductPanel({ product, saving, onChange, onSave }: { product: Row; saving: boolean; onChange: (key: string, value: any) => void; onSave: () => void }) {
  const p = product.profitability || {};
  return <article className="rounded-3xl border border-[#dde7df] bg-white p-4">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{product.name}</h3><p className="text-xs text-slate-500">{product.category || "Uncategorized"} · ₹{Number(product.price || 0).toLocaleString("en-IN")}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black">{product.in_stock ? "IN STOCK" : "OUT"}</span></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-black text-slate-600">Delivery mode<select value={product.delivery_mode || "LOCAL_STANDARD"} onChange={(event) => onChange("delivery_mode", event.target.value)} className="mt-1 block w-full rounded-xl border border-[#dde7df] px-3 py-2.5 text-sm"><option value="LOCAL_30_MIN">30-min Fresh</option><option value="LOCAL_STANDARD">Local Standard</option><option value="INDIA_STANDARD">India Standard</option></select></label>
      <label className="text-xs font-black text-slate-600">Shipping class<select value={product.shipping_class || "STANDARD"} onChange={(event) => onChange("shipping_class", event.target.value)} className="mt-1 block w-full rounded-xl border border-[#dde7df] px-3 py-2.5 text-sm"><option value="STANDARD">Standard</option><option value="FRAGILE">Fragile</option><option value="HEAVY">Heavy</option><option value="COLD_CHAIN">Cold chain</option><option value="LOCAL_ONLY">Local only</option></select></label>
      <SmallNumber label="Packed weight g" value={product.packed_weight_grams} onChange={(value) => onChange("packed_weight_grams", value)} />
      <SmallNumber label="Min India qty" value={product.min_nationwide_quantity} onChange={(value) => onChange("min_nationwide_quantity", value)} />
      <SmallNumber label="Min India basket ₹" value={product.min_nationwide_order_value} onChange={(value) => onChange("min_nationwide_order_value", value)} />
      <SmallNumber label="Cost price ₹" value={p.cost_price} onChange={(value) => onChange("profitability.cost_price", value)} />
      <SmallNumber label="Packaging ₹" value={p.packaging_cost} onChange={(value) => onChange("profitability.packaging_cost", value)} />
      <SmallNumber label="Handling ₹" value={p.handling_cost} onChange={(value) => onChange("profitability.handling_cost", value)} />
      <SmallNumber label="Return/RTO %" value={p.return_risk_percent} onChange={(value) => onChange("profitability.return_risk_percent", value)} />
      <SmallNumber label="Min contribution override ₹" value={p.min_contribution_rupees} onChange={(value) => onChange("profitability.min_contribution_rupees", value)} />
      <SmallNumber label="Min margin override %" value={p.min_margin_percent} onChange={(value) => onChange("profitability.min_margin_percent", value)} />
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <Toggle label="Fresh candidate" checked={product.fresh_eligible === true} disabled={product.delivery_mode !== "LOCAL_30_MIN"} onChange={(checked) => onChange("fresh_eligible", checked)} />
      <Toggle label="Cold chain" checked={product.requires_cold_chain === true} onChange={(checked) => onChange("requires_cold_chain", checked)} />
      <Toggle label="India candidate" checked={product.nationwide_shipping_enabled === true} disabled={product.delivery_mode !== "INDIA_STANDARD" || product.requires_cold_chain === true} onChange={(checked) => onChange("nationwide_shipping_enabled", checked)} />
    </div>
    <button onClick={onSave} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save size={15}/>{saving ? "Saving…" : "Save product"}</button>
  </article>;
}

function SmallNumber({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return <label className="text-xs font-black text-slate-600">{label}<input type="number" min="0" step="0.01" value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-[#dde7df] px-3 py-2.5 text-sm" /></label>;
}
