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
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300"
        title={`Store Operating in Single Currency (${primaryCurrency})`}
      >
        <Coins className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-amber-300 font-bold">{primaryCurrency} ({primarySymbol})</span>
      </div>
    );
  }

  const nextCurrency = currency === primaryCurrency ? secondaryCurrency : primaryCurrency;

  return (
    <button
      onClick={toggleCurrency}
      title={`Switch to ${nextCurrency}. 1 ${primaryCurrency} = ${exchangeRate} ${secondaryCurrency}`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold transition-colors group"
    >
      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-300" />
      <span className="text-amber-300 font-bold">{currency}</span>
      <span className="text-slate-500 hidden sm:inline">
        / {nextCurrency}
      </span>
    </button>
  );
}
