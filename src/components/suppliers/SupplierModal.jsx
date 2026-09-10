import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { setDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useTenant } from '../../contexts/TenantContext';
import { Save, Trash2, AlertCircle, Building2, Phone, Mail, Clock, CreditCard, MapPin } from 'lucide-react';

const PAYMENT_TERMS_OPTIONS = [
  'Cash on Delivery (COD)',
  'Net 7 Days',
  'Net 15 Days',
  'Net 30 Days',
  'Advance Payment / Wire',
  'Consignment',
];

const TRADE_COUNTRIES = [
  'Monrovia, Liberia (Local)',
  'Dubai, UAE',
  'Guangzhou / Yiwu, China',
  'Lagos, Nigeria',
  'Accra, Ghana',
  'Abidjan, Ivory Coast',
  'United States / UK',
];

export default function SupplierModal({ isOpen, onClose, editSupplier = null }) {
  const isEdit = !!editSupplier;
  const { getTenantCol, getTenantDoc } = useTenant();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('Monrovia, Liberia (Local)');
  const [terms, setTerms] = useState('Cash on Delivery (COD)');
  const [leadTimeWeeks, setLeadTimeWeeks] = useState(2);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editSupplier) {
        setName(editSupplier.name || '');
        setCode(editSupplier.code || '');
        setContactPerson(editSupplier.contactPerson || '');
        setPhone(editSupplier.phone || '');
        setEmail(editSupplier.email || '');
        setCountry(editSupplier.country || 'Monrovia, Liberia (Local)');
        setTerms(editSupplier.terms || 'Cash on Delivery (COD)');
        setLeadTimeWeeks(editSupplier.transitLeadWeeks != null ? editSupplier.transitLeadWeeks : 2);
        setAddress(editSupplier.address || '');
      } else {
        setName('');
        setCode(`SUP-${Math.floor(1000 + Math.random() * 9000)}`);
        setContactPerson('');
        setPhone('');
        setEmail('');
        setCountry('Monrovia, Liberia (Local)');
        setTerms('Cash on Delivery (COD)');
        setLeadTimeWeeks(2);
        setAddress('');
      }
      setError('');
      setConfirmDelete(false);
    }
  }, [isOpen, editSupplier]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Supplier name is required'); return; }

    setSaving(true);
    setError('');

    const data = {
      name: name.trim(),
      code: code.trim() || `SUP-${Date.now().toString().slice(-4)}`,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      country,
      terms,
      transitLeadWeeks: Number(leadTimeWeeks) || 1,
      address: address.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      if (isEdit) {
        await setDoc(getTenantDoc('suppliers', editSupplier.id), data, { merge: true });
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(getTenantCol('suppliers'), data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    setSaving(true);
    try {
      await deleteDoc(getTenantDoc('suppliers', editSupplier.id));
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Supplier: ${editSupplier.name}` : 'Register New Supplier / Vendor'}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Delete vendor?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs text-slate-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-slate-500 hover:text-red-400 rounded-xl"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : (isEdit ? 'Update Supplier' : 'Save Supplier')}</span>
            </button>
          </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Supplier / Company Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dubai Wholesale Perfumes LLC"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Vendor Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Origin / Hub Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {TRADE_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Contact Representative
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Mr. Ahmed / Fatu"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Phone / WhatsApp Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971... or +231..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Transit Lead Time (Weeks to Monrovia)
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={leadTimeWeeks}
              onChange={(e) => setLeadTimeWeeks(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Payment Terms
            </label>
            <select
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {PAYMENT_TERMS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
