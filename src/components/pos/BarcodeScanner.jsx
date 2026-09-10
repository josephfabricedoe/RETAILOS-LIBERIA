import React, { useState } from 'react';
import { Search, Camera, X } from 'lucide-react';
import BarcodeScannerModal from '../shared/BarcodeScannerModal';

export default function BarcodeScanner({ onSearch, searchQuery, onSearchQueryChange }) {
  const [internalQuery, setInternalQuery] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const isControlled = typeof searchQuery === 'string' && Boolean(onSearchQueryChange);
  const currentQuery = isControlled ? searchQuery : internalQuery;

  const handleInputChange = (val) => {
    if (isControlled) {
      onSearchQueryChange(val);
    } else {
      setInternalQuery(val);
    }
  };

  const handleClear = () => {
    handleInputChange('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (currentQuery.trim()) {
      onSearch(currentQuery.trim());
    }
  };

  const handleBarcodeScanned = (scannedCode) => {
    if (scannedCode) {
      onSearch(scannedCode);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search input */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={currentQuery}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Search product name or barcode..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-28 py-2.5 sm:py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors text-sm shadow-2xs"
          />
          {currentQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
          >
            Search
          </button>
        </form>

        {/* Barcode Camera Button */}
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex-shrink-0"
        >
          <Camera className="w-5 h-5" />
          <span>Scan Barcode</span>
        </button>
      </div>

      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Barcode (Auto-closes after scan)"
      />
    </div>
  );
}
