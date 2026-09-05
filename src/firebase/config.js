import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';

/**
 * Firebase Client SDK Configuration for authentication-2708d
 */
const firebaseConfig = {
  apiKey: "AIzaSyCaxt7IyXNAm5N41gWX0AJA3iJsq9_O-Cc",
  authDomain: "authentication-2708d.firebaseapp.com",
  projectId: "authentication-2708d",
  storageBucket: "authentication-2708d.firebasestorage.app",
  messagingSenderId: "101323771563",
  appId: "1:101323771563:web:68073d61462d90b39471ee",
  measurementId: "G-9P985Z2SN2"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
let db = null;
try {
  db = getFirestore(app);
} catch (e) {
  console.warn("Firestore initialization notice:", e);
}

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

export {
  app,
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  analytics,
  firebaseConfig
};

export default app;
