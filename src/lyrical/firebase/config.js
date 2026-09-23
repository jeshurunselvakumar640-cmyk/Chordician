import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

/**
 * Dedicated Firebase Configuration for Lyrical App
 * Project: notespiano (Completely separated from Chordician's pianonotes-1bd94)
 */
export const lyricalFirebaseConfig = {
  apiKey: import.meta.env.VITE_LYRICAL_FIREBASE_API_KEY || "AIzaSyCzO-j-0IwhSlukRcHPJ0p2s9zaKOu-iaA",
  authDomain: import.meta.env.VITE_LYRICAL_FIREBASE_AUTH_DOMAIN || "notespiano.firebaseapp.com",
  projectId: import.meta.env.VITE_LYRICAL_FIREBASE_PROJECT_ID || "notespiano",
  storageBucket: import.meta.env.VITE_LYRICAL_FIREBASE_STORAGE_BUCKET || "notespiano.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_LYRICAL_FIREBASE_MESSAGING_SENDER_ID || "809297428608",
  appId: import.meta.env.VITE_LYRICAL_FIREBASE_APP_ID || "1:809297428608:web:a6a762395c5d874ca12665"
};

// Initialize Named Firebase App 'lyricalApp' to prevent collision with Chordician singleton
export const lyricalApp = getApps().find((a) => a.name === 'lyricalApp') || initializeApp(lyricalFirebaseConfig, 'lyricalApp');

// Initialize Firestore client with multi-tab offline caching
let lyricalDbInstance = null;
try {
  lyricalDbInstance = initializeFirestore(lyricalApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  try {
    lyricalDbInstance = getFirestore(lyricalApp);
  } catch (err) {
    console.warn('[Lyrical Firebase] Firestore initialization notice:', err);
  }
}

export const lyricalDb = lyricalDbInstance;
