import React from 'react';

export const PRICING_MODES = [
  { id: 'retail',     label: 'Retail',  short: 'R' },
  { id: 'halfDozen',  label: '6x',      short: '6' },
  { id: 'dozen',      label: '12x',     short: '12' },
  { id: 'discount',   label: 'Disc%',   short: '%' },
];

export function getPriceForMode(product, mode) {
  switch (mode) {
    case 'retail':    return product.retailPrice || 0;
    case 'halfDozen': return product.halfDozenPrice || (product.retailPrice ? product.retailPrice * 0.9 : 0);
    case 'dozen':     return product.dozenPrice || (product.retailPrice ? product.retailPrice * 0.85 : 0);
    default:          return product.retailPrice || 0;
  }
}

export default function PricingModeSwitcher({ mode, onChange, discountPct, onDiscountChange }) {
  return (
    <div className="flex items-center gap-1">
      {PRICING_MODES.map(m => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
            mode === m.id
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          {m.short}
        </button>
      ))}
      {mode === 'discount' && (
        <input
          type="number"
          min={0} max={100} step={1}
          value={discountPct}
          onChange={e => onDiscountChange(Number(e.target.value))}
          className="w-14 bg-white border border-slate-300 rounded-lg px-1.5 py-0.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
          placeholder="%"
        />
      )}
    </div>
  );
}
