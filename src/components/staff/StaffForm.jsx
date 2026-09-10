import React, { useState } from 'react';
import { X, User, KeyRound, Phone, Mail, Shield, CheckCircle2 } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { addDoc, updateDoc, Timestamp } from 'firebase/firestore';

export default function StaffForm({ staff = null, onClose, onSave }) {
  const { getTenantCol, getTenantDoc } = useTenant();

  const [formData, setFormData] = useState({
    name: staff?.name || '',
    role: staff?.role || 'cashier',
    pin: staff?.pin || '',
    phone: staff?.phone || '',
    email: staff?.email || '',
    active: staff?.active !== false
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Staff name is required.');
      return;
    }
    if (!/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (staff?.id) {
        const staffRef = getTenantDoc('staff', staff.id);
        await updateDoc(staffRef, {
          ...formData,
          updatedAt: Timestamp.now()
        });
      } else {
        const staffCol = getTenantCol('staff');
        await addDoc(staffCol, {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }

      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error('Error saving staff:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <p className="text-xs text-slate-500">Assign role and 4-digit terminal PIN</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Marie Cooper"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Store Manager</option>
                <option value="delivery">Delivery Rider</option>
                <option value="owner">Store Owner</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">4-Digit PIN *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono tracking-widest text-center text-sm font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="0770000000 or 0880000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="staff@store.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Account Active</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
