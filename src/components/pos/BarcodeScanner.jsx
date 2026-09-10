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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={currentQuery}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Search product name or barcode..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-28 py-2.5 sm:py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
          />
          {currentQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold text-xs transition-colors shadow-xs"
          >
            Search
          </button>
        </form>

        {/* Barcode Camera Button */}
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex-shrink-0"
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
