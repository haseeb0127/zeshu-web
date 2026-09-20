"use client";

import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminSupabase } from "../../lib/browser-supabase";
import OrderAlertManager from "../../components/OrderAlertManager";
import SupportAlertManager from "../../components/SupportAlertManager";
import { LogOut, MessageCircle, Package, Plus, Send, Store, Users, X } from "lucide-react";

const supabase = adminSupabase();
type Row = Record<string, any>;
type Tab = "overview" | "orders" | "riders" | "vendors" | "products" | "customers" | "support";
const STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

const emptyVendor = { owner_id: "", business_name: "", address: "", category: "", latitude: "", longitude: "", is_open: false, rating: "" };
const emptyRider = { user_id: "", full_name: "", phone_number: "", vehicle_number: "", is_active: false };

const safeError = (error: any) => {
  const message = String(error?.message || "");
  if (message.includes("vendor owner user not found")) return "The owner UUID is not an existing Auth user.";
  if (message.includes("vendor already exists")) return "That Auth user already owns a vendor.";
  if (message.includes("rider user not found")) return "The rider UUID is not an existing Auth user.";
  if (message.includes("rider already exists")) return "That Auth user already has a rider profile.";
  if (message.includes("rider has an active assigned order")) return "This rider has an active delivery. Complete or reassign the delivery before suspending the rider.";
  if (message.includes("admin access required")) return "Admin access required.";
  if (message.includes("invalid")) return "The supplied details are invalid.";
  return "The operation could not be completed. Please refresh and try again.";
};

