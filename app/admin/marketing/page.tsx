"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { adminSupabase } from "../../lib/browser-supabase";

const supabase = adminSupabase();
type Row = Record<string, any>;
type CampaignForm = {
  id: string;
  client_id: string;
  name: string;
  placement: "HOMEPAGE_BANNER" | "CATEGORY_BANNER" | "SPONSORED_PRODUCT";
  audience: "JAGTIAL" | "INDIA";
  category_name: string;
  headline: string;
  cta_label: string;
  desktop_image_url: string;
  mobile_image_url: string;
  destination_url: string;
  starts_at: string;
  ends_at: string;
  priority: string;
  advertising_fee: string;
  payment_status: "UNPAID" | "PARTIAL" | "PAID" | "WAIVED";
  status: "DRAFT" | "PUBLISHED" | "PAUSED";
  product_ids: string[];
};

const emptyCampaign: CampaignForm = {
  id: "",
  client_id: "",
  name: "",
  placement: "HOMEPAGE_BANNER",
  audience: "JAGTIAL",
  category_name: "",
  headline: "",
  cta_label: "Shop now",
  desktop_image_url: "",
  mobile_image_url: "",
  destination_url: "",
  starts_at: "",
  ends_at: "",
  priority: "50",
  advertising_fee: "",
  payment_status: "UNPAID",
  status: "DRAFT",
  product_ids: [],
};

