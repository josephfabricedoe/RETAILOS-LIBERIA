import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../contexts/AppContext';
import { useTenant } from '../../contexts/TenantContext';
import { getDefaultModuleForRole } from '../../utils/rbac';
import { 
  Lock, 
  Unlock, 
  Delete, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  Clock, 
  Sparkles, 
  Truck, 
  ShoppingCart, 
  UserCheck,
  Store
} from 'lucide-react';

export default function TerminalPinModal() {
  const { unlockTerminalStaff, signOut } = useAuth();
  const { setActiveModule } = useApp();
  const { currentTenant, getTenantCol, tenantId } = useTenant();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [welcomeData, setWelcomeData] = useState(null);

  const storeName = currentTenant?.businessName || 'RetailOS Store';
  const themeColor = currentTenant?.themeColor || '#0ea5e9';

  // Physical keyboard listener
  useEffect(() => {
    if (welcomeData) return;

    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, welcomeData]);

  const handleDigit = (digit) => {
    if (pin.length >= 4 || verifying || welcomeData) return;
    setError('');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      verifyAndLogin(newPin);
    }
  };

  const handleBackspace = () => {
    if (verifying || welcomeData) return;
    setError('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (verifying || welcomeData) return;
    setError('');
    setPin('');
  };

  const verifyAndLogin = async (enteredPin) => {
    setVerifying(true);
    setError('');

    try {
      // 1. Query staff from tenant subcollection first
      let staff = null;
      try {
        const staffSnap = await getDocs(getTenantCol('staff'));
        const staffList = staffSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.active !== false);
        staff = staffList.find(u => String(u.pin || '').trim() === enteredPin);
      } catch (e) {}

      // 2. Fallback: check global users collection with businessId filter
      if (!staff) {
        const usersSnap = await getDocs(
          query(collection(db, 'users'), where('businessId', '==', tenantId))
        );
        const usersList = usersSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.active !== false);
        staff = usersList.find(u => String(u.pin || '').trim() === enteredPin);
      }

      // 3. Demo fallback: default cashier PIN '1234' or '0000'
      if (!staff && (enteredPin === '1234' || enteredPin === '0000')) {
        staff = {
          id: 'demo_staff_01',
          displayName: 'Demo Cashier',
          role: 'cashier',
          email: 'cashier@store.com',
          businessId: tenantId,
        };
      }

      if (!staff) {
        setError('Incorrect PIN. Please contact Store Manager.');
        setPin('');
        setVerifying(false);
        return;
      }

      // Check attendance today & auto clock-in
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let clockedInNotice = `Shift Active (${timeStr})`;
      try {
        const attCol = getTenantCol('attendance');
        const attQuery = query(
          attCol,
          where('staffId', '==', staff.id),
          where('timestamp', '>=', todayStart),
          orderBy('timestamp', 'desc')
        );
        const attSnap = await getDocs(attQuery);
        const latestPunch = attSnap.docs[0]?.data();

        if (!latestPunch || latestPunch.action === 'clockOut') {
          await addDoc(attCol, {
            staffId: staff.id,
            staffName: staff.displayName || staff.email,
            role: staff.role || 'cashier',
            action: 'clockIn',
            timestamp: serverTimestamp(),
            date: todayStr,
            time: timeStr,
            deviceType: 'terminal-pin-kiosk',
            autoClockedIn: true,
          });
          clockedInNotice = `Clocked in at ${timeStr}`;
        } else {
          clockedInNotice = `Already on shift (last punch: ${latestPunch.time || timeStr})`;
        }
      } catch (attErr) {
        console.warn('Auto attendance error:', attErr);
      }

      setWelcomeData({
        name: staff.displayName || staff.email,
        role: staff.role || 'cashier',
        clockNotice: clockedInNotice,
        staffObj: staff,
      });

      // Auto-unlock after 1.2s greeting
      setTimeout(() => {
        unlockTerminalStaff(staff);
        setActiveModule(getDefaultModuleForRole(staff.role));
      }, 1200);

    } catch (err) {
      console.error(err);
      setError('Verification failed. Try again.');
      setPin('');
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md selection:bg-cyan-500 selection:text-white">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center">
        {/* Store Header */}
        <div className="text-center mb-6">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xl mx-auto mb-3"
            style={{ backgroundColor: themeColor }}
          >
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">
            {storeName}
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Staff Kiosk · Punch 4-Digit Secret PIN
          </p>
        </div>

        {welcomeData ? (
          <div className="w-full py-8 text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Welcome, {welcomeData.name}!</h3>
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{welcomeData.role}</p>
            <p className="text-xs text-slate-400">{welcomeData.clockNotice}</p>
            <p className="text-[11px] text-slate-500 pt-2">Opening Store Register...</p>
          </div>
        ) : (
          <div className="w-full space-y-5">
            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 py-3">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-cyan-400 scale-125 shadow-md shadow-cyan-400/50'
                        : 'border-2 border-slate-700 bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-xs text-center justify-center">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(String(num))}
                  className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-cyan-500 active:text-slate-950 text-white font-extrabold text-xl transition-colors border border-slate-700/60 shadow-xs flex items-center justify-center"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors border border-slate-700/40 flex items-center justify-center"
              >
                CLEAR
              </button>

              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-cyan-500 active:text-slate-950 text-white font-extrabold text-xl transition-colors border border-slate-700/60 shadow-xs flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/40 flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Demo PIN: <strong>1234</strong></span>
              <button
                type="button"
                onClick={signOut}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Kiosk</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
