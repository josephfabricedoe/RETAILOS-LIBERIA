import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import Papa from 'papaparse';
import { useTenant } from '../../contexts/TenantContext';
import { addDoc } from 'firebase/firestore';

export default function SalesImport({ onClose, onComplete }) {
  const { getTenantCol, currentStore } = useTenant();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('CSV parsing errors encountered. Please check file format.');
        }
        setParsedData(results.data);
      },
      error: (err) => {
        setError('Error reading file: ' + err.message);
      }
    });
  };

  const handleImport = async () => {
    if (!parsedData.length) return;
    setLoading(true);
    setError(null);
    let imported = 0;

    try {
      const salesCol = getTenantCol('sales');
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const saleRecord = {
          receiptNumber: row.Receipt || row.receiptNumber || `IMP-${Date.now()}-${i}`,
          customerName: row.Customer || row.customerName || 'Historical Customer',
          paymentMethod: row.PaymentMethod || row.paymentMethod || 'Cash USD',
          totalUSD: parseFloat(row.TotalUSD || row.totalUSD || row.Amount || 0),
          totalLRD: parseFloat(row.TotalLRD || row.totalLRD || 0),
          date: row.Date ? new Date(row.Date).toISOString() : new Date().toISOString(),
          cashierName: row.Cashier || row.cashierName || 'Historical Import',
          importedAt: new Date().toISOString(),
          items: [
            {
              name: row.ItemName || 'Imported Line Item',
              quantity: parseInt(row.Quantity || 1, 10),
              priceUSD: parseFloat(row.TotalUSD || 0)
            }
          ]
        };

        await addDoc(salesCol, saleRecord);
        imported++;
        setProgress(Math.round((imported / parsedData.length) * 100));
      }

      setSuccessCount(imported);
      if (onComplete) onComplete(imported);
    } catch (err) {
      console.error('Import error:', err);
      setError('Import halted: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Import Historical Sales</h3>
            <p className="text-xs text-slate-500">Upload CSV transactions into {currentStore?.name || 'store'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount > 0 ? (
            <div className="p-6 bg-emerald-50 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-base">Import Complete!</h4>
              <p className="text-xs text-emerald-700">Successfully imported {successCount} sales records.</p>
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow hover:bg-emerald-700 transition"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 text-center transition cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-sales-file"
                />
                <label htmlFor="csv-sales-file" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="w-12 h-12 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-800">
                    {file ? file.name : 'Select or drop CSV file'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Format columns: Receipt, Date, Customer, TotalUSD, PaymentMethod
                  </span>
                </label>
              </div>

              {parsedData.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Found <strong>{parsedData.length}</strong> records ready to import</span>
                  </div>
                  {loading && <span className="font-bold text-emerald-600">{progress}%</span>}
                </div>
              )}

              {loading && (
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading || parsedData.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'Importing...' : `Import ${parsedData.length} Records`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
