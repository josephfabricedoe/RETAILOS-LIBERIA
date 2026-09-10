import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export const PERIOD_PRESETS = [
  { id: 'today',  label: 'Today' },
  { id: 'week',   label: 'Weekly' },
  { id: 'month',  label: 'Monthly' },
  { id: 'all',    label: 'All Time' },
  { id: 'custom', label: 'Custom' },
];

export function getItemDate(item) {
  if (!item) return null;
  if (item.timestamp?.toDate) return item.timestamp.toDate();
  if (item.date?.toDate) return item.date.toDate();
  if (item.timestamp instanceof Date) return item.timestamp;
  if (typeof item.timestamp === 'string') {
    const d = new Date(item.timestamp);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof item.timestamp === 'number') return new Date(item.timestamp);
  if (typeof item.date === 'string') {
    const d = new Date(item.date);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.createdAt?.toDate) return item.createdAt.toDate();
  return null;
}

export function filterItemsByPeriod(items, mode, refDate = new Date(), customFrom = '', customTo = '') {
  if (!Array.isArray(items)) return [];
  if (mode === 'all') return items;

  if (mode === 'custom' && customFrom && customTo) {
    const fromD = new Date(customFrom + 'T00:00:00');
    const toD = new Date(customTo + 'T23:59:59.999');
    return items.filter(item => {
      const d = getItemDate(item);
      return d && d >= fromD && d <= toD;
    });
  }

  const target = new Date(refDate);

  if (mode === 'today') {
    return items.filter(item => {
      const d = getItemDate(item);
      return d &&
        d.getFullYear() === target.getFullYear() &&
        d.getMonth() === target.getMonth() &&
        d.getDate() === target.getDate();
    });
  }

  if (mode === 'week') {
    const startOfWeek = new Date(target);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return items.filter(item => {
      const d = getItemDate(item);
      return d && d >= startOfWeek && d <= endOfWeek;
    });
  }

  if (mode === 'month') {
    return items.filter(item => {
      const d = getItemDate(item);
      return d &&
        d.getFullYear() === target.getFullYear() &&
        d.getMonth() === target.getMonth();
    });
  }

  return items;
}

export default function DateFilterBar({
  periodMode,
  setPeriodMode,
  refDate,
  setRefDate,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  displayLabel
}) {
  const handlePrev = () => {
    const d = new Date(refDate);
    if (periodMode === 'today') d.setDate(d.getDate() - 1);
    else if (periodMode === 'week') d.setDate(d.getDate() - 7);
    else if (periodMode === 'month') d.setMonth(d.getMonth() - 1);
    setRefDate(d);
  };

  const handleNext = () => {
    const d = new Date(refDate);
    if (periodMode === 'today') d.setDate(d.getDate() + 1);
    else if (periodMode === 'week') d.setDate(d.getDate() + 7);
    else if (periodMode === 'month') d.setMonth(d.getMonth() + 1);
    setRefDate(d);
  };

  const isToday = () => {
    const now = new Date();
    return refDate.toDateString() === now.toDateString();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
        {PERIOD_PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriodMode(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              periodMode === p.id
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodMode !== 'all' && periodMode !== 'custom' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-white px-2">
            {displayLabel}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={periodMode === 'today' && isToday()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {periodMode === 'custom' && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-white focus:outline-none focus:border-cyan-500"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}
    </div>
  );
}
