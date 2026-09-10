import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  Users, 
  Calendar,
  Search,
  Download
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import { exportToCsv } from '../../utils/exportCsv';

export default function AttendanceView() {
  const { currentStore } = useTenant();
  const { docs: logs, loading } = useTenantCollection('attendance');
  const { docs: staff } = useTenantCollection('staff');

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      !search ||
      (log.staffName && log.staffName.toLowerCase().includes(search.toLowerCase())) ||
      (log.terminal && log.terminal.toLowerCase().includes(search.toLowerCase()));

    const matchDate = !dateFilter || log.date === dateFilter;
    return matchSearch && matchDate;
  });

  const handleExport = () => {
    exportToCsv(
      filteredLogs.map((l) => ({
        Date: l.date,
        Time: l.time,
        Staff: l.staffName,
        Role: l.role,
        Terminal: l.terminal || 'Main Register'
      })),
      `${currentStore?.slug || 'store'}_attendance_${dateFilter}.csv`
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Staff Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated morning PIN kiosk clock-ins and shift timestamps
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Staff Roster</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{staff.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700">Present Today</span>
            <p className="text-2xl font-black text-emerald-900 mt-1">
              {new Set(logs.filter((l) => l.date === new Date().toISOString().slice(0, 10)).map((l) => l.staffId)).size}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Clock Records</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{logs.length}</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Staff Member</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Clock-In Time</th>
              <th className="py-3 px-4">Station / Register</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                  No attendance punches logged for this date.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {log.date || 'Today'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {log.staffName || 'Staff Member'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.role || 'Cashier'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                    {log.time || '08:30 AM'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {log.terminal || 'Main Register'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> On Duty
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
