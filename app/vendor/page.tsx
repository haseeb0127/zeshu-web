"use client";

import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Edit3,
  Eye,
  EyeOff,
  ImageIcon,
  IndianRupee,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import OrderAlertManager from "../components/OrderAlertManager";
import { vendorSupabase } from "../lib/browser-supabase";
import { VENDOR_PRODUCT_CATEGORIES } from "../lib/catalog-categories";

const supabase = vendorSupabase();

type Tab = "dashboard" | "orders" | "products" | "analytics";
type Vendor = { id: string; business_name: string | null; is_open: boolean | null };
type Product = {
  id: string;
  name: string;
  price: number | string | null;
  unit: string | null;
  image_url: string | null;
  in_stock: boolean | null;
  category: string | null;
  brand: string | null;
  quantity: number | string | null;
  weight: string | null;
};
type Order = Record<string, any>;

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  category: "",
  brand: "",
  quantity: "",
  weight: "",
  unit: "",
  image_url: "",
  in_stock: true,
};

const PRODUCT_UNITS = ["pcs", "pack", "kg", "g", "L", "ml"] as const;

const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  PENDING: { label: "Confirm order", status: "CONFIRMED" },
  CONFIRMED: { label: "Start preparing", status: "PREPARING" },
  PREPARING: { label: "Ready for pickup", status: "READY_FOR_PICKUP" },
};

