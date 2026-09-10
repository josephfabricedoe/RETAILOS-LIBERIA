import React, { useState } from 'react';
import { 
  Store, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  MessageCircle, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  ArrowUpRight,
  Package,
  Layers,
  Settings
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useApp } from '../../contexts/AppContext';

export default function StorefrontHubView() {
  const { currentStore, currentTenant, tenantId } = useTenant();
  const { setActiveModule } = useApp();
  const { docs: products } = useTenantCollection('products');

  const [copied, setCopied] = useState(false);

  const storeSlug = currentStore?.slug || currentTenant?.slug || tenantId || 'store';
  const storefrontUrl = `${window.location.origin}/?store=${storeSlug}#catalog`;
  const storePhone = currentStore?.whatsappNumber || currentStore?.phone || 'Not Configured';
  const activeProducts = products.filter(p => Number(p.showroomQty ?? p.showroomStock ?? p.stock ?? p.quantity ?? 0) > 0);

  const handleCopy = () => {
    navigator.clipboard?.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Public Online Storefront</h1>
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Enterprise Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customer-facing digital catalog connected directly to your sales counter WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-black text-white rounded-xl shadow-xs transition"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied URL!' : 'Copy Catalog Link'}</span>
          </button>

          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
          >
            <span>Open Live Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* URL Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Active &amp; Ready for Customers Across Liberia</span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Share Your Link on WhatsApp Status &amp; Facebook
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Customers can open this link on any mobile phone or browser without installing an app. They can view your available showroom stock and dispatch their order ticket straight to your WhatsApp line.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
          <div className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 font-mono text-xs text-emerald-300 truncate select-all">
            {storefrontUrl}
          </div>
          <button
            onClick={handleCopy}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy URL'}</span>
          </button>
        </div>
      </div>

      {/* Storefront Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Showroom Items Online</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
            <span>{activeProducts.length}</span>
            <span className="text-xs font-semibold text-slate-400">/ {products.length} catalog items</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live stock synced automatically from POS</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">WhatsApp Order Desk</span>
          <div className="text-lg font-black text-slate-900 mt-1 font-mono flex items-center gap-1.5 text-emerald-700">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>{storePhone}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Number where orders are sent</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Store Branding</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {currentStore?.logoUrl ? '✓ Custom Logo Set' : 'Default Monogram'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentStore?.hideWatermark ? 'RetailOS Watermark: Hidden' : 'RetailOS Watermark: Displayed'}
            </p>
          </div>
          <button
            onClick={() => setActiveModule('settings')}
            className="mt-3 text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Branding in Settings</span>
          </button>
        </div>
      </div>

      {/* Storefront Features Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-black text-slate-900">How Your Storefront Works for You</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-extrabold text-slate-900 block">1. Zero Inventory Duplication</span>
            <p className="text-slate-600 leading-relaxed">
              When a cashier completes a sale on the POS register, the showroom stock updates immediately on your online storefront, preventing customers from ordering sold-out items.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-extrabold text-slate-900 block">2. Itemized WhatsApp Cart</span>
            <p className="text-slate-600 leading-relaxed">
              Customers pick their items and quantities, enter their name and Monrovia delivery address, and tap send. You receive a pre-formatted message ready to confirm and dispatch.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-extrabold text-slate-900 block">3. Dual-Currency Display</span>
            <p className="text-slate-600 leading-relaxed">
              Displays both USD prices and current Liberian Dollar (LRD) exchange amounts using your store&rsquo;s configured exchange rate.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-extrabold text-slate-900 block">4. White-Label Ready</span>
            <p className="text-slate-600 leading-relaxed">
              Upload your store logo and choose whether to display or remove the &ldquo;Powered by RetailOS&rdquo; badge in Store Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
