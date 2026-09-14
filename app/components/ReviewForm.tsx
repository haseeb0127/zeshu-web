import React from 'react';
import StarRating from './StarRating';

export type ReviewProduct = { id: string; name: string; rating: number; comment: string; existing: boolean };

type ReviewFormProps = {
  overall: number;
  delivery: number;
  store: number;
  comment: string;
  products: ReviewProduct[];
  loading: boolean;
  error: string | null;
  success: string | null;
  existingReview: boolean;
  onOverallChange: (value: number) => void;
  onDeliveryChange: (value: number) => void;
  onStoreChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onProductChange: (id: string, value: number) => void;
  onProductCommentChange: (id: string, value: string) => void;
  onSubmit: () => void;
};

export default function ReviewForm({ overall, delivery, store, comment, products, loading, error, success, existingReview, onOverallChange, onDeliveryChange, onStoreChange, onCommentChange, onProductChange, onProductCommentChange, onSubmit }: ReviewFormProps) {
  return <section className="mt-6 rounded-3xl border border-amber-100 bg-amber-50/60 p-5 text-left" aria-labelledby="review-title">
    <h3 id="review-title" className="text-lg font-black text-slate-900">Rate your order</h3>
    <p className="mt-1 text-xs text-slate-600">{existingReview ? 'You rated this order before.' : 'Your review is verified against this delivered purchase.'}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <label className="rounded-2xl bg-white p-3 text-xs font-black text-slate-700">Overall experience<StarRating value={overall} onChange={onOverallChange} label="Overall experience" /></label>
      <label className="rounded-2xl bg-white p-3 text-xs font-black text-slate-700">Store experience<StarRating value={store} onChange={onStoreChange} label="Store experience" /></label>
      <label className="rounded-2xl bg-white p-3 text-xs font-black text-slate-700">Delivery experience<StarRating value={delivery} onChange={onDeliveryChange} label="Delivery experience" /></label>
    </div>
    {products.length > 0 && <div className="mt-4 rounded-2xl bg-white p-3"><p className="text-xs font-black text-slate-700">Rate products (optional)</p>{products.map((product) => <div key={product.id} className="mt-3 border-b border-slate-100 pb-3 last:border-0"><div className="flex items-center justify-between gap-3"><span className="line-clamp-1 text-xs font-bold text-slate-700">{product.name}</span><StarRating value={product.rating} onChange={(value) => onProductChange(product.id, value)} label={`${product.name} rating`} /></div>{product.existing && product.rating > 0 && <p className="mt-1 text-[11px] font-bold text-amber-700">Your rating: {product.rating}★ · Edit review</p>}<input maxLength={1000} value={product.comment} onChange={(event) => onProductCommentChange(product.id, event.target.value)} placeholder="Optional product comment" className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-xs" /></div>)}</div>}
    <textarea maxLength={1000} value={comment} onChange={(event) => onCommentChange(event.target.value)} placeholder="Optional comment (plain text)" className="mt-4 min-h-20 w-full resize-y rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-amber-400" />
    {error && <p role="alert" className="mt-2 text-xs font-bold text-red-700">{error}</p>}
    {success && <p role="status" className="mt-2 text-xs font-bold text-emerald-700">{success}</p>}
    <button type="button" disabled={loading || overall < 1} onClick={onSubmit} className="mt-4 rounded-xl bg-[#087443] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Saving review…' : existingReview ? 'Update review' : 'Submit review'}</button>
  </section>;
}
