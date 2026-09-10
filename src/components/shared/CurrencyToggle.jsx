import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { DollarSign } from 'lucide-react';

export default function CurrencyToggle() {
  const { currency, toggleCurrency, exchangeRate } = useApp();
  return (
    <button
      onClick={toggleCurrency}
      title={`Exchange Rate: $1 USD = L$${exchangeRate} LRD`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
    >
      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
      <span className="text-amber-300 font-bold">{currency}</span>
      <span className="text-slate-500 hidden sm:inline">/ {currency === 'USD' ? 'LRD' : 'USD'}</span>
    </button>
  );
}