function orderItems(order: Order): any[] {
  if (Array.isArray(order.items)) return order.items;
  if (typeof order.items !== "string") return [];
  try {
    const parsed = JSON.parse(order.items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function money(value: unknown) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function isToday(value: unknown) {
  if (!value) return false;
  const date = new Date(String(value));
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [authRefresh, setAuthRefresh] = useState(0);
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorOtp, setVendorOtp] = useState("");
  const [vendorOtpSent, setVendorOtpSent] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [storeSaving, setStoreSaving] = useState(false);
  const [transitioningOrderId, setTransitioningOrderId] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN" | "OUT" | "LOW">("ALL");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);

  const refreshData = async (activeVendor: Vendor = vendor as Vendor) => {
    if (!activeVendor?.id) return;
    setIsLoading(true);
    const [vendorResult, ordersResult, productsResult] = await Promise.all([
      supabase.from("vendors").select("id,business_name,is_open").eq("id", activeVendor.id).maybeSingle(),
      supabase.from("orders").select("*").eq("vendor_id", activeVendor.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("products").select("id,name,price,unit,image_url,in_stock,category,brand,quantity,weight").eq("vendor_id", activeVendor.id).order("created_at", { ascending: false }),
    ]);
    const firstError = vendorResult.error || ordersResult.error || productsResult.error;
    if (firstError) {
      console.error("Vendor portal refresh failed:", firstError);
      setError("Your vendor data could not be refreshed. Please try again.");
    } else {
      setVendor(vendorResult.data as Vendor);
      setOrders((ordersResult.data || []) as Order[]);
      setProducts((productsResult.data || []) as Product[]);
      setError("");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loadVendor = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setAccessError("Please sign in with a vendor account.");
        setIsAuthorizing(false);
        return;
      }
      const { data, error: vendorError } = await supabase
        .from("vendors")
        .select("id,business_name,is_open")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (vendorError || !data) {
        console.error("Vendor profile lookup failed:", vendorError);
        setAccessError("Vendor account not found.");
        setIsAuthorizing(false);
        return;
      }
      const resolvedVendor = data as Vendor;
      setVendor(resolvedVendor);
      setIsAuthorizing(false);
      void refreshData(resolvedVendor);
    };
    void loadVendor();
  }, [authRefresh]);

  useEffect(() => {
    if (!vendor?.id) return;
    const channel = supabase
      .channel(`vendor-operations-${vendor.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${vendor.id}` }, () => void refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `vendor_id=eq.${vendor.id}` }, () => void refreshData())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [vendor?.id]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category?.trim()).filter(Boolean))) as string[],
    [products],
  );
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(productQuery.trim().toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || product.category === categoryFilter;
    const inStock = product.in_stock !== false;
    const quantity = Number(product.quantity);
    const isLowStock = inStock && Number.isFinite(quantity) && quantity >= 0 && quantity <= 5;
    const matchesStock = stockFilter === "ALL"
      || (stockFilter === "IN" && inStock)
      || (stockFilter === "OUT" && !inStock)
      || (stockFilter === "LOW" && isLowStock);
    return matchesSearch && matchesCategory && matchesStock;
  }), [products, productQuery, categoryFilter, stockFilter]);
  const todayOrders = useMemo(() => orders.filter((order) => isToday(order.created_at)), [orders]);
  const statusCount = (status: string) => orders.filter((order) => (order.status || "PENDING") === status).length;
  const todayRevenue = todayOrders.reduce((total, order) => total + Number(order.total_paid || 0), 0);
  const completedOrders = orders.filter((order) => order.status === "DELIVERED");
  const completedRevenue = completedOrders.reduce((total, order) => total + Number(order.total_paid || 0), 0);
  const averageOrderValue = orders.length ? orders.reduce((total, order) => total + Number(order.total_paid || 0), 0) / orders.length : 0;
  const inStockCount = products.filter((product) => product.in_stock !== false).length;
  const lowStockCount = products.filter((product) => {
    const quantity = Number(product.quantity);
    return product.in_stock !== false && Number.isFinite(quantity) && quantity >= 0 && quantity <= 5;
  }).length;
  const attentionOrderCount = statusCount("PENDING") + statusCount("CONFIRMED") + statusCount("PREPARING");
  const topProducts = useMemo(() => {
    const totals = new Map<string, number>();
    orders.forEach((order) => orderItems(order).forEach((entry) => {
      const name = entry?.item?.name || entry?.name;
      const quantity = Number(entry?.qty ?? entry?.quantity ?? 0);
      if (typeof name === "string" && Number.isFinite(quantity)) totals.set(name, (totals.get(name) || 0) + quantity);
    }));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  const setStoreStatus = async (isOpen: boolean) => {
    if (storeSaving || !vendor) return;
    setStoreSaving(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("set_vendor_store_status", { p_is_open: isOpen });
    if (rpcError) {
      console.error("Store status RPC failed:", rpcError);
      setError("Store status could not be changed. Please try again.");
    } else {
      setMessage(isOpen ? "Store is open for orders." : "Store is closed.");
      await refreshData();
    }
    setStoreSaving(false);
  };

  const advanceOrder = async (order: Order) => {
    const transition = NEXT_STATUS[order.status || "PENDING"];
    if (!transition || transitioningOrderId) return;
    setTransitioningOrderId(order.id);
    setError("");
    const { error: rpcError } = await supabase.rpc("advance_vendor_order_status", {
      p_order_id: order.id,
      p_next_status: transition.status,
    });
    if (rpcError) {
      console.error("Vendor order transition failed:", rpcError);
      setError("This order could not be updated. Its status may have changed; refresh and try again.");
    } else {
      setMessage(`Order moved to ${transition.status.replaceAll("_", " ")}.`);
      await refreshData();
    }
    setTransitioningOrderId(null);
  };

  const openProductForm = (product?: Product) => {
    setEditingProduct(product || null);
    if (product) {
      setProductForm({
        name: product.name || "", price: String(product.price ?? ""), category: product.category || "", brand: product.brand || "", quantity: String(product.quantity ?? ""),
        weight: product.weight || "", unit: product.unit || "", image_url: product.image_url || "", in_stock: product.in_stock !== false,
      });
    } else {
      let defaults: Partial<typeof EMPTY_PRODUCT> = {};
      try {
        defaults = JSON.parse(window.localStorage.getItem("zeshu:vendor-product-defaults") || "{}");
      } catch {}
      setProductForm({ ...EMPTY_PRODUCT, category: String(defaults.category || ""), brand: String(defaults.brand || ""), unit: String(defaults.unit || "") });
    }
    setIsProductFormOpen(true);
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vendor || savingProduct) return;
    const price = Number(productForm.price);
    const quantity = productForm.quantity === "" ? null : Number(productForm.quantity);
    const unit = productForm.unit.trim();
    if (!productForm.name.trim() || !productForm.category.trim() || !Number.isFinite(price) || price < 0 || (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) || !unit) {
      setError("Enter a product name, category, valid price, non-negative quantity, and unit.");
      return;
    }
    setSavingProduct(true);
    setError("");
    const payload = {
      name: productForm.name.trim(), price, category: productForm.category.trim(), brand: productForm.brand.trim() || null, quantity,
      weight: productForm.weight.trim() || null, unit,
      image_url: productForm.image_url.trim() || null, in_stock: productForm.in_stock,
    };
    let result = editingProduct
      ? await supabase.rpc("vendor_update_product", {
          p_product_id: editingProduct.id,
          p_name: payload.name,
          p_price: payload.price,
          p_category: payload.category,
          p_quantity: payload.quantity,
          p_weight: payload.weight,
          p_unit: payload.unit,
          p_image_url: payload.image_url,
          p_in_stock: payload.in_stock,
          p_set_name: true,
          p_set_price: true,
          p_set_category: true,
          p_set_quantity: true,
          p_set_weight: true,
          p_set_unit: true,
          p_set_image_url: true,
          p_set_in_stock: true,
        })
      : await supabase.from("products").insert({ ...payload, vendor_id: vendor.id });
    let saveError = result.error;
    if (!saveError && editingProduct) {
      const brandResult = await supabase.rpc("vendor_update_product_brand", {
        p_product_id: editingProduct.id,
        p_brand: payload.brand,
      });
      saveError = brandResult.error;
    }
    if (saveError) {
      console.error("Product save failed:", saveError);
      setError("Product could not be saved. Please review the fields and try again.");
    } else {
      setIsProductFormOpen(false);
      try {
        window.localStorage.setItem("zeshu:vendor-product-defaults", JSON.stringify({
          category: payload.category,
          brand: payload.brand || "",
          unit: payload.unit,
        }));
      } catch {}
      setMessage(editingProduct ? "Product updated." : "Product added. Category, brand and unit will be remembered for your next product.");
      await refreshData();
    }
    setSavingProduct(false);
  };

  const adjustStockQuantity = async (product: Product, delta: number) => {
    if (!vendor || stockUpdatingId) return;
    const current = Number(product.quantity);
    const nextQuantity = Math.max(0, (Number.isFinite(current) ? current : 0) + delta);
    setStockUpdatingId(product.id);
    setError("");
    const { error: updateError } = await supabase.rpc("vendor_update_product", {
      p_product_id: product.id,
      p_quantity: nextQuantity,
      p_in_stock: nextQuantity > 0,
      p_set_quantity: true,
      p_set_in_stock: true,
    });
    if (updateError) {
      console.error("Product quantity update failed:", updateError);
      setError("Quantity could not be updated. Please try again.");
    } else {
      await refreshData();
    }
    setStockUpdatingId(null);
  };

  const toggleStock = async (product: Product) => {
    if (!vendor || stockUpdatingId) return;
    const nextInStock = product.in_stock === false;
    if (nextInStock && product.quantity !== null && product.quantity !== "" && Number(product.quantity) <= 0) {
      setError("Set a positive quantity before marking this product in stock.");
      return;
    }
    setStockUpdatingId(product.id);
    setError("");
    const { error: updateError } = await supabase.rpc("vendor_update_product", {
      p_product_id: product.id,
      p_in_stock: nextInStock,
      p_set_in_stock: true,
    });
    if (updateError) {
      console.error("Product stock update failed:", updateError);
      setError("Stock status could not be updated. Please try again.");
    } else {
      await refreshData();
    }
    setStockUpdatingId(null);
  };

  const deleteProduct = async (product: Product) => {
    if (!vendor || deletingProductId || !window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    setDeletingProductId(product.id);
    setError("");
    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id).eq("vendor_id", vendor.id);
    if (deleteError) {
      console.error("Product delete failed:", deleteError);
      setError("Product could not be deleted. Please try again.");
    } else {
      setMessage("Product deleted.");
      await refreshData();
    }
    setDeletingProductId(null);
  };

  const logout = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Vendor sign out failed:", signOutError);
      setError("Could not sign out safely. Please try again.");
    } else {
      setVendor(null);
      setAccessError("You have signed out.");
    }
  };

  const sendVendorOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(vendorPhone) || authSubmitting) {
      setAuthError("Enter a valid 10-digit mobile number.");
      return;
    }
    setAuthSubmitting(true);
    setAuthError("");
    setAuthNotice("");
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: `+91${vendorPhone}` });
    if (otpError) {
      console.error("Vendor OTP delivery failed:", otpError);
      setAuthError("We could not send an OTP. Check the number and try again.");
    } else {
      setVendorOtpSent(true);
      setAuthNotice("OTP sent. Enter the 6-digit code to continue.");
    }
    setAuthSubmitting(false);
  };

  const verifyVendorOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(vendorOtp) || authSubmitting) {
      setAuthError("Enter the 6-digit OTP.");
      return;
    }
    setAuthSubmitting(true);
    setAuthError("");
    const { data, error: verifyError } = await supabase.auth.verifyOtp({ phone: `+91${vendorPhone}`, token: vendorOtp, type: "sms" });
    if (verifyError || !data.user) {
      console.error("Vendor OTP verification failed:", verifyError);
      setAuthError("The OTP could not be verified. Please try again.");
      setAuthSubmitting(false);
      return;
    }
    setVendorOtp("");
    setVendorOtpSent(false);
    setAuthNotice("");
    setIsAuthorizing(true);
    setAccessError("");
    setAuthSubmitting(false);
    setAuthRefresh((current) => current + 1);
  };

  if (isAuthorizing) return <div className="min-h-screen bg-[#f7f9f5] text-[#132019] flex items-center justify-center"><Loader2 className="animate-spin" aria-label="Checking vendor access" /></div>;
  if (accessError) {
    const needsSignIn = accessError === "Please sign in with a vendor account.";
    return <div className="min-h-screen bg-[#f7f9f5] px-6 flex items-center justify-center text-center text-[#132019]"><div className="max-w-md"><Package className="mx-auto mb-4 text-[#087443]" size={42} /><h1 className="text-2xl font-black">Vendor access required</h1><p className="mt-2 text-slate-500">{accessError}</p>{needsSignIn ? <div className="mt-6 rounded-2xl border border-[#dde7df] bg-white p-4 text-left">{authNotice && <p role="status" className="mb-3 text-sm font-bold text-emerald-700">{authNotice}</p>}{authError && <p role="alert" className="mb-3 text-sm font-bold text-red-700">{authError}</p>}{!vendorOtpSent ? <form onSubmit={sendVendorOtp} className="space-y-3"><label className="block text-sm font-bold text-slate-600">Vendor mobile number<input value={vendorPhone} onChange={(event) => setVendorPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" autoComplete="tel" className="mt-1.5 w-full rounded-xl border border-[#dde7df] bg-white px-3 py-3 text-slate-900 outline-none focus:border-emerald-500" placeholder="10-digit mobile number" /></label><button disabled={authSubmitting} className="w-full rounded-xl bg-[#087443] py-3 font-black text-white disabled:opacity-60">{authSubmitting ? "Sending..." : "Send OTP"}</button></form> : <form onSubmit={verifyVendorOtp} className="space-y-3"><label className="block text-sm font-bold text-slate-600">6-digit OTP<input value={vendorOtp} onChange={(event) => setVendorOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-1.5 w-full rounded-xl border border-[#dde7df] bg-white px-3 py-3 text-center text-lg tracking-[0.35em] text-slate-900 outline-none focus:border-emerald-500" placeholder="000000" /></label><button disabled={authSubmitting} className="w-full rounded-xl bg-[#087443] py-3 font-black text-white disabled:opacity-60">{authSubmitting ? "Verifying..." : "Verify OTP"}</button><button type="button" disabled={authSubmitting} onClick={() => { setVendorOtpSent(false); setVendorOtp(""); setAuthError(""); setAuthNotice(""); }} className="w-full py-2 text-sm font-bold text-slate-600">Use a different number</button></form>}</div> : <p className="mt-2 text-sm text-slate-500">This signed-in account is not linked to a vendor profile.</p>}<button onClick={() => void logout()} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#dde7df] bg-white px-4 py-3 text-sm font-black text-slate-100 hover:bg-slate-100"><LogOut size={17} />Log out</button></div></div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 }, { id: "orders", label: "Orders", icon: ClipboardList },
    { id: "products", label: "Products", icon: ShoppingBag }, { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return <div className="min-h-screen bg-[#f7f9f5] text-[#132019]">
    <OrderAlertManager supabaseClient={supabase} channelName="vendor-order-alerts" filter={vendor?.id ? `vendor_id=eq.${vendor.id}` : undefined} />
    <header className="sticky top-0 z-40 border-b border-[#dde7df] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#16A663] to-[#087443] font-black text-xl">Z</div><div className="min-w-0"><p className="truncate font-black">{vendor?.business_name || "Vendor store"}</p><p className="text-xs font-bold text-slate-500">Zeshu vendor operations</p></div></div>
        <div className="flex items-center gap-2"><button onClick={() => void setStoreStatus(!(vendor?.is_open === true))} disabled={storeSaving} className={`hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black disabled:opacity-60 ${vendor?.is_open ? "bg-[#087443] text-white" : "bg-slate-100 text-slate-700"}`}><span className={`h-2 w-2 rounded-full ${vendor?.is_open ? "bg-white" : "bg-slate-400"}`} />{storeSaving ? "Saving..." : vendor?.is_open ? "Close store" : "Open store"}</button><button onClick={() => void logout()} className="rounded-xl border border-[#dde7df] bg-white p-2.5 text-slate-700 hover:bg-slate-100" aria-label="Sign out"><LogOut size={18} /></button></div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 md:px-6">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${tab === id ? "bg-[#087443] text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-[#087443]"}`}><Icon size={16} />{label}</button>)}</nav>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><CircleAlert className="mt-0.5 shrink-0" size={18} />{error}</div>}
      {message && <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 className="mt-0.5 shrink-0" size={18} />{message}<button className="ml-auto" onClick={() => setMessage("")} aria-label="Dismiss message"><X size={16} /></button></div>}
      <div className="mb-5 flex items-center justify-between gap-3 sm:hidden"><span className={`rounded-full px-3 py-1 text-xs font-black ${vendor?.is_open ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-600"}`}>{vendor?.is_open ? "Store open" : "Store closed"}</span><button onClick={() => void setStoreStatus(!(vendor?.is_open === true))} disabled={storeSaving} className="rounded-xl bg-[#087443] px-3 py-2 text-sm font-black disabled:opacity-60">{storeSaving ? "Saving..." : vendor?.is_open ? "Close store" : "Open store"}</button></div>

      {tab === "dashboard" && <>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
          ["Products", products.length, ShoppingBag, "text-[#087443]"], ["In stock", inStockCount, CheckCircle2, "text-emerald-700"],
          ["Today's orders", todayOrders.length, ClipboardList, "text-amber-300"], ["Today's revenue", `₹${money(todayRevenue)}`, IndianRupee, "text-amber-700"],
        ].map(([label, value, Icon, colour]: any) => <div key={label} className="rounded-2xl border border-[#dde7df] bg-white p-5"><Icon className={colour} size={20} /><p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>)}</section>
        <section className="mt-5 rounded-3xl border border-[#dde7df] bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Needs attention</h2><p className="text-xs text-slate-500">Zeshu brings the work that matters to the top so you do not need to search around.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => openProductForm()} className="rounded-xl bg-[#087443] px-3 py-2 text-xs font-black text-white"><Plus size={15} className="mr-1 inline" />Add product</button><button onClick={() => setTab("orders")} className="rounded-xl border border-[#cfe8d7] px-3 py-2 text-xs font-black text-[#087443]">Open orders</button></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button onClick={() => setTab("orders")} className="rounded-2xl bg-amber-50 p-4 text-left"><p className="text-xs font-black uppercase tracking-wider text-amber-700">Orders to handle</p><p className="mt-1 text-3xl font-black text-slate-900">{attentionOrderCount}</p><p className="mt-1 text-xs text-slate-600">Pending, confirmed or preparing</p></button>
            <button onClick={() => { setTab("products"); setStockFilter("LOW"); }} className="rounded-2xl bg-orange-50 p-4 text-left"><p className="text-xs font-black uppercase tracking-wider text-orange-700">Low stock</p><p className="mt-1 text-3xl font-black text-slate-900">{lowStockCount}</p><p className="mt-1 text-xs text-slate-600">5 units or fewer</p></button>
            <button onClick={() => void setStoreStatus(!(vendor?.is_open === true))} disabled={storeSaving} className="rounded-2xl bg-emerald-50 p-4 text-left disabled:opacity-60"><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Store</p><p className="mt-1 text-xl font-black text-slate-900">{vendor?.is_open ? "Open" : "Closed"}</p><p className="mt-1 text-xs text-slate-600">{storeSaving ? "Saving..." : "Tap to change status"}</p></button>
          </div>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl border border-[#dde7df] bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Recent orders</h2><button onClick={() => setTab("orders")} className="flex items-center text-sm font-bold text-[#087443]">View all <ChevronRight size={16} /></button></div><RecentOrders orders={orders.slice(0, 5)} /></div><div className="rounded-3xl border border-[#dde7df] bg-white p-5"><h2 className="text-lg font-black">Order flow</h2><div className="mt-4 grid grid-cols-2 gap-3">{["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "DELIVERED"].map((status) => <div key={status} className="rounded-2xl bg-[#f1f5f2] p-3"><p className="text-[11px] font-black text-slate-500">{status.replaceAll("_", " ")}</p><p className="mt-1 text-2xl font-black">{statusCount(status)}</p></div>)}</div></div></section>
      </>}

      {tab === "orders" && <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">Orders</h1><p className="text-sm text-slate-500">Only orders assigned to this vendor store are shown.</p></div><button onClick={() => void refreshData()} disabled={isLoading} className="rounded-xl border border-[#dde7df] px-3 py-2 text-sm font-bold hover:bg-slate-900 disabled:opacity-60">{isLoading ? "Refreshing..." : "Refresh"}</button></div>{isLoading ? <Loading /> : orders.length ? <div className="grid gap-4 lg:grid-cols-2">{orders.map((order) => <OrderCard key={order.id} order={order} isTransitioning={transitioningOrderId === order.id} onAdvance={() => void advanceOrder(order)} />)}</div> : <Empty icon={<ClipboardList />} title="No orders yet" copy="New, paid orders for this store will appear here." />}</section>}

      {tab === "products" && <section><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black">Products</h1><p className="text-sm text-slate-500">{products.length} product{products.length === 1 ? "" : "s"} in this store</p></div><button onClick={() => openProductForm()} className="inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 font-black text-white hover:bg-[#065F38]"><Plus size={18} />Add product</button></div><div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]"><label className="flex items-center gap-2 rounded-xl border border-[#dde7df] bg-white px-3"><Search size={17} className="text-slate-500" /><input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Search products" /></label><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-[#dde7df] bg-white px-3 py-3 text-sm font-bold outline-none"><option value="ALL">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)} className="rounded-xl border border-[#dde7df] bg-white px-3 py-3 text-sm font-bold outline-none"><option value="ALL">All stock</option><option value="LOW">Low stock ≤5</option><option value="IN">In stock</option><option value="OUT">Out of stock</option></select></div>{isLoading ? <Loading /> : visibleProducts.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} stockLoading={stockUpdatingId === product.id} deleteLoading={deletingProductId === product.id} onEdit={() => openProductForm(product)} onToggle={() => void toggleStock(product)} onAdjustQuantity={(delta) => void adjustStockQuantity(product, delta)} onDelete={() => void deleteProduct(product)} />)}</div> : <Empty icon={<ShoppingBag />} title="No matching products" copy="Try a different filter or add the first product for this store." />}</section>}

      {tab === "analytics" && <section><h1 className="text-2xl font-black">Analytics</h1><p className="mt-1 text-sm text-slate-500">Calculated from this store's real orders and products.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Today's revenue" value={`₹${money(todayRevenue)}`} /><Metric label="Completed revenue" value={`₹${money(completedRevenue)}`} /><Metric label="Average order value" value={`₹${money(averageOrderValue)}`} /><Metric label="Out of stock" value={String(products.length - inStockCount)} /></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border border-[#dde7df] bg-white p-5"><h2 className="font-black">Top products by ordered quantity</h2>{topProducts.length ? <ol className="mt-4 space-y-3">{topProducts.map(([name, quantity], index) => <li key={name} className="flex items-center justify-between rounded-xl bg-[#f1f5f2] px-3 py-3"><span className="font-bold"><span className="mr-3 text-[#087443]">{index + 1}</span>{name}</span><span className="text-sm font-black text-slate-600">{quantity} sold</span></li>)}</ol> : <p className="mt-4 text-sm text-slate-500">No ordered product quantities are available yet.</p>}</div><div className="rounded-3xl border border-[#dde7df] bg-white p-5"><h2 className="font-black">Order status counts</h2><div className="mt-4 space-y-3">{["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((status) => <div key={status} className="flex justify-between border-b border-white/5 pb-3 text-sm"><span className="font-bold text-slate-600">{status.replaceAll("_", " ")}</span><span className="font-black">{statusCount(status)}</span></div>)}</div></div></div></section>}
    </main>
    {isProductFormOpen && <ProductForm form={productForm} editing={Boolean(editingProduct)} saving={savingProduct} onClose={() => !savingProduct && setIsProductFormOpen(false)} onChange={setProductForm} onSubmit={saveProduct} />}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#dde7df] bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>; }
function Loading() { return <div className="flex min-h-52 items-center justify-center gap-3 text-slate-500"><Loader2 className="animate-spin" size={20} />Loading vendor data...</div>; }
function Empty({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) { return <div className="rounded-3xl border border-dashed border-[#cfe0d2] bg-white p-12 text-center"><div className="mx-auto mb-4 text-slate-500">{icon}</div><h2 className="font-black">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{copy}</p></div>; }
function RecentOrders({ orders }: { orders: Order[] }) { return orders.length ? <div className="space-y-3">{orders.map((order) => <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f1f5f2] p-3"><div className="min-w-0"><p className="truncate text-sm font-black">#{String(order.id).split("-")[0].toUpperCase()}</p><p className="text-xs text-slate-500">{order.created_at ? new Date(order.created_at).toLocaleString() : ""}</p></div><div className="text-right"><p className="font-black">₹{money(order.total_paid)}</p><StatusBadge status={order.status || "PENDING"} /></div></div>)}</div> : <p className="text-sm text-slate-500">No vendor orders yet.</p>; }

function OrderCard({ order, isTransitioning, onAdvance }: { order: Order; isTransitioning: boolean; onAdvance: () => void }) {
  const status = order.status || "PENDING"; const transition = NEXT_STATUS[status]; const items = orderItems(order);
  return <article className="overflow-hidden rounded-3xl border border-[#dde7df] bg-white"><div className="flex items-start justify-between gap-3 border-b border-[#dde7df] bg-slate-800/60 p-4"><div><StatusBadge status={status} /><p className="mt-2 text-xs font-black text-slate-600">#{String(order.id).split("-")[0].toUpperCase()}</p><p className="mt-1 text-xs text-slate-500">{order.created_at ? new Date(order.created_at).toLocaleString() : ""}</p></div><div className="text-right"><p className="text-xl font-black">₹{money(order.total_paid)}</p><p className="text-xs text-slate-500">Delivery fee ₹{money(order.delivery_fee)}</p></div></div><div className="space-y-4 p-4"><div><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Items ({items.length})</p>{items.length ? <div className="space-y-2">{items.map((item, index) => <div key={index} className="flex justify-between rounded-xl bg-[#f1f5f2] px-3 py-2 text-sm"><span className="font-bold">{item?.qty ?? item?.quantity ?? 0} × {item?.item?.name || item?.name || "Product"}</span><span className="text-slate-500">₹{money(item?.item?.price ?? item?.price)}</span></div>)}</div> : <p className="text-sm text-slate-500">No readable item details.</p>}</div><div className="flex gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 shrink-0 text-[#087443]" size={16} /><span>{order.delivery_address || "Address not provided"}</span></div></div><div className="border-t border-[#dde7df] p-4">{transition ? <button onClick={onAdvance} disabled={isTransitioning} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087443] py-3 font-black text-white hover:bg-[#065F38] disabled:opacity-60">{isTransitioning ? <Loader2 className="animate-spin" size={18} /> : <Package size={18} />}{isTransitioning ? "Updating..." : transition.label}</button> : status === "READY_FOR_PICKUP" ? <p className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-3 text-sm font-black text-emerald-700"><CheckCircle2 size={18} />Waiting for rider pickup</p> : <p className="text-center text-sm font-bold text-slate-500">No vendor action is available for this status.</p>}</div></article>;
}

function ProductCard({ product, stockLoading, deleteLoading, onEdit, onToggle, onAdjustQuantity, onDelete }: { product: Product; stockLoading: boolean; deleteLoading: boolean; onEdit: () => void; onToggle: () => void; onAdjustQuantity: (delta: number) => void; onDelete: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const numericQuantity = Number(product.quantity); const lowStock = product.in_stock !== false && Number.isFinite(numericQuantity) && numericQuantity > 0 && numericQuantity <= 5;
  return <article className="overflow-hidden rounded-3xl border border-[#dde7df] bg-white"><div className="flex gap-3 p-4"><div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f1f5f2]">{product.image_url && !imageFailed ? <img src={product.image_url} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover" /> : <ImageIcon aria-label="Product image unavailable" className="text-slate-500" />}</div><div className="min-w-0 flex-1"><h2 className="truncate font-black">{product.name}</h2><p className="mt-1 text-sm font-black text-[#087443]">₹{money(product.price)} <span className="font-medium text-slate-500">{product.unit || ""}</span></p><p className="mt-1 text-xs text-slate-500">{product.category || "Uncategorized"}{product.weight ? ` · ${product.weight}` : ""}</p></div></div><div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#dde7df] px-4 py-3 text-xs font-bold"><div className="flex flex-wrap gap-2">{product.in_stock !== false ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700">In stock</span> : <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">Out of stock</span>}{product.quantity !== null && product.quantity !== "" && <span className={`rounded-full px-2 py-1 ${lowStock ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{lowStock ? "Low stock · " : "Quantity · "}{product.quantity}</span>}</div><div className="inline-flex items-center overflow-hidden rounded-lg border border-[#dde7df] bg-white"><button aria-label={`Reduce ${product.name} quantity`} onClick={() => onAdjustQuantity(-1)} disabled={stockLoading} className="px-2.5 py-1.5 text-base font-black text-slate-600 disabled:opacity-50">−</button><span className="min-w-8 border-x border-[#dde7df] px-2 py-1.5 text-center text-xs font-black">{Number.isFinite(Number(product.quantity)) ? Number(product.quantity) : 0}</span><button aria-label={`Increase ${product.name} quantity`} onClick={() => onAdjustQuantity(1)} disabled={stockLoading} className="px-2.5 py-1.5 text-base font-black text-[#087443] disabled:opacity-50">+</button></div></div><div className="grid grid-cols-3 gap-2 p-3"><button onClick={onToggle} disabled={stockLoading} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-2 py-2 text-xs font-black hover:bg-slate-700 disabled:opacity-60">{stockLoading ? <Loader2 className="animate-spin" size={15} /> : product.in_stock !== false ? <EyeOff size={15} /> : <Eye size={15} />}{product.in_stock !== false ? "Hide" : "Stock"}</button><button onClick={onEdit} className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#087443]/15 px-2 py-2 text-xs font-black text-[#087443] hover:bg-[#087443]/25"><Edit3 size={15} />Edit</button><button onClick={onDelete} disabled={deleteLoading} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-50 px-2 py-2 text-xs font-black text-red-700 hover:bg-red-100">{deleteLoading ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}Delete</button></div></article>;
}

function ProductForm({ form, editing, saving, onClose, onChange, onSubmit }: { form: typeof EMPTY_PRODUCT; editing: boolean; saving: boolean; onClose: () => void; onChange: React.Dispatch<React.SetStateAction<typeof EMPTY_PRODUCT>>; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [onClose, saving]);
  const unitField = <label className="block text-sm font-bold text-slate-600">Unit <span className="text-red-700">*</span><select required value={form.unit} onChange={(event) => onChange((current) => ({ ...current, unit: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#dde7df] bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"><option value="">Select unit</option>{form.unit && !PRODUCT_UNITS.includes(form.unit as typeof PRODUCT_UNITS[number]) && <option value={form.unit}>{form.unit}</option>}{PRODUCT_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label>;
  const knownCategory = VENDOR_PRODUCT_CATEGORIES.some((category) => category.id === form.category);
  const categoryField = <label className="block text-sm font-bold text-slate-600">Category <span className="text-red-700">*</span><select required value={form.category} onChange={(event) => onChange((current) => ({ ...current, category: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#dde7df] bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"><option value="">Select customer category</option>{form.category && !knownCategory && <option value={form.category}>{form.category} (legacy)</option>}{VENDOR_PRODUCT_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select><span className="mt-1 block text-[10px] font-medium leading-4 text-slate-500">Use the closest standard category so customers can find this item and Zeshu can match backup vendors correctly.</span></label>;
  const field = (key: keyof typeof EMPTY_PRODUCT, label: string, type = "text", required = false) => <label className="block text-sm font-bold text-slate-600">{label}<input required={required} type={type} min={type === "number" ? 0 : undefined} step={key === "price" ? "0.01" : undefined} value={String(form[key] ?? "")} onChange={(event) => onChange((current) => ({ ...current, [key]: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#dde7df] bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500" /></label>;
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="fixed inset-0 z-50 flex items-end bg-black/35 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"><form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-[#dde7df] bg-white p-5 shadow-2xl sm:rounded-3xl"><div className="mb-5 flex items-center justify-between"><div><h2 id="product-form-title" className="text-xl font-black">{editing ? "Edit product" : "Add product"}</h2><p className="text-sm text-slate-500">This product is saved only to your vendor store.</p></div><button type="button" aria-label="Close product form" onClick={onClose} disabled={saving} className="rounded-xl bg-slate-100 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><X size={18} /></button></div><div className="grid gap-4 sm:grid-cols-2">{field("name", "Product name", "text", true)}{field("price", "Price (₹)", "number", true)}{categoryField}{field("brand", "Brand")}{field("quantity", "Quantity", "number")}{field("weight", "Weight")}{unitField}</div><div className="mt-4">{field("image_url", "Image URL")}</div><label className="mt-4 flex items-center justify-between rounded-xl border border-[#dde7df] bg-[#f1f5f2] p-3"><span><span className="block font-black">Available for sale</span><span className="text-xs text-slate-500">Inventory is not reserved during checkout.</span></span><input type="checkbox" checked={form.in_stock} onChange={(event) => onChange((current) => ({ ...current, in_stock: event.target.checked }))} className="h-5 w-5 accent-[#087443]" /></label><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl px-4 py-3 font-black text-slate-600">Cancel</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087443] px-5 py-3 font-black text-white disabled:opacity-60">{saving && <Loader2 className="animate-spin" size={17} />}{saving ? "Saving..." : editing ? "Save changes" : "Add product"}</button></div></form></div>;
}
