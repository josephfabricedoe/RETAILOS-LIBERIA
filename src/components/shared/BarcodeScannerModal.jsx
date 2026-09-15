import React, { useState, useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';
import { 
  Zap, 
  ZapOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCw, 
  Barcode, 
  ZoomIn, 
  Focus,
  Eye,
  Check,
  Sparkles
} from 'lucide-react';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1850, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch (e) {}
}

// Calculate frame sharpness / Laplacian variance
function assessSharpness(ctx, width, height) {
  try {
    if (!ctx || width < 50 || height < 50) return 20;
    const sampleW = Math.min(160, width);
    const sampleH = Math.min(160, height);
    const startX = Math.floor((width - sampleW) / 2);
    const startY = Math.floor((height - sampleH) / 2);
    const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
    const d = imgData.data;
    let diffSum = 0;
    let count = 0;
    for (let y = 1; y < sampleH - 1; y += 4) {
      for (let x = 1; x < sampleW - 1; x += 4) {
        const i = (y * sampleW + x) * 4;
        const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        const rightLum = d[i + 4] * 0.299 + d[i + 5] * 0.587 + d[i + 6] * 0.114;
        const downLum = d[i + sampleW * 4] * 0.299 + d[i + sampleW * 4 + 1] * 0.587 + d[i + sampleW * 4 + 2] * 0.114;
        diffSum += Math.abs(lum - rightLum) + Math.abs(lum - downLum);
        count++;
      }
    }
    return count > 0 ? (diffSum / count) : 20;
  } catch (e) {
    return 20;
  }
}

