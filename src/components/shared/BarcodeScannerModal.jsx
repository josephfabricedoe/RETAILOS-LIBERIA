import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Zap, ZapOff, CheckCircle2, AlertCircle, X, RotateCw, Barcode } from 'lucide-react';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1850, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode',
}) {
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(true);
  const [scannedCode, setScannedCode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [errorInfo, setErrorInfo] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const html5QrCodeRef = useRef(null);
  const activeTrackRef = useRef(null);
  const isStoppingRef = useRef(false);
  const containerId = 'retail-modal-barcode-reader';

  const stopScanner = async () => {
    isStoppingRef.current = true;
    if (activeTrackRef.current) {
      try {
        await activeTrackRef.current.applyConstraints({ advanced: [{ torch: false }] });
      } catch (e) {}
      activeTrackRef.current = null;
    }

    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (e) {}
    isStoppingRef.current = false;
  };

  const startScanner = async () => {
    if (isStarting || isStoppingRef.current) return;
    setIsStarting(true);
    setErrorInfo(null);
    setScannedCode('');

    try {
      await stopScanner();
      await new Promise((r) => setTimeout(r, 150));

      const el = document.getElementById(containerId);
      if (!el) {
        setIsStarting(false);
        return;
      }

      const qr = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      html5QrCodeRef.current = qr;

      const cameras = await Html5Qrcode.getCameras();
      let cameraIdOrConfig = { facingMode: 'environment' };

      if (cameras && cameras.length > 0) {
        const backCam = cameras.find((c) =>
          /back|rear|environment|wide|main/i.test(c.label)
        );
        if (backCam) {
          cameraIdOrConfig = backCam.id;
        } else {
          cameraIdOrConfig = cameras[cameras.length - 1].id;
        }
      }

      await qr.start(
        cameraIdOrConfig,
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minDim * 0.85),
              height: Math.floor(minDim * 0.65),
            };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!decodedText || isStoppingRef.current) return;
          playBeep();
          setScannedCode(decodedText);
          setTimeout(() => {
            stopScanner().then(() => {
              onScan(decodedText);
              onClose();
            });
          }, 450);
        },
        () => {}
      );

      // Probe torch capability
      try {
        const videoEl = document.querySelector(`#${containerId} video`);
        if (videoEl && videoEl.srcObject) {
          const track = videoEl.srcObject.getVideoTracks()[0];
          if (track) {
            activeTrackRef.current = track;
            const caps = track.getCapabilities ? track.getCapabilities() : {};
            if (caps.torch) setHasTorch(true);
          }
        }
      } catch (e) {}

    } catch (err) {
      console.warn('Camera start error:', err);
      setErrorInfo(err.message || 'Could not start camera. Enter barcode manually.');
    } finally {
      setIsStarting(false);
    }
  };

  const toggleTorch = async () => {
    if (!activeTrackRef.current) return;
    try {
      const next = !torchOn;
      await activeTrackRef.current.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => startScanner(), 150);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      playBeep();
      stopScanner().then(() => {
        onScan(manualInput.trim());
        onClose();
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => stopScanner().then(onClose)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          <div id={containerId} className="w-full h-full" />

          {/* Animated red/cyan laser line */}
          <div className="scanner-line" />

          {/* Torch toggle button */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`absolute top-4 right-4 z-20 p-2.5 rounded-full border shadow-lg transition-all ${
                torchOn
                  ? 'bg-amber-400 border-amber-300 text-slate-950 scale-110 shadow-amber-400/50'
                  : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
              }`}
              title={torchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
            >
              {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          {/* Scanned Badge */}
          {scannedCode && (
            <div className="absolute inset-0 z-30 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Scanned Successfully</p>
              <p className="text-lg font-mono font-black text-white mt-1">{scannedCode}</p>
            </div>
          )}

          {/* Error notice */}
          {errorInfo && (
            <div className="absolute inset-4 z-30 bg-slate-900/90 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 mb-3">{errorInfo}</p>
              <button
                type="button"
                onClick={startScanner}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Fallback */}
        <div className="p-4 bg-slate-850 border-t border-slate-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or type barcode manually..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
