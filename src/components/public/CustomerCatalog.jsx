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
  LogIn
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import { useCurrency } from '../../hooks/useCurrency';

export default function CustomerCatalog({ onOpenStaffLogin }) {
  const { currentStore } = useTenant();
  const { formatUSD, formatLRD, fxRate } = useCurrency();
  const { docs: products, loading } = useTenantCollection('products');

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
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
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

  const totalUSD = cart.reduce((acc, item) => acc + (Number(item.priceUSD || item.price || 0) * item.quantity), 0);
  const totalLRD = totalUSD * fxRate;

  const handleOrderWhatsApp = () => {
    if (cart.length === 0) return;

    const storeName = currentStore?.name || 'Store';
    const itemsText = cart
      .map((item) => `• ${item.quantity}x ${item.name} - $${(Number(item.priceUSD || 0) * item.quantity).toFixed(2)}`)
      .join('\n');

    const message = `🛍️ *NEW ORDER - ${storeName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${customerInfo.name || 'Website Customer'}
📞 *Phone:* ${customerInfo.phone || 'N/A'}
📍 *Address:* ${customerInfo.address || 'Pickup in Store'}

*ORDER ITEMS:*
${itemsText}

━━━━━━━━━━━━━━━━━━
💵 *TOTAL:* $${totalUSD.toFixed(2)} USD (L$ ${Math.round(totalLRD).toLocaleString()} LRD)

Please confirm order availability and delivery!`;

    const storePhone = (currentStore?.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = storePhone.startsWith('231') ? storePhone : '231' + storePhone.replace(/^0/, '');
    const url = storePhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Storefront Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm"
            style={{ backgroundColor: currentStore?.themeColor || '#10b981' }}
          >
            {currentStore?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
              {currentStore?.name || 'Online Catalog'}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {currentStore?.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {currentStore.address}
                </span>
              )}
              {currentStore?.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {currentStore.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">My Bag</span>
            {cart.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>

          {onOpenStaffLogin && (
            <button
              onClick={onOpenStaffLogin}
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              title="Staff Terminal Login"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Hero Announcement */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              Verified Retailer Catalog
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2">
              Browse Available Products & Order Direct on WhatsApp
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Select your items and send your order straight to our sales counter for fast pickup or bike delivery.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/10 text-center shrink-0">
            <span className="text-[10px] text-slate-300 block uppercase font-bold">Store Exchange Rate</span>
            <span className="font-mono font-bold text-sm text-emerald-400">$1 USD = {fxRate} LRD</span>
          </div>
        </div>
      </div>

      {/* Catalog Search & Category Filter */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs font-medium">
              Loading store catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs font-medium">
              No products found in this category.
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const stock = Number(prod.showroomStock || prod.stock || 0);
              const isOutOfStock = stock <= 0;
              const priceUSD = Number(prod.priceUSD || prod.price || 0);

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between p-3.5 group overflow-hidden"
                >
                  <div>
                    {prod.imageUrl ? (
                      <div className="aspect-square bg-slate-100 rounded-xl mb-3 overflow-hidden">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-300 font-bold text-2xl">
                        {prod.name?.charAt(0) || 'P'}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-slate-400 truncate">
                        {prod.category || 'Item'}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isOutOfStock
                            ? 'bg-red-50 text-red-600'
                            : stock < 5
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'Sold Out' : `${stock} left`}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-black text-slate-900 text-xs">{formatUSD(priceUSD)}</div>
                      <div className="text-[10px] text-slate-400">{formatLRD(priceUSD * fxRate)}</div>
                    </div>

                    <button
                      onClick={() => addToCart(prod)}
                      disabled={isOutOfStock}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Add to order"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Your Shopping Bag</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Your bag is empty. Add items from the catalog.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl text-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {formatUSD(item.priceUSD || 0)} each
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-slate-800 text-xs w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Your WhatsApp Number (077... / 088...)"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Delivery Landmark or 'Pickup in Store'"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Total Order:</span>
                  <div className="text-right">
                    <span className="font-black text-sm text-slate-900">{formatUSD(totalUSD)}</span>
                    <span className="text-[10px] text-slate-400 block">{formatLRD(totalLRD)}</span>
                  </div>
                </div>

                <button
                  onClick={handleOrderWhatsApp}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Order via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
