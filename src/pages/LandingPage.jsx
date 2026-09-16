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
  Award,
  KeyRound
} from 'lucide-react';
import RegisterInterestModal from '../components/public/RegisterInterestModal';

export default function LandingPage({ onGoToLogin }) {
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white font-sans">
      {/* Background soft ambient glows */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50 pointer-events-none" />

      {/* Top Support Hotline Banner */}
      <div className="relative z-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-2 text-xs text-center shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-semibold">
          <span className="flex items-center gap-1.5 font-bold">
            <Phone className="w-3.5 h-3.5 text-emerald-200" />
            Liberia Support Line & WhatsApp:
          </span>
          <a
            href="tel:0770430269"
            className="font-mono font-black text-white hover:underline transition"
          >
            0770430269
          </a>
          <span className="text-emerald-200">·</span>
          <a
            href="https://wa.me/231770430269?text=Hello%20RetailOS%20Liberia%2C%20I%20would%20like%20to%20register%20my%20business"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-100 hover:text-white hover:underline font-bold"
          >
            <MessageCircle className="w-3.5 h-3.5 text-white" />
            Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-200 backdrop-blur-md bg-white/95 sticky top-0 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">
                RetailOS <span className="text-emerald-600">Liberia</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mt-0.5">
                Cloud POS & Store OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Sign In to Store</span>
            </button>
            {/* PART 1: Top Navigation Button */}
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Register Your Business</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Empowering Liberian Retailers & Boutiques</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-tight">
            The Complete Operating System for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              Liberian Retail Businesses
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Run your boutique, pharmacy, cosmetics store, or supermarket with effortless <strong className="text-slate-900 font-bold">single or dual-currency billing</strong> (USD & LRD), fast cashier registers, offline resilience, and automated receipt printing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {/* PART 1: Hero Primary CTA */}
            <button
              onClick={() => setShowRegisterModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Store className="w-5 h-5" />
              <span>Register Your Business</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800 font-bold text-base rounded-2xl shadow-2xs transition-colors"
            >
              Staff & Owner Sign In
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> $0 Free Forever Entry Plan</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Single or Dual Currency (USD & LRD)</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant WhatsApp receipts</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Works on phones, tablets & PC</span>
          </div>
        </section>

        {/* Feature Grid: Built for West Africa */}
        <section className="py-20 bg-white border-y border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Engineered for Monrovia's Daily Realities
              </h2>
              <p className="text-slate-600 text-sm max-w-xl mx-auto font-medium">
                Foreign POS software fails in Liberia because of dual currencies, cellular cuts, and theft. RetailOS was designed ground-up for our market.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 hover:bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-emerald-400/80 shadow-2xs hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-2xs">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Single or Dual Currency</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Support USD, Liberian Dollars (LRD), Ghanaian Cedi (GHS), or CFA Francs. Choose between a pure single currency or live dual-currency exchange rates with instant change calculation.
                </p>
              </div>

              <div className="bg-slate-50 hover:bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-emerald-400/80 shadow-2xs hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Offline PWA Resiliency</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  When Orange or Lonestar Cell data drops or electricity cuts out, your cashiers keep ringing up sales uninterrupted with multi-tab IndexedDB storage.
                </p>
              </div>

              <div className="bg-slate-50 hover:bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-emerald-400/80 shadow-2xs hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-700 shadow-2xs">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">WhatsApp Executive Z-Reports</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Every evening at shift close, the register reconciles cash counted vs expected cash and sends a verified executive Z-Report straight to the store owner's WhatsApp.
                </p>
              </div>

              <div className="bg-slate-50 hover:bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-emerald-400/80 shadow-2xs hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-700 shadow-2xs">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">4-Digit PIN Terminal Kiosk</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Staff sign in via shared tablet or PC using a fast 4-digit PIN. Automatically records morning clock-in times and protects owner settings from staff tampering.
                </p>
              </div>

              <div className="bg-slate-50 hover:bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-emerald-400/80 shadow-2xs hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 shadow-2xs">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Showroom & Storeroom Stock</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Track shelf stock separately from backroom cartons. Transfer items with barcode scanners and perform physical stock cycle count audits with variance logs.
                </p>
              </div>

              <div className="bg-slate-50 hover:bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-emerald-400/80 shadow-2xs hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shadow-2xs">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Lead-Time Transit Warnings</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Alerts you to restock goods coming from Dubai/China (3–5 weeks) or Ghana/Nigeria (1–2 weeks) well before you stock out on Monrovia shelves.
                </p>
              </div>
            </div>

            {/* PART 2: Mid-page Major Call-to-Action Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-600/20">
              <div className="space-y-2 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/40 text-emerald-100 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Custom Store Setup by Joseph Doe & Team</span>
                </div>
                <h3 className="text-2xl font-black">Ready to Modernize Your Retail Store?</h3>
                <p className="text-emerald-100 text-xs sm:text-sm max-w-xl leading-relaxed font-medium">
                  Register your business today. Our Monrovia team will configure your store profile, owner login, and cashier credentials immediately.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-7 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-sm shadow-lg transition-all shrink-0 flex items-center gap-2 active:scale-95"
              >
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Register Your Business</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              Fair & Scalable Plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Accessible Pricing for Every Business in Liberia
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto font-medium">
              Start free with zero monthly fees for entry stores with low sales. Upgrade as your operations grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter (Entry - $0/mo Free Forever) */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-7 space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Entry / Starter</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Free Forever
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  For entry small businesses & micro-retailers with low sales and simple needs. Use it as long as you want!
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-950">$0</span>
                  <span className="text-slate-500 text-xs font-semibold">/month (No time limit)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-200 font-semibold">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Single Terminal POS Counter</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Single or Dual Currency (USD & LRD)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Core Product Inventory & Barcode Scan</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> WhatsApp Electronic Receipts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 58mm Bluetooth Thermal Print</li>
                  <li className="flex items-center gap-2 text-slate-500 font-normal"><span>• Optional: $50 one-time setup & training</span></li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-xs transition-colors shadow-2xs"
              >
                Start Free Forever
              </button>
            </div>

            {/* Growth Plan - $19.99/mo */}
            <div className="bg-white border-2 border-emerald-600 rounded-3xl p-7 space-y-6 flex flex-col justify-between shadow-xl shadow-emerald-600/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm">
                Most Popular for Growing Boutiques
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Growth Plan</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Full Operations
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  For active retail boutiques, cosmetics stores, and pharmacies expanding their team.
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-700">$19.99</span>
                  <span className="text-slate-500 text-xs font-semibold">/month (or ~L$3,950)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-200 font-semibold">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Everything in Entry Plan</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-Staff 4-Digit PIN Terminal Kiosk</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automatic Morning Attendance Punch</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Showroom vs. Storeroom Transfers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Daily Executive WhatsApp Z-Reports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cash Drawer Variance Balancing Audits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Customer VIP Loyalty & Credit Tab Ledger</li>
                  <li className="flex items-center gap-2 text-slate-500 font-normal"><span>• Optional: $50 one-time setup & training</span></li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all"
              >
                Choose Growth ($19.99/mo)
              </button>
            </div>

            {/* Enterprise Plan - $39.99/mo */}
            <div className="bg-white border-2 border-purple-200 hover:border-purple-400 rounded-3xl p-7 space-y-6 flex flex-col justify-between transition-all shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Enterprise Plan</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                    Multi-Branch
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  For multi-branch supermarkets, pharmacies, and high-volume retail operations.
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-purple-700">$39.99</span>
                  <span className="text-slate-500 text-xs font-semibold">/month (or ~L$7,900)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-200 font-semibold">
                  <li className="flex items-center gap-2 font-bold text-emerald-700"><Award className="w-4 h-4 text-emerald-600" /> FREE In-Store Setup & Training (Save $50)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Everything in Growth Plan</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Public Customer Storefront Catalog</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Bike & Keh-Keh Dispatch Board</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Full P&L Statement & COGS Accounting</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Unlimited Staff Accounts & Custom Colors</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Dedicated 24/7 VIP Phone Support</li>
                </ul>
              </div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-md shadow-purple-600/20"
              >
                Choose Enterprise ($39.99/mo)
              </button>
            </div>
          </div>

          {/* On-site Setup & Staff Training Callout Card */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <Award className="w-4 h-4 text-emerald-700" />
                Hands-On In-Store Setup & Staff Training
              </div>
              <h3 className="text-xl font-black text-slate-950">Need Our Team to Come Set Up Your Store in Monrovia?</h3>
              <p className="text-xs text-slate-700 max-w-2xl leading-relaxed font-medium">
                In case your business needs hands-on hardware pairing (Bluetooth 58mm printer, barcode scanner), catalog import, and cashier team training, we provide on-site setup for a <strong className="text-emerald-800 font-bold">$50 USD one-time payment</strong>. 
                <span className="text-slate-900 font-bold block mt-1">★ Enterprise Plan subscribers get in-store setup and staff training 100% FREE!</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href="tel:0770430269"
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs border border-slate-300 transition flex items-center gap-2 shadow-2xs"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Call: 0770430269</span>
              </a>
              <a
                href="https://wa.me/231770430269?text=Hello%20RetailOS%20Liberia%2C%20I%20would%20like%20to%20request%20in-store%20setup%20and%20staff%20training"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: 0770430269</span>
              </a>
            </div>
          </div>
          {/* PART 3: Bottom Major Call-to-Action Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800">
                Fast Monrovia Onboarding
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Take Control of Your Store Today
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Join retail shopkeepers across Monrovia using RetailOS for dual-currency sales, customer store credits, and staff registers.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Store className="w-5 h-5" />
                <span>Register Your Business</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-base rounded-2xl border border-slate-700 transition"
              >
                Already Registered? Sign In
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Support Hotline */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-8 text-xs text-slate-600 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <span className="text-sm font-black text-slate-900 block">RetailOS Liberia 🇱🇷</span>
            <p className="mt-1 text-slate-600 font-medium">The Independent Multi-Tenant Cloud POS & Retail OS for West Africa</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Monrovia, Liberia · Built to empower local retail commerce</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <div className="text-xs">
              <span className="text-slate-500 block font-bold">Official Support Line & WhatsApp:</span>
              <a href="tel:0770430269" className="font-mono font-black text-emerald-700 hover:underline text-sm">
                0770430269
              </a>
            </div>
            <a
              href="https://wa.me/231770430269"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      </footer>

      {showRegisterModal && (
        <RegisterInterestModal onClose={() => setShowRegisterModal(false)} />
      )}
    </div>
  );
}
