import React, { useState } from 'react';
import { 
  X, 
  Store, 
  User, 
  Phone, 
  MapPin, 
  Tag, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  MessageCircle,
  Clock
} from 'lucide-react';
import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const BUSINESS_CATEGORIES = [
  'Boutique & Fashion',
  'Cosmetics & Hair Beauty',
  'Pharmacy & Health',
  'Supermarket & Grocery',
  'Provisions & Household Goods',
  'Electronics & Phones',
  'Building Materials & Hardware',
  'Restaurant & Cafe',
  'General Retail Goods',
];

const MONROVIA_LOCATIONS = [
  'Sinkor (Tubman Blvd / 1st - 24th St)',
  'Paynesville / ELWA / Duport Road',
  'Red Light Market & Commercial Zone',
  'Waterside Market & Down Town',
  'Central Monrovia / Broad Street',
  'Bushrod Island / Duala Market',
  'Freeport / Clara Town',
  'Congo Town / Old Road',
  'Other County / Outside Monrovia',
];

export default function RegisterInterestModal({ onClose }) {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('Boutique & Fashion');
  const [location, setLocation] = useState('Sinkor (Tubman Blvd / 1st - 24th St)');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Please enter your business or store name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number or WhatsApp.');
      return;
    }

    setError('');
    setSubmitting(true);

    const leadData = {
      id: `lead_${Date.now()}`,
      businessName: businessName.trim(),
      ownerName: ownerName.trim() || 'Store Owner',
      phone: phone.trim(),
      businessType,
      location,
      notes: notes.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // 1. Save locally so it is immediately recorded regardless of connection
    try {
      const existing = JSON.parse(localStorage.getItem('retailos_local_leads') || '[]');
      existing.unshift(leadData);
      localStorage.setItem('retailos_local_leads', JSON.stringify(existing));
    } catch (e) {
      console.warn('Local lead cache warning:', e);
    }

    // 2. Sync to Firestore in cloud
    try {
      await setDoc(doc(db, 'leads', leadData.id), {
        ...leadData,
        serverCreatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore setDoc notice, attempting addDoc fallback:', err);
      try {
        await addDoc(collection(db, 'leads'), {
          ...leadData,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (fallbackErr) {
        console.error('Firestore lead persistence error:', fallbackErr);
      }
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-sans">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Register Your Business</h2>
              <p className="text-[11px] text-slate-500 font-medium">Get onboarded on RetailOS Liberia</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Business Request Received!</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Thank you, <strong className="text-slate-900">{ownerName || businessName}</strong>. Our onboarding team is configuring your store workspace and will contact you via WhatsApp or phone at <span className="font-mono font-bold text-emerald-700">{phone}</span> with your login credentials.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Fast Onboarding Guarantee (under 30 minutes)</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                You will receive your <strong>Store Owner Email</strong> and <strong>Cashier Login Passwords</strong> directly to start ringing sales immediately.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/231770430269?text=Hello%20RetailOS%20Liberia%2C%20I%20just%20submitted%20my%20store%20registration%20for%20${encodeURIComponent(businessName)}.%20Please%20set%20up%20my%20login%20credentials.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Joseph on WhatsApp</span>
              </a>
              <button
                onClick={onClose}
                className="py-3 px-5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Business / Store Name *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. M&M Boutique or Sinkor Pharmacy"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Owner / Contact Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Joseph Doe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Phone / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0770430269"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-medium font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Business Type / Category
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-medium bg-white"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Location in Liberia
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-medium bg-white"
                >
                  {MONROVIA_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Special Requirements or Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Need 2 cashiers, dual currency LRD/USD, or receipt printer assistance."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-medium resize-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>We will manually set up your business workspace, owner credentials, and cashier accounts immediately.</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
