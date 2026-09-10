import React, { useState, useEffect, useRef } from 'react';
import Modal from '../shared/Modal';
import { setDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useTenant } from '../../contexts/TenantContext';
import { Save, Trash2, AlertCircle, Barcode, Camera, Image as ImageIcon, X, Building2 } from 'lucide-react';
import BarcodeScannerModal from '../shared/BarcodeScannerModal';
import { compressReceiptImage } from '../../utils/receiptCompressor';
import { DEFAULT_RETAIL_CATEGORIES } from '../pos/POSView';

const RETAIL_CATEGORIES = DEFAULT_RETAIL_CATEGORIES.filter(c => c !== 'All');

export default function ProductForm({ isOpen, onClose, editProduct = null }) {
  const isEdit = !!editProduct;
  const { getTenantCol, getTenantDoc } = useTenant();

  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(RETAIL_CATEGORIES[0]);
  const [supplierId, setSupplierId] = useState('');
  const [suppliersList, setSuppliersList] = useState([]);
  const [retailPrice, setRetailPrice] = useState('');
  const [halfDozenPrice, setHalfDozenPrice] = useState('');
  const [dozenPrice, setDozenPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [showroomQty, setShowroomQty] = useState(0);
  const [storeroomQty, setStoreroomQty] = useState(0);
  const [reorderTrigger, setReorderTrigger] = useState(10);
  const [imageUrl, setImageUrl] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      getDocs(getTenantCol('suppliers')).then(snap => {
        setSuppliersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => console.warn('Could not fetch suppliers:', err));

      if (editProduct) {
        setBarcode(editProduct.barcode || editProduct.id || '');
        setName(editProduct.name || '');
        setCategory(editProduct.category || RETAIL_CATEGORIES[0]);
        setSupplierId(editProduct.supplierId || '');
        setRetailPrice(editProduct.retailPrice != null ? String(editProduct.retailPrice) : '');
        setHalfDozenPrice(editProduct.halfDozenPrice != null ? String(editProduct.halfDozenPrice) : '');
        setDozenPrice(editProduct.dozenPrice != null ? String(editProduct.dozenPrice) : '');
        setCostPrice(editProduct.costPrice != null ? String(editProduct.costPrice) : '');
        setShowroomQty(editProduct.showroomQty != null ? editProduct.showroomQty : 0);
        setStoreroomQty(editProduct.storeroomQty != null ? editProduct.storeroomQty : 0);
        setReorderTrigger(editProduct.reorderTrigger != null ? editProduct.reorderTrigger : 10);
        setImageUrl(editProduct.imageUrl || '');
      } else {
        setBarcode('');
        setName('');
        setCategory(RETAIL_CATEGORIES[0]);
        setSupplierId('');
        setRetailPrice('');
        setHalfDozenPrice('');
        setDozenPrice('');
        setCostPrice('');
        setShowroomQty(0);
        setStoreroomQty(0);
        setReorderTrigger(10);
        setImageUrl('');
      }
      setConfirmDelete(false);
      setError('');
    }
  }, [isOpen, editProduct]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressReceiptImage(file, 600, 0.7);
      setImageUrl(compressed);
    } catch (err) {
      alert('Could not compress image. Try another image.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Product name is required'); return; }
    if (!retailPrice || isNaN(Number(retailPrice))) { setError('Valid retail price is required'); return; }

    setSaving(true);
    setError('');

    const cleanBarcode = (barcode || '').trim() || `GEN_${Date.now().toString().slice(-8)}`;

    const payload = {
      barcode: cleanBarcode,
      name: name.trim(),
      category,
      supplierId: supplierId || null,
      retailPrice: parseFloat(retailPrice),
      halfDozenPrice: halfDozenPrice ? parseFloat(halfDozenPrice) : null,
      dozenPrice: dozenPrice ? parseFloat(dozenPrice) : null,
      costPrice: costPrice ? parseFloat(costPrice) : null,
      showroomQty: parseInt(showroomQty, 10) || 0,
      storeroomQty: parseInt(storeroomQty, 10) || 0,
      reorderTrigger: parseInt(reorderTrigger, 10) || 0,
      imageUrl: imageUrl || '',
      updatedAt: serverTimestamp(),
    };

    if (!isEdit) {
      payload.createdAt = serverTimestamp();
    }

    try {
      if (isEdit && editProduct.id !== cleanBarcode) {
        await deleteDoc(getTenantDoc('products', editProduct.id));
      }
      await setDoc(getTenantDoc('products', cleanBarcode), payload, { merge: true });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    setSaving(true);
    try {
      const docId = editProduct.id || editProduct.barcode;
      await deleteDoc(getTenantDoc('products', docId));
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? `Edit Product: ${editProduct?.name || ''}` : 'Add New Inventory Item'}
        size="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            {isEdit ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 font-medium">Delete item permanently?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-red-950/30 transition-colors"
                  title="Delete product"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : (isEdit ? 'Update Item' : 'Add to Inventory')}</span>
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Barcode */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Barcode / SKU
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or type barcode..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-cyan-400 transition-colors"
                  title="Scan with camera"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {RETAIL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Product Title / Description *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Classic Men's Oxford Shoes Black Size 42"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Supplier */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Primary Supplier / Vendor
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">No Supplier Assigned</option>
                {suppliersList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.country || 'Local'})
                  </option>
                ))}
              </select>
            </div>

            {/* Prices */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Retail Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Cost Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Quantities */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Showroom Shelf Stock
              </label>
              <input
                type="number"
                value={showroomQty}
                onChange={(e) => setShowroomQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Storeroom Back Stock
              </label>
              <input
                type="number"
                value={storeroomQty}
                onChange={(e) => setStoreroomQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Reorder Threshold */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                value={reorderTrigger}
                onChange={(e) => setReorderTrigger(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Product Image (Optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300 font-semibold flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                </button>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {scannerOpen && (
        <BarcodeScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={(code) => setBarcode(code)}
          title="Scan Product Barcode"
        />
      )}
    </>
  );
}
