import React, { useState, useEffect } from 'react';
import { onSnapshot, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../contexts/AppContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useTenant } from '../../contexts/TenantContext';
import BarcodeScanner from './BarcodeScanner';
import Cart from './Cart';
import ReceiptModal from './ReceiptModal';
import ReceiptsHistoryModal from './ReceiptsHistoryModal';
import { getPriceForMode } from './PricingModeSwitcher';
import { 
  PackageOpen, 
  AlertCircle, 
  ShoppingBag, 
  Check, 
  Users, 
  CreditCard, 
  Bluetooth, 
  X, 
  Receipt, 
  Filter, 
  RotateCcw, 
  Phone,
  Store,
  Sparkles
} from 'lucide-react';
import { connectBluetoothPrinter, getConnectedPrinterName } from '../../utils/bluetoothPrinter';

export const DEFAULT_RETAIL_CATEGORIES = [
  'All',
  'Apparel & Fashion',
  'Shoes & Bags',
  'Cosmetics & Hair',
  'Pharmacy & Health',
  'Food & Beverages',
  'Provisions & Household',
  'Electronics & Phones',
  'General Goods',
];

export default function POSView() {
  const { currentUser, userProfile } = useAuth();
  const { exchangeRate } = useApp();
  const { format } = useCurrency();
  const { getTenantCol, getTenantDoc, tenantId, currentTenant } = useTenant();

  const [allProducts, setAllProducts] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptsHistoryOpen, setReceiptsHistoryOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  const [btPrinter, setBtPrinter] = useState(getConnectedPrinterName());

  // Order Discount State
  const [orderDiscountType, setOrderDiscountType] = useState('percent');
  const [orderDiscountValue, setOrderDiscountValue] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Subscribe to live products from tenant subcollection
  useEffect(() => {
    if (!tenantId) return;
    try {
      const unsub = onSnapshot(getTenantCol('products'), (snap) => {
        const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllProducts(prods);
      });
      return unsub;
    } catch (e) {
      console.warn('Products sync notice:', e);
    }
  }, [tenantId]);

  // Subscribe to live customers from tenant subcollection
  useEffect(() => {
    if (!tenantId) return;
    try {
      const unsub = onSnapshot(getTenantCol('customers'), (snap) => {
        const custs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomersList(custs);
      });
      return unsub;
    } catch (e) {
      console.warn('Customers sync notice:', e);
    }
  }, [tenantId]);

  // Search products by name or barcode
  const handleSearch = (queryStr) => {
    const q = (queryStr || '').trim().toLowerCase();
    setPosSearchQuery(queryStr);
    if (!q) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    setSearching(true);
    setSearchError('');

    const matches = allProducts.filter(p => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const barcodeMatch = (p.barcode || '').toLowerCase().includes(q);
      const skuMatch = (p.sku || '').toLowerCase().includes(q);
      return nameMatch || barcodeMatch || skuMatch;
    });

    setSearchResults(matches);
    setSearching(false);

    if (matches.length === 0) {
      setSearchError(`No products found matching "${queryStr}"`);
    } else if (matches.length === 1 && matches[0].barcode?.toLowerCase() === q) {
      addToCart(matches[0]);
      setSearchResults([]);
      setPosSearchQuery('');
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = updated[existingIdx];
        const newQty = item.quantity + 1;
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          total: item.unitPrice * newQty,
        };
        return updated;
      }
      const unitPrice = product.retailPrice || 0;
      return [...prev, {
        product,
        name: product.name,
        unitPrice,
        quantity: 1,
        pricingMode: 'retail',
        discountPct: 0,
        total: unitPrice,
      }];
    });

    setLastAddedProduct(product);
    setTimeout(() => setLastAddedProduct(null), 2500);
  };

  const updateCartItem = (idx, updatedItem) => {
    setCartItems(prev => {
      const arr = [...prev];
      arr[idx] = updatedItem;
      return arr;
    });
  };

  const removeCartItem = (idx) => {
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePairBt = async () => {
    try {
      const conn = await connectBluetoothPrinter();
      setBtPrinter(conn.name);
    } catch (e) {
      alert(e.message || 'Bluetooth connection failed');
    }
  };

  // Filtered browse products
  const displayProducts = allProducts.filter(p => {
    if (inStockOnly && (p.showroomQty || 0) <= 0) return false;
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (posSearchQuery.trim()) {
      const q = posSearchQuery.trim().toLowerCase();
      const match = (p.name || '').toLowerCase().includes(q) ||
                    (p.barcode || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate cart subtotal & discount
  const cartSubtotal = cartItems.reduce((sum, it) => sum + it.total, 0);
  let discountAmount = 0;
  if (orderDiscountValue && Number(orderDiscountValue) > 0) {
    if (orderDiscountType === 'percent') {
      discountAmount = (cartSubtotal * Number(orderDiscountValue)) / 100;
    } else {
      discountAmount = Number(orderDiscountValue);
    }
  }
  const cartFinalTotal = Math.max(0, cartSubtotal - discountAmount);

  // Complete checkout transaction
  const handleCompleteSale = async () => {
    if (cartItems.length === 0 || processing) return;
    setProcessing(true);

    try {
      const numTendered = amountPaid === '' ? cartFinalTotal : Number(amountPaid);
      const isCredit = numTendered < cartFinalTotal;
      const balanceOwed = isCredit ? (cartFinalTotal - numTendered) : 0;
      const changeAmount = !isCredit ? (numTendered - cartFinalTotal) : 0;

      let custName = 'Walk-in Customer';
      let custPhone = '';
      let customerRefId = selectedCustomerId;

      if (selectedCustomerId) {
        const found = customersList.find(c => c.id === selectedCustomerId);
        if (found) {
          custName = found.name;
          custPhone = found.phone || '';
        }
      } else if (newCustomerName.trim()) {
        custName = newCustomerName.trim();
        custPhone = newCustomerPhone.trim();
        // Create new customer record under tenant
        const newCustDoc = await addDoc(getTenantCol('customers'), {
          name: custName,
          phone: custPhone,
          totalPurchases: cartFinalTotal,
          currentDebt: balanceOwed,
          createdAt: serverTimestamp(),
        });
        customerRefId = newCustDoc.id;
      }

      const receiptNo = `R${Date.now().toString().slice(-6)}`;
      const cashierName = userProfile?.displayName || userProfile?.email?.split('@')[0] || 'Cashier';

      const salePayload = {
        receiptNo,
        items: cartItems.map(it => ({
          productId: it.product.id,
          name: it.product.name,
          barcode: it.product.barcode || '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          pricingMode: it.pricingMode,
          total: it.total,
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        total: cartFinalTotal,
        paymentMethod,
        amountPaid: numTendered,
        balanceOwed,
        change: changeAmount,
        customerId: customerRefId || null,
        customerName: custName,
        customerPhone: custPhone,
        cashierName,
        cashierId: currentUser?.uid || 'kiosk',
        timestamp: serverTimestamp(),
        date: new Date().toLocaleDateString('en-US'),
      };

      // 1. Write sale document to tenant's sales collection
      const saleDocRef = await addDoc(getTenantCol('sales'), salePayload);

      // 2. Decrement showroom stock for each product in tenant inventory
      for (const it of cartItems) {
        if (it.product?.id) {
          try {
            await updateDoc(getTenantDoc('products', it.product.id), {
              showroomQty: increment(-it.quantity),
            });
          } catch (stkErr) {
            console.warn('Stock decrement warning:', stkErr);
          }
        }
      }

      // 3. Update customer balance if debt/credit
      if (customerRefId && balanceOwed > 0) {
        try {
          await updateDoc(getTenantDoc('customers', customerRefId), {
            currentDebt: increment(balanceOwed),
            totalPurchases: increment(cartFinalTotal),
          });
        } catch (cErr) {
          console.warn('Customer debt update notice:', cErr);
        }
      }

      const completed = { id: saleDocRef.id, ...salePayload };
      setCompletedSale(completed);
      setCartItems([]);
      setCheckoutModal(false);
      setAmountPaid('');
      setOrderDiscountValue('');
      setSelectedCustomerId('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setReceiptOpen(true);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to record sale: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Products Left Section */}
      <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-slate-800 p-3 sm:p-4 overflow-hidden">
        {/* Top Controls: Search Bar & Actions */}
        <div className="space-y-3 pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                {currentTenant?.businessName || 'Store Register'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-500/30">
                1 USD = L${exchangeRate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReceiptsHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                <span>Receipts</span>
              </button>

              <button
                type="button"
                onClick={handlePairBt}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  btPrinter
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={btPrinter ? `Paired with ${btPrinter}` : 'Pair Bluetooth Printer'}
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{btPrinter ? 'Printer Ready' : 'Pair BT'}</span>
              </button>
            </div>
          </div>

          <BarcodeScanner
            onSearch={handleSearch}
            searchQuery={posSearchQuery}
            onSearchQueryChange={handleSearch}
          />

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {DEFAULT_RETAIL_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto py-3">
          {searchError && (
            <div className="p-3 mb-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
              <PackageOpen className="w-10 h-10 mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">No products available in this view</p>
              <p className="text-xs text-slate-600 mt-0.5">Add items from the Inventory module or adjust your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {displayProducts.map((p) => {
                const isOutOfStock = (p.showroomQty || 0) <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className={`relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                      isOutOfStock
                        ? 'bg-slate-900/50 border-slate-800/60 opacity-60'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-750 hover:border-cyan-500/50 shadow-xs active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[80px]">
                          {p.barcode || p.sku || 'No Barcode'}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          (p.showroomQty || 0) > 5
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : (p.showroomQty || 0) > 0
                            ? 'bg-amber-950/60 text-amber-300'
                            : 'bg-rose-950/60 text-rose-300'
                        }`}>
                          {p.showroomQty || 0} in stock
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-baseline justify-between">
                      <span className="text-sm font-black text-cyan-300">
                        {format(p.retailPrice || 0)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        L${((p.retailPrice || 0) * exchangeRate).toFixed(0)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Cart Section */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col bg-slate-900 p-4 overflow-hidden flex-shrink-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Register Cart</h3>
          </div>
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={() => setCartItems([])}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden py-2">
          <Cart
            items={cartItems}
            onUpdate={updateCartItem}
            onRemove={removeCartItem}
            onCheckout={() => setCheckoutModal(true)}
          />
        </div>
      </div>

      {/* Checkout Tender Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Complete Sale & Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Order Amount Summary */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal ({cartItems.length} items):</span>
                  <span>${cartSubtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                    <span>Discount Applied:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-700">
                  <span>Total Due (USD):</span>
                  <span className="text-cyan-300">${cartFinalTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Total Due (LRD @ {exchangeRate}):</span>
                  <span>L${(cartFinalTotal * exchangeRate).toFixed(0)}</span>
                </div>
              </div>

              {/* Order Discount Controls */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Order Discount (Optional)
                </label>
                <div className="flex gap-2">
                  <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setOrderDiscountType('percent')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        orderDiscountType === 'percent' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderDiscountType('fixed')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        orderDiscountType === 'fixed' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      $
                    </button>
                  </div>
                  <input
                    type="number"
                    value={orderDiscountValue}
                    onChange={(e) => setOrderDiscountValue(e.target.value)}
                    placeholder={orderDiscountType === 'percent' ? 'e.g. 10%' : 'e.g. $5.00'}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'Mobile Money (MoMo)', 'Card / POS'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        paymentMethod === m
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Tendered (Supports split/credit) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Amount Tendered (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={cartFinalTotal.toFixed(2)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                {amountPaid !== '' && Number(amountPaid) > cartFinalTotal && (
                  <p className="text-xs text-emerald-400 mt-1 font-semibold">
                    Change to Return: ${(Number(amountPaid) - cartFinalTotal).toFixed(2)} (or L${((Number(amountPaid) - cartFinalTotal) * exchangeRate).toFixed(0)})
                  </p>
                )}
                {amountPaid !== '' && Number(amountPaid) < cartFinalTotal && (
                  <p className="text-xs text-amber-400 mt-1 font-semibold">
                    Remaining Balance Due (Credit): ${(cartFinalTotal - Number(amountPaid)).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Customer Association (VIP Accounts) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Link Customer / VIP Credit Account
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Walk-in Customer (Standard Sale)</option>
                  {customersList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} {c.currentDebt > 0 ? `[Owes: $${c.currentDebt}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleCompleteSale}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50"
              >
                {processing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{processing ? 'Processing...' : `Confirm & Print Receipt ($${cartFinalTotal.toFixed(2)})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Completed Receipt Modal */}
      {receiptOpen && completedSale && (
        <ReceiptModal
          isOpen={receiptOpen}
          onClose={() => {
            setReceiptOpen(false);
            setCompletedSale(null);
          }}
          sale={completedSale}
        />
      )}

      {/* Receipts Archive Modal */}
      {receiptsHistoryOpen && (
        <ReceiptsHistoryModal
          isOpen={receiptsHistoryOpen}
          onClose={() => setReceiptsHistoryOpen(false)}
        />
      )}
    </div>
  );
}
