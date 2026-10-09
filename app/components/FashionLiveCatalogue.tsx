"use client";

import { useEffect, useMemo, useState } from "react";

type FashionProduct = {
  id: string;
  name: string;
  brand?: string | null;
  price: number;
  image_url?: string | null;
  fashion: { department: string; subcategory?: string | null };
  variants: Array<{ id: string; size_label?: string | null; colour_name?: string | null; stock_quantity: number; sale_price?: number | null; mrp?: number | null }>;
  commerce?: { mrp?: number | null; return_eligible?: boolean; return_window_days?: number | null } | null;
  seller: { business_name: string; marketplace_status: string; kyc_verified: boolean; gst_verified: boolean; authorized_brand_partner: boolean; invoice_available: boolean };
};

type Payload = {
  products: FashionProduct[];
  filters: { departments: string[]; sizes: string[]; colours: string[]; brands: string[]; sellers: string[] };
};

const departmentLabel: Record<string, string> = {
  WOMEN: "Women", MEN: "Men", KIDS: "Kids", FOOTWEAR: "Footwear", ACCESSORIES: "Accessories",
};

export default function FashionLiveCatalogue() {
  const [payload, setPayload] = useState<Payload>({ products: [], filters: { departments: [], sizes: [], colours: [], brands: [], sellers: [] } });
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("ALL");
  const [size, setSize] = useState("ALL");
  const [colour, setColour] = useState("ALL");

  useEffect(() => {
    let active = true;
    fetch("/api/fashion/catalog", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("catalogue unavailable")))
      .then((data: Payload) => { if (active) setPayload(data); })
      .catch(() => { if (active) setPayload({ products: [], filters: { departments: [], sizes: [], colours: [], brands: [], sellers: [] } }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const products = useMemo(() => payload.products.filter((product) => {
    if (department !== "ALL" && product.fashion.department !== department) return false;
    if (size !== "ALL" && !product.variants.some((variant) => variant.size_label === size)) return false;
    if (colour !== "ALL" && !product.variants.some((variant) => variant.colour_name === colour)) return false;
    return true;
  }), [payload.products, department, size, colour]);

  return (
    <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 md:p-7" aria-labelledby="live-fashion-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#075E45]">Live seller catalogue</p>
          <h2 id="live-fashion-title" className="mt-1 text-2xl font-black tracking-tight">Available on Zeshu Fashion</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Filters are generated only from seller-backed products and in-stock variants. Empty categories are not padded with demo products.</p>
        </div>
        {!loading && <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">{payload.products.length} live products</span>}
      </div>

      {payload.products.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Filter label="Department" value={department} onChange={setDepartment} options={payload.filters.departments.map((value) => ({ value, label: departmentLabel[value] || value }))} />
        <Filter label="Size" value={size} onChange={setSize} options={payload.filters.sizes.map((value) => ({ value, label: value }))} />
        <Filter label="Colour" value={colour} onChange={setColour} options={payload.filters.colours.map((value) => ({ value, label: value }))} />
      </div>}

      {loading ? (
        <p className="mt-5 text-sm font-semibold text-slate-500">Checking live seller inventory…</p>
      ) : payload.products.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-5">
          <p className="font-black text-slate-900">Real Fashion inventory is being onboarded.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Zeshu will show products here after a seller catalogue, variant stock, pricing and fulfilment details are connected. No placeholder products are being used.</p>
        </div>
      ) : products.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">No live seller inventory matches these filters right now.</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const prices = product.variants.map((variant) => Number(variant.sale_price ?? product.price)).filter(Number.isFinite);
            const fromPrice = prices.length ? Math.min(...prices) : Number(product.price);
            const sizes = [...new Set(product.variants.map((variant) => variant.size_label).filter(Boolean))];
            const colours = [...new Set(product.variants.map((variant) => variant.colour_name).filter(Boolean))];
            return <article key={product.id} className="zeshu-gloss-card rounded-2xl border border-slate-200 p-3">
              <div className="zeshu-product-stage aspect-square overflow-hidden rounded-xl bg-slate-50 p-3">
                {product.image_url ? <img src={product.image_url} alt={product.name} className="zeshu-product-photo h-full w-full object-contain" loading="lazy" /> : <div className="grid h-full place-items-center text-xs font-bold text-slate-400">Image unavailable</div>}
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-black">{product.name}</h3>
              {product.brand && <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-[#075E45]">{product.brand}</p>}
              <p className="mt-1 text-xs font-semibold text-slate-500">Sold by {product.seller.business_name}</p>
              <p className="mt-2 text-lg font-black">₹{fromPrice.toFixed(0)}{prices.length > 1 ? " onwards" : ""}</p>
              {sizes.length > 0 && <p className="mt-1 text-xs text-slate-600">Sizes: {sizes.join(", ")}</p>}
              {colours.length > 0 && <p className="mt-1 text-xs text-slate-600">Colours: {colours.join(", ")}</p>}
              {product.commerce?.return_eligible && product.commerce.return_window_days && <p className="mt-2 text-[11px] font-bold text-emerald-700">{product.commerce.return_window_days}-day return eligible</p>}
            </article>;
          })}
        </div>
      )}
    </section>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="text-xs font-black text-slate-600">{label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900">
      <option value="ALL">All</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}
