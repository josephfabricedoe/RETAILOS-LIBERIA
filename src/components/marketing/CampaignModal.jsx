import React, { useState } from 'react';
import { X, MessageSquare, Send, Users, Sparkles, AlertCircle } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { addDoc, Timestamp } from 'firebase/firestore';

const TEMPLATES = [
  {
    name: 'New Stock Restock Alert',
    text: 'Hello {CustomerName}! Exciting news from {StoreName}! 🎉 We just received fresh inventory and new arrivals in store today. Visit us early before stock sells out! WhatsApp: {StorePhone}'
  },
  {
    name: 'Weekend Flash Discount',
    text: 'Hello {CustomerName}! Enjoy our Special Weekend Discount at {StoreName}! 🛍️ Get 10% off storewide this Friday & Saturday. We look forward to seeing you!'
  },
  {
    name: 'VIP Customer Appreciation',
    text: 'Hello {CustomerName}, you are one of our most valued VIP customers at {StoreName}! ⭐ As a thank you for your loyalty, mention this message on your next visit for a complimentary gift.'
  }
];

export default function CampaignModal({ customers = [], onClose, onCreated }) {
  const { getTenantCol, currentStore } = useTenant();

  const [title, setTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [message, setMessage] = useState(TEMPLATES[0].text);
  const [loading, setLoading] = useState(false);

  const eligibleCustomers = customers.filter((c) => {
    if (!c.phone) return false;
    if (targetAudience === 'DEBTORS') return Number(c.outstandingDebtUSD || 0) > 0;
    if (targetAudience === 'VIPS') return Number(c.loyaltyPoints || 0) >= 100;
    return true;
  });

  const previewMessage = message
    .replace('{CustomerName}', 'Kekura')
    .replace('{StoreName}', currentStore?.name || 'Retail Store')
    .replace('{StorePhone}', currentStore?.phone || '0770123456');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const campCol = getTenantCol('campaigns');
      await addDoc(campCol, {
        title: title.trim(),
        targetAudience,
        message,
        recipientCount: eligibleCustomers.length,
        createdAt: Timestamp.now(),
        date: new Date().toISOString()
      });

      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      alert('Error saving campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">New WhatsApp Campaign</h3>
              <p className="text-xs text-slate-500">Reach your customer base directly on WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Campaign Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Month-End Beauty Restock"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
            >
              <option value="ALL">All Customers with Phone Numbers</option>
              <option value="VIPS">VIP Loyalty Members (100+ points)</option>
              <option value="DEBTORS">Customers with Credit / Debt Balance</option>
            </select>
            <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
              🎯 Eligible recipients: {eligibleCustomers.length} customer(s)
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Quick Templates</label>
              <span className="text-[10px] text-slate-400">Click to apply</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => setMessage(tmpl.text)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Campaign Message</label>
            <textarea
              rows="4"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl font-mono text-xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Available tags: {'{CustomerName}'}, {'{StoreName}'}, {'{StorePhone}'}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Customer Message Preview:
            </span>
            <p className="text-xs text-emerald-950 whitespace-pre-wrap">{previewMessage}</p>
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
              disabled={loading || eligibleCustomers.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
