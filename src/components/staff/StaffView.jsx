import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  KeyRound, 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2,
  CalendarCheck
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import StaffForm from './StaffForm';
import { deleteDoc, addDoc, Timestamp } from 'firebase/firestore';

export default function StaffView() {
  const { getTenantDoc, getTenantCol, currentStore } = useTenant();
  const { docs: staffMembers, loading: staffLoading } = useTenantCollection('staff');
  const { docs: attendanceLogs, loading: logsLoading } = useTenantCollection('attendance');

  const [activeTab, setActiveTab] = useState('roster'); // roster, attendance
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [revealedPins, setRevealedPins] = useState({});

  const togglePin = (id) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      const docRef = getTenantDoc('staff', staffId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error removing staff:', err);
      alert('Failed to remove staff: ' + err.message);
    }
  };

  const handleManualPunch = async (staff) => {
    try {
      const attendanceCol = getTenantCol('attendance');
      await addDoc(attendanceCol, {
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        type: 'CLOCK_IN',
        timestamp: Timestamp.now(),
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        terminal: 'Store Main Register'
      });
      alert(`Clock-in recorded for ${staff.name}`);
    } catch (err) {
      alert('Failed to record clock-in: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">Owner</span>;
      case 'manager':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Manager</span>;
      case 'delivery':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Delivery Rider</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Cashier</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Terminal Access</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage store team members, 4-digit POS terminal PINs, and morning attendance logs
          </p>
        </div>

        <button
          onClick={() => {
            setEditingStaff(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'roster'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Roster ({staffMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'attendance'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance Clock Logs ({attendanceLogs.length})</span>
        </button>
      </div>

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffMembers.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50 stroke-1" />
              <p className="font-semibold text-sm">No staff members configured for this store</p>
              <p className="text-xs mt-1 text-slate-400">Add cashiers or managers so they can unlock the POS terminal with their PIN.</p>
            </div>
          ) : (
            staffMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition">
                        {member.name}
                      </h3>
                      <div className="mt-1">{getRoleBadge(member.role)}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingStaff(member);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member.id, member.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        POS PIN:
                      </span>
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <span>{revealedPins[member.id] ? member.pin : '••••'}</span>
                        <button
                          onClick={() => togglePin(member.id)}
                          className="text-[10px] text-emerald-600 hover:underline"
                        >
                          {revealedPins[member.id] ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                    </div>

                    {member.phone && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          Phone:
                        </span>
                        <span className="font-mono">{member.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Status:</span>
                      {member.active !== false ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                          <XCircle className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleManualPunch(member)}
                    className="w-full py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Record Morning Clock-In
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Clock Time</th>
                <th className="py-3 px-4">Terminal / Station</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                    No attendance logs recorded yet.
                  </td>
                </tr>
              ) : (
                attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {log.date || 'Today'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.staffName || 'Staff Member'}
                    </td>
                    <td className="py-3 px-4">
                      {getRoleBadge(log.role || 'cashier')}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-600">
                      {log.time || '08:30 AM'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.terminal || 'Main Register'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <StaffForm
          staff={editingStaff}
          onClose={() => {
            setShowModal(false);
            setEditingStaff(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingStaff(null);
          }}
        />
      )}
    </div>
  );
}
