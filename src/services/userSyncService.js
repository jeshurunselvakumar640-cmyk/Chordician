import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/config.js';
import { getThisSundayData, getUpcomingSunday } from './thisSundayService.js';
import {
  getStoredViewMode,
  setStoredViewMode,
  getStoredTheme,
  setStoredTheme,
  getStoredDesktopMode,
  setStoredDesktopMode
} from './storage.js';

export const NOTES_STORAGE_KEY = 'chordician_saved_custom_notes';
export const FAVORITES_STORAGE_KEY = 'chordician_user_favorites';
export const LEAD_NOTES_STORAGE_KEY = 'chordician_user_lead_notes';
export const THIS_SUNDAY_STORAGE_KEY = 'chordician_this_sunday_setlist';
export const NOTES_DRAFT_KEY = 'chordician_custom_notes_draft';
export const NOTES_DRAFT_TITLE_KEY = 'chordician_custom_notes_draft_title';

let _activeSnapshotUnsub = null;
let _activeSyncUid = null;
let _isApplyingRemoteSnapshot = false;
let _isInitialHydrationComplete = false;

/**
 * Dispatches a custom window event to trigger reactive UI updates.
 */
function emitSyncEvent(eventName, detail = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

/**
 * Clears local user data when signing out or switching profiles.
 * Ensures Account A's state does not bleed into Account B.
 */
export function clearLocalUserData() {
  if (_activeSnapshotUnsub) {
    try {
      _activeSnapshotUnsub();
    } catch {}
    _activeSnapshotUnsub = null;
  }
  _activeSyncUid = null;
  _isInitialHydrationComplete = false;
  _isApplyingRemoteSnapshot = true;

  try {
    // 1. Reset This Sunday in localStorage & dispatch event
    const upcomingSunday = getUpcomingSunday();
    const defaultSunday = {
      serviceDate: upcomingSunday,
      songIds: [],
      notes: '',
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(THIS_SUNDAY_STORAGE_KEY, JSON.stringify(defaultSunday));
    } catch {}
    emitSyncEvent('chordician:this-sunday-updated', defaultSunday);

    // 2. Reset Favorites in localStorage & dispatch event
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch {}
    emitSyncEvent('chordician:favorites-updated', []);

    // 3. Reset Custom Notes in localStorage & dispatch event
    try {
      localStorage.removeItem(NOTES_STORAGE_KEY);
      localStorage.removeItem(NOTES_DRAFT_KEY);
      localStorage.removeItem(NOTES_DRAFT_TITLE_KEY);
    } catch {}
    emitSyncEvent('chordician:custom-notes-updated', []);

    // 4. Reset Lead Notes in localStorage & dispatch event
    try {
      localStorage.removeItem(LEAD_NOTES_STORAGE_KEY);
    } catch {}
    emitSyncEvent('chordician:lead-notes-updated', []);

    // Note: Global Communion and All Songs library are preserved!
  } finally {
    _isApplyingRemoteSnapshot = false;
  }
}

let _sundayPushQueue = Promise.resolve();
let _notesPushQueue = Promise.resolve();
let _favoritesPushQueue = Promise.resolve();
let _leadNotesPushQueue = Promise.resolve();
let _prefsPushQueue = Promise.resolve();


/**
 * Pushes updated "This Sunday" setlist to Firestore (/users/{uid}.thisSunday).
 *
 * @param {Object|null} user
 * @param {Object} thisSundayData
 */
export async function pushThisSundayToCloud(user = null, thisSundayData = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !currentUser.uid || !db || _isApplyingRemoteSnapshot || !_isInitialHydrationComplete) return;

  const targetUid = currentUser.uid;
  if (_activeSyncUid && _activeSyncUid !== targetUid) return;

  _sundayPushQueue = _sundayPushQueue.then(async () => {
    if (_activeSyncUid !== targetUid || !_isInitialHydrationComplete) return;

    const data = thisSundayData || getThisSundayData();
    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          thisSunday: {
            serviceDate: data.serviceDate || '',
            songIds: Array.isArray(data.songIds) ? data.songIds : [],
            notes: data.notes || '',
            updatedAt: data.updatedAt || new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[UserSync] pushThisSundayToCloud notice:', err.message);
    }
  }).catch(() => {});

  return _sundayPushQueue;
}

