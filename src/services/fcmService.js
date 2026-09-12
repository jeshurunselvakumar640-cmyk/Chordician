import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'firebase/messaging';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db, app, auth, ensureAuthReady } from '../firebase/config.js';

const FCM_TOKEN_ID_KEY = 'chordician_fcm_token_id';
const FCM_TOKEN_VAL_KEY = 'chordician_fcm_token_val';
const DEVICE_ID_KEY = 'chordician_device_id';

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
 * Generates or retrieves a persistent anonymous device ID for guest users.
 */
export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return 'device_unknown';
  let devId = null;
  try {
    devId = localStorage.getItem(DEVICE_ID_KEY);
  } catch {}
  if (!devId) {
    devId = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem(DEVICE_ID_KEY, devId);
    } catch {}
  }
  return devId;
}

/**
 * Generates a clean deterministic document ID for a token belonging to a specific user or device.
 */
function createTokenDocId(userId, token) {
  const safeSuffix = btoa(token.slice(-32)).replace(/[/+=]/g, '');
  return `${userId}_${safeSuffix}`;
}

/**
 * Requests browser notification permission and retrieves the FCM Web Push token
 * associated with the active ServiceWorkerRegistration.
 *
 * @param {Object|null} user Optional authenticated user object from AuthContext
 * @returns {Promise<{ success: boolean, token?: string, error?: string, permission?: string }>}
 */
export async function requestNotificationToken(user = null) {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Push notifications are not supported in this browser.', permission: 'unsupported' };
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

    // Acquire active service worker registration with fallback
    let registration = null;
    try {
      registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 4000))
      ]);
    } catch {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        registration = regs[0] || null;
      } catch {}
    }

    const messaging = getMessaging(app);
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const tokenOptions = { vapidKey };
    if (registration) {
      tokenOptions.serviceWorkerRegistration = registration;
    }

    // Retrieve FCM Web Push token
    const token = await getToken(messaging, tokenOptions);

    if (!token) {
      return { success: false, error: 'No FCM registration token received from provider.', permission };
    }

    // Persist token to dedicated /fcm_tokens collection
    await ensureAuthReady();
    const targetUserId = user?.uid || getOrCreateDeviceId();
    const tokenId = createTokenDocId(targetUserId, token);
    const tokenDocRef = doc(db, 'fcm_tokens', tokenId);

    const tokenPayload = {
      token,
      userId: targetUserId,
      email: user?.email || '',
      displayName: user?.displayName || (user ? 'Musician' : 'Guest Musician'),
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
 * @param {Object|null} user Authenticated user object or null
 * @returns {Promise<{ success: boolean }>}
 */
export async function unregisterNotificationToken(user = null) {
  let tokenId = null;
  try {
    tokenId = localStorage.getItem(FCM_TOKEN_ID_KEY);
  } catch {}

  const targetId = tokenId || (user?.uid ? createTokenDocId(user.uid, '') : null);

  if (targetId && db) {
    try {
      const tokenDocRef = doc(db, 'fcm_tokens', targetId);
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
 * Sends a local test notification to verify mobile drawer presentation.
 */
export async function sendLocalTestNotification() {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Push notifications are not supported on this device.' };
  }

  if (Notification.permission !== 'granted') {
    const res = await requestNotificationToken();
    if (!res.success) {
      return { success: false, error: 'Notification permission is required.' };
    }
  }

  const title = '🎵 Chordician Push Notifications';
  const body = 'Notifications are working perfectly! You will receive alerts when new songs are added.';

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/favicon.svg',
          tag: 'chordician-test-notification',
          renotify: true,
          data: { url: '/songs' }
        });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        return { success: true };
      }
    }

    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/favicon.svg'
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Automatically checks and initiates notification permission onboarding for the current device.
 *
 * @param {Object|null} user Authenticated user object (optional)
 * @returns {Promise<void>}
 */
