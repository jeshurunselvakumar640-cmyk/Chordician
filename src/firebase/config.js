import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

/**
 * Firebase Client SDK Configuration for pianonotes-1bd94
 */
const firebaseConfig = {
  apiKey: "AIzaSyB_4AdPTivYU0wmU-w8ra2MsM6oPJr9SYs",
  authDomain: "pianonotes-1bd94.firebaseapp.com",
  projectId: "pianonotes-1bd94",
  storageBucket: "pianonotes-1bd94.firebasestorage.app",
  messagingSenderId: "540352442337",
  appId: "1:540352442337:web:65e3bc6eccc26058656ca0",
  measurementId: "G-M9KMH89JQ8"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Analytics if supported in environment
let analytics = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics fallback in environments without full storage support
  });
}

/**
 * Helper to ensure an authenticated user session exists if Firebase Auth is enabled.
 * If Auth is not yet configured in Firebase Console, it gracefully falls back without crashing.
 */
let authInitPromise = null;
export function ensureAuthReady() {
  if (authInitPromise) return authInitPromise;

  authInitPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        // Attempt anonymous sign-in if no user session exists
        signInAnonymously(auth)
          .then((cred) => resolve(cred.user))
          .catch((err) => {
            // If Anonymous Auth is not enabled in Firebase Console, resolve null gracefully
            if (process.env.NODE_ENV === 'development') {
              console.info('[Firebase Auth] Anonymous sign-in not active or disabled in console:', err.code);
            }
            resolve(null);
          });
      }
    });
  });

  return authInitPromise;
}

export { app, db, auth, analytics, firebaseConfig };

