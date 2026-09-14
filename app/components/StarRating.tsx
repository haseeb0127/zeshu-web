import React from 'react';

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  label?: string;
  readOnly?: boolean;
};

export default function StarRating({ value, onChange, label = 'Rating', readOnly = false }: StarRatingProps) {
  return <div role={readOnly ? undefined : 'radiogroup'} aria-label={label} className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" aria-label={`${star} star${star === 1 ? '' : 's'}`} aria-checked={value === star} role={readOnly ? undefined : 'radio'} disabled={readOnly} onClick={() => onChange?.(star)} className={`text-2xl leading-none transition ${star <= value ? 'text-amber-400' : 'text-slate-300'} ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}>★</button>)}
  </div>;
}