/**
 * Pushes custom notes array to Firestore (/users/{uid}.customNotes).
 *
 * @param {Object|null} user
 * @param {Array} customNotesList
 */
export async function pushCustomNotesToCloud(user = null, customNotesList = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !currentUser.uid || !db || _isApplyingRemoteSnapshot || !_isInitialHydrationComplete) return;

  const targetUid = currentUser.uid;
  if (_activeSyncUid && _activeSyncUid !== targetUid) return;

  _notesPushQueue = _notesPushQueue.then(async () => {
    if (_activeSyncUid !== targetUid || !_isInitialHydrationComplete) return;

    let notes = customNotesList;
    if (!notes) {
      try {
        const raw = localStorage.getItem(NOTES_STORAGE_KEY);
        notes = raw ? JSON.parse(raw) : [];
      } catch {
        notes = [];
      }
    }

    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          customNotes: Array.isArray(notes) ? notes : [],
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[UserSync] pushCustomNotesToCloud notice:', err.message);
    }
  }).catch(() => {});

  return _notesPushQueue;
}

/**
 * Pushes favorites song IDs array to Firestore (/users/{uid}.favorites).
 * Serialized to ensure rapid toggles (Favorite -> Unfavorite -> Favorite) always converge to latest state.
 *
 * @param {Object|null} user
 * @param {Array} favoriteSongIds
 */
export async function pushFavoritesToCloud(user = null, favoriteSongIds = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !currentUser.uid || !db || _isApplyingRemoteSnapshot || !_isInitialHydrationComplete) return;

  const targetUid = currentUser.uid;
  if (_activeSyncUid && _activeSyncUid !== targetUid) return;

  _favoritesPushQueue = _favoritesPushQueue.then(async () => {
    if (_activeSyncUid !== targetUid || !_isInitialHydrationComplete) return;

    let favorites = favoriteSongIds;
    if (!favorites) {
      try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        favorites = raw ? JSON.parse(raw) : [];
      } catch {
        favorites = [];
      }
    }

    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          favorites: Array.isArray(favorites) ? favorites : [],
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[UserSync] pushFavoritesToCloud notice:', err.message);
    }
  }).catch(() => {});

  return _favoritesPushQueue;
}

/**
 * Pushes Lead Notes song IDs array to Firestore (/users/{uid}.leadNotes).
 * Serialized to ensure rapid toggles (Add -> Remove -> Add) always converge to latest state.
 *
 * @param {Object|null} user
 * @param {Array} leadNoteSongIds
 */
export async function pushLeadNotesToCloud(user = null, leadNoteSongIds = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !currentUser.uid || !db || _isApplyingRemoteSnapshot || !_isInitialHydrationComplete) return;

  const targetUid = currentUser.uid;
  if (_activeSyncUid && _activeSyncUid !== targetUid) return;

  _leadNotesPushQueue = _leadNotesPushQueue.then(async () => {
    if (_activeSyncUid !== targetUid || !_isInitialHydrationComplete) return;

    let leadNotes = leadNoteSongIds;
    if (!leadNotes) {
      try {
        const raw = localStorage.getItem(LEAD_NOTES_STORAGE_KEY);
        leadNotes = raw ? JSON.parse(raw) : [];
      } catch {
        leadNotes = [];
      }
    }

    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          leadNotes: Array.isArray(leadNotes) ? leadNotes : [],
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[UserSync] pushLeadNotesToCloud notice:', err.message);
    }
  }).catch(() => {});

  return _leadNotesPushQueue;
}

/**
 * Pushes user preferences to Firestore (/users/{uid}.preferences).
 *
 * @param {Object|null} user
 * @param {Object} prefs
 */