const toInputDate = (value: unknown) => {
  if (!value) return "";
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const campaignState = (campaign: Row) => {
  if (campaign.status === "PAUSED") return "Paused";
  if (campaign.status === "DRAFT") return "Draft";
  const now = Date.now();
  const start = Date.parse(campaign.starts_at || "");
  const end = Date.parse(campaign.ends_at || "");
  if (Number.isFinite(end) && end < now) return "Expired";
  if (Number.isFinite(start) && start > now) return "Scheduled";
  return "Live";
};

export default function AdminMarketingPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Row[]>([]);
  const [campaigns, setCampaigns] = useState<Row[]>([]);
  const [products, setProducts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | "">("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showClient, setShowClient] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [clientForm, setClientForm] = useState({ business_name: "", contact_person: "", brand_name: "", contact_email: "", contact_phone: "", notes: "" });
  const [form, setForm] = useState<CampaignForm>(emptyCampaign);

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
    const response = await fetch("/api/admin/marketing", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      router.replace("/admin/login");
      return;
    }
    if (!response.ok) setError(payload.error || "Marketing data could not be loaded.");
    else {
      setClients(Array.isArray(payload.clients) ? payload.clients : []);
      setCampaigns(Array.isArray(payload.campaigns) ? payload.campaigns : []);
      setProducts(Array.isArray(payload.products) ? payload.products : []);
      setError("");
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const availableProducts = useMemo(() => products.filter((product) => product.vendor_id && product.in_stock !== false && Number(product.quantity) > 0), [products]);

  const saveClient = async () => {
    setBusy(true); setError(""); setNotice("");
    const accessToken = await token();
    const response = await fetch("/api/admin/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action: "client", ...clientForm }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.error || "Client could not be saved.");
    else {
      setNotice("Client added.");
      setClientForm({ business_name: "", contact_person: "", brand_name: "", contact_email: "", contact_phone: "", notes: "" });
      setShowClient(false);
      await load();
      if (payload.client?.id) setForm((current) => ({ ...current, client_id: payload.client.id }));
    }
    setBusy(false);
  };

  const uploadArtwork = async (file: File, kind: "desktop" | "mobile") => {
    setUploading(kind); setError(""); setNotice("");
    const accessToken = await token();
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/admin/marketing/upload", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: data });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.error || "Artwork upload failed.");
    else {
      setForm((current) => ({ ...current, [kind === "desktop" ? "desktop_image_url" : "mobile_image_url"]: payload.url || "" }));
      setNotice(`${kind === "desktop" ? "Desktop" : "Mobile"} artwork uploaded.`);
    }
    setUploading("");
  };

  const saveCampaign = async (forcedStatus?: CampaignForm["status"]) => {
    setBusy(true); setError(""); setNotice("");
    const nextStatus = forcedStatus || form.status;
    const accessToken = await token();
    const response = await fetch("/api/admin/marketing", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        action: "campaign",
        ...form,
        status: nextStatus,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.error || "Campaign could not be saved.");
    else {
      setNotice(nextStatus === "PUBLISHED" ? "Campaign published." : nextStatus === "PAUSED" ? "Campaign paused." : "Campaign saved.");
      setShowCampaign(false);
      setForm(emptyCampaign);
      await load();
    }
    setBusy(false);
  };

  const setCampaignStatus = async (campaign: Row, status: CampaignForm["status"]) => {
    setBusy(true); setError(""); setNotice("");
    const accessToken = await token();
    const response = await fetch("/api/admin/marketing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        id: campaign.id,
        client_id: campaign.client_id,
        name: campaign.name,
        placement: campaign.placement,
        audience: campaign.audience,
        category_name: campaign.category_name || "",
        headline: campaign.headline || "",
        cta_label: campaign.cta_label || "Shop now",
        desktop_image_url: campaign.desktop_image_url || "",
        mobile_image_url: campaign.mobile_image_url || "",
        destination_url: campaign.destination_url || "",
        starts_at: campaign.starts_at || null,
        ends_at: campaign.ends_at || null,
        priority: campaign.priority ?? 0,
        advertising_fee: campaign.advertising_fee ?? "",
        payment_status: campaign.payment_status || "UNPAID",
        status,
        product_ids: Array.isArray(campaign.product_ids) ? campaign.product_ids : [],
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setError(payload.error || "Campaign status could not be changed.");
    else {
      setNotice(status === "PAUSED" ? "Campaign paused." : status === "PUBLISHED" ? "Campaign published." : "Campaign saved as draft.");
      await load();
    }
    setBusy(false);
  };

  const editCampaign = (campaign: Row) => {
    setForm({
      id: campaign.id,
      client_id: campaign.client_id || "",
      name: campaign.name || "",
      placement: campaign.placement || "HOMEPAGE_BANNER",
      audience: campaign.audience || "JAGTIAL",
      category_name: campaign.category_name || "",
      headline: campaign.headline || "",
      cta_label: campaign.cta_label || "Shop now",
      desktop_image_url: campaign.desktop_image_url || "",
      mobile_image_url: campaign.mobile_image_url || "",
      destination_url: campaign.destination_url || "",
      starts_at: toInputDate(campaign.starts_at),
      ends_at: toInputDate(campaign.ends_at),
      priority: String(campaign.priority ?? 50),
      advertising_fee: campaign.advertising_fee == null ? "" : String(campaign.advertising_fee),
      payment_status: campaign.payment_status || "UNPAID",
      status: campaign.status || "DRAFT",
      product_ids: Array.isArray(campaign.product_ids) ? campaign.product_ids : [],
    });
    setShowCampaign(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedProducts = availableProducts.filter((product) => form.product_ids.includes(String(product.id)));

  if (loading) return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 text-sm font-bold text-slate-500">Loading Marketing…</div></main>;

  return <main className="min-h-screen bg-slate-50 p-4 md:p-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><Link href="/admin/dashboard" className="text-xs font-black text-violet-700">← Admin dashboard</Link><h1 className="mt-1 text-3xl font-black text-slate-950">Marketing</h1><p className="mt-1 text-sm text-slate-500">Clients, banners, sponsored products, scheduling and campaign reporting.</p></div>
        <div className="flex gap-2"><button onClick={() => setShowClient(true)} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-violet-700 shadow-sm"><Plus size={16} className="mr-1 inline" /> Client</button><button onClick={() => { setForm(emptyCampaign); setShowCampaign(true); }} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white"><Plus size={16} className="mr-1 inline" /> Campaign</button></div>
      </div>

      {error && <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}<button onClick={() => setError("")}><X size={16} /></button></div>}
      {notice && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{notice}</div>}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Clients", clients.length], ["Campaigns", campaigns.length], ["Live", campaigns.filter((c) => campaignState(c) === "Live").length], ["Total clicks", campaigns.reduce((sum, c) => sum + Number(c.clicks || 0), 0)]].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>)}
      </section>

      {showClient && <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Add client</h2><p className="text-xs text-slate-500">Business, contact person and brand are required.</p></div><button onClick={() => setShowClient(false)}><X /></button></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">{[
          ["business_name","Business name *"],["contact_person","Contact person *"],["brand_name","Brand *"],["contact_email","Email"],["contact_phone","Phone"]
        ].map(([key,label]) => <label key={key} className="text-xs font-bold text-slate-600">{label}<input value={(clientForm as any)[key]} onChange={(e) => setClientForm({ ...clientForm, [key]: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>)}</div>
        <label className="mt-3 block text-xs font-bold text-slate-600">Notes<textarea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" /></label>
        <button disabled={busy} onClick={() => void saveClient()} className="mt-4 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Saving…" : "Add client"}</button>
      </section>}

      {showCampaign && <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-black">{form.id ? "Edit campaign" : "Create campaign"}</h2><p className="text-xs text-slate-500">Preview artwork, link live products, schedule and publish.</p></div><button onClick={() => setShowCampaign(false)}><X /></button></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-bold text-slate-600">Client *<select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-sm"><option value="">Choose client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.brand_name} · {client.business_name}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-600">Campaign name *<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Placement<select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as CampaignForm["placement"] })} className="mt-1 w-full rounded-xl border p-2.5 text-sm"><option value="HOMEPAGE_BANNER">Homepage banner</option><option value="CATEGORY_BANNER">Category banner</option><option value="SPONSORED_PRODUCT">Sponsored product</option></select></label>
          <label className="text-xs font-bold text-slate-600">Audience<select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as CampaignForm["audience"] })} className="mt-1 w-full rounded-xl border p-2.5 text-sm"><option value="JAGTIAL">Jagtial</option><option value="INDIA">India-wide digital</option></select></label>
          <label className="text-xs font-bold text-slate-600">Category<input value={form.category_name} onChange={(e) => setForm({ ...form, category_name: e.target.value })} placeholder="Optional" className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Priority (0–1000)<input type="number" min="0" max="1000" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Headline<input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Button label<input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Internal destination<input value={form.destination_url} onChange={(e) => setForm({ ...form, destination_url: e.target.value })} placeholder="/scanner or /app" className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Starts<input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Ends<input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Advertising fee ₹<input type="number" min="0" step="0.01" value={form.advertising_fee} onChange={(e) => setForm({ ...form, advertising_fee: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-600">Payment status<select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as CampaignForm["payment_status"] })} className="mt-1 w-full rounded-xl border p-2.5 text-sm"><option>UNPAID</option><option>PARTIAL</option><option>PAID</option><option>WAIVED</option></select></label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-black">Artwork</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{(["desktop","mobile"] as const).map((kind) => <label key={kind} className="rounded-xl border border-dashed border-slate-300 p-3 text-xs font-bold text-slate-600">{kind === "desktop" ? "Desktop image" : "Mobile image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading !== ""} onChange={(e) => { const file=e.target.files?.[0]; if (file) void uploadArtwork(file, kind); }} className="mt-2 block w-full text-xs" /><span className="mt-1 block text-slate-400">{uploading === kind ? "Uploading…" : "JPEG, PNG, WebP or AVIF · max 5 MB"}</span></label>)}</div>
            {(form.desktop_image_url || form.mobile_image_url) && <div className="mt-4 grid gap-3 sm:grid-cols-2">{form.desktop_image_url && <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Desktop preview</p><img src={form.desktop_image_url} alt="Desktop campaign preview" className="h-36 w-full rounded-xl object-cover" /></div>}{form.mobile_image_url && <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Mobile preview</p><img src={form.mobile_image_url} alt="Mobile campaign preview" className="h-36 w-full rounded-xl object-cover" /></div>}</div>}
          </div>
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-black">Linked catalog products</p><p className="mt-1 text-xs text-slate-500">Only live, in-stock products are available. Linking products automatically requires Jagtial targeting.</p><div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{availableProducts.map((product) => { const checked=form.product_ids.includes(String(product.id)); return <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" checked={checked} onChange={() => { const id=String(product.id); setForm((current) => ({ ...current, audience: checked ? current.audience : "JAGTIAL", product_ids: checked ? current.product_ids.filter((x) => x !== id) : [...current.product_ids, id] })); }} /><span className="min-w-0 flex-1"><span className="block truncate font-bold">{product.name}</span><span className="block text-xs text-slate-500">{product.brand || "No brand"} · {product.category || "General"} · ₹{product.price}</span></span></label>; })}</div>{availableProducts.length === 0 && <p className="mt-3 text-xs font-bold text-amber-700">No available catalog products found.</p>}</div>
        </div>

        {selectedProducts.length > 0 && <div className="mt-4 rounded-xl bg-violet-50 p-3 text-xs font-bold text-violet-800">Selected: {selectedProducts.map((product) => product.name).join(", ")}</div>}
        <div className="mt-5 flex flex-wrap gap-2"><button disabled={busy} onClick={() => void saveCampaign("DRAFT")} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-50">Save draft</button><button disabled={busy} onClick={() => void saveCampaign("PUBLISHED")} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Preview checked · Publish</button>{form.id && <button disabled={busy} onClick={() => void saveCampaign("PAUSED")} className="rounded-xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-800 disabled:opacity-50">Pause</button>}</div>
      </section>}

      <section className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black">Campaigns</h2><p className="mt-1 text-xs text-slate-500">Dates automatically determine scheduled/live/expired display; paused campaigns stay hidden.</p></div>
        {campaigns.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No campaigns yet.</div> : <div className="divide-y divide-slate-100">{campaigns.map((campaign) => { const state=campaignState(campaign); const client=clients.find((c) => c.id === campaign.client_id); return <article key={campaign.id} className="grid gap-4 p-5 lg:grid-cols-[1.4fr_.8fr_.8fr_auto] lg:items-center">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black text-slate-900">{campaign.name}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${state === "Live" ? "bg-emerald-100 text-emerald-700" : state === "Paused" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{state}</span>{campaign.placement === "SPONSORED_PRODUCT" && <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-black uppercase text-violet-700">Sponsored</span>}</div><p className="mt-1 text-xs text-slate-500">{client?.brand_name || "Unknown brand"} · {campaign.placement.replace(/_/g," ")} · {campaign.audience}</p><p className="mt-1 text-xs font-bold text-slate-600">{campaign.headline || "No headline"}</p></div>
          <div className="text-xs"><p className="font-black text-slate-400 uppercase">Schedule</p><p className="mt-1 font-bold">{campaign.starts_at ? new Date(campaign.starts_at).toLocaleString() : "—"}</p><p className="text-slate-500">to {campaign.ends_at ? new Date(campaign.ends_at).toLocaleString() : "—"}</p></div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs"><div><p className="font-black text-slate-400">Views</p><p className="mt-1 font-black">{campaign.views || 0}</p></div><div><p className="font-black text-slate-400">Clicks</p><p className="mt-1 font-black">{campaign.clicks || 0}</p></div><div><p className="font-black text-slate-400">CTR</p><p className="mt-1 font-black">{Number(campaign.ctr || 0).toFixed(2)}%</p></div></div>
          <div className="flex gap-2 lg:justify-end"><button onClick={() => editCampaign(campaign)} className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Edit</button>{campaign.status === "PUBLISHED" ? <button disabled={busy} onClick={() => void setCampaignStatus(campaign, "PAUSED")} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 disabled:opacity-50">Pause</button> : <button onClick={() => editCampaign(campaign)} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Review</button>}</div>
        </article>; })}</div>}
      </section>
    </div>
  </main>;
}
