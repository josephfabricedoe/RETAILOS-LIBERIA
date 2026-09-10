import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { setDoc, serverTimestamp, getDocs, addDoc } from 'firebase/firestore';
import { useTenant } from '../../contexts/TenantContext';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Boxes } from 'lucide-react';

function findField(row, candidates) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const matchedKey = keys.find(k => k.trim().toLowerCase() === c.toLowerCase());
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      return String(row[matchedKey]).trim();
    }
  }
  return '';
}

export default function CSVImport() {
  const { getTenantCol, getTenantDoc } = useTenant();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [newSuppliersCount, setNewSuppliersCount] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      return;
    }
    setError('');
    setDone(false);
    setProgress(0);
    setFile(f);

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (!res.data.length) {
          setError('The uploaded CSV file is empty.');
          setFile(null);
          return;
        }
        setHeaders(res.meta.fields || []);
        setPreview(res.data.slice(0, 5));
      },
      error: (err) => {
        setError('Error reading CSV: ' + err.message);
      }
    });
  };

  const handleImport = () => {
    if (!file) return;
    setImporting(true);
    setProgress(0);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = res.data;
        const total = rows.length;
        let count = 0;
        let createdSuppliers = 0;

        try {
          // Fetch existing suppliers map
          const existingSuppliersSnap = await getDocs(getTenantCol('suppliers'));
          const supplierMap = new Map();
          existingSuppliersSnap.docs.forEach(d => {
            const data = d.data();
            if (data.name) {
              supplierMap.set(data.name.trim().toLowerCase(), d.id);
            }
          });

          for (let i = 0; i < total; i++) {
            const row = rows[i];

            const barcode = findField(row, ['barcode', 'code', 'upc', 'sku', 'id']) || `GEN_${Date.now()}_${i}`;
            const name = findField(row, ['name', 'product', 'item', 'title', 'description']);

            if (!name) continue;

            const category = findField(row, ['category', 'cat', 'type', 'department']) || 'General Goods';
            const rawSupplier = findField(row, ['supplier', 'vendor', 'supplier_name', 'distributor']);

            let supplierId = null;
            if (rawSupplier) {
              const cleanSuppName = rawSupplier.trim();
              const suppKey = cleanSuppName.toLowerCase();

              if (supplierMap.has(suppKey)) {
                supplierId = supplierMap.get(suppKey);
              } else {
                const newSuppRef = await addDoc(getTenantCol('suppliers'), {
                  name: cleanSuppName,
                  country: 'Liberia',
                  transitLeadWeeks: 1,
                  createdAt: serverTimestamp(),
                });
                supplierId = newSuppRef.id;
                supplierMap.set(suppKey, supplierId);
                createdSuppliers++;
              }
            }

            const rawRetail = findField(row, ['retailprice', 'retail_price', 'price', 'retail', 'selling_price']);
            const rawCost = findField(row, ['costprice', 'cost_price', 'cost', 'unit_cost']);
            const rawShowroom = findField(row, ['showroomqty', 'showroom_qty', 'qty', 'stock', 'quantity']);
            const rawStoreroom = findField(row, ['storeroomqty', 'storeroom_qty', 'warehouse_qty', 'storeroom']);

            const retailPrice = parseFloat(rawRetail) || 0;
            const costPrice = parseFloat(rawCost) || 0;
            const showroomQty = parseInt(rawShowroom, 10) || 0;
            const storeroomQty = parseInt(rawStoreroom, 10) || 0;

            const productData = {
              barcode,
              name,
              category,
              retailPrice,
              costPrice,
              showroomQty,
              storeroomQty,
              reorderTrigger: 10,
              updatedAt: serverTimestamp(),
            };

            if (supplierId) {
              productData.supplierId = supplierId;
            }

            await setDoc(getTenantDoc('products', barcode), productData, { merge: true });
            count++;
            setProgress(Math.round(((i + 1) / total) * 100));
          }

          setImportedCount(count);
          setNewSuppliersCount(createdSuppliers);
          setDone(true);
        } catch (err) {
          console.error('Import error:', err);
          setError('Import error: ' + err.message);
        } finally {
          setImporting(false);
        }
      }
    });
  };

  const handleDownloadSample = () => {
    const sample = "Barcode,Name,Category,RetailPrice,CostPrice,ShowroomQty,StoreroomQty,Supplier\n" +
      "794552001,Classic Oxford Shoes Size 42,Apparel & Fashion,45.00,25.00,10,20,Monrovia Importers\n" +
      "794552002,Multivitamin Capsules 60s,Pharmacy & Health,12.00,7.00,15,30,Sinkor Wholesale\n" +
      "794552003,Coconut Shea Hair Cream,Cosmetics & Hair,8.50,4.50,25,50,Ivory Coast Beauty Hub";
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'retailos-inventory-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Upload Box */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40"
      >
        <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-white">Click or drag CSV file to upload inventory</p>
        <p className="text-xs text-slate-400 mt-1">Columns: Barcode, Name, Category, RetailPrice, CostPrice, ShowroomQty, StoreroomQty, Supplier</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleDownloadSample}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample CSV Template</span>
        </button>

        {file && (
          <span className="text-xs text-slate-300 font-mono">
            Selected: {file.name}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview Table */}
      {preview.length > 0 && !done && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Preview (First 5 Rows):</h4>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold">
                <tr>
                  {headers.slice(0, 6).map(h => <th key={h} className="py-2 px-3">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {preview.map((row, idx) => (
                  <tr key={idx}>
                    {headers.slice(0, 6).map(h => (
                      <td key={h} className="py-2 px-3 text-slate-300">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            disabled={importing}
            onClick={handleImport}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {importing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{importing ? `Importing... (${progress}%)` : 'Confirm & Import to Store Inventory'}</span>
          </button>
        </div>
      )}

      {done && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-center space-y-1">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">Inventory Import Completed!</h4>
          <p className="text-xs text-emerald-300">
            Successfully imported {importedCount} products into your store stock.
          </p>
          {newSuppliersCount > 0 && (
            <p className="text-xs text-cyan-300">
              Auto-registered {newSuppliersCount} new suppliers in directory.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
