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
  TrendingUp,
  Phone,
  HelpCircle,
  Award
} from 'lucide-react';
import NewStoreModal from '../components/superadmin/NewStoreModal';

export default function LandingPage({ onGoToLogin, onStoreRegistered }) {
  const [showTrialModal, setShowTrialModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Background radial glows */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Top Support Hotline Banner */}
      <div className="relative z-20 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 px-4 py-2 text-xs text-center text-emerald-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-medium">
          <span className="flex items-center gap-1.5 text-white font-bold">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            Liberia Support Line & WhatsApp:
          </span>
          <a
            href="tel:0770430269"
            className="font-mono font-black text-emerald-300 hover:text-white hover:underline transition"
          >
            0770430269
          </a>
          <span className="text-emerald-500">·</span>
          <a
            href="https://wa.me/231770430269?text=Hello%20RetailOS%20Liberia%2C%20I%20would%20like%20assistance%20setting%20up%20my%20store"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-300 hover:text-white hover:underline font-bold"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            Chat on WhatsApp
          </a>
          <span className="hidden sm:inline text-emerald-600">|</span>
          <span className="text-[11px] text-emerald-400/90 hidden md:inline">
            Free forever entry plan available for small micro-retailers!
          </span>
        </div>
      </div>

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
            <a
              href="https://wa.me/231770430269"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-emerald-400 text-xs font-semibold transition"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>0770430269</span>
            </a>
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
              <span>Get Started Free</span>
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
            Run your boutique, pharmacy, cosmetics store, or supermarket with effortless <span className="text-white font-medium">single or dual-currency billing</span> (USD, LRD, GHS, CFA), offline network resilience, 4-digit PIN staff registers, and instant WhatsApp daily executive closing reports.
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
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> $0 Free Forever Entry Plan</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Single or Dual Currency (USD & LRD)</span>
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
                <h3 className="text-lg font-bold text-white">Single or Dual Currency</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Support USD, Liberian Dollars (LRD), Ghanaian Cedi (GHS), or CFA Francs. Choose between a pure single currency or live dual-currency exchange rates with instant change calculation.
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

        {/* Pricing Section (Requirement 2) */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Fair & Scalable Plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Accessible Pricing for Every Business in Liberia
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Start free with zero monthly fees for entry stores with low sales. Upgrade as your operations grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter (Entry - $0/mo Free Forever) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Entry / Starter</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    Free Forever
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  For entry small businesses & micro-retailers with low sales and simple needs. Use it as long as you want!
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">$0</span>
                  <span className="text-slate-400 text-xs">/month (No time limit)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Single Terminal POS Counter</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Single or Dual Currency (USD & LRD)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Core Product Inventory & Barcode Scan</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> WhatsApp Electronic Receipts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 58mm Bluetooth Thermal Print</li>
                  <li className="flex items-center gap-2 text-slate-400"><span>• Optional: $50 one-time setup & training</span></li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs transition-colors"
              >
                Start Free Forever
              </button>
            </div>

            {/* Growth Plan - $19.99/mo */}
            <div className="bg-gradient-to-b from-cyan-950/40 to-slate-900 border-2 border-cyan-500 rounded-3xl p-7 space-y-6 flex flex-col justify-between shadow-2xl shadow-cyan-500/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                Most Popular for Growing Boutiques
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Growth Plan</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                    Full Operations
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  For active retail boutiques, cosmetics stores, and pharmacies expanding their team.
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">$19.99</span>
                  <span className="text-slate-400 text-xs">/month (or ~L$3,950)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Everything in Entry Plan</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Multi-Staff 4-Digit PIN Terminal Kiosk</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Automatic Morning Attendance Punch</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Showroom vs. Storeroom Transfers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Daily Executive WhatsApp Z-Reports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Cash Drawer Variance Balancing Audits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Customer VIP Loyalty & Credit Tab Ledger</li>
                  <li className="flex items-center gap-2 text-slate-400"><span>• Optional: $50 one-time setup & training</span></li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all"
              >
                Choose Growth ($19.99/mo)
              </button>
            </div>

            {/* Enterprise Plan - $39.99/mo */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Enterprise Plan</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    Multi-Branch
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  For multi-branch supermarkets, pharmacies, and high-volume retail operations.
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">$39.99</span>
                  <span className="text-slate-400 text-xs">/month (or ~L$7,900)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2 font-bold text-emerald-400"><Award className="w-4 h-4" /> FREE In-Store Setup & Training (Save $50)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Everything in Growth Plan</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Public Customer Storefront Catalog</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Bike & Keh-Keh Dispatch Board</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Full P&L Statement & COGS Accounting</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Unlimited Staff Accounts & Custom Colors</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Dedicated 24/7 VIP Phone Support</li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs transition-colors"
              >
                Choose Enterprise ($39.99/mo)
              </button>
            </div>
          </div>

          {/* On-site Setup & Staff Training Callout Card */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                Hands-On In-Store Setup & Staff Training
              </div>
              <h3 className="text-xl font-bold text-white">Need Our Team to Come Set Up Your Store in Monrovia?</h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                In case your business needs hands-on hardware pairing (Bluetooth 58mm printer, barcode scanner), catalog import, and cashier team training, we provide on-site setup for a <span className="text-emerald-400 font-bold">$50 USD one-time payment</span>. 
                <span className="text-white font-semibold block mt-1">★ Enterprise Plan subscribers get in-store setup and staff training 100% FREE!</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href="tel:0770430269"
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call: 0770430269</span>
              </a>
              <a
                href="https://wa.me/231770430269?text=Hello%20RetailOS%20Liberia%2C%20I%20would%20like%20to%20request%20in-store%20setup%20and%20staff%20training"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: 0770430269</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Support Hotline */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 px-4 sm:px-8 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <span className="text-sm font-bold text-white block">RetailOS Liberia 🇱🇷</span>
            <p className="mt-1 text-slate-500">The Independent Multi-Tenant Cloud POS & Retail OS for West Africa</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Monrovia, Liberia · Built to empower local retail commerce</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold">Official Support Line & WhatsApp:</span>
              <a href="tel:0770430269" className="font-mono font-bold text-emerald-400 hover:underline text-sm">
                0770430269
              </a>
            </div>
            <a
              href="https://wa.me/231770430269"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
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
