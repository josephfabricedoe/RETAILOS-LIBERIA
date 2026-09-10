import React from 'react';
import { useCurrency } from '../../hooks/useCurrency';
import { TrendingUp, TrendingDown, DollarSign, Percent, Wallet, CreditCard } from 'lucide-react';

function MetricCard({ label, value, subtext, icon: Icon, color = 'green' }) {
  const colors = {
    green: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/30 text-emerald-300',
    red:   'from-rose-500/15 to-rose-600/5 border-rose-500/30 text-rose-300',
    amber: 'from-amber-500/15 to-amber-600/5 border-amber-500/30 text-amber-300',
    blue:  'from-cyan-500/15 to-blue-600/5 border-cyan-500/30 text-cyan-300',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 flex flex-col justify-between shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
        </div>
        <div className="p-2 rounded-xl bg-white/5 flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtext && (
        <p className="text-[11px] text-slate-400 mt-2 border-t border-white/5 pt-1.5 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default function SummaryMetrics({ sales = [], expenses = [], deliveries = [] }) {
  const { format } = useCurrency();

  const posSalesTotal = sales.reduce((s, sale) => s + (sale.total || 0), 0);
  const deliveryIncome = deliveries
    .filter(d => d.paymentStatus === 'Paid' || d.cashConfirmed)
    .reduce((s, d) => s + (d.charge || 0), 0);
  const grossRevenue = posSalesTotal + deliveryIncome;

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netIncome = grossRevenue - totalExpenses;
  const netMargin = grossRevenue > 0 ? ((netIncome / grossRevenue) * 100).toFixed(1) : '0.0';

  const cashSales = sales
    .filter(s => (s.paymentMethod || 'Cash').toLowerCase() === 'cash')
    .reduce((s, sale) => s + (sale.total || 0), 0);

  const cashDeliveries = deliveries
    .filter(d => (d.paymentStatus === 'Paid' || d.cashConfirmed) && (d.paymentStatus === 'COD' || d.paymentStatus === 'Paid'))
    .reduce((s, d) => s + (d.charge || 0), 0);

  const expectedDrawerCash = (cashSales + cashDeliveries) - totalExpenses;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Gross Revenue"
          value={format(grossRevenue)}
          subtext={`Store: ${format(posSalesTotal)} · Delivery: ${format(deliveryIncome)}`}
          icon={TrendingUp}
          color="green"
        />

        <MetricCard
          label="Operating Expenses"
          value={format(totalExpenses)}
          subtext={`${expenses.length} recorded expense(s)`}
          icon={TrendingDown}
          color="red"
        />

        <MetricCard
          label="Net Operating Profit"
          value={format(netIncome)}
          subtext={`Revenue minus operating expenses`}
          icon={DollarSign}
          color={netIncome >= 0 ? 'green' : 'red'}
        />

        <MetricCard
          label="Net Profit Margin"
          value={`${netMargin}%`}
          subtext={`Operating margin for period`}
          icon={Percent}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Expected Drawer Cash:</span>
          </div>
          <span className="text-white font-black text-sm">{format(expectedDrawerCash)}</span>
        </div>

        <div className="flex items-center justify-between px-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-medium">Digital / MoMo / Bank Inflows:</span>
          </div>
          <span className="text-white font-black text-sm">{format(grossRevenue - (cashSales + cashDeliveries))}</span>
        </div>
      </div>
    </div>
  );
}