let _hasAttemptedOnboarding = false;
export async function initNotificationOnboarding(user = null) {
  if (!isPushNotificationSupported()) return;
  if (_hasAttemptedOnboarding) return;

  const currentPermission = getNotificationPermissionState();
  if (currentPermission === 'denied' || currentPermission === 'unsupported') return;

  if (currentPermission === 'granted') {
    _hasAttemptedOnboarding = true;
    let existingTokenId = null;
    try {
      existingTokenId = localStorage.getItem(FCM_TOKEN_ID_KEY);
    } catch {}
    if (!existingTokenId) {
      requestNotificationToken(user).catch(() => {});
    }
    return;
  }

  if (currentPermission === 'default') {
    _hasAttemptedOnboarding = true;

    const tryPrompt = async () => {
      try {
        await requestNotificationToken(user);
      } catch (err) {
        console.warn('[FCM Onboarding] Permission request notice:', err);
      }
    };

    // Attempt prompt
    tryPrompt();

    // Attach one-time user interaction listener (for mobile Safari PWA / mobile Chrome requiring user gesture)
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        if (getNotificationPermissionState() === 'default') {
          tryPrompt();
        }
        window.removeEventListener('click', handleUserGesture, true);
        window.removeEventListener('touchend', handleUserGesture, true);
      };

      window.addEventListener('click', handleUserGesture, { capture: true, once: true });
      window.addEventListener('touchend', handleUserGesture, { capture: true, once: true });
    }
  }
}

/**
 * Sets up foreground FCM listener + real-time Firestore notification sync.
 *
 * @param {Function} onNotificationReceived Callback receiving ({ title, body, songId, url, uploaderName })
 * @returns {Function} Cleanup unsubscribe function
 */
export function setupForegroundNotificationListener(onNotificationReceived) {
  if (typeof window === 'undefined' || !db) return () => {};

  const unsubs = [];

  // 1. Firebase Messaging onMessage listener
  try {
    const messaging = getMessaging(app);
    const unsubMsg = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || '🎵 Chordician';
      const body = payload.notification?.body || payload.data?.body || 'A new song was added to the songbook!';
      const songId = payload.data?.songId || null;
      const url = payload.data?.url || (songId ? `/songs/${songId}` : '/songs');
      const uploaderName = payload.data?.createdByName || 'Jeshurun Selvakumar';

      // Trigger native notification if permission is granted
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/favicon.svg',
            tag: songId ? `chordician-song-${songId}` : 'chordician-notification',
            renotify: true,
            data: { songId, url }
          });
        }).catch(() => {});
      }

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      if (typeof onNotificationReceived === 'function') {
        onNotificationReceived({ title, body, songId, url, uploaderName });
      }
    });
    unsubs.push(unsubMsg);
  } catch {}

  // 2. Real-time Firestore new song sync listener
  try {
    const startTime = Date.now();
    let isInitialSnapshot = true;

    const songsRef = collection(db, 'songs');
    const q = query(songsRef, orderBy('createdAt', 'desc'), limit(1));

    const unsubFirestore = onSnapshot(q, (snapshot) => {
      if (isInitialSnapshot) {
        isInitialSnapshot = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() || {};
          const songId = change.doc.id;
          const title = data.title || 'New Song';
          const uploaderName = (data.createdByName || data.createdBy || 'Jeshurun Selvakumar').trim();
          const notifTitle = '🎵 Hey Musician!';
          const notifBody = `New song added by ${uploaderName}: "${title}"`;
          const url = `/songs/${songId}`;

          // Avoid self-notification or stale timestamps
          const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : Date.now();
          if (createdAtMs < startTime - 5000) return;

          // Native OS notification presentation
          if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(notifTitle, {
                body: notifBody,
                icon: '/pwa-192x192.png',
                badge: '/favicon.svg',
                tag: `chordician-song-${songId}`,
                renotify: true,
                data: { songId, url }
              });
            }).catch(() => {});
          }

          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

          if (typeof onNotificationReceived === 'function') {
            onNotificationReceived({
              title: notifTitle,
              body: notifBody,
              songId,
              url,
              uploaderName,
              songTitle: title
            });
          }
        }
      });
    }, (err) => {
      console.warn('[FCM Service] Firestore realtime listener notice:', err.message);
    });

    unsubs.push(unsubFirestore);
  } catch {}

  return () => {
    unsubs.forEach((u) => {
      try {
        if (typeof u === 'function') u();
      } catch {}
    });
  };
}

/**
 * Asynchronously triggers server-side notification broadcast for a newly created song.
 *
 * @param {string} songId Valid Firestore document ID of newly created song
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function triggerNewSongNotification(songId) {
  if (!songId || typeof window === 'undefined') {
    return { success: false, error: 'Missing songId' };
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (auth?.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const response = await fetch('/api/notifications/notify-new-song', {
      method: 'POST',
      headers,
      body: JSON.stringify({ songId })
    });

    const data = await response.json().catch(() => ({}));
    return { success: response.ok, data };
  } catch (err) {
    console.warn('[FCM Service] Notification trigger notice (non-fatal):', err);
    return { success: false, error: err.message || 'Network error' };
  }
}