export async function pushPreferencesToCloud(user = null, prefs = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !currentUser.uid || !db || _isApplyingRemoteSnapshot || !_isInitialHydrationComplete) return;

  const targetUid = currentUser.uid;
  if (_activeSyncUid && _activeSyncUid !== targetUid) return;

  _prefsPushQueue = _prefsPushQueue.then(async () => {
    if (_activeSyncUid !== targetUid || !_isInitialHydrationComplete) return;

    const currentPrefs = prefs || {
      viewMode: getStoredViewMode(),
      theme: getStoredTheme(),
      desktopMode: getStoredDesktopMode()
    };

    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          preferences: currentPrefs,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[UserSync] pushPreferencesToCloud notice:', err.message);
    }
  }).catch(() => {});

  return _prefsPushQueue;
}

/**
 * Synchronizes local device data with remote cloud data on login / snapshot.
 * Enforces remote profile precedence so cloud data is never overwritten by empty local state.
 *
 * @param {Object} remoteData Document data from /users/{uid}
 * @param {string} uid Authenticated user UID
 */
export function applyRemoteUserDataToLocal(remoteData, uid = null) {
  if (!remoteData || typeof remoteData !== 'object') {
    _isInitialHydrationComplete = true;
    return;
  }

  _isApplyingRemoteSnapshot = true;
  const currentUser = auth?.currentUser;

  try {
    // 1. Sync "This Sunday" Setlist
    // If the field exists remotely (even if songIds is []), REMOTE WINS.
    if ('thisSunday' in remoteData && remoteData.thisSunday !== null && remoteData.thisSunday !== undefined) {
      const remoteSunday = remoteData.thisSunday;
      const mergedSunday = {
        serviceDate: remoteSunday.serviceDate || getUpcomingSunday(),
        songIds: Array.isArray(remoteSunday.songIds) ? remoteSunday.songIds : [],
        notes: typeof remoteSunday.notes === 'string' ? remoteSunday.notes : '',
        updatedAt: remoteSunday.updatedAt || new Date().toISOString()
      };
      try {
        localStorage.setItem(THIS_SUNDAY_STORAGE_KEY, JSON.stringify(mergedSunday));
        emitSyncEvent('chordician:this-sunday-updated', mergedSunday);
      } catch {}
    } else {
      // Field is missing from remote profile -> check if legacy local data is eligible for one-time migration
      const localData = getThisSundayData();
      if (localData && Array.isArray(localData.songIds) && localData.songIds.length > 0) {
        setTimeout(() => {
          pushThisSundayToCloud(currentUser, localData).catch(() => {});
        }, 0);
      } else {
        const defaultSunday = {
          serviceDate: getUpcomingSunday(),
          songIds: [],
          notes: '',
          updatedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem(THIS_SUNDAY_STORAGE_KEY, JSON.stringify(defaultSunday));
          emitSyncEvent('chordician:this-sunday-updated', defaultSunday);
        } catch {}
      }
    }

    // 2. Sync "Custom Notes"
    // If the field exists remotely (even if []), REMOTE WINS.
    if ('customNotes' in remoteData && remoteData.customNotes !== null && remoteData.customNotes !== undefined) {
      const remoteNotes = Array.isArray(remoteData.customNotes) ? remoteData.customNotes : [];
      try {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(remoteNotes));
        emitSyncEvent('chordician:custom-notes-updated', remoteNotes);
      } catch {}
    } else {
      // Field is missing from remote profile -> check legacy local notes for one-time migration
      let legacyNotes = [];
      try {
        const raw = localStorage.getItem(NOTES_STORAGE_KEY);
        legacyNotes = raw ? JSON.parse(raw) : [];
      } catch {}
      if (Array.isArray(legacyNotes) && legacyNotes.length > 0) {
        setTimeout(() => {
          pushCustomNotesToCloud(currentUser, legacyNotes).catch(() => {});
        }, 0);
      } else {
        try {
          localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([]));
          emitSyncEvent('chordician:custom-notes-updated', []);
        } catch {}
      }
    }

    // 3. Sync "Favorites"
    // If the field exists remotely (even if []), REMOTE WINS.
    if ('favorites' in remoteData && remoteData.favorites !== null && remoteData.favorites !== undefined) {
      const remoteFavorites = Array.isArray(remoteData.favorites) ? remoteData.favorites : [];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(remoteFavorites));
        emitSyncEvent('chordician:favorites-updated', remoteFavorites);
      } catch {}
    } else {
      // Field is missing from remote profile -> check legacy local favorites for one-time migration
      let legacyFavs = [];
      try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        legacyFavs = raw ? JSON.parse(raw) : [];
      } catch {}
      if (Array.isArray(legacyFavs) && legacyFavs.length > 0) {
        setTimeout(() => {
          pushFavoritesToCloud(currentUser, legacyFavs).catch(() => {});
        }, 0);
      } else {
        try {
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([]));
          emitSyncEvent('chordician:favorites-updated', []);
        } catch {}
      }
    }

    // 4. Sync "Lead Notes"
    // If the field exists remotely (even if []), REMOTE WINS.
    if ('leadNotes' in remoteData && remoteData.leadNotes !== null && remoteData.leadNotes !== undefined) {
      const remoteLeadNotes = Array.isArray(remoteData.leadNotes) ? remoteData.leadNotes : [];
      try {
        localStorage.setItem(LEAD_NOTES_STORAGE_KEY, JSON.stringify(remoteLeadNotes));
        emitSyncEvent('chordician:lead-notes-updated', remoteLeadNotes);
      } catch {}
    } else {
      // Field is missing from remote profile -> check legacy local lead notes for one-time migration
      let legacyLead = [];
      try {
        const raw = localStorage.getItem(LEAD_NOTES_STORAGE_KEY);
        legacyLead = raw ? JSON.parse(raw) : [];
      } catch {}
      if (Array.isArray(legacyLead) && legacyLead.length > 0) {
        setTimeout(() => {
          pushLeadNotesToCloud(currentUser, legacyLead).catch(() => {});
        }, 0);
      } else {
        try {
          localStorage.setItem(LEAD_NOTES_STORAGE_KEY, JSON.stringify([]));
          emitSyncEvent('chordician:lead-notes-updated', []);
        } catch {}
      }
    }

    // 5. Sync "Preferences" (viewMode, theme, desktopMode)
    // If the field exists remotely (even if {}), REMOTE WINS.
    if ('preferences' in remoteData && remoteData.preferences !== null && remoteData.preferences !== undefined) {
      const prefs = remoteData.preferences;
      if (prefs.viewMode === 'grid' || prefs.viewMode === 'list') {
        setStoredViewMode(prefs.viewMode);
      }
      if (prefs.theme) {
        setStoredTheme(prefs.theme);
      }
      if (typeof prefs.desktopMode === 'boolean') {
        setStoredDesktopMode(prefs.desktopMode);
      }
      emitSyncEvent('chordician:preferences-updated', prefs);
    } else {
      // Preferences missing remotely -> save local preferences to cloud once
      const currentPrefs = {
        viewMode: getStoredViewMode(),
        theme: getStoredTheme(),
        desktopMode: getStoredDesktopMode()
      };
      setTimeout(() => {
        pushPreferencesToCloud(currentUser, currentPrefs).catch(() => {});
      }, 0);
    }
  } finally {
    _isApplyingRemoteSnapshot = false;
    _isInitialHydrationComplete = true;
  }
}

/**
 * Initializes real-time listener for user profile document (/users/{uid}).
 * Synchronizes This Sunday, Notes, Favorites, and Preferences in real-time across devices.
 *
 * @param {Object} user Authenticated user object
 * @returns {Function} Unsubscribe cleanup function
 */
export function initUserProfileSync(user) {
  if (!user || !user.uid || !db) return () => {};

  // Clean up any existing listener from previous user/session
  if (_activeSnapshotUnsub) {
    try {
      _activeSnapshotUnsub();
    } catch {}
    _activeSnapshotUnsub = null;
  }

  _activeSyncUid = user.uid;
  _isInitialHydrationComplete = false;

  try {
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          _isInitialHydrationComplete = true;
          return;
        }
        const data = docSnap.data();
        applyRemoteUserDataToLocal(data, user.uid);
      },
      (err) => {
        console.warn('[UserSync] Realtime profile sync notice:', err.message);
        _isInitialHydrationComplete = true;
      }
    );

    _activeSnapshotUnsub = unsub;
    return unsub;
  } catch (err) {
    console.warn('[UserSync] initUserProfileSync exception:', err.message);
    _isInitialHydrationComplete = true;
    return () => {};
  }
}
