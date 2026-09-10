import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useCurrency } from '../../hooks/useCurrency';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function PaymentPieChart({ sales = [] }) {
  const { formatUSD } = useCurrency();

  // Aggregate sales by payment method
  const methodMap = {};

  sales.forEach((s) => {
    const method = s.paymentMethod || 'Cash';
    const amount = Number(s.totalUSD || s.total || 0);
    if (!methodMap[method]) {
      methodMap[method] = { name: method, value: 0, count: 0 };
    }
    methodMap[method].value += amount;
    methodMap[method].count += 1;
  });

  const data = Object.values(methodMap).sort((a, b) => b.value - a.value);
  const totalAmount = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <p className="text-sm font-medium">No sales recorded for this period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Payment Method Breakdown</h3>
          <p className="text-xs text-slate-500">Distribution across cash, mobile money & credit</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
          Total: {formatUSD(totalAmount)}
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val) => [formatUSD(val), 'Volume']}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '0.75rem',
                border: 'none',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span className="text-xs text-slate-600 font-medium">
                  {value} ({((entry.payload.value / totalAmount) * 100).toFixed(0)}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-slate-700 font-medium">{d.name}</span>
            </div>
            <span className="font-bold text-slate-900">{formatUSD(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
