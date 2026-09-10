import React, { useState, useRef } from 'react';
import Modal from '../shared/Modal';
import { useApp } from '../../contexts/AppContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useTenant } from '../../contexts/TenantContext';
import { Printer, Tag, Sparkles, Copy, Sliders, Check } from 'lucide-react';

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

function generateBarcodeSVG(text) {
  if (!text) return null;
  const safeText = text.toString().trim();
  const codes = [104];
  let checkSum = 104;

  for (let i = 0; i < safeText.length; i++) {
    const code = safeText.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      codes.push(code);
      checkSum += code * (i + 1);
    }
  }

  codes.push(checkSum % 103);
  codes.push(106);

  let barModules = [];
  codes.forEach(c => {
    const pattern = CODE128_PATTERNS[c] || "212222";
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0;
      for (let w = 0; w < width; w++) {
        barModules.push(isBar ? 1 : 0);
      }
    }
  });

  const totalWidth = barModules.length;
  const height = 46;

  let d = "";
  for (let i = 0; i < barModules.length; i++) {
    if (barModules[i] === 1) {
      d += `M${i},0 v${height} `;
    }
  }

  return { d, totalWidth, height };
}

export default function BarcodeLabelModal({ isOpen, onClose, product, allProducts = [] }) {
  const { storeSettings, exchangeRate } = useApp();
  const { format } = useCurrency();
  const { currentTenant } = useTenant();

  const [selectedProduct, setSelectedProduct] = useState(product);
  const [labelCopies, setLabelCopies] = useState(12);
  const [columns, setColumns] = useState(3);
  const [includeLRD, setIncludeLRD] = useState(true);

  const prod = selectedProduct || product;
  const barcodeData = generateBarcodeSVG(prod?.barcode || prod?.id);
  const rate = exchangeRate || 198;
  const storeName = currentTenant?.businessName || storeSettings?.storeName || 'RETAIL STORE';

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Barcode Label Generator & Sheet Printer"
      size="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print {labelCopies} Label{labelCopies > 1 ? 's' : ''}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Select Product
            </label>
            <select
              value={prod?.id || ''}
              onChange={e => {
                const found = allProducts.find(p => p.id === e.target.value);
                if (found) setSelectedProduct(found);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {allProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} · [{p.barcode || 'No Barcode'}] · ${Number(p.retailPrice || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-28">
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={labelCopies}
              onChange={e => setLabelCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="w-32">
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Columns
            </label>
            <div className="grid grid-cols-2 gap-1">
              {[2, 3].map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColumns(col)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    columns === col ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {col} Col
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Label Preview Grid */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-h-[50vh] overflow-y-auto">
          <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {Array.from({ length: labelCopies }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white text-slate-950 p-3 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center justify-between text-center"
              >
                <p className="text-[10px] font-black uppercase tracking-wider truncate w-full text-slate-700">
                  {storeName}
                </p>
                <h4 className="font-bold text-xs line-clamp-1 my-1 w-full">{prod?.name || 'Item Name'}</h4>

                {barcodeData ? (
                  <div className="w-full my-1 flex flex-col items-center">
                    <svg
                      viewBox={`0 0 ${barcodeData.totalWidth} ${barcodeData.height}`}
                      className="w-full h-8 max-w-[160px]"
                      preserveAspectRatio="none"
                    >
                      <path d={barcodeData.d} stroke="#000000" strokeWidth="1" fill="none" />
                    </svg>
                    <p className="font-mono text-[9px] font-bold tracking-widest text-slate-900 mt-0.5">
                      {prod?.barcode || prod?.id}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">No Barcode</p>
                )}

                <div className="w-full border-t border-dashed border-slate-300 pt-1 mt-1 flex items-baseline justify-between px-1">
                  <span className="font-black text-xs text-slate-900">
                    ${Number(prod?.retailPrice || 0).toFixed(2)}
                  </span>
                  {includeLRD && (
                    <span className="font-bold text-[10px] text-slate-600 font-mono">
                      L${((prod?.retailPrice || 0) * rate).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
