"use client";

import Link from "next/link";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSupabase } from "../../lib/browser-supabase";
import { ArrowLeft, CheckCircle2, CircleAlert, Loader2, Package, Save, Truck } from "lucide-react";

const supabase = adminSupabase();
type Row = Record<string, any>;

type SettingsForm = {
  nationwide_checkout_enabled: boolean;
  default_min_contribution_rupees: string;
  default_min_margin_percent: string;
  payment_fee_percent: string;
  default_rto_allowance_percent: string;
  default_operating_cost_percent: string;
  free_shipping_enabled: boolean;
  courier_provider: string;
};

const DEFAULT_SETTINGS: SettingsForm = {
  nationwide_checkout_enabled: false,
  default_min_contribution_rupees: "25",
  default_min_margin_percent: "5",
  payment_fee_percent: "2",
  default_rto_allowance_percent: "5",
  default_operating_cost_percent: "3",
  free_shipping_enabled: false,
  courier_provider: "",
};

const money = (value: unknown) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function FulfillmentWorkspace() {
  const router = useRouter();
  const [adminUserId, setAdminUserId] = useState("");
  const [products, setProducts] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Row[]>([]);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [settings, setSettings] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [productForm, setProductForm] = useState({
    delivery_mode: "LOCAL_STANDARD",
    fresh_eligible: false,
    nationwide_shipping_enabled: false,
    requires_cold_chain: false,
    packed_weight_grams: "",
    package_length_cm: "",
    package_width_cm: "",
    package_height_cm: "",
    shipping_class: "STANDARD",
    min_nationwide_quantity: "1",
    min_nationwide_order_value: "0",
    handling_minutes: "15",
    cost_price: "",
    packaging_cost: "0",
    handling_cost: "0",
    return_risk_percent: "0",
    min_contribution_rupees: "",
    min_margin_percent: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      router.replace("/admin/login");
      return;
    }
    const { data: role, error: roleError } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (roleError || !role) {
      setError("Admin access required.");
      setLoading(false);
      return;
    }
    setAdminUserId(user.id);

    const [productsResult, profilesResult, vendorsResult, settingsResult] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("product_fulfillment_profiles").select("*"),
      supabase.from("vendors").select("id,business_name,is_open,local_30_min_enabled,local_standard_enabled"),
      supabase.from("fulfillment_settings").select("*").eq("id", "default").maybeSingle(),
    ]);
    const firstError = productsResult.error || profilesResult.error || vendorsResult.error || settingsResult.error;
    if (firstError) {
      console.error("Fulfillment workspace load failed:", firstError);
      setError("Fulfillment settings could not be loaded.");
    }
    setProducts(productsResult.data || []);
    setProfiles(profilesResult.data || []);
    setVendors(vendorsResult.data || []);
    if (settingsResult.data) {
      const row = settingsResult.data;
      setSettings({
        nationwide_checkout_enabled: row.nationwide_checkout_enabled === true,
        default_min_contribution_rupees: String(row.default_min_contribution_rupees ?? 25),
        default_min_margin_percent: String(row.default_min_margin_percent ?? 5),
        payment_fee_percent: String(row.payment_fee_percent ?? 2),
        default_rto_allowance_percent: String(row.default_rto_allowance_percent ?? 5),
        default_operating_cost_percent: String(row.default_operating_cost_percent ?? 3),
        free_shipping_enabled: row.free_shipping_enabled === true,
        courier_provider: String(row.courier_provider || ""),
      });
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) => `${product.name || ""} ${product.category || ""} ${product.brand || ""}`.toLowerCase().includes(needle));
  }, [products, query]);

  const selectProduct = (product: Row) => {
    const profile = profiles.find((entry) => entry.product_id === product.id) || {};
    setSelectedProductId(product.id);
    setNotice("");
    setError("");
    setProductForm({
      delivery_mode: product.delivery_mode || "LOCAL_STANDARD",
      fresh_eligible: product.fresh_eligible === true,
      nationwide_shipping_enabled: product.nationwide_shipping_enabled === true,
      requires_cold_chain: product.requires_cold_chain === true,
      packed_weight_grams: String(product.packed_weight_grams ?? ""),
      package_length_cm: String(product.package_length_cm ?? ""),
      package_width_cm: String(product.package_width_cm ?? ""),
      package_height_cm: String(product.package_height_cm ?? ""),
      shipping_class: product.shipping_class || "STANDARD",
      min_nationwide_quantity: String(product.min_nationwide_quantity ?? 1),
      min_nationwide_order_value: String(product.min_nationwide_order_value ?? 0),
      handling_minutes: String(product.handling_minutes ?? 15),
      cost_price: String(profile.cost_price ?? ""),
      packaging_cost: String(profile.packaging_cost ?? 0),
      handling_cost: String(profile.handling_cost ?? 0),
      return_risk_percent: String(profile.return_risk_percent ?? 0),
      min_contribution_rupees: String(profile.min_contribution_rupees ?? ""),
      min_margin_percent: String(profile.min_margin_percent ?? ""),
    });
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!adminUserId || savingSettings) return;
    if (settings.nationwide_checkout_enabled && !settings.courier_provider.trim()) {
      setError("Keep nationwide checkout off until a real courier provider is connected.");
      return;
    }
    setSavingSettings(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("admin_update_fulfillment_settings", {
      p_admin_user_id: adminUserId,
      p_nationwide_checkout_enabled: settings.nationwide_checkout_enabled,
      p_default_min_contribution_rupees: Number(settings.default_min_contribution_rupees),
      p_default_min_margin_percent: Number(settings.default_min_margin_percent),
      p_payment_fee_percent: Number(settings.payment_fee_percent),
      p_default_rto_allowance_percent: Number(settings.default_rto_allowance_percent),
      p_default_operating_cost_percent: Number(settings.default_operating_cost_percent),
      p_free_shipping_enabled: settings.free_shipping_enabled,
      p_courier_provider: settings.courier_provider.trim() || null,
    });
    setSavingSettings(false);
    if (rpcError) {
      console.error("Fulfillment settings save failed:", rpcError);
      setError("Settings could not be saved. Nationwide checkout remains protected.");
      return;
    }
    setNotice("Fulfillment settings saved.");
    await load();
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!adminUserId || !selectedProductId || savingProduct) return;
    const selected = products.find((product) => product.id === selectedProductId);
    if (!selected) return;

    const opt = (value: string) => value.trim() === "" ? null : Number(value);
    const packedWeight = opt(productForm.packed_weight_grams);
    const costPrice = opt(productForm.cost_price);

    if (productForm.delivery_mode === "LOCAL_30_MIN" && !productForm.fresh_eligible) {
      setError("30-minute Fresh products must be marked Fresh eligible.");
      return;
    }
    if (productForm.nationwide_shipping_enabled && (
      productForm.delivery_mode !== "INDIA_STANDARD"
      || productForm.requires_cold_chain
      || productForm.shipping_class !== "STANDARD"
      || !packedWeight
      || costPrice === null
    )) {
      setError("India delivery needs standard shipping, packed weight and cost price, with no cold-chain requirement.");
      return;
    }

    setSavingProduct(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("admin_update_product_fulfillment", {
      p_admin_user_id: adminUserId,
      p_product_id: selectedProductId,
      p_delivery_mode: productForm.delivery_mode,
      p_fresh_eligible: productForm.fresh_eligible,
      p_nationwide_shipping_enabled: productForm.nationwide_shipping_enabled,
      p_requires_cold_chain: productForm.requires_cold_chain,
      p_packed_weight_grams: packedWeight,
      p_package_length_cm: opt(productForm.package_length_cm),
      p_package_width_cm: opt(productForm.package_width_cm),
      p_package_height_cm: opt(productForm.package_height_cm),
      p_shipping_class: productForm.shipping_class,
      p_min_nationwide_quantity: Number(productForm.min_nationwide_quantity || 1),
      p_min_nationwide_order_value: Number(productForm.min_nationwide_order_value || 0),
      p_handling_minutes: Number(productForm.handling_minutes || 15),
      p_cost_price: costPrice,
      p_packaging_cost: Number(productForm.packaging_cost || 0),
      p_handling_cost: Number(productForm.handling_cost || 0),
      p_return_risk_percent: Number(productForm.return_risk_percent || 0),
      p_min_contribution_rupees: opt(productForm.min_contribution_rupees),
      p_min_margin_percent: opt(productForm.min_margin_percent),
    });
    setSavingProduct(false);
    if (rpcError) {
      console.error("Product fulfillment save failed:", rpcError);
      setError("Product delivery settings could not be saved.");
      return;
    }
    setNotice(`${selected.name} delivery settings saved.`);
    await load();
  };

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const vendor = selectedProduct ? vendors.find((entry) => entry.id === selectedProduct.vendor_id) : null;
  const indiaReadyCount = products.filter((p) => p.delivery_mode === "INDIA_STANDARD" && p.nationwide_shipping_enabled === true).length;
  const freshCount = products.filter((p) => p.delivery_mode === "LOCAL_30_MIN" && p.fresh_eligible === true).length;

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#f7f9f5]"><Loader2 className="animate-spin text-[#087443]" size={28} /></div>;

  const input = "mt-1.5 w-full rounded-xl border border-[#dce8df] bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500";

  return <div className="min-h-screen bg-[#f7f9f5] text-slate-900">
    <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3"><Link href="/admin/dashboard" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100" aria-label="Back to admin dashboard"><ArrowLeft size={18}/></Link><div><h1 className="text-xl font-black">Delivery & Profitability</h1><p className="text-xs text-slate-500">30-minute Fresh and India-wide delivery controls</p></div></div>
        <Truck className="text-[#087443]" />
      </div>
    </header>

    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {error && <div className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><CircleAlert className="shrink-0" size={18}/>{error}</div>}
      {notice && <div className="flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 className="shrink-0" size={18}/>{notice}</div>}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase text-slate-400">30-min Fresh products</p><p className="mt-2 text-3xl font-black text-[#087443]">{freshCount}</p></div>
        <div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase text-slate-400">India-ready products</p><p className="mt-2 text-3xl font-black text-sky-700">{indiaReadyCount}</p></div>
        <div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase text-slate-400">Nationwide checkout</p><p className="mt-2 text-xl font-black">{settings.nationwide_checkout_enabled ? "Enabled" : "Protected / Off"}</p></div>
      </section>

      <form onSubmit={saveSettings} className="rounded-3xl border border-[#dce8df] bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">Business safety defaults</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">These private thresholds protect Zeshu from loss-making India shipments. Do not enable nationwide checkout until live courier rates are connected and tested.</p></div><Package className="text-[#087443]" size={20}/></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["default_min_contribution_rupees","Minimum contribution ₹"],
            ["default_min_margin_percent","Minimum margin %"],
            ["payment_fee_percent","Payment fee %"],
            ["default_rto_allowance_percent","Return/RTO allowance %"],
            ["default_operating_cost_percent","Operating cost %"],
          ].map(([key,label]) => <label key={key} className="text-sm font-bold text-slate-600">{label}<input type="number" min="0" step="0.01" value={String(settings[key as keyof SettingsForm])} onChange={(e) => setSettings((current) => ({ ...current, [key]: e.target.value }))} className={input}/></label>)}
          <label className="text-sm font-bold text-slate-600">Courier provider<input value={settings.courier_provider} onChange={(e) => setSettings((current) => ({ ...current, courier_provider: e.target.value }))} placeholder="Not connected" className={input}/></label>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span><span className="block font-black">Nationwide checkout</span><span className="text-xs text-slate-500">Keep off until courier serviceability and live rates are connected.</span></span><input type="checkbox" checked={settings.nationwide_checkout_enabled} onChange={(e) => setSettings((current) => ({ ...current, nationwide_checkout_enabled: e.target.checked }))} className="h-5 w-5 accent-[#087443]"/></label>
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span><span className="block font-black">Allow free shipping</span><span className="text-xs text-slate-500">Actual basket must still pass the profit gate.</span></span><input type="checkbox" checked={settings.free_shipping_enabled} onChange={(e) => setSettings((current) => ({ ...current, free_shipping_enabled: e.target.checked }))} className="h-5 w-5 accent-[#087443]"/></label>
        </div>
        <button disabled={savingSettings} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{savingSettings ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}Save business safeguards</button>
      </form>

      <section className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <div className="rounded-3xl border border-[#dce8df] bg-white p-5">
          <h2 className="font-black">Products</h2>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product, category or brand" className={`${input} mt-4`}/>
          <div className="mt-4 max-h-[38rem] space-y-2 overflow-y-auto">{filteredProducts.map((product) => <button type="button" key={product.id} onClick={() => selectProduct(product)} className={`w-full rounded-2xl border p-3 text-left ${selectedProductId === product.id ? "border-emerald-400 bg-emerald-50" : "border-slate-100 hover:bg-slate-50"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.category || "Uncategorized"} · ₹{money(product.price)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${product.delivery_mode === "LOCAL_30_MIN" ? "bg-emerald-50 text-emerald-700" : product.delivery_mode === "INDIA_STANDARD" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}>{product.delivery_mode === "LOCAL_30_MIN" ? "Fresh" : product.delivery_mode === "INDIA_STANDARD" ? "India" : "Local"}</span></div></button>)}</div>
        </div>

        <div className="rounded-3xl border border-[#dce8df] bg-white p-5">
          {!selectedProduct ? <div className="grid min-h-80 place-items-center text-center text-sm text-slate-500"><p>Select a product to configure delivery and profitability.</p></div> : <form onSubmit={saveProduct}>
            <div><h2 className="text-lg font-black">{selectedProduct.name}</h2><p className="mt-1 text-xs text-slate-500">{vendor?.business_name || "Vendor"} · ₹{money(selectedProduct.price)}</p></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-600">Delivery mode<select value={productForm.delivery_mode} onChange={(e) => setProductForm((current) => ({ ...current, delivery_mode: e.target.value, fresh_eligible: e.target.value === "LOCAL_30_MIN" ? current.fresh_eligible : false, nationwide_shipping_enabled: e.target.value === "INDIA_STANDARD" ? current.nationwide_shipping_enabled : false }))} className={input}><option value="LOCAL_STANDARD">Local standard</option><option value="LOCAL_30_MIN">⚡ 30-min Fresh</option><option value="INDIA_STANDARD">🇮🇳 India delivery</option></select></label>
              <label className="text-sm font-bold text-slate-600">Shipping class<select value={productForm.shipping_class} onChange={(e) => setProductForm((current) => ({ ...current, shipping_class: e.target.value, nationwide_shipping_enabled: e.target.value === "STANDARD" ? current.nationwide_shipping_enabled : false }))} className={input}><option value="STANDARD">Standard</option><option value="FRAGILE">Fragile</option><option value="HEAVY">Heavy</option><option value="COLD_CHAIN">Cold chain</option><option value="LOCAL_ONLY">Local only</option></select></label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[["packed_weight_grams","Packed weight g"],["min_nationwide_quantity","Min India qty"],["min_nationwide_order_value","Min India basket ₹"],["handling_minutes","Handling minutes"],["package_length_cm","Length cm"],["package_width_cm","Width cm"],["package_height_cm","Height cm"]].map(([key,label]) => <label key={key} className="text-xs font-bold text-slate-600">{label}<input type="number" min="0" step="0.01" value={productForm[key as keyof typeof productForm] as string} onChange={(e) => setProductForm((current) => ({ ...current, [key]: e.target.value }))} className={input}/></label>)}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl bg-emerald-50 p-3"><span className="text-sm font-black">Fresh eligible</span><input type="checkbox" checked={productForm.fresh_eligible} onChange={(e) => setProductForm((current) => ({ ...current, fresh_eligible: e.target.checked }))} className="h-5 w-5 accent-[#087443]"/></label>
              <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="text-sm font-black">Requires cold chain</span><input type="checkbox" checked={productForm.requires_cold_chain} onChange={(e) => setProductForm((current) => ({ ...current, requires_cold_chain: e.target.checked, nationwide_shipping_enabled: e.target.checked ? false : current.nationwide_shipping_enabled }))} className="h-5 w-5 accent-[#087443]"/></label>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4"><p className="text-xs font-black text-amber-800">Private business inputs — never shown to customers</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{[["cost_price","Cost price ₹"],["packaging_cost","Packaging ₹"],["handling_cost","Handling ₹"],["return_risk_percent","Return/RTO risk %"],["min_contribution_rupees","Min contribution ₹"],["min_margin_percent","Min margin %"]].map(([key,label]) => <label key={key} className="text-xs font-bold text-slate-600">{label}<input type="number" min="0" step="0.01" value={productForm[key as keyof typeof productForm] as string} onChange={(e) => setProductForm((current) => ({ ...current, [key]: e.target.value }))} className={input}/></label>)}</div></div>

            <label className="mt-4 flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50 p-4"><span><span className="block font-black text-sky-800">India-ready product</span><span className="text-xs text-sky-700">This is only product readiness. Payment stays blocked until the global courier + profitability gate is enabled.</span></span><input type="checkbox" checked={productForm.nationwide_shipping_enabled} disabled={productForm.delivery_mode !== "INDIA_STANDARD" || productForm.requires_cold_chain || productForm.shipping_class !== "STANDARD"} onChange={(e) => setProductForm((current) => ({ ...current, nationwide_shipping_enabled: e.target.checked }))} className="h-5 w-5 accent-sky-600 disabled:opacity-40"/></label>

            <button disabled={savingProduct} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{savingProduct ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}Save product delivery</button>
          </form>}
        </div>
      </section>
    </main>
  </div>;
}
