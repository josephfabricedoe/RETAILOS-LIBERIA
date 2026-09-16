import React, { useState, useEffect } from 'react';
import { onSnapshot, updateDoc } from 'firebase/firestore';
import { useCurrency } from '../../hooks/useCurrency';
import { useTenant } from '../../contexts/TenantContext';
import ProductForm from './ProductForm';
import BarcodeLabelModal from './BarcodeLabelModal';
import {
  AlertTriangle, Edit2, PlusCircle, Download,
  Search, ChevronDown, ChevronRight, Package, Tag, Boxes, FileSpreadsheet, Upload, Sparkles, Trash2
} from 'lucide-react';
import { downloadCSV, downloadSampleInventoryTemplate } from '../../utils/exportCsv';
import { loadSampleProducts, clearSampleProducts } from '../../utils/sampleProducts';
import { DEFAULT_RETAIL_CATEGORIES } from '../pos/POSView';

export default function ShowroomTable({ onRestockClick, onOpenImport }) {
  const { getTenantCol, getTenantDoc, tenantId, currentTenant } = useTenant();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeTargetProduct, setBarcodeTargetProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [clearingSamples, setClearingSamples] = useState(false);
  const { format } = useCurrency();

  useEffect(() => {
    if (!tenantId) return;
    try {
      const unsub = onSnapshot(getTenantCol('products'), snap => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      return unsub;
    } catch (e) {
      console.warn('Showroom stock notice:', e);
      setLoading(false);
    }
  }, [tenantId]);

  const toggleCollapse = (cat) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || (p.category || 'General Goods') === selectedCategory;
    if (!matchesCat) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const name = (p.name || '').toLowerCase();
    const barcode = (p.barcode || p.id || '').toString().toLowerCase();
    const cat = (p.category || '').toLowerCase();

    return name.includes(q) || barcode.includes(q) || cat.includes(q);
  });

  const groupedByCategory = filteredProducts.reduce((acc, p) => {
    const cat = p.category || 'General Goods';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categoryKeys = Object.keys(groupedByCategory).sort();

  const handleExportStockCSV = () => {
    const data = products.map(p => ({
      Barcode: p.barcode || p.id,
      Name: p.name,
      Category: p.category || 'General Goods',
      ShowroomQty: p.showroomQty || 0,
      StoreroomQty: p.storeroomQty || 0,
      RetailPriceUSD: (p.retailPrice || 0).toFixed(2),
      CostPriceUSD: (p.costPrice || 0).toFixed(2),
      TotalValueUSD: ((p.retailPrice || 0) * (p.showroomQty || 0)).toFixed(2),
    }));

    downloadCSV(`${(currentTenant?.slug || 'store')}-showroom-stock.csv`, data);
  };

  const totalShowroomItems = products.reduce((s, p) => s + (p.showroomQty || 0), 0);
  const totalShowroomValue = products.reduce((s, p) => s + ((p.showroomQty || 0) * (p.retailPrice || 0)), 0);
  const sampleProductsCount = products.filter(p => p.isSample).length;

  const handleLoadSamples = async () => {
    try {
      setLoadingSamples(true);
      await loadSampleProducts(getTenantDoc);
    } catch (err) {
      console.warn('Failed to load sample products:', err);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleClearSamples = async () => {
    if (!window.confirm('Wipe all sample demo items? Any real products you added will be preserved.')) return;
    try {
      setClearingSamples(true);
      await clearSampleProducts(getTenantCol, getTenantDoc);
    } catch (err) {
      console.error('Failed to clear sample products:', err);
      alert('Could not clear sample products: ' + err.message);
    } finally {
      setClearingSamples(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Sample Items Banner */}
      {sampleProductsCount > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Showing {sampleProductsCount} Liberian retail sample products for testing.</span>
          </div>
          <button
            type="button"
            onClick={handleClearSamples}
            disabled={clearingSamples}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearingSamples ? 'Clearing...' : 'Clear Demo Items'}</span>
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shelf stock..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {DEFAULT_RETAIL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadSampleInventoryTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-cyan-300 rounded-xl transition-colors"
            title="Download blank sample CSV spreadsheet template"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sample CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportStockCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBarcodeTargetProduct(products[0] || null);
              setBarcodeModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print Labels</span>
          </button>

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Shelf Items</span>
          <p className="text-xl font-black text-white mt-0.5">{totalShowroomItems.toLocaleString()} pcs</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Showroom Value</span>
          <p className="text-xl font-black text-cyan-300 mt-0.5">{format(totalShowroomValue)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Unique SKUs / Products</span>
          <p className="text-xl font-black text-slate-200 mt-0.5">{products.length} Products</p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item & Barcode</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Shelf Stock</th>
                <th className="py-3 px-4">Backroom Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading showroom inventory...</span>
                  </td>
                </tr>
              ) : categoryKeys.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 px-6">
                    <div className="max-w-xl mx-auto text-center space-y-4">
                      <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto text-cyan-400">
                        <Boxes className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Your Store Shelves are Empty</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          Get started by downloading our spreadsheet template, importing your existing CSV inventory, or adding your first item manually.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={downloadSampleInventoryTemplate}
                          className="flex flex-col items-center justify-center p-4 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-cyan-500/50 rounded-2xl transition-all group text-center"
                        >
                          <FileSpreadsheet className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-white">1. Download Template</span>
                          <span className="text-[10px] text-slate-400 mt-1">Ready-to-fill CSV template</span>
                        </button>

                        <button
                          type="button"
                          onClick={onOpenImport}
                          className="flex flex-col items-center justify-center p-4 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/60 hover:border-cyan-400 rounded-2xl transition-all group text-center"
                        >
                          <Upload className="w-6 h-6 text-cyan-300 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-cyan-200">2. Upload CSV</span>
                          <span className="text-[10px] text-cyan-400/80 mt-1">Bulk import all items</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAddOpen(true)}
                          className="flex flex-col items-center justify-center p-4 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-emerald-500/50 rounded-2xl transition-all group text-center"
                        >
                          <PlusCircle className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-white">3. Add Manually</span>
                          <span className="text-[10px] text-slate-400 mt-1">Single product form</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleLoadSamples}
                          disabled={loadingSamples}
                          className="flex flex-col items-center justify-center p-4 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/60 hover:border-emerald-400 rounded-2xl transition-all group text-center disabled:opacity-50"
                        >
                          <Sparkles className="w-6 h-6 text-amber-300 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-emerald-200">
                            {loadingSamples ? 'Loading...' : '4. Load Sample Pack'}
                          </span>
                          <span className="text-[10px] text-emerald-400/80 mt-1">8 Liberian retail items</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                categoryKeys.map(cat => {
                  const catProducts = groupedByCategory[cat];
                  const isCollapsed = collapsedCategories[cat];
                  return (
                    <React.Fragment key={cat}>
                      <tr 
                        onClick={() => toggleCollapse(cat)}
                        className="bg-slate-850/80 cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                        <td colSpan="6" className="py-2.5 px-4 font-bold text-slate-200">
                          <div className="flex items-center gap-2">
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            <span>{cat}</span>
                            <span className="text-[10px] font-normal px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {catProducts.length} items
                            </span>
                          </div>
                        </td>
                      </tr>

                      {!isCollapsed && catProducts.map((p) => {
                        const isLow = (p.showroomQty || 0) <= (p.reorderTrigger || 5);
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-xl object-cover border border-slate-800" />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                                    <Package className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-bold text-white text-xs">{p.name}</h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.barcode || p.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-slate-300">{p.category || 'General Goods'}</td>

                            <td className="py-3 px-4 font-bold text-cyan-300">
                              {format(p.retailPrice || 0)}
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                                isLow ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                                <span>{p.showroomQty || 0} pcs</span>
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-300 font-medium">
                              {p.storeroomQty || 0} pcs
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditProduct(p)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {onRestockClick && (
                                  <button
                                    type="button"
                                    onClick={() => onRestockClick(p)}
                                    className="px-2.5 py-1 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    Restock
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <ProductForm
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
        />
      )}

      {editProduct && (
        <ProductForm
          isOpen={Boolean(editProduct)}
          onClose={() => setEditProduct(null)}
          editProduct={editProduct}
        />
      )}

      {barcodeModalOpen && (
        <BarcodeLabelModal
          isOpen={barcodeModalOpen}
          onClose={() => setBarcodeModalOpen(false)}
          product={barcodeTargetProduct}
          allProducts={products}
        />
      )}
    </div>
  );
}