const vendorCreateError = (error: any) => {
  const message = String(error?.message || "");
  if (message.includes("vendor owner user not found")) return "That Auth User UUID does not exist.";
  if (message.includes("vendor already exists for owner")) return "This user already has a vendor profile.";
  if (message.includes("invalid vendor details")) return "Please check all required vendor details, including category.";
  if (message.includes("admin access required")) return "Your admin session is not authorized.";
  return process.env.NODE_ENV === "development" && message
    ? `Vendor creation failed: ${message}`
    : "The operation could not be completed. Please refresh and try again.";
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [orders, setOrders] = useState<Row[]>([]);
  const [riders, setRiders] = useState<Row[]>([]);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [products, setProducts] = useState<Row[]>([]);
  const [customers, setCustomers] = useState<Row[]>([]);
  const [wallets, setWallets] = useState<Row[]>([]);
  const [selectedRiders, setSelectedRiders] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState("");
  const [saving, setSaving] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendor);
  const [riderForm, setRiderForm] = useState(emptyRider);
  const [vendorModal, setVendorModal] = useState(false);
  const [riderModal, setRiderModal] = useState(false);
  const [suspendingVendorId, setSuspendingVendorId] = useState<string | null>(null);
  const [suspendingRiderId, setSuspendingRiderId] = useState<string | null>(null);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [supportConversations, setSupportConversations] = useState<Row[]>([]);
  const [supportStatusFilter, setSupportStatusFilter] = useState<"ALL" | "WAITING" | "OPEN" | "RESOLVED">("ALL");
  const [selectedSupportConversation, setSelectedSupportConversation] = useState<Row | null>(null);
  const [supportMessages, setSupportMessages] = useState<Row[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportDetailLoading, setSupportDetailLoading] = useState(false);
  const [supportReply, setSupportReply] = useState("");
  const [supportBusy, setSupportBusy] = useState(false);
  const supportRequestRef = useRef(false);
  const supportDetailRequestRef = useRef(0);
  const supportDetailAbortRef = useRef<AbortController | null>(null);

  const load = async () => {
    const results = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("riders").select("id,user_id,full_name,phone_number,vehicle_number,is_active,admin_suspended,created_at"),
      supabase.from("vendors").select("id,owner_id,business_name,category,address,latitude,longitude,is_open,admin_suspended,rating,created_at"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("id,phone,created_at"),
      supabase.from("wallets").select("user_id,coins,zeshu_coins"),
    ]);
    const names = ["orders", "riders", "vendors", "products", "users", "wallets"];
    const failures = results.map((result, index) => result.error ? [names[index], result.error] as const : null).filter(Boolean) as Array<readonly [string, any]>;
    if (failures.length) {
      console.error("Admin data query failed:", failures);
      setError(`Could not load: ${failures.map(([name]) => name).join(", ")}.`);
    } else {
      setError("");
    }
    const [o, r, v, p, c, w] = results;
    if (o.data) setOrders(o.data); if (r.data) setRiders(r.data); if (v.data) setVendors(v.data); if (p.data) setProducts(p.data); if (c.data) setCustomers(c.data); if (w.data) setWallets(w.data);
    setLoading(false);
  };

  const getSupportToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token || "";
  };

  const loadSupportConversations = async () => {
    if (supportRequestRef.current) return;
    supportRequestRef.current = true;
    setSupportLoading(true);
    try {
      const token = await getSupportToken();
      if (!token) return;
      const response = await fetch("/api/admin/support/conversations", { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Support inbox is temporarily unavailable.");
      setSupportConversations(Array.isArray(payload.conversations) ? payload.conversations : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Support inbox is temporarily unavailable.");
    } finally {
      supportRequestRef.current = false;
      setSupportLoading(false);
    }
  };

  const openSupportConversation = async (conversation: Row) => {
    const requestId = supportDetailRequestRef.current + 1;
    supportDetailRequestRef.current = requestId;
    supportDetailAbortRef.current?.abort();
    const controller = new AbortController();
    supportDetailAbortRef.current = controller;
    setSelectedSupportConversation(conversation);
    setSupportMessages([]);
    setSupportReply("");
    setSupportDetailLoading(true);
    try {
      const token = await getSupportToken();
      if (!token) throw new Error("Admin session expired.");
      const response = await fetch(`/api/admin/support/conversations/${conversation.id}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Support thread could not be loaded.");
      if (requestId !== supportDetailRequestRef.current || controller.signal.aborted) return;
      setSelectedSupportConversation(payload.conversation || conversation);
      setSupportMessages(Array.isArray(payload.messages) ? payload.messages : []);
    } catch (loadError) {
      if (controller.signal.aborted || requestId !== supportDetailRequestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : "Support thread could not be loaded.");
    } finally {
      if (requestId === supportDetailRequestRef.current) {
        supportDetailAbortRef.current = null;
        setSupportDetailLoading(false);
      }
    }
  };

  const sendSupportReply = async () => {
    if (!selectedSupportConversation || !supportReply.trim() || supportBusy || selectedSupportConversation.status === "RESOLVED") return;
    setSupportBusy(true); setError("");
    try {
      const token = await getSupportToken();
      if (!token) throw new Error("Admin session expired.");
      const response = await fetch(`/api/admin/support/conversations/${selectedSupportConversation.id}`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reply", message: supportReply.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Reply could not be saved.");
      setSupportReply("");
      if (payload.message) setSupportMessages((current) => [...current, payload.message]);
      if (payload.conversation) {
        setSelectedSupportConversation(payload.conversation);
        setSupportConversations((current) => current.map((item) => item.id === payload.conversation.id ? { ...item, ...payload.conversation, last_message: { body: payload.message?.body || "", sender_role: "ADMIN", created_at: payload.message?.created_at } } : item));
      }
      setNotice("Reply sent.");
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Reply could not be saved.");
    } finally { setSupportBusy(false); }
  };

  const resolveSupportConversation = async () => {
    if (!selectedSupportConversation || supportBusy || selectedSupportConversation.status === "RESOLVED") return;
    setSupportBusy(true); setError("");
    try {
      const token = await getSupportToken();
      if (!token) throw new Error("Admin session expired.");
      const response = await fetch(`/api/admin/support/conversations/${selectedSupportConversation.id}`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "resolve" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Conversation could not be resolved.");
      if (payload.conversation) {
        setSelectedSupportConversation(payload.conversation);
        setSupportConversations((current) => current.map((item) => item.id === payload.conversation.id ? { ...item, ...payload.conversation } : item));
      }
      setNotice("Conversation resolved.");
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Conversation could not be resolved.");
    } finally { setSupportBusy(false); }
  };

  useEffect(() => {
    let alive = true;
    const authorize = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.replace("/admin/login"); return; }
      const { data: role, error: roleError } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (roleError || !role) { if (alive) { setAccessError("Admin access required."); setLoading(false); } return; }
      if (alive) await load();
    };
    void authorize();
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    if (tab !== "support") return;
    void loadSupportConversations();
    const timer = window.setInterval(() => void loadSupportConversations(), 12000);
    return () => window.clearInterval(timer);
  }, [tab]);

  useEffect(() => {
    if (tab !== "support" || !selectedSupportConversation?.id) return;
    const conversationId = selectedSupportConversation.id;
    const channel = supabase
      .channel(`admin-support-live-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${conversationId}` }, (payload: any) => {
        const message = payload?.new;
        if (!message?.id) return;
        setSupportMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        void loadSupportConversations();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_conversations", filter: `id=eq.${conversationId}` }, (payload: any) => {
        const conversation = payload?.new;
        if (!conversation?.id) return;
        setSelectedSupportConversation((current) => current?.id === conversation.id ? { ...current, ...conversation } : current);
        setSupportConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, ...conversation } : item));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selectedSupportConversation?.id, tab]);

  useEffect(() => () => {
    supportDetailAbortRef.current?.abort();
  }, []);

  const assign = async (order: Row) => {
    const rider = riders.find((item) => item.id === selectedRiders[order.id]);
    if (!rider || rider.is_active !== true || rider.admin_suspended === true || order.status !== "READY_FOR_PICKUP") {
      setError("This rider is offline or suspended. Select another rider.");
      await load();
      return;
    }
    setAssigning(order.id); setError("");
    const { error: assignmentError } = await supabase.rpc("admin_assign_rider", {
      p_order_id: order.id,
      p_rider_id: rider.id,
    });
    setAssigning("");
    if (assignmentError) {
      console.error("Admin rider assignment failed:", assignmentError);
      const message = String(assignmentError.message || "");
      if (message.includes("rider is not available for assignment")) {
        setError("This rider is offline or suspended. Select another rider.");
      } else if (message.includes("order is not ready for rider assignment") || message.includes("order is no longer ready for rider assignment")) {
        setError("This order is no longer ready for rider assignment. Refresh and try again.");
      } else if (message.includes("rider not found")) {
        setError("The selected rider could not be found. Refresh and choose another rider.");
      } else if (message.includes("order not found")) {
        setError("The order could not be found. Refresh and try again.");
      } else {
        setError("Rider assignment failed. Refresh and try again.");
      }
      await load();
      return;
    }
    setNotice("Rider assigned. The order status remains READY_FOR_PICKUP."); await load();
  };

  const createVendor = async (event: FormEvent) => {
    event.preventDefault();
    const ownerId = vendorForm.owner_id.trim();
    if (!ownerId) { setError("Existing Auth User UUID is required."); return; }
    const category = vendorForm.category.trim();
    if (!category) { setError("Category is required."); return; }
    const numeric = (value: string) => {
      if (value.trim() === "") return { value: null as number | null, invalid: false };
      const parsed = Number(value);
      return { value: Number.isFinite(parsed) ? parsed : null, invalid: !Number.isFinite(parsed) };
    };
    const latitude = numeric(vendorForm.latitude);
    const longitude = numeric(vendorForm.longitude);
    const rating = numeric(vendorForm.rating);
    if (latitude.invalid || longitude.invalid || rating.invalid) { setError("Please check the optional numeric fields."); return; }
    setSaving(true); setError("");
    const { error: rpcError } = await supabase.rpc("admin_create_vendor", {
      p_owner_id: ownerId, p_business_name: vendorForm.business_name.trim(), p_address: vendorForm.address.trim(), p_category: category,
      p_latitude: latitude.value, p_longitude: longitude.value, p_is_open: vendorForm.is_open, p_rating: rating.value,
    });
    setSaving(false);
    if (rpcError) { console.error("admin_create_vendor failed", rpcError); setError(vendorCreateError(rpcError)); return; }
    setVendorForm(emptyVendor); setVendorModal(false); setNotice("Vendor created successfully."); await load();
  };

  const setVendorSuspension = async (vendor: Row, suspended: boolean) => {
    if (suspendingVendorId) return;
    if (suspended && !window.confirm(`Suspend ${vendor.business_name || "this vendor"}?`)) return;
    setSuspendingVendorId(vendor.id);
    setError("");
    const { error: rpcError } = await supabase.rpc("admin_set_vendor_suspension", { p_vendor_id: vendor.id, p_suspended: suspended });
    if (rpcError) { console.error("Admin vendor suspension failed:", rpcError); setError(safeError(rpcError)); setSuspendingVendorId(null); return; }
    setNotice(suspended ? "Vendor suspended." : "Vendor restored. Store status was not reopened automatically."); await load(); setSuspendingVendorId(null);
  };

  const createRider = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    const { error: rpcError } = await supabase.rpc("admin_create_rider", {
      p_user_id: riderForm.user_id.trim(), p_full_name: riderForm.full_name.trim(), p_phone_number: riderForm.phone_number.trim(), p_vehicle_number: riderForm.vehicle_number.trim() || null, p_is_active: riderForm.is_active,
    });
    setSaving(false);
    if (rpcError) { console.error("Admin rider creation failed:", rpcError); setError(safeError(rpcError)); return; }
    setRiderForm(emptyRider); setRiderModal(false); setNotice("Rider created successfully."); await load();
  };

  const setRiderSuspension = async (rider: Row, suspended: boolean) => {
    if (suspendingRiderId) return;
    if (suspended && !window.confirm(`Suspend ${rider.full_name || "this rider"}?`)) return;
    setSuspendingRiderId(rider.id);
    setError("");
    const { error: rpcError } = await supabase.rpc("admin_set_rider_suspension", { p_rider_id: rider.id, p_suspended: suspended });
    if (rpcError) { console.error("Admin rider suspension failed:", rpcError); setError(safeError(rpcError)); setSuspendingRiderId(null); return; }
    setNotice(suspended ? "Rider suspended." : "Rider restored. Rider remains offline until they choose to go online."); await load(); setSuspendingRiderId(null);
  };

  const toggleStock = async (product: Row) => {
    if (updatingProductId) return;
    setUpdatingProductId(product.id);
    const { error: rpcError } = await supabase.rpc("admin_update_product", { p_product_id: product.id, p_in_stock: !product.in_stock });
    if (rpcError) { console.error("Admin product update failed:", rpcError); setError("Product stock change failed."); } else await load();
    setUpdatingProductId(null);
  };

  const overview = useMemo(() => ({ active: orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length, delivered: orders.filter((o) => o.status === "DELIVERED").length, online: riders.filter((r) => r.is_active && !r.admin_suspended).length, revenue: orders.reduce((sum, o) => sum + Number(o.total_paid || 0), 0) }), [orders, riders]);

  if (loading) return <div className="min-h-screen grid place-items-center"><div className="animate-spin h-10 w-10 border-4 border-[#087443] border-t-transparent rounded-full" /></div>;
  if (accessError) return <div className="min-h-screen grid place-items-center p-6 text-center"><div><h1 className="text-2xl font-black">Admin access required</h1><p className="mt-2 text-slate-500">This account is not authorized for Zeshu HQ.</p></div></div>;

  return <div className="min-h-screen bg-[#f7f9f5] font-sans text-slate-900">
    <OrderAlertManager supabaseClient={supabase} channelName="admin-order-alerts" />
    <SupportAlertManager supabaseClient={supabase} />
    <header className="sticky top-0 z-20 flex items-center justify-between bg-[#087443] px-5 py-4 text-white shadow-[0_8px_24px_rgba(8,116,67,.16)]"><div className="flex items-center gap-3"><Store className="text-emerald-100" /><div><h1 className="font-black tracking-tight">ZESHU HQ</h1><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Operations</p></div></div><button type="button" aria-label="Sign out of admin dashboard" onClick={async () => { await supabase.auth.signOut(); router.replace("/admin/login"); }} className="min-h-10 min-w-10 rounded-xl bg-white/10 p-2"><LogOut size={18} /></button></header>
    <main className="mx-auto max-w-7xl p-5">
      {error && <div role="alert" className="mb-4 flex justify-between rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}<button onClick={() => setError("")}><X size={16} /></button></div>}
      {notice && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{notice}</div>}
      <nav className="mb-6 flex gap-2 overflow-x-auto">{(["overview", "orders", "riders", "vendors", "products", "customers", "support"] as Tab[]).map((item) => <button key={item} onClick={() => { setTab(item); if (item !== "support") { supportDetailRequestRef.current += 1; supportDetailAbortRef.current?.abort(); setSelectedSupportConversation(null); } }} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black capitalize ${tab === item ? "bg-[#087443] text-white" : "bg-white text-slate-500"}`}>{item === "support" && <MessageCircle size={15} aria-hidden="true" />}{item}</button>)}<Link href="/admin/marketing" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-[#087443]">Marketing</Link><Link href="/admin/partners" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-emerald-700">Partner failover</Link></nav>
      {tab === "overview" && <div className="grid gap-4 md:grid-cols-4">{[["Active orders", overview.active], ["Delivered", overview.delivered], ["Available riders", overview.online], ["Revenue", `₹${overview.revenue.toFixed(2)}`]].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]"><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}</div>}
      {tab === "orders" && <section className="overflow-x-auto rounded-2xl bg-white shadow-[0_4px_16px_rgba(19,32,25,.06)]">{orders.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No orders found.</div> : <table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b"><th className="p-4">Order</th><th className="p-4">Status</th><th className="p-4">Vendor / rider</th><th className="p-4">Assignment</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b"><td className="p-4 font-mono text-xs">#{String(order.id).slice(0, 8)}</td><td className="p-4 font-black">{order.status}</td><td className="p-4 text-xs">{vendors.find((v) => v.id === order.vendor_id)?.business_name || "—"}<br />{riders.find((r) => r.id === order.rider_id)?.full_name || "—"}</td><td className="p-4">{order.status === "READY_FOR_PICKUP" && <div className="flex gap-2"><select value={selectedRiders[order.id] || ""} onChange={(e) => setSelectedRiders({ ...selectedRiders, [order.id]: e.target.value })} className="rounded-lg border p-2 text-xs"><option value="">Available rider</option>{riders.filter((r) => r.is_active === true && r.admin_suspended !== true).map((r) => <option key={r.id} value={r.id}>{r.full_name || r.id}</option>)}</select><button aria-label={`Assign rider to order ${String(order.id).slice(0, 8)}`} disabled={assigning === order.id} onClick={() => void assign(order)} className="rounded-lg bg-[#087443] p-2 text-white"><Send size={14} /></button></div>}</td></tr>)}</tbody></table>}</section>}
      {tab === "riders" && <section><div className="mb-4 flex justify-end"><button onClick={() => setRiderModal(true)} className="flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white"><Plus size={16} /> Add Rider</button></div>{riders.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No riders found.</div> : <div className="grid gap-4 md:grid-cols-2">{riders.map((rider) => <div key={rider.id} className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]"><div className="flex justify-between"><div><h2 className="font-black">{rider.full_name || "Unnamed rider"}</h2><p className="text-sm text-slate-500">{rider.phone_number || "Phone unavailable"} · {rider.vehicle_number || "Vehicle unavailable"}</p></div><div className="text-right"><span className={`rounded-full px-2 py-1 text-xs font-black ${rider.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{rider.is_active ? "Online" : "Offline"}</span><p className={`mt-2 text-xs font-black ${rider.admin_suspended ? "text-red-600" : "text-emerald-600"}`}>{rider.admin_suspended ? "Suspended" : "Active"}</p></div></div><p className="mt-3 break-all text-xs text-slate-400">User ID: {rider.user_id}</p><button onClick={() => void setRiderSuspension(rider, !rider.admin_suspended)} className={`mt-4 rounded-xl px-3 py-2 text-xs font-black ${rider.admin_suspended ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{rider.admin_suspended ? "Restore Rider" : "Suspend Rider"}</button></div>)}</div>}</section>}
      {tab === "vendors" && <section><div className="mb-4 flex justify-end"><button onClick={() => setVendorModal(true)} className="flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white"><Plus size={16} /> Add Vendor</button></div>{vendors.length ? <div className="grid gap-4 md:grid-cols-2">{vendors.map((vendor) => <div key={vendor.id} className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]"><div className="flex justify-between"><div><h2 className="font-black">{vendor.business_name || "Unnamed vendor"}</h2><p className="text-sm text-slate-500">{vendor.category || "Uncategorized"}</p></div><div className="text-right"><span className="text-xs font-black">{vendor.is_open ? "Open" : "Closed"}</span><p className={`mt-2 text-xs font-black ${vendor.admin_suspended ? "text-red-600" : "text-emerald-600"}`}>{vendor.admin_suspended ? "Suspended" : "Active"}</p></div></div><p className="mt-3 text-sm text-slate-500">{vendor.address || "Address unavailable"}</p><p className="mt-2 break-all text-xs text-slate-400">Owner ID: {vendor.owner_id}</p><button onClick={() => void setVendorSuspension(vendor, !vendor.admin_suspended)} className={`mt-4 rounded-xl px-3 py-2 text-xs font-black ${vendor.admin_suspended ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{vendor.admin_suspended ? "Restore Vendor" : "Suspend Vendor"}</button></div>)}</div> : <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No vendor profiles exist yet.</div>}</section>}
      {tab === "products" && (products.length === 0 ? <section className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No products found.</section> : <section className="grid gap-4 md:grid-cols-3">{products.map((product) => <div key={product.id} className="rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(19,32,25,.06)]"><h2 className="font-black">{product.name}</h2><p className="text-sm">₹{product.price} · {product.quantity ?? "—"}</p><p className="text-xs text-slate-500">Vendor: {vendors.find((v) => v.id === product.vendor_id)?.business_name || product.vendor_id || "—"}</p><button onClick={() => void toggleStock(product)} className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black">{product.in_stock ? "Mark out of stock" : "Mark in stock"}</button></div>)}</section>)}
      {tab === "customers" && (customers.length === 0 ? <section className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No customers found.</section> : <section className="grid gap-4 md:grid-cols-2">{customers.map((customer) => { const customerOrders = orders.filter((order) => order.user_id === customer.id); const wallet = wallets.find((item) => item.user_id === customer.id); return <div key={customer.id} className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]"><p className="break-all font-mono text-xs">{customer.id}</p><p className="mt-2">{customer.phone || "Phone unavailable"}</p><p className="text-sm text-slate-500">{customerOrders.length} orders · ₹{customerOrders.reduce((sum, order) => sum + Number(order.total_paid || 0), 0).toFixed(2)}</p><p className="mt-2 text-sm">Coins: {wallet?.coins ?? "Unavailable"} · Zeshu Coins: {wallet?.zeshu_coins ?? "Unavailable"}</p></div>; })}</section>)}
      {tab === "support" && <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Support inbox</h2><p className="mt-1 text-xs text-slate-500">Customer conversations and escalation requests.</p></div><button type="button" onClick={() => void loadSupportConversations()} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black">Refresh</button></div>
          <div className="mt-4 flex flex-wrap gap-2">{(["ALL", "WAITING", "OPEN", "RESOLVED"] as const).map((status) => <button type="button" key={status} onClick={() => setSupportStatusFilter(status)} className={`rounded-full px-3 py-1.5 text-[11px] font-black ${supportStatusFilter === status ? "bg-[#087443] text-white" : "bg-slate-100 text-slate-600"}`}>{status === "WAITING" ? "Waiting for support" : status}</button>)}</div>
          {supportLoading && supportConversations.length === 0 ? <p className="mt-5 text-sm text-slate-500">Loading support inbox…</p> : <div className="mt-4 space-y-2">{supportConversations.filter((conversation) => supportStatusFilter === "ALL" || conversation.status === supportStatusFilter).length === 0 ? <p className="rounded-xl bg-[#f7f9f5] p-4 text-sm text-slate-500">No conversations in this view.</p> : supportConversations.filter((conversation) => supportStatusFilter === "ALL" || conversation.status === supportStatusFilter).map((conversation) => <button type="button" key={conversation.id} onClick={() => void openSupportConversation(conversation)} className={`w-full rounded-xl border p-3 text-left transition ${selectedSupportConversation?.id === conversation.id ? "border-emerald-400 bg-emerald-50" : conversation.status === "WAITING" ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-white hover:bg-[#f7f9f5]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-slate-900">{conversation.subject || "Customer support"}</p><p className="mt-1 text-[11px] font-bold text-slate-500">Customer {String(conversation.user_id || "").slice(0, 8)} · {conversation.order_id ? `Order ${String(conversation.order_id).slice(0, 8)}` : "No order linked"}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${conversation.status === "WAITING" ? "bg-amber-200 text-amber-900" : conversation.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{conversation.status === "WAITING" ? "WAITING" : conversation.status}</span></div>{conversation.last_message?.body && <p className="mt-2 truncate text-xs text-slate-600">{conversation.last_message.sender_role === "ADMIN" ? "You: " : ""}{conversation.last_message.body}</p>}<p className="mt-2 text-[10px] font-bold text-slate-400">Updated {conversation.updated_at ? new Date(conversation.updated_at).toLocaleString() : "—"}</p></button>)}</div>}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(19,32,25,.06)]">{!selectedSupportConversation ? <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500"><div><MessageCircle className="mx-auto mb-3 text-slate-300" size={32} /><p>Select a conversation to view the full thread.</p></div></div> : <><div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><p className="font-black text-slate-900">{selectedSupportConversation.subject || "Customer support"}</p><p className="mt-1 text-xs font-bold text-slate-500">Customer {String(selectedSupportConversation.user_id || "").slice(0, 8)} · {selectedSupportConversation.order_id ? `Order ${String(selectedSupportConversation.order_id).slice(0, 8)}` : "No order linked"}</p></div><div className="flex gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black">{selectedSupportConversation.status}</span>{selectedSupportConversation.status !== "RESOLVED" && <button type="button" disabled={supportBusy} onClick={() => void resolveSupportConversation()} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Resolve</button>}</div></div>{supportDetailLoading ? <p className="py-8 text-sm text-slate-500">Loading thread…</p> : <><div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">{supportMessages.length === 0 ? <p className="rounded-xl bg-[#f7f9f5] p-4 text-sm text-slate-500">No messages found.</p> : supportMessages.map((message) => <div key={message.id} className={`rounded-xl p-3 ${message.sender_role === "ADMIN" ? "ml-10 bg-emerald-50" : "mr-10 bg-[#f7f9f5]"}`}><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{message.sender_role === "ADMIN" ? "Zeshu support" : message.sender_role === "CUSTOMER" ? "Customer" : message.sender_role === "AI" ? "Zeshu Assistant" : "Support"}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{message.body}</p><p className="mt-2 text-[10px] text-slate-400">{message.created_at ? new Date(message.created_at).toLocaleString() : ""}</p></div>)}</div>{selectedSupportConversation.status !== "RESOLVED" && <div className="mt-4 border-t pt-4"><label htmlFor="admin-support-reply" className="sr-only">Support reply</label><textarea id="admin-support-reply" rows={3} maxLength={4000} value={supportReply} onChange={(event) => setSupportReply(event.target.value)} placeholder="Write a reply to the customer" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" /><button type="button" disabled={supportBusy || !supportReply.trim()} onClick={() => void sendSupportReply()} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><Send size={15} aria-hidden="true" />{supportBusy ? "Sending…" : "Send reply"}</button></div>}{selectedSupportConversation.status === "RESOLVED" && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">Resolved conversations are read-only.</p>}</>}</>}
        </div>
      </section>}
    </main>
    {vendorModal && <Modal title="Add Vendor" close={() => setVendorModal(false)}><form onSubmit={(event) => void createVendor(event)} className="grid gap-3">{([["owner_id", "Existing Auth User UUID"], ["business_name", "Business Name"], ["address", "Address"], ["category", "Category (required)"], ["latitude", "Latitude (optional)"], ["longitude", "Longitude (optional)"], ["rating", "Rating 0-5 (optional)"]] as const).map(([key, label]) => <input key={key} required={["owner_id", "business_name", "address", "category"].includes(key)} type={key === "latitude" || key === "longitude" || key === "rating" ? "number" : "text"} step="any" placeholder={label} value={vendorForm[key]} onChange={(e) => setVendorForm({ ...vendorForm, [key]: e.target.value })} className="rounded-xl border p-3" />)}<label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={vendorForm.is_open} onChange={(e) => setVendorForm({ ...vendorForm, is_open: e.target.checked })} /> Store open</label><button disabled={saving} className="rounded-xl bg-[#087443] py-3 font-black text-white">{saving ? "Creating..." : "Create Vendor"}</button></form></Modal>}
    {riderModal && <Modal title="Add Rider" close={() => setRiderModal(false)}><form onSubmit={(event) => void createRider(event)} className="grid gap-3">{([["user_id", "Existing Auth User UUID"], ["full_name", "Full Name"], ["phone_number", "Phone Number"], ["vehicle_number", "Vehicle Number (optional)"]] as const).map(([key, label]) => <input key={key} required={key !== "vehicle_number"} placeholder={label} value={riderForm[key]} onChange={(e) => setRiderForm({ ...riderForm, [key]: e.target.value })} className="rounded-xl border p-3" />)}<label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={riderForm.is_active} onChange={(e) => setRiderForm({ ...riderForm, is_active: e.target.checked })} /> Start online</label><button disabled={saving} className="rounded-xl bg-[#087443] py-3 font-black text-white">{saving ? "Creating..." : "Create Rider"}</button></form></Modal>}
  </div>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6"><div className="mb-5 flex items-center justify-between"><h2 id="admin-dialog-title" className="text-xl font-black">{title}</h2><button type="button" aria-label="Close dialog" onClick={close} className="min-h-10 min-w-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><X /></button></div>{children}</div></div>;
}
