import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
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
  onAuthStateChanged
} from '../firebase/config';
import { updateProfile } from 'firebase/auth';
import { OWNER_EMAIL, OWNER_DEFAULT_NAME, isUserOwner } from '../utils/authConstants.js';
import { unregisterNotificationToken, initNotificationOnboarding } from '../services/fcmService.js';
import { initUserProfileSync } from '../services/userSyncService.js';

export { OWNER_EMAIL, OWNER_DEFAULT_NAME, isUserOwner };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup' | 'forgot'

  // Determine if the current authenticated user has Owner / Full Edit privileges
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    const emailMatch = (currentUser.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
    const roleMatch = userProfile?.role === 'owner';
    return emailMatch || roleMatch;
  }, [currentUser, userProfile]);

  // Global canEdit is true for Owner (used for global database sync & settings)
  const canEdit = isOwner;

  // Authenticated users can create/import songs
  const canCreateSong = Boolean(currentUser);

  // Song-level permission: Owner can edit ALL songs.
  // Normal authenticated users can edit ONLY songs they created (song.createdByUid === currentUser.uid).
  // Legacy unowned songs (no createdByUid) can ONLY be edited by the Owner.
  // Signed-out users cannot edit any songs.
  const canEditSong = useCallback((song) => {
    if (!currentUser) return false;
    if (isOwner) return true;
    if (!song) return false;
    const songCreatorUid = song.createdByUid || song.userId || song.ownerId || null;
    if (!songCreatorUid) return false; // Legacy unowned song -> only owner can edit
    return songCreatorUid === currentUser.uid;
  }, [currentUser, isOwner]);

  // Synchronize user profile with Firestore (/users/{uid})
  const syncUserProfile = useCallback(async (user, extraData = {}) => {
    if (!user || !db) return null;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const isUserOwner = (user.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
      const defaultName = isUserOwner ? OWNER_DEFAULT_NAME : (user.displayName || 'Musician');
      const finalName = extraData.displayName || defaultName;

      if (!userSnap.exists()) {
        // Create new user profile document
        const newProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: finalName,
          role: isUserOwner ? 'owner' : 'viewer',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      } else {
        // Update existing user document
        const existingData = userSnap.data();
        const updatedData = {
          ...existingData,
          displayName: extraData.displayName || existingData.displayName || finalName,
          role: isUserOwner ? 'owner' : (existingData.role || 'viewer'),
          lastLoginAt: new Date().toISOString()
        };
        await updateDoc(userRef, {
          lastLoginAt: updatedData.lastLoginAt,
          role: updatedData.role,
          ...(extraData.displayName ? { displayName: extraData.displayName } : {})
        });
        setUserProfile(updatedData);
        return updatedData;
      }
    } catch (err) {
      console.warn('[Auth] Failed to sync user profile with Firestore:', err);
      // Fallback local profile if Firestore write is restricted
      const isUserOwner = (user.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
      const fallbackProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: isUserOwner ? OWNER_DEFAULT_NAME : (user.displayName || 'Musician'),
        role: isUserOwner ? 'owner' : 'viewer'
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    let syncUnsub = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && !user.isAnonymous) {
        await syncUserProfile(user);
        initNotificationOnboarding(user).catch(() => {});
        syncUnsub = initUserProfileSync(user);
      } else {
        setUserProfile(null);
        if (syncUnsub) {
          try {
            syncUnsub();
          } catch {}
          syncUnsub = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (syncUnsub) {
        try {
          syncUnsub();
        } catch {}
      }
    };
  }, [syncUserProfile]);

  // Sign in with Email and Password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      await syncUserProfile(user);
      initNotificationOnboarding(user).catch(() => {});
      return { user, error: null };
    } catch (err) {
      return { user: null, error: formatAuthError(err) };
    }
  };

  // Create new account
  const signup = async (email, password, displayName = '') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      const isUserOwner = email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
      const finalName = displayName.trim() || (isUserOwner ? OWNER_DEFAULT_NAME : 'Musician');

      if (auth.currentUser && updateProfile) {
        try {
          await updateProfile(auth.currentUser, { displayName: finalName });
        } catch (e) {
          // Non-critical profile name update error
        }
      }

      await syncUserProfile(user, { displayName: finalName });
      initNotificationOnboarding(user).catch(() => {});
      return { user, error: null };
    } catch (err) {
      return { user: null, error: formatAuthError(err) };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      if (currentUser) {
        await unregisterNotificationToken(currentUser).catch(() => {});
      }
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: formatAuthError(err) };
    }
  };

  // Send Password Reset Email
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: formatAuthError(err) };
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const value = {
    currentUser,
    userProfile,
    isOwner,
    canEdit,
    canCreateSong,
    canEditSong,
    loading,
    isAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    signup,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Format Firebase Auth errors into friendly user messages
 */
function formatAuthError(err) {
  if (!err) return 'An unknown error occurred.';
  const code = err.code || '';
  const message = err.message || '';

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Access temporarily blocked due to multiple failed login attempts. Try resetting your password or try again later.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection and try again.';
  }

  return message || 'Authentication failed. Please try again.';
}
