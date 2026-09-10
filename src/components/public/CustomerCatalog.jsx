import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Plus, 
  Minus, 
  X, 
  Check, 
  ArrowLeft,
  LogIn,
  Store,
  Lock,
  Sparkles,
  Package,
  ShieldCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import { useCurrency } from '../../hooks/useCurrency';

export default function CustomerCatalog({ onOpenStaffLogin }) {
  const { currentStore, currentTenant, isSuperAdmin } = useTenant();
  const { formatUSD, formatLRD, fxRate } = useCurrency();
  const { docs: products, loading } = useTenantCollection('products');

  const storePlan = currentTenant?.subscriptionPlan || currentStore?.subscriptionPlan || 'starter';
  const isEnterprise = isSuperAdmin || storePlan === 'enterprise';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const addToCart = (product) => {
    const price = Number(product.retailPrice ?? product.priceUSD ?? product.price ?? 0);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, effectivePrice: price, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalUSD = cart.reduce((acc, item) => {
    const price = Number(item.effectivePrice ?? item.retailPrice ?? item.priceUSD ?? item.price ?? 0);
    return acc + price * item.quantity;
  }, 0);
  const totalLRD = totalUSD * (fxRate || 198);

  const handleOrderWhatsApp = () => {
    if (cart.length === 0) return;

    const storeName = currentStore?.name || 'Store';
    const itemsText = cart
      .map((item) => {
        const p = Number(item.effectivePrice ?? item.retailPrice ?? item.priceUSD ?? item.price ?? 0);
        return `• ${item.quantity}x ${item.name} - $${(p * item.quantity).toFixed(2)} USD`;
      })
      .join('\n');

    const message = `🛍️ *NEW ONLINE ORDER - ${storeName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${customerInfo.name || 'Website Customer'}
📞 *Phone / WhatsApp:* ${customerInfo.phone || 'N/A'}
📍 *Delivery / Pickup:* ${customerInfo.address || 'Pickup at Store'}

*ORDER ITEMS:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━
💵 *TOTAL AMOUNT:* $${totalUSD.toFixed(2)} USD (approx. L$ ${Math.round(totalLRD).toLocaleString()} LRD)

Please confirm order availability and fulfillment timeline!`;

    // Only use the store's configured public phone or WhatsApp line
    const rawPhone = (currentStore?.whatsappNumber || currentStore?.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('231') ? rawPhone : '231' + rawPhone.replace(/^0/, '');
    const url = rawPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const storeName = currentStore?.name || 'Retail Store';
  const storeAddress = currentStore?.address || 'Monrovia, Liberia';
  const storePhone = currentStore?.whatsappNumber || currentStore?.phone || '';
  const storeLogo = currentStore?.logoUrl || '';
  const hideWatermark = Boolean(isEnterprise && currentStore?.hideWatermark);

  // -------------------------------------------------------------
  // 1. NON-ENTERPRISE PLAN GATE VIEW
  // -------------------------------------------------------------
  if (!isEnterprise) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100">
        {/* Simple Top Navigation */}
        <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-sm">
              {storeLogo ? (
                <img src={storeLogo} alt={storeName} className="w-full h-full object-contain rounded-xl" />
              ) : (
                storeName.charAt(0)
              )}
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block">
                {storeName}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {storeAddress}
              </span>
            </div>
          </div>

          {onOpenStaffLogin && (
            <button
              onClick={onOpenStaffLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Owner & Staff Sign In</span>
            </button>
          )}
        </header>

        {/* Hero Notice Card */}
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16 flex flex-col justify-center">
          <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
              <Store className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/60">
                Enterprise Feature
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-2">
                Online Storefront Coming Soon
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                <strong className="text-white">{storeName}</strong> has not yet activated its public digital web storefront.
              </p>
            </div>

            {/* Direct Store Contact */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-2 text-left">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                To purchase or check product availability:
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Visit our physical store at <strong>{storeAddress}</strong></span>
              </div>
              {storePhone && (
                <div className="flex items-center gap-2 text-slate-200">
                  <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Call or WhatsApp: <strong className="font-mono">{storePhone}</strong></span>
                </div>
              )}
            </div>

            {/* Store Owner Upgrade Section */}
            <div className="pt-4 border-t border-slate-800/80 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Are you the store owner of {storeName}?</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Public Online Storefront and 1-click WhatsApp customer ordering are exclusive to the <strong className="text-white">Enterprise Plan ($39.99/mo)</strong>. Upgrade your plan to instantly publish your live shelf inventory online.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={onOpenStaffLogin}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In to Upgrade Plan</span>
                </button>
                <a
                  href="https://wa.me/231770430269?text=Hello%20Joseph%20and%20Malydia,%20I%20want%20to%20upgrade%20my%20store%20to%20Enterprise%20Plan%20($39.99/mo)%20to%20unlock%20the%20public%20online%20storefront."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Contact Platform Support (0770430269)</span>
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Watermark Footer */}
        <footer className="py-6 px-4 text-center border-t border-slate-800 text-xs text-slate-500">
          <a
            href="https://retailos-liberia.web.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-semibold transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Powered by RetailOS Liberia</span>
          </a>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. ACTIVE ENTERPRISE STOREFRONT (HIGH CONTRAST & INTERNATIONAL STANDARD)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Storefront Header */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="w-12 h-12 object-contain rounded-2xl border-2 border-slate-200 bg-white p-1 shadow-sm shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0"
                style={{ backgroundColor: currentStore?.themeColor || '#0f172a' }}
              >
                {storeName.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-black text-slate-950 text-base sm:text-lg tracking-tight truncate">
                  {storeName}
                </h1>
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  Verified Store
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-700 mt-0.5 flex-wrap font-medium">
                {storeAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{storeAddress}</span>
                  </span>
                )}
                {storePhone && (
                  <span className="flex items-center gap-1 font-mono font-bold text-slate-900">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Orders: {storePhone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">My Bag</span>
              {cart.length > 0 && (
                <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            {onOpenStaffLogin && (
              <button
                onClick={onOpenStaffLogin}
                className="p-2 text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition"
                title="Store Staff Login"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Exchange & Ordering Banner */}
      <div className="bg-slate-950 text-white py-6 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-700/60">
              Live Showroom Stock
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-white">
              Official Digital Catalog & Direct WhatsApp Checkout
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed font-medium">
              Browse current available stock. Tap &ldquo;Add to Bag&rdquo; and your complete order ticket will be dispatched directly to our sales counter on WhatsApp for instant packing.
            </p>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 px-5 py-3 rounded-2xl text-center shrink-0 shadow-lg">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              Counter Exchange Rate
            </span>
            <span className="font-mono font-black text-base text-emerald-400">
              $1 USD = {fxRate || 198} LRD
            </span>
          </div>
        </div>
      </div>

      {/* Catalog Search & Category Filter */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search products by name, category, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-950 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 text-xs font-black rounded-xl transition whitespace-nowrap shadow-xs ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white border-2 border-slate-950'
                    : 'bg-white text-slate-800 hover:bg-slate-100 border-2 border-slate-250'
                }`}
              >
                {cat === 'ALL' ? 'All Products' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-600 text-sm font-bold bg-white rounded-3xl border-2 border-slate-200">
              Loading verified inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-slate-200 text-center text-slate-600 text-sm font-bold">
              No products found matching your search.
            </div>
          ) : (
            filteredProducts.map((prod) => {
              // Read actual Firestore stock and price with extensive fallbacks
              const stock = Number(
                prod.showroomQty ?? 
                prod.showroomStock ?? 
                prod.stock ?? 
                prod.quantity ?? 
                0
              );
              const isOutOfStock = stock <= 0;
              const isLowStock = stock > 0 && stock < 5;
              const priceUSD = Number(
                prod.retailPrice ?? 
                prod.priceUSD ?? 
                prod.price ?? 
                0
              );
              const priceLRD = priceUSD * (fxRate || 198);

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border-2 border-slate-250 hover:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between p-4 group overflow-hidden"
                >
                  <div>
                    {/* Product Image or High-Contrast Placeholder */}
                    {prod.imageUrl ? (
                      <div className="aspect-square bg-slate-50 rounded-2xl mb-3 overflow-hidden border border-slate-200 flex items-center justify-center relative">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-3 border-2 border-slate-250 flex flex-col items-center justify-center p-3 relative group-hover:border-slate-400 transition">
                        <Package className="w-10 h-10 text-slate-600 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-300 shadow-xs">
                          {prod.name?.slice(0, 3) || 'ITM'}
                        </span>
                      </div>
                    )}

                    {/* Category & Stock Badges */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[110px]">
                        {prod.category || 'General'}
                      </span>

                      {isOutOfStock ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                          Sold Out
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                          {stock} Left
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-700" />
                          In Stock
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-extrabold text-slate-950 text-sm line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                  </div>

                  {/* Price & Action Button */}
                  <div className="mt-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-black text-slate-950 text-base tracking-tight leading-none">
                        ${priceUSD.toFixed(2)}
                      </div>
                      <div className="text-[11px] font-extrabold text-emerald-800 mt-0.5">
                        L$ {Math.round(priceLRD).toLocaleString()}
                      </div>
                    </div>

                    {isOutOfStock ? (
                      <button
                        disabled
                        className="px-3 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl border border-slate-200 cursor-not-allowed"
                      >
                        Sold Out
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(prod)}
                        className="flex items-center gap-1 px-3.5 py-2 bg-slate-950 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
                        title="Add item to shopping bag"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* International Standard Watermark Footer */}
      {!hideWatermark ? (
        <footer className="mt-auto py-8 px-4 text-center border-t-2 border-slate-200 bg-white">
          <div className="max-w-md mx-auto space-y-2">
            <a
              href="https://retailos-liberia.web.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-black transition shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>⚡ Powered by RetailOS Liberia</span>
            </a>
            <p className="text-[11px] text-slate-600 font-bold">
              Multi-tenant retail operating system for Liberia &amp; West Africa
            </p>
          </div>
        </footer>
      ) : (
        <footer className="mt-auto py-6 px-4 text-center border-t border-slate-200 bg-white text-xs text-slate-500 font-semibold">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </footer>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-950 text-base">Your Shopping Bag</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-xs font-bold space-y-2">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p>Your shopping bag is empty.</p>
                  <p className="text-slate-400 font-normal">Add items from the store catalog to place an order.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const p = Number(item.effectivePrice ?? item.retailPrice ?? item.priceUSD ?? item.price ?? 0);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
                    >
                      <div className="truncate pr-2">
                        <div className="font-extrabold text-slate-950 truncate">{item.name}</div>
                        <div className="text-[11px] text-emerald-800 font-bold mt-0.5">
                          ${p.toFixed(2)} USD each
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 font-bold hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-slate-950 text-xs w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 font-bold hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t-2 border-slate-200 space-y-4">
                <div className="space-y-2 text-xs">
                  <label className="block text-[11px] font-black uppercase text-slate-700">
                    Customer Details for WhatsApp Order:
                  </label>
                  <input
                    type="text"
                    placeholder="Your Full Name *"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Your Contact Number (077... / 088...) *"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Delivery Landmark or 'Pickup at Store'"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="p-4 bg-slate-950 text-white rounded-2xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Total Order Amount:</span>
                  <div className="text-right">
                    <span className="font-black text-base text-emerald-400">${totalUSD.toFixed(2)} USD</span>
                    <span className="text-[11px] text-slate-300 block font-semibold">
                      approx. L$ {Math.round(totalLRD).toLocaleString()} LRD
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleOrderWhatsApp}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Order to Store on WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
