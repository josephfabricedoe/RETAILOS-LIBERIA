import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  memoryLocalCache 
} from 'firebase/firestore';

// RetailOS Liberia - Dedicated Standalone Firebase Project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB16b1F5FiKjIe6sS5tGqKHx_5_TYzk-Gc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'retailos-liberia-212ba.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'retailos-liberia-212ba',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'retailos-liberia-212ba.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '936212835355',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:936212835355:web:91b497c2b3ce01b9b79cbe',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with resilient memoryLocalCache and auto-detect long-polling
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalAutoDetectLongPolling: true,
});

export default app;