// Format numbers nicely (e.g. 6 294015 175217)
function formatBarcodeNumbers(code) {
  if (!code) return '';
  const str = String(code).trim();
  if (str.length === 13) {
    return `${str[0]} ${str.slice(1, 7)} ${str.slice(7)}`;
  }
  if (str.length === 12) {
    return `${str[0]} ${str.slice(1, 6)} ${str.slice(6, 11)} ${str[11]}`;
  }
  return str;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Smart Barcode Scanner',
}) {
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [errorInfo, setErrorInfo] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Vision Intelligence state
  const [linesFound, setLinesFound] = useState(false);
  const [focusQuality, setFocusQuality] = useState('good'); // 'blurry' | 'good'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusIndicator, setFocusIndicator] = useState({ x: 0, y: 0, active: false });

  // Camera devices
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCamIndex, setCurrentCamIndex] = useState(0);

  const containerRef = useRef(null);
  const activeTrackRef = useRef(null);
  const isStoppingRef = useRef(false);
  const nativeDetectorRef = useRef(null);
  const nativeIntervalRef = useRef(null);
  const lastSharpnessCheckRef = useRef(0);
  const containerId = 'retail-quagga-reader';

  const stopScanner = async () => {
    isStoppingRef.current = true;
    if (nativeIntervalRef.current) {
      clearInterval(nativeIntervalRef.current);
      nativeIntervalRef.current = null;
    }
    if (activeTrackRef.current) {
      try {
        await activeTrackRef.current.applyConstraints({ advanced: [{ torch: false }] });
      } catch (e) {}
      activeTrackRef.current = null;
    }
    try {
      Quagga.offDetected();
      Quagga.offProcessed();
      await Quagga.stop();
    } catch (e) {}
    isStoppingRef.current = false;
  };

  const handleBarcodeCaptured = (rawCode) => {
    if (!rawCode || isStoppingRef.current) return;
    const clean = String(rawCode).trim();
    if (!clean) return;

    isStoppingRef.current = true;
    if (nativeIntervalRef.current) {
      clearInterval(nativeIntervalRef.current);
      nativeIntervalRef.current = null;
    }

    playBeep();
    if (navigator.vibrate) {
      try { navigator.vibrate([60, 40, 60]); } catch (e) {}
    }

    setScannedCode(clean);
    setTimeout(() => {
      stopScanner().then(() => {
        onScan(clean);
        onClose();
      });
    }, 550);
  };

  const startScanner = async (targetDeviceId = null) => {
    if (isStarting || isStoppingRef.current) return;
    setIsStarting(true);
    setErrorInfo(null);
    setScannedCode('');
    setLinesFound(false);

    try {
      await stopScanner();
      await new Promise((r) => setTimeout(r, 120));

      const el = document.getElementById(containerId);
      if (!el) {
        setIsStarting(false);
        return;
      }
      el.innerHTML = '';

      // Discover back cameras
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          const rearDevices = videoDevices.filter(d => 
            /back|rear|environment|wide|main|0/i.test(d.label) || !/front|user|selfie/i.test(d.label)
          );
          setAvailableCameras(rearDevices.length > 0 ? rearDevices : videoDevices);
        }
      } catch (e) {}

      const cameraConstraints = targetDeviceId
        ? { deviceId: { exact: targetDeviceId } }
        : { facingMode: 'environment' };

      await new Promise((resolve, reject) => {
        Quagga.init({
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: el,
            constraints: {
              ...cameraConstraints,
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
            },
            area: {
              top: '0%',
              right: '0%',
              left: '0%',
              bottom: '0%',
            },
          },
          locator: {
            patchSize: 'medium',
            halfSample: true,
          },
          numOfWorkers: 2,
          decoder: {
            readers: [
              'ean_reader',
              'ean_8_reader',
              'upc_reader',
              'upc_e_reader',
              'code_128_reader',
              'code_39_reader',
            ],
          },
          locate: true,
        }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      Quagga.start();

      // Hook Quagga processed frames: draw line tracking boxes and check sharpness
      Quagga.onProcessed((result) => {
        if (isStoppingRef.current) return;
        const drawingCtx = Quagga.canvas && Quagga.canvas.ctx ? Quagga.canvas.ctx.overlay : null;
        const drawingCanvas = Quagga.canvas && Quagga.canvas.dom ? Quagga.canvas.dom.overlay : null;

        if (result && drawingCtx && drawingCanvas) {
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

          // 1. Draw candidate barcode line boxes
          if (result.boxes) {
            result.boxes.filter(box => box !== result.box).forEach(box => {
              Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { 
                color: 'rgba(52, 211, 153, 0.4)', 
                lineWidth: 2 
              });
            });
          }

          // 2. Draw best matching barcode bounding box (The green identified lines!)
          if (result.box) {
            setLinesFound(true);
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { 
              color: '#10b981', 
              lineWidth: 3.5 
            });
          } else {
            setLinesFound(false);
          }

          // 3. Draw scan line through the barcode lines
          if (result.codeResult && result.codeResult.code) {
            Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { 
              color: '#06b6d4', 
              lineWidth: 4 
            });
          }

          // 4. Sharpness test periodically (every 400ms)
          const now = Date.now();
          if (now - lastSharpnessCheckRef.current > 400) {
            lastSharpnessCheckRef.current = now;
            const score = assessSharpness(drawingCtx, drawingCanvas.width, drawingCanvas.height);
            setFocusQuality(score < 9.5 ? 'blurry' : 'good');
          }
        }
      });

      // Hook Quagga detection
      Quagga.onDetected((result) => {
        if (result && result.codeResult && result.codeResult.code) {
          handleBarcodeCaptured(result.codeResult.code);
        }
      });

      // Get active camera track for continuous autofocus and zoom
      try {
        const track = Quagga.CameraAccess.getActiveTrack();
        if (track) {
          activeTrackRef.current = track;
          const caps = track.getCapabilities ? track.getCapabilities() : {};

          if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
            try {
              await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
            } catch (e) {}
          }
          if (caps.torch) {
            setHasTorch(true);
          }
        }
      } catch (e) {}

      // Parallel Hardware BarcodeDetector on raw video element (GPU accelerated on Chrome Android)
      if ('BarcodeDetector' in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          const active = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'].filter(f => supported.includes(f));
          if (active.length > 0) {
            const nativeDetector = new window.BarcodeDetector({ formats: active });
            nativeDetectorRef.current = nativeDetector;

            nativeIntervalRef.current = setInterval(async () => {
              if (isStoppingRef.current) return;
              const videoEl = el.querySelector('video');
              if (videoEl && videoEl.readyState >= 2) {
                try {
                  const detected = await nativeDetector.detect(videoEl);
                  if (detected && detected.length > 0 && detected[0].rawValue) {
                    handleBarcodeCaptured(detected[0].rawValue);
                  }
                } catch (e) {}
              }
            }, 100);
          }
        } catch (e) {}
      }

    } catch (err) {
      console.warn('Scanner init error:', err);
      setErrorInfo(err.message || 'Could not start camera. Enter barcode numbers below.');
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
          const clamped = Math.max(caps.zoom.min || 1, Math.min(targetZoom, caps.zoom.max || 5));
          await track.applyConstraints({ advanced: [{ zoom: clamped }] });
          hardwareApplied = true;
        }
      } catch (e) {}
    }

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
    await startScanner(availableCameras[nextIndex].deviceId);
  };

  const handleTapToFocus = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusIndicator({ x, y, active: true });
    setTimeout(() => setFocusIndicator(prev => ({ ...prev, active: false })), 900);

    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch (e) {}
    }

    const track = activeTrackRef.current;
    if (track && track.applyConstraints) {
      try {
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
        }
      } catch (e) {}
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
      handleBarcodeCaptured(manualInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-sm">
              <Barcode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">{title}</h3>
              <p className="text-[11px] text-slate-400 font-medium truncate">Line-tracking & number capture engine</p>
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

        {/* Viewfinder with Live Line-Tracking */}
        <div 
          onClick={handleTapToFocus}
          className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center cursor-crosshair select-none"
        >
          {/* Quagga2 Live Video & Overlay Canvas Container */}
          <div id={containerId} ref={containerRef} className="w-full h-full" />

          {/* Dynamic Laser Scanning Line */}
          <div className="scanner-line z-10" />

          {/* Tap-To-Focus Target */}
          {focusIndicator.active && (
            <div
              className="absolute pointer-events-none focus-reticle z-30 flex flex-col items-center justify-center"
              style={{ left: `${focusIndicator.x}px`, top: `${focusIndicator.y}px` }}
            >
              <div className="w-14 h-14 border-2 border-emerald-400 rounded-xl shadow-2xl flex items-center justify-center bg-emerald-500/15 backdrop-blur-2xs">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <span className="text-[10px] font-black text-emerald-300 bg-black/80 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/40 uppercase tracking-wider">
                Refocusing
              </span>
            </div>
          )}

          {/* Top Status & Controls Overlay */}
          <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-auto">
            {/* Live Barcode Line & Focus Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 border border-white/20 text-xs font-bold backdrop-blur-md shadow-lg">
              {linesFound ? (
                <div className="flex items-center gap-1.5 text-emerald-400 animate-pulse">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lines Identified</span>
                </div>
              ) : focusQuality === 'blurry' ? (
                <div className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Hold ~15cm away</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <Focus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>In Focus</span>
                </div>
              )}
            </div>

            {/* Top Right: Flashlight & Camera Switcher */}
            <div className="flex items-center gap-2">
              {availableCameras.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    switchCameraLens();
                  }}
                  className="px-2.5 py-1.5 rounded-full bg-black/65 hover:bg-black/85 border border-white/20 text-white text-xs font-bold backdrop-blur-md shadow-lg flex items-center gap-1"
                  title="Switch Camera Sensor"
                >
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cam {currentCamIndex + 1}</span>
                </button>
              )}

              {hasTorch && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTorch();
                  }}
                  className={`p-2 rounded-full border shadow-lg transition-all ${
                    torchOn
                      ? 'bg-amber-400 border-amber-300 text-slate-950 scale-110 shadow-amber-400/50'
                      : 'bg-black/65 border-white/20 text-white hover:bg-black/85 backdrop-blur-md'
                  }`}
                  title={torchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
                >
                  {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Bottom Zoom Preset Toolbar: 1x, 1.5x, 2x Macro, 3x */}
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
                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-105 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Scanned Numbers Success Card */}
          {scannedCode && (
            <div className="absolute inset-0 z-30 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-xl animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-1">
                Numbers Captured
              </p>
              <p className="text-2xl font-mono font-black text-white tracking-widest bg-black/50 px-4 py-2 rounded-xl border border-emerald-400/40 shadow-inner">
                {formatBarcodeNumbers(scannedCode)}
              </p>
            </div>
          )}

          {/* Error Message */}
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

        {/* Real-time Distance & Macro Guidance */}
        <div className="px-4 py-2.5 bg-slate-800/80 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">
              Point at barcode lines from <strong>15–20 cm away</strong>.
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
            <span>{zoomLevel === 2 ? '1x Normal' : '2x Macro'}</span>
          </button>
        </div>

        {/* Capture Numbers Below Barcode (Direct Numeric Input) */}
        <div className="p-4 bg-slate-850 border-t border-slate-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or type the numbers printed below the code..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono tracking-wider"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex-shrink-0"
            >
              Capture
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

