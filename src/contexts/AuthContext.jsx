import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { 
  normalizeRole, 
  isOwner, 
  isManager, 
  isCashier, 
  isDelivery, 
  isSuperAdmin,
  isSuperAdminEmail 
} from '../utils/rbac';
import { useTenant } from './TenantContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { currentTenant, switchTenant } = useTenant();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleOverride, setRoleOverride] = useState(() => {
    try {
      return localStorage.getItem('retailos_role_override') || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;

    // Safety fallback timer for offline / slow mobile network in Monrovia
    const fallbackTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2000);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      setCurrentUser(user);
      setLoading(false);
      clearTimeout(fallbackTimer);

      if (user) {
        const isSuper = isSuperAdminEmail(user.email);

        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (!mounted) return;
          if (snap.exists()) {
            const data = snap.data();
            if (isSuper) {
              setUserProfile({ ...data, role: 'superadmin', displayName: data.displayName || 'Platform Super-Admin' });
            } else {
              // Store owner account
              setUserProfile({ ...data, role: data.role || 'owner' });
              if (data.businessId && switchTenant) {
                switchTenant(data.businessId);
              }
            }
          } else {
            // New user account profile - default to Store Owner
            const defaultProfile = {
              uid: user.uid,
              email: user.email,
              displayName: isSuper 
                ? 'RetailOS Master Admin' 
                : (user.displayName || user.email?.split('@')[0] || 'Store Owner'),
              role: isSuper ? 'superadmin' : 'owner',
              businessId: isSuper ? 'all' : (currentTenant?.businessId || 'biz_monrovia_glam'),
              createdAt: serverTimestamp(),
            };
            try {
              await setDoc(doc(db, 'users', user.uid), defaultProfile, { merge: true });
            } catch (err) {
              console.warn('Auto-seed user error:', err);
            }
            setUserProfile(defaultProfile);
          }
        } catch (e) {
          console.warn('User profile fetch notice:', e);
          if (mounted) {
            setUserProfile({
              role: isSuper ? 'superadmin' : 'owner',
              displayName: isSuper ? 'Platform Admin' : (user.displayName || 'Store Owner'),
              email: user.email,
            });
          }
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      unsub();
    };
  }, [currentTenant?.businessId]);

  // Terminal PIN Kiosk state (for counter staff when kiosk is locked)
  const [terminalStaff, setTerminalStaff] = useState(() => {
    try {
      const saved = sessionStorage.getItem('retailos_terminal_staff');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const isSharedTerminal = Boolean(
    currentUser?.email &&
    currentTenant?.terminalEmail &&
    currentUser.email.toLowerCase().trim() === currentTenant.terminalEmail.toLowerCase().trim()
  );

  const isTerminalLocked = isSharedTerminal && !terminalStaff;

  const unlockTerminalStaff = (staff) => {
    setTerminalStaff(staff);
    try {
      sessionStorage.setItem('retailos_terminal_staff', JSON.stringify(staff));
    } catch (e) {}
  };

  const lockTerminalStaff = () => {
    setTerminalStaff(null);
    try {
      sessionStorage.removeItem('retailos_terminal_staff');
    } catch (e) {}
  };

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const signOut = () => {
    lockTerminalStaff();
    setRoleOverride(null);
    try {
      localStorage.removeItem('retailos_role_override');
    } catch (e) {}
    return fbSignOut(auth);
  };

  const createAccount = async (email, password, displayName, role = 'owner', businessId = null) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email,
      displayName,
      role,
      businessId: businessId || currentTenant?.businessId || 'biz_monrovia_glam',
      createdAt: serverTimestamp(),
    });
    return cred;
  };

  // Switch role for testing (e.g. store owner testing cashier mode)
  const setRole = (newRole) => {
    setRoleOverride(newRole);
    try {
      if (newRole) {
        localStorage.setItem('retailos_role_override', newRole);
      } else {
        localStorage.removeItem('retailos_role_override');
      }
    } catch (e) {}
  };

  // Resolve active staff profile and role
  // Default to Store Owner (owner) so business owners have full management immediately
  const baseProfile = isSharedTerminal 
    ? (terminalStaff || { displayName: 'Staff Terminal', role: 'cashier' }) 
    : (userProfile || { displayName: 'Store Owner', role: 'owner' });

  const resolvedRole = roleOverride || baseProfile?.role || 'owner';
  const currentRole = normalizeRole(resolvedRole, currentUser?.email);

  const effectiveProfile = {
    ...baseProfile,
    role: currentRole,
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile: effectiveProfile,
      rawUserProfile: userProfile,
      terminalStaff,
      isSharedTerminal,
      isTerminalLocked,
      unlockTerminalStaff,
      lockTerminalStaff,
      loading,
      signIn,
      signOut,
      createAccount,
      currentRole,
      setRole,
      roleOverride,
      isSuperAdmin: isSuperAdmin(currentRole, currentUser?.email),
      isOwner: isOwner(currentRole),
      isManager: isManager(currentRole),
      isCashier: isCashier(currentRole),
      isDelivery: isDelivery(currentRole),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
