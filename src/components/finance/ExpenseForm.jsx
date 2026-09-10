import React, { useState, useRef } from 'react';
import Modal from '../shared/Modal';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../contexts/TenantContext';
import { DollarSign, Camera, AlertCircle, Save } from 'lucide-react';
import { compressReceiptImage } from '../../utils/receiptCompressor';

const EXPENSE_CATEGORIES = [
  'Generator Fuel & Engine Oil',
  'LEC Electricity / Utilities',
  'Staff Food & Daily Lunch Allowance',
  'Store Supplies & Cleaning Materials',
  'Bike / Keh-Keh Transport & Dispatch',
  'Store Rent / Lease Payment',
  'Supplier Cash Payout',
  'Maintenance & Repairs',
  'Other Operational Expense',
];

export default function ExpenseForm({ isOpen, onClose }) {
  const { userProfile, currentUser } = useAuth();
  const { getTenantCol } = useTenant();

  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressReceiptImage(file, 800, 0.7);
      setReceiptPhoto(compressed);
    } catch (err) {
      alert('Failed to process receipt photo');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        category,
        amount: parseFloat(amount),
        currency,
        notes: notes.trim(),
        receiptPhoto: receiptPhoto || '',
        recordedBy: userProfile?.displayName || userProfile?.email || 'Staff',
        recordedById: currentUser?.uid || 'kiosk',
        date: new Date().toISOString().slice(0, 10),
        timestamp: serverTimestamp(),
      };

      await addDoc(getTenantCol('expenses'), payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Operating Expense / Cash Out"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Recording...' : 'Log Expense'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Expense Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Amount Paid *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
            >
              <option value="USD">USD ($)</option>
              <option value="LRD">LRD (L$)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Notes / Details
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 5 gallons fuel for generator evening shift"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Receipt / Bill Photo
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs text-slate-300 font-semibold flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attach Receipt Slip</span>
            </button>
            {receiptPhoto && (
              <img src={receiptPhoto} alt="Receipt" className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
