import { useApp } from '../contexts/AppContext';

export const WEST_AFRICAN_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', defaultRate: 1 },
  { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$', defaultRate: 198 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', defaultRate: 15.5 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', defaultRate: 1550 },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', defaultRate: 605 },
  { code: 'SLE', name: 'Sierra Leonean Leone', symbol: 'Le', defaultRate: 22.5 },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'FG', defaultRate: 8600 },
  { code: 'EUR', name: 'Euro', symbol: '€', defaultRate: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', defaultRate: 0.77 },
];

export function useCurrency() {
  const { 
    currency, 
    toggleCurrency, 
    exchangeRate, 
    currencyMode = 'dual',
    primaryCurrency = 'USD',
    primarySymbol = '$',
    secondaryCurrency = 'LRD',
    secondarySymbol = 'L$'
  } = useApp();

  const isDualCurrency = currencyMode === 'dual';
  const fxRate = Number(exchangeRate || 198);

  const format = (amountInPrimary) => {
    const val = Number(amountInPrimary || 0);
    if (!isDualCurrency || currency === primaryCurrency) {
      return `${primarySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    const secondaryVal = val * fxRate;
    return `${secondarySymbol}${Math.round(secondaryVal).toLocaleString()}`;
  };

  const formatPrimary = (val) => {
    return `${primarySymbol}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSecondary = (val) => {
    const secondaryVal = Number(val || 0) * fxRate;
    return `${secondarySymbol}${Math.round(secondaryVal).toLocaleString()}`;
  };

  // Backwards compatibility aliases
  const formatUSD = formatPrimary;
  const formatLRD = formatSecondary;

  const formatBoth = (valInPrimary) => ({
    primary: format(valInPrimary),
    usd: formatPrimary(valInPrimary),
    lrd: isDualCurrency ? formatSecondary(valInPrimary) : null,
    secondary: isDualCurrency ? formatSecondary(valInPrimary) : null
  });

  const toPrimary = (amount) => (currency === primaryCurrency || !isDualCurrency) ? amount : amount / fxRate;
  const toSecondary = (amountInPrimary) => amountInPrimary * fxRate;

  return {
    currency,
    toggleCurrency,
    exchangeRate: fxRate,
    fxRate,
    currencyMode,
    isDualCurrency,
    primaryCurrency,
    primarySymbol,
    secondaryCurrency,
    secondarySymbol,
    format,
    formatPrimary,
    formatSecondary,
    formatUSD,
    formatLRD,
    formatBoth,
    toPrimary,
    toSecondary,
    toUSD: toPrimary,
    toLRD: toSecondary
  };
}
