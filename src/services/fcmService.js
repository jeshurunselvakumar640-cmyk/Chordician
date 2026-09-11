import { getMessaging, getToken, isSupported as isMessagingSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, app, auth, ensureAuthReady } from '../firebase/config.js';

const FCM_TOKEN_ID_KEY = 'chordician_fcm_token_id';
const FCM_TOKEN_VAL_KEY = 'chordician_fcm_token_val';

/**
 * Checks whether Web Push Notifications and Service Workers are supported in the current environment.
 */
export function isPushNotificationSupported() {
  if (typeof window === 'undefined') return false;
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Returns the current Notification permission state ('default' | 'granted' | 'denied' | 'unsupported').
 */
export function getNotificationPermissionState() {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Generates a clean deterministic document ID for a token belonging to a specific user.
 */
function createTokenDocId(userId, token) {
  const safeSuffix = btoa(token.slice(-32)).replace(/[/+=]/g, '');
  return `${userId}_${safeSuffix}`;
}

/**
 * Requests browser notification permission and retrieves the FCM Web Push token
 * associated with the active PWA ServiceWorkerRegistration.
 *
 * @param {Object} user Authenticated user object from AuthContext
 * @returns {Promise<{ success: boolean, token?: string, error?: string, permission?: string }>}
 */
export async function requestNotificationToken(user) {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Push notifications are not supported in this browser.', permission: 'unsupported' };
  }

  if (!user || !user.uid) {
    return { success: false, error: 'User must be authenticated to enable notifications.', permission: Notification.permission };
  }

  // Never repeatedly prompt if user already explicitly denied permission
  if (Notification.permission === 'denied') {
    return { success: false, error: 'Notification permission is blocked in browser settings.', permission: 'denied' };
  }

  try {
    // Request permission from the browser
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was not granted.', permission };
    }

    // Verify messaging support in Firebase
    const supported = await isMessagingSupported();
    if (!supported) {
      return { success: false, error: 'Firebase Cloud Messaging is not supported in this browser context.', permission };
    }

    // Wait for the unified PWA Service Worker to be active
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      return { success: false, error: 'Active service worker registration not available.', permission };
    }

    const messaging = getMessaging(app);
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    // Retrieve FCM Web Push token using the exact active PWA ServiceWorkerRegistration
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      return { success: false, error: 'No FCM registration token received from provider.', permission };
    }

    // Persist token to dedicated /fcm_tokens collection
    await ensureAuthReady();
    const tokenId = createTokenDocId(user.uid, token);
    const tokenDocRef = doc(db, 'fcm_tokens', tokenId);

    const tokenPayload = {
      token,
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Musician',
      platform: 'web',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(tokenDocRef, tokenPayload, { merge: true });

    // Store in local storage for cleanup on logout or disable
    try {
      localStorage.setItem(FCM_TOKEN_ID_KEY, tokenId);
      localStorage.setItem(FCM_TOKEN_VAL_KEY, token);
    } catch {}

    return { success: true, token, tokenId, permission: 'granted' };
  } catch (err) {
    console.warn('[FCM Service] Failed to register notification token:', err);
    return { success: false, error: err.message || 'Failed to register notification token', permission: Notification.permission };
  }
}

/**
 * Unregisters and removes the active device token from Firestore on logout or disable.
 *
 * @param {Object} user Authenticated user object
 * @returns {Promise<{ success: boolean }>}
 */
export async function unregisterNotificationToken(user) {
  let tokenId = null;
  try {
    tokenId = localStorage.getItem(FCM_TOKEN_ID_KEY);
  } catch {}

  if (tokenId && user && user.uid && db) {
    try {
      const tokenDocRef = doc(db, 'fcm_tokens', tokenId);
      await deleteDoc(tokenDocRef);
    } catch (err) {
      console.warn('[FCM Service] Token removal notice:', err);
    }
  }

  try {
    localStorage.removeItem(FCM_TOKEN_ID_KEY);
    localStorage.removeItem(FCM_TOKEN_VAL_KEY);
  } catch {}

  return { success: true };
}

/**
 * Asynchronously triggers server-side notification broadcast for a newly created song.
 * Guaranteed to NEVER throw, block UI, or fail the song creation process.
 *
 * @param {string} songId Valid Firestore document ID of newly created song
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function triggerNewSongNotification(songId) {
  if (!songId || typeof window === 'undefined') {
    return { success: false, error: 'Missing songId' };
  }

  try {
    if (!auth?.currentUser) {
      return { success: false, error: 'User is not signed in' };
    }

    const idToken = await auth.currentUser.getIdToken();
    const response = await fetch('/api/notifications/notify-new-song', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ songId })
    });

    const data = await response.json().catch(() => ({}));
    return { success: response.ok, data };
  } catch (err) {
    console.warn('[FCM Service] Notification trigger notice (non-fatal):', err);
    return { success: false, error: err.message || 'Network error' };
  }
}
