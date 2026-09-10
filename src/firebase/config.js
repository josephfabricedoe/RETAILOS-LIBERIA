import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  memoryLocalCache 
} from 'firebase/firestore';

// RetailOS Liberia - Firebase Configuration
// Uses environment variables with production fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyABnn-dG_UIJ-3UpbfvL5KMP0gBey6rkI8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'jam-beauty-store-online.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'jam-beauty-store-online',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'jam-beauty-store-online.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '794552738927',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:794552738927:web:c544c1b3bce5fe18b5199a',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Safe cleanup of legacy corrupted firestore IndexedDB databases if any exist in browser
if (typeof window !== 'undefined' && 'indexedDB' in window) {
  try {
    if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
      window.indexedDB.databases().then((dbs) => {
        dbs.forEach((dbInfo) => {
          if (dbInfo && dbInfo.name && (dbInfo.name.includes('firestore') || dbInfo.name.includes('firebase'))) {
            try { window.indexedDB.deleteDatabase(dbInfo.name); } catch (e) {}
          }
        });
      }).catch(() => {});
    }
  } catch (e) {}
}

// Initialize Firestore with resilient memoryLocalCache to eliminate multi-tab IndexedDB lock assertion crashes
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

export default app;
