import React, { useState } from 'react';
import { 
  Store, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  WifiOff, 
  DollarSign, 
  MessageCircle, 
  PackageCheck, 
  Lock, 
  Users, 
  Zap,
  TrendingUp
} from 'lucide-react';
import NewStoreModal from '../components/superadmin/NewStoreModal';

export default function LandingPage({ onGoToLogin, onStoreRegistered }) {
  const [showTrialModal, setShowTrialModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Background radial glows */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 backdrop-blur-md bg-slate-950/70 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-none">
                RetailOS <span className="text-cyan-400">Liberia</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest block mt-0.5">
                Multi-Store Cloud POS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Staff Sign In
            </button>
            <button
              onClick={() => setShowTrialModal(true)}
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Built Specifically for Retail Realities in Liberia & West Africa</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            The Complete Operating System for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Liberian Retail Businesses
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Run your boutique, pharmacy, cosmetics store, or supermarket with effortless <span className="text-white font-medium">USD & LRD dual-currency billing</span>, offline network resilience, 4-digit PIN staff registers, and instant WhatsApp daily executive closing reports.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setShowTrialModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Deploy Your Store Workspace Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base rounded-2xl transition-colors"
            >
              Launch POS Terminal
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant WhatsApp receipts</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Works on phones, tablets & PC</span>
          </div>
        </section>

        {/* Feature Grid: Built for West Africa */}
        <section className="py-16 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Engineered for Monrovia's Daily Realities
              </h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Foreign POS software fails in Liberia because of dual currencies, cellular cuts, and theft. RetailOS was designed ground-up for our market.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Dual Currency (USD & LRD)</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Real-time live exchange rate toggle. Display prices, checkout, calculate change, and print receipts simultaneously in US Dollars and Liberian Dollars.
                </p>
              </div>

              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Offline PWA Resiliency</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  When Orange or Lonestar Cell data drops or electricity cuts out, your cashiers keep ringing up sales uninterrupted with multi-tab IndexedDB storage.
                </p>
              </div>

              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">WhatsApp Executive Z-Reports</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Every evening at shift close, the register reconciles cash counted vs expected cash and sends a verified executive Z-Report straight to the store owner's WhatsApp.
                </p>
              </div>

              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">4-Digit PIN Terminal Kiosk</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Staff sign in via shared tablet or PC using a fast 4-digit PIN. Automatically records morning clock-in times and protects owner settings from staff tampering.
                </p>
              </div>

              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Showroom & Storeroom Stock</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Track shelf stock separately from backroom cartons. Transfer items with barcode scanners and perform physical stock cycle count audits with variance logs.
                </p>
              </div>

              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Lead-Time Transit Warnings</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Alerts you to restock goods coming from Dubai/China (3–5 weeks) or Ghana/Nigeria (1–2 weeks) well before you stock out on Monrovia shelves.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-white">Transparent Monthly Pricing for Liberian Stores</h2>
            <p className="text-slate-400 text-sm">Pay in USD or Liberian Dollars. No surprise setup fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Starter Plan</h3>
                <p className="text-xs text-slate-400">Ideal for small provision stores and boutique kiosks.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">$25</span>
                  <span className="text-slate-400 text-xs">/month (or ~L$4,950)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 1 Store Location</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Up to 3 Staff PIN Accounts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> USD & LRD Dual Currency POS</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> WhatsApp Electronic Receipts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 58mm Bluetooth Printer Support</li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs transition-colors"
              >
                Choose Starter
              </button>
            </div>

            {/* Growth (Featured) */}
            <div className="bg-gradient-to-b from-cyan-950/40 to-slate-900 border-2 border-cyan-500 rounded-3xl p-7 space-y-6 flex flex-col justify-between shadow-2xl shadow-cyan-500/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                Most Popular in Monrovia
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Growth Plan</h3>
                <p className="text-xs text-slate-400">For active retail boutiques, pharmacies, and cosmetics stores.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">$45</span>
                  <span className="text-slate-400 text-xs">/month (or ~L$8,910)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Everything in Starter</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Showroom & Storeroom Inventory</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Daily Executive WhatsApp Z-Reports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Shelf Cycle Count Audit Tool</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Restock Lead-Time Warnings</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Customer VIP Loyalty & Store Credit</li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Enterprise Plan</h3>
                <p className="text-xs text-slate-400">For multi-branch supermarkets and high-volume retail chains.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">$85</span>
                  <span className="text-slate-400 text-xs">/month (or ~L$16,830)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Everything in Growth</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Public Customer Storefront Catalog</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Unlimited Staff PIN Accounts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Priority WhatsApp Tech Support</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Custom Store Branding & Colors</li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs transition-colors"
              >
                Choose Enterprise
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 relative z-10">
        <p>RetailOS Liberia &copy; {new Date().getFullYear()} · The Multi-Tenant Cloud POS for Liberia</p>
        <p className="mt-1">Monrovia, Liberia · Empowering local retail commerce</p>
      </footer>

      {showTrialModal && (
        <NewStoreModal
          onClose={() => setShowTrialModal(false)}
          onCreated={(newStore) => {
            if (onStoreRegistered) onStoreRegistered(newStore);
          }}
        />
      )}
    </div>
  );
}
