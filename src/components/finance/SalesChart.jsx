import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

function groupAllByDay(sales = [], deliveries = []) {
  const map = {};

  sales.forEach(item => {
    const d = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!map[key]) map[key] = { date: key, storeSales: 0, deliverySales: 0, totalRevenue: 0 };
    map[key].storeSales += (item.total || 0);
    map[key].totalRevenue += (item.total || 0);
  });

  deliveries.forEach(item => {
    if (item.paymentStatus === 'Paid' || item.cashConfirmed) {
      const d = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[key]) map[key] = { date: key, storeSales: 0, deliverySales: 0, totalRevenue: 0 };
      map[key].deliverySales += (item.charge || 0);
      map[key].totalRevenue += (item.charge || 0);
    }
  });

  return Object.values(map);
}

const CustomTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 shadow-2xl text-xs space-y-1">
      <p className="text-slate-400 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold flex justify-between gap-3">
          <span>{p.name}:</span>
          <span>${Number(p.value).toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
};

export function SalesByDayChart({ sales = [], deliveries = [] }) {
  const data = useMemo(() => groupAllByDay(sales, deliveries), [sales, deliveries]);

  if (!data.length) {
    return <p className="text-slate-500 text-xs text-center py-10">No sales transactions recorded for this period.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v}`}
        />
        <Tooltip content={<CustomTip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 6 }} />
        <Bar
          dataKey="storeSales"
          name="Store POS Sales"
          fill="#0ea5e9"
          maxBarSize={45}
          stackId="a"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="deliverySales"
          name="Delivery Income"
          fill="#10b981"
          maxBarSize={45}
          stackId="a"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueVsExpensesChart({ sales = [], expenses = [], deliveries = [] }) {
  const data = useMemo(() => {
    const revMap = groupAllByDay(sales, deliveries);
    const expMap = {};

    expenses.forEach(item => {
      const d = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      expMap[key] = (expMap[key] || 0) + (item.amount || 0);
    });

    const allDates = [...new Set([...revMap.map(d => d.date), ...Object.keys(expMap)])];

    return allDates.map(date => {
      const revEntry = revMap.find(d => d.date === date);
      return {
        date,
        Revenue: revEntry ? revEntry.totalRevenue : 0,
        Expenses: expMap[date] || 0,
      };
    });
  }, [sales, expenses, deliveries]);

  if (!data.length) {
    return <p className="text-slate-500 text-xs text-center py-10">No revenue or expense records for this period.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v}`}
        />
        <Tooltip content={<CustomTip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 6 }} />
        <Bar
          dataKey="Revenue"
          name="Gross Revenue"
          fill="#10b981"
          maxBarSize={32}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="Expenses"
          name="Operating Expenses"
          fill="#f43f5e"
          maxBarSize={32}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function SalesChart({ sales = [], deliveries = [] }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-800 text-base mb-1">Daily Sales & Inflow Volume</h3>
      <p className="text-xs text-slate-500 mb-4">Daily gross receipts across store counter and delivery dispatches</p>
      <SalesByDayChart sales={sales} deliveries={deliveries} />
    </div>
  );
}

