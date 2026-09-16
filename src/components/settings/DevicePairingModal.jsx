import React, { useState } from 'react';
import { 
  X, Smartphone, QrCode, Copy, Check, ShieldCheck, 
  HelpCircle, ArrowRight, Share2, Store 
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { getBoundStore } from '../../utils/deviceBinding';

export default function DevicePairingModal({ onClose }) {
  const { currentTenant } = useTenant();
  const bound = getBoundStore();
  const store = bound || currentTenant;

  const [copied, setCopied] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const slug = store?.slug || store?.businessId || 'store';
  const pairUrl = `https://retailos-liberia.web.app/?link=${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pairUrl)}&color=0f172a&bgcolor=ffffff`;

  const phone = store?.ownerPhone || store?.phone || '0770430269';
  const pin = store?.passcode || '1234';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-xs text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Connect Another Device</h2>
              <p className="text-[11px] text-slate-500 font-medium">Link sales counter tablet or second phone</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-slate-200/80 rounded-2xl text-center">
            <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200 mb-2">
              <img 
                src={qrUrl} 
                alt="Device Pairing QR Code" 
                className="w-44 h-44 object-contain rounded-lg"
              />
            </div>
            <p className="text-[11px] font-bold text-slate-700 mt-1">
              Point second phone or tablet camera here
            </p>
            <p className="text-[10px] text-slate-400">
              Instantly opens {store?.businessName || 'Your Store'} on the new device
            </p>
          </div>

          {/* Alternative: Phone Number & PIN credentials */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
                Manual Device Link Credentials:
              </span>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                No Email Needed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white border border-emerald-200 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Store Phone</span>
                <span className="text-xs font-black text-slate-900 font-mono">{phone}</span>
              </div>

              <div className="bg-white border border-emerald-200 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">4-Digit PIN</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700 font-mono tracking-widest">
                    {showPin ? pin : '••••'}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-slate-400 hover:text-slate-700 font-bold underline"
                  >
                    {showPin ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Step Guide */}
          <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">How it works on your other device:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1 font-medium">
              <li>Open <strong>retailos-liberia.web.app</strong> on the other device.</li>
              <li>Tap <strong>"Already Have a Store? Link This Device"</strong>.</li>
              <li>Enter phone <strong className="text-slate-900">{phone}</strong> and your 4-digit PIN.</li>
              <li>That device is permanently registered and unlocks 100% offline!</li>
            </ol>
          </div>

          {/* Copy Direct Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-800 font-bold flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Direct Link Copied to Clipboard!' : 'Copy Direct Device Pairing Link'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Liberia Support: 0770430269</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
