import React from 'react';
import { useCurrency } from '../../hooks/useCurrency';
import { Coins, ArrowRightLeft } from 'lucide-react';

export default function CurrencyToggle() {
  const { 
    currency, 
    toggleCurrency, 
    exchangeRate, 
    isDualCurrency, 
    primaryCurrency, 
    secondaryCurrency,
    primarySymbol,
    secondarySymbol
  } = useCurrency();

  // If single currency mode, show static badge of active store currency
  if (!isDualCurrency) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 shadow-2xs"
        title={`Store Operating in Single Currency (${primaryCurrency})`}
      >
        <Coins className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-amber-900 font-extrabold">{primaryCurrency} ({primarySymbol})</span>
      </div>
    );
  }

  const nextCurrency = currency === primaryCurrency ? secondaryCurrency : primaryCurrency;

  return (
    <button
      onClick={toggleCurrency}
      title={`Switch to ${nextCurrency}. 1 ${primaryCurrency} = ${exchangeRate} ${secondaryCurrency}`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs rounded-xl text-xs font-semibold text-slate-800 transition-colors group"
    >
      <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-180 transition-transform duration-300" />
      <span className="text-emerald-700 font-extrabold">{currency}</span>
      <span className="text-slate-400 font-bold hidden sm:inline">
        / {nextCurrency}
      </span>
    </button>
  );
}
