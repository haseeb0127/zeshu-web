import { useState } from "react";
import QuantityControl from "./QuantityControl";
import { Heart } from "lucide-react";
import { deliveryBadge } from "../lib/fulfillment";

type Product = { id: string | number; name: string; brand?: string; price?: number; weight?: string; unit?: string; image_url?: string; in_stock?: boolean; quantity?: number; vendor_id?: string | null; delivery_mode?: string; fresh_eligible?: boolean; nationwide_shipping_enabled?: boolean; requires_cold_chain?: boolean; packed_weight_grams?: number | null; shipping_class?: string | null; min_nationwide_quantity?: number; min_nationwide_order_value?: number };
type Props = { product: Product; quantity?: number; onAdd: () => void; onRemove: () => void; isFavorite?: boolean; favoriteBusy?: boolean; onFavoriteToggle?: () => void; reviewAverage?: number; reviewCount?: number; onReviews?: () => void; sponsored?: boolean; localThirtyMinuteAvailable?: boolean; nationwideCheckoutEnabled?: boolean };

export default function ProductCard({ product, quantity, onAdd, onRemove, isFavorite = false, favoriteBusy = false, onFavoriteToggle, reviewAverage, reviewCount = 0, onReviews, sponsored = false, localThirtyMinuteAvailable = false, nationwideCheckoutEnabled = false }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const unavailable = !product.vendor_id || product.in_stock === false || Number(product.quantity) <= 0;
  const badge = deliveryBadge(product, { localThirtyMinuteAvailable, nationwideCheckoutEnabled });
  const nationwideMinimum = Number(product.min_nationwide_order_value || 0);
  const nationwideQty = Math.max(1, Number(product.min_nationwide_quantity || 1));
  return <article className="group flex min-h-[290px] flex-col rounded-3xl border border-[#e3e9e4] bg-white p-3 shadow-[0_2px_10px_rgba(20,45,31,.04)] transition-shadow hover:shadow-[0_10px_28px_rgba(20,45,31,.09)] md:p-4">
    <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-[#f5f7f5] p-4">
      {onFavoriteToggle && <button type="button" aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`} aria-pressed={isFavorite} disabled={favoriteBusy} onClick={onFavoriteToggle} className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#087443] shadow-sm disabled:opacity-50"><Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button>}
      {product.image_url && !imageFailed ? <img src={product.image_url} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-center text-xs font-bold text-[#6b7b70]">Image unavailable</div>}
    </div>
    <div className="mb-2 flex flex-wrap items-center gap-1.5">{sponsored && <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-amber-700">Sponsored</span>}<span className={`rounded-full px-2 py-1 text-[9px] font-black ${badge.tone === "fresh" ? "bg-emerald-50 text-emerald-700" : badge.tone === "india" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{badge.label}</span></div>
    <h3 className="min-h-10 text-sm font-bold leading-5 text-[#1b2c22] line-clamp-2">{product.name}</h3>
    {product.brand && <p className="mt-1 truncate text-[11px] font-black uppercase tracking-wide text-[#087443]">{product.brand}</p>}
    <p className="mt-1 min-h-5 text-xs font-medium text-[#6b7b70]">{product.weight || product.unit || "1 unit"}</p>{product.delivery_mode === "INDIA_STANDARD" && product.nationwide_shipping_enabled && (nationwideQty > 1 || nationwideMinimum > 0) && <p className="mt-1 text-[10px] font-bold text-blue-700">{nationwideQty > 1 ? `India delivery from ${nationwideQty}+ units` : `India delivery on eligible baskets${nationwideMinimum > 0 ? ` above ₹${nationwideMinimum}` : ""}`}</p>}
    <div className="mt-1 flex items-center justify-between gap-2">{reviewCount > 0 ? <p className="text-xs font-black text-amber-600">★ {Number(reviewAverage || 0).toFixed(1)} <span className="font-medium text-slate-500">({reviewCount})</span></p> : <p className="text-[11px] font-medium text-slate-400">No reviews yet</p>}{onReviews && <button type="button" onClick={onReviews} className="text-[10px] font-black text-[#087443]">See reviews</button>}</div>
    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#edf1ed] pt-3">
      <span className="text-base font-black text-[#17261d]">₹{product.price || 0}</span>
      {unavailable ? <span className="rounded-lg bg-[#f3f5f3] px-2 py-2 text-[10px] font-black uppercase tracking-wide text-[#78857c]">Currently unavailable</span> : quantity ? <QuantityControl quantity={quantity} label={product.name} onAdd={onAdd} onRemove={onRemove} /> : <button type="button" onClick={onAdd} className="h-10 min-w-[84px] rounded-xl border border-[#087443] bg-[#e9f7ef] px-4 text-xs font-black text-[#075b36] active:scale-95">ADD</button>}
    </div>
  </article>;
}
