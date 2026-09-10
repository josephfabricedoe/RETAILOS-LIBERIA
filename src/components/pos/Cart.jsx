import React from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import PricingModeSwitcher, { getPriceForMode } from './PricingModeSwitcher';
import { useCurrency } from '../../hooks/useCurrency';

export default function Cart({ items, onUpdate, onRemove, onCheckout }) {
  const { format } = useCurrency();

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const updateMode = (index, mode) => {
    const item = items[index];
    const unitPrice = mode === 'discount' ? item.product.retailPrice : getPriceForMode(item.product, mode);
    const total = unitPrice * item.quantity * (mode === 'discount' ? (1 - (item.discountPct || 0) / 100) : 1);
    onUpdate(index, { ...item, pricingMode: mode, unitPrice, total });
  };

  const updateDiscount = (index, pct) => {
    const item = items[index];
    const unitPrice = item.product.retailPrice;
    const total = unitPrice * item.quantity * (1 - pct / 100);
    onUpdate(index, { ...item, discountPct: pct, unitPrice, total });
  };

  const updateQty = (index, delta) => {
    const item = items[index];
    const qty = Math.max(1, item.quantity + delta);
    const total = item.unitPrice * qty * (item.pricingMode === 'discount' ? (1 - (item.discountPct || 0) / 100) : 1);
    onUpdate(index, { ...item, quantity: qty, total });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400 border border-slate-200">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-700">Register Cart is empty</p>
        <p className="text-xs text-slate-500 mt-1">Scan or tap an item to ring up sale</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 shadow-2xs rounded-2xl p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{item.product.name}</p>
                <p className="text-xs text-slate-400 font-mono">{item.product.barcode}</p>
              </div>
              <button 
                onClick={() => onRemove(i)} 
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <PricingModeSwitcher
                mode={item.pricingMode}
                onChange={mode => updateMode(i, mode)}
                discountPct={item.discountPct || 0}
                onDiscountChange={pct => updateDiscount(i, pct)}
              />
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button 
                  onClick={() => updateQty(i, -1)} 
                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-black w-6 text-center text-slate-900">{item.quantity}</span>
                <button 
                  onClick={() => updateQty(i, +1)} 
                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <span className="text-sm font-black text-emerald-700 ml-1">{format(item.total)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal & Checkout */}
      <div className="border-t border-slate-200 pt-3 mt-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">
            Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})
          </span>
          <span className="text-2xl font-black text-slate-900">{format(subtotal)}</span>
        </div>
        <button
          onClick={() => onCheckout(subtotal)}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.99]"
        >
          Proceed to Tender — {format(subtotal)}
        </button>
      </div>
    </div>
  );
}
