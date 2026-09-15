import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Zap, 
  ZapOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCw, 
  Barcode, 
  ZoomIn, 
  Focus
} from 'lucide-react';

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
  const [hasTorch, setHasTorch] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [errorInfo, setErrorInfo] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Multi-camera / Lens switching state
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCamIndex, setCurrentCamIndex] = useState(0);

  // Zoom & Close-up Focus state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);
  const [focusIndicator, setFocusIndicator] = useState({ x: 0, y: 0, active: false });

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

  const startScanner = async (targetCamId = null) => {
    if (isStarting || isStoppingRef.current) return;
    setIsStarting(true);
    setErrorInfo(null);
    setScannedCode('');

    try {
      await stopScanner();
      await new Promise((r) => setTimeout(r, 120));

      const el = document.getElementById(containerId);
      if (!el) {
        setIsStarting(false);
        return;
      }

      // Initialize Html5Qrcode with hardware BarcodeDetector acceleration if supported
      const qr = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      html5QrCodeRef.current = qr;

      // Discover camera devices
      let cameras = [];
      try {
        cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          // Sort to prioritize rear/back/environment cameras first
          const rearCams = cameras.filter(c => 
            /back|rear|environment|wide|main|0/i.test(c.label) || !/front|user|selfie/i.test(c.label)
          );
          const finalCams = rearCams.length > 0 ? rearCams : cameras;
          setAvailableCameras(finalCams);
        }
      } catch (camErr) {
        console.warn('Could not enumerate cameras:', camErr);
      }

      let cameraIdOrConfig = { facingMode: 'environment' };
      if (targetCamId) {
        cameraIdOrConfig = targetCamId;
      } else if (cameras && cameras.length > 0) {
        const backCam = cameras.find((c) =>
          /back|rear|environment|wide|main/i.test(c.label)
        );
        cameraIdOrConfig = backCam ? backCam.id : cameras[0].id;
      }

      await qr.start(
        cameraIdOrConfig,
        {
          fps: 25,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minDim * 0.88),
              height: Math.floor(minDim * 0.60),
            };
          },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { min: 640, ideal: 1920, max: 2560 },
            height: { min: 480, ideal: 1080, max: 1440 },
          },
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

      // Inspect video track for autofocus, macro, zoom, and torch
      try {
        const videoEl = document.querySelector(`#${containerId} video`);
        if (videoEl && videoEl.srcObject) {
          const track = videoEl.srcObject.getVideoTracks()[0];
          if (track) {
            activeTrackRef.current = track;
            const caps = track.getCapabilities ? track.getCapabilities() : {};

            // 1. Force continuous autofocus so closer objects auto-focus
            if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
              try {
                await track.applyConstraints({
                  advanced: [{ focusMode: 'continuous' }],
                });
              } catch (e) {}
            }

            // 2. Detect hardware zoom support
            if (caps.zoom) {
              setHasHardwareZoom(true);
            }

            // 3. Detect torch support
            if (caps.torch) {
              setHasTorch(true);
            }

            // Re-apply current zoom if already set
            if (zoomLevel > 1) {
              applyZoom(zoomLevel);
            }
          }
        }
      } catch (e) {
        console.warn('Track capability inspection note:', e);
      }

    } catch (err) {
      console.warn('Camera start error:', err);
      setErrorInfo(err.message || 'Could not start camera. Enter barcode manually.');
    } finally {
      setIsStarting(false);
    }
  };

  const applyZoom = async (targetZoom) => {
    setZoomLevel(targetZoom);
    const track = activeTrackRef.current;
    let hardwareApplied = false;

    if (track && track.applyConstraints) {
      try {
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.zoom) {
          const minZ = caps.zoom.min || 1;
          const maxZ = caps.zoom.max || 5;
          const clamped = Math.max(minZ, Math.min(targetZoom, maxZ));
          await track.applyConstraints({ advanced: [{ zoom: clamped }] });
          hardwareApplied = true;
        }
      } catch (e) {
        console.warn('Hardware zoom constraint note:', e);
      }
    }

    // Apply smooth CSS digital zoom fallback if hardware zoom wasn't accepted
    const videoEl = document.querySelector(`#${containerId} video`);
    if (videoEl) {
      if (!hardwareApplied && targetZoom > 1) {
        videoEl.style.transform = `scale(${targetZoom})`;
      } else {
        videoEl.style.transform = 'scale(1)';
      }
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

  const switchCameraLens = async () => {
    if (availableCameras.length <= 1) return;
    const nextIndex = (currentCamIndex + 1) % availableCameras.length;
    setCurrentCamIndex(nextIndex);
    await startScanner(availableCameras[nextIndex].id);
  };

  const handleTapToFocus = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = x / rect.width;
    const relY = y / rect.height;

    setFocusIndicator({ x, y, active: true });
    setTimeout(() => {
      setFocusIndicator(prev => ({ ...prev, active: false }));
    }, 1000);

    if (navigator.vibrate) {
      try { navigator.vibrate(35); } catch (e) {}
    }

    const track = activeTrackRef.current;
    if (track && track.applyConstraints) {
      try {
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        const adv = [];
        if (caps.focusMode && Array.isArray(caps.focusMode)) {
          if (caps.focusMode.includes('continuous')) {
            adv.push({ focusMode: 'continuous' });
          } else if (caps.focusMode.includes('single-shot')) {
            adv.push({ focusMode: 'single-shot' });
          }
        }
        if (caps.pointsOfInterest) {
          adv.push({ pointsOfInterest: [{ x: relX, y: relY }] });
        }
        if (adv.length > 0) {
          await track.applyConstraints({ advanced: adv });
        }
      } catch (err) {
        console.warn('Refocus error:', err);
      }
    }
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
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Barcode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">{title}</h3>
              <p className="text-[11px] text-slate-400 font-medium truncate">Tap screen or zoom if close object blurs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => stopScanner().then(onClose)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder with Tap-To-Focus */}
        <div 
          onClick={handleTapToFocus}
          className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center cursor-crosshair select-none"
        >
          <div id={containerId} className="w-full h-full" />

          {/* 4 Corner Targeting Reticles */}
          <div className="absolute inset-8 sm:inset-10 pointer-events-none flex flex-col justify-between z-10 opacity-80">
            <div className="flex justify-between">
              <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-lg" />
              <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-lg" />
            </div>
            <div className="flex justify-between">
              <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-lg" />
              <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-lg" />
            </div>
          </div>

          {/* Animated dynamic red/cyan/emerald laser line */}
          <div className="scanner-line z-10" />

          {/* Tap-To-Focus Ring */}
          {focusIndicator.active && (
            <div
              className="absolute pointer-events-none focus-reticle z-30 flex flex-col items-center justify-center"
              style={{ left: `${focusIndicator.x}px`, top: `${focusIndicator.y}px` }}
            >
              <div className="w-14 h-14 border-2 border-emerald-400 rounded-xl shadow-2xl flex items-center justify-center bg-emerald-500/10 backdrop-blur-2xs">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-black/75 px-1.5 py-0.5 rounded-full mt-1 border border-emerald-500/30">
                Focusing...
              </span>
            </div>
          )}

          {/* Top Control Overlay: Flashlight & Lens Switcher */}
          <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-auto">
            {/* Multi-lens Switcher (If multiple rear cameras exist) */}
            {availableCameras.length > 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  switchCameraLens();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition-all"
                title="Switch to Macro / Wide Camera Lens"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lens {currentCamIndex + 1}/{availableCameras.length}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[11px] text-emerald-300 font-medium backdrop-blur-xs">
                <Focus className="w-3 h-3 text-emerald-400" />
                <span>Continuous Focus</span>
              </div>
            )}

            {/* Torch toggle button */}
            {hasTorch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTorch();
                }}
                className={`p-2.5 rounded-full border shadow-lg transition-all ${
                  torchOn
                    ? 'bg-amber-400 border-amber-300 text-slate-950 scale-110 shadow-amber-400/50'
                    : 'bg-black/60 border-white/20 text-white hover:bg-black/80 backdrop-blur-md'
                }`}
                title={torchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
              >
                {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Bottom Control Overlay: 1x / 1.5x / 2x Macro / 3x Zoom Controls */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center bg-black/75 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-2xl gap-1"
          >
            {[
              { level: 1, label: '1x' },
              { level: 1.5, label: '1.5x' },
              { level: 2, label: '2x Macro' },
              { level: 3, label: '3x' },
            ].map((item) => (
              <button
                key={item.level}
                type="button"
                onClick={() => applyZoom(item.level)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  zoomLevel === item.level
                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Scanned Success Badge */}
          {scannedCode && (
            <div className="absolute inset-0 z-30 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-150">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Scanned Successfully</p>
              <p className="text-lg font-mono font-black text-white mt-1">{scannedCode}</p>
            </div>
          )}

          {/* Error notice */}
          {errorInfo && (
            <div className="absolute inset-4 z-30 bg-slate-900/95 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 mb-3">{errorInfo}</p>
              <button
                type="button"
                onClick={() => startScanner()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Helpful Macro / Close-Up Hint Banner */}
        <div className="px-4 py-2.5 bg-slate-800/80 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 min-w-0">
            <span className="text-amber-400 text-sm">💡</span>
            <span className="truncate">
              <strong>Blurry up close?</strong> Hold item <strong>15cm (6in)</strong> away & use <strong>2x Macro</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => applyZoom(zoomLevel === 2 ? 1 : 2)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
              zoomLevel === 2
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <ZoomIn className="w-3 h-3" />
            <span>{zoomLevel === 2 ? '1x Normal' : '2x Close-Up'}</span>
          </button>
        </div>

        {/* Manual Barcode Input Fallback */}
        <div className="p-4 bg-slate-850 border-t border-slate-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or type barcode manually..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
