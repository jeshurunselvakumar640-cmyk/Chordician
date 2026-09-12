import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/config.js';
import { getThisSundayData, saveThisSundayData } from './thisSundayService.js';
import { getCommunionData, saveCommunionData } from './communionService.js';
import { getStoredViewMode, setStoredViewMode, getStoredTheme, setStoredTheme, getStoredDesktopMode, setStoredDesktopMode } from './storage.js';

const NOTES_STORAGE_KEY = 'chordician_saved_custom_notes';
const FAVORITES_STORAGE_KEY = 'chordician_user_favorites';
const THIS_SUNDAY_STORAGE_KEY = 'chordician_this_sunday_setlist';
const COMMUNION_STORAGE_KEY = 'chordician_communion_songs';

let _activeSnapshotUnsub = null;
let _isApplyingRemoteSnapshot = false;

/**
 * Dispatches a custom window event to trigger reactive UI updates.
 */
function emitSyncEvent(eventName, detail = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

/**
 * Pushes updated "This Sunday" setlist to Firestore (/users/{uid}.thisSunday).
 *
 * @param {Object|null} user
 * @param {Object} thisSundayData
 */
export async function pushThisSundayToCloud(user = null, thisSundayData = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !db || _isApplyingRemoteSnapshot) return;

  const data = thisSundayData || getThisSundayData();
  try {
    const userRef = doc(db, 'users', currentUser.uid);
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
}

/**
 * Pushes updated "Communion" songs setlist to Firestore (/users/{uid}.communion).
 *
 * @param {Object|null} user
 * @param {Object} communionData
 */
export async function pushCommunionToCloud(user = null, communionData = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !db || _isApplyingRemoteSnapshot) return;

  const data = communionData || getCommunionData();
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(
      userRef,
      {
        communion: {
          songIds: Array.isArray(data.songIds) ? data.songIds : [],
          notes: data.notes || '',
          updatedAt: data.updatedAt || new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[UserSync] pushCommunionToCloud notice:', err.message);
  }
}

/**
 * Pushes custom notes array to Firestore (/users/{uid}.customNotes).
 *
 * @param {Object|null} user
 * @param {Array} customNotesList
 */
export async function pushCustomNotesToCloud(user = null, customNotesList = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !db || _isApplyingRemoteSnapshot) return;

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
    const userRef = doc(db, 'users', currentUser.uid);
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
}

/**
 * Pushes favorites song IDs array to Firestore (/users/{uid}.favorites).
 *
 * @param {Object|null} user
 * @param {Array} favoriteSongIds
 */
export async function pushFavoritesToCloud(user = null, favoriteSongIds = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !db || _isApplyingRemoteSnapshot) return;

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
    const userRef = doc(db, 'users', currentUser.uid);
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
}

/**
 * Pushes user preferences to Firestore (/users/{uid}.preferences).
 *
 * @param {Object|null} user
 * @param {Object} prefs
 */
export async function pushPreferencesToCloud(user = null, prefs = null) {
  const currentUser = user || auth?.currentUser;
  if (!currentUser || !db || _isApplyingRemoteSnapshot) return;

  const currentPrefs = prefs || {
    viewMode: getStoredViewMode(),
    theme: getStoredTheme(),
    desktopMode: getStoredDesktopMode()
  };

  try {
    const userRef = doc(db, 'users', currentUser.uid);
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
}

/**
 * Synchronizes local device data with remote cloud data on initial login / snapshot.
 * Merges gracefully so existing local items are preserved if cloud is empty,
 * and remote items populate device if local is empty.
 *
 * @param {Object} remoteData Document data from /users/{uid}
 */
export function applyRemoteUserDataToLocal(remoteData) {
  if (!remoteData || typeof remoteData !== 'object') return;

  _isApplyingRemoteSnapshot = true;
  try {
    // 1. Sync "This Sunday" Setlist
    if (remoteData.thisSunday && typeof remoteData.thisSunday === 'object') {
      const remoteSunday = remoteData.thisSunday;
      const localSunday = getThisSundayData();

      const remoteTime = remoteSunday.updatedAt ? new Date(remoteSunday.updatedAt).getTime() : 0;
      const localTime = localSunday.updatedAt ? new Date(localSunday.updatedAt).getTime() : 0;

      // Update if remote is newer or local is empty
      if (remoteSunday.songIds && (remoteTime >= localTime || localSunday.songIds.length === 0)) {
        const mergedSunday = {
          serviceDate: remoteSunday.serviceDate || localSunday.serviceDate,
          songIds: remoteSunday.songIds || [],
          notes: remoteSunday.notes || '',
          updatedAt: remoteSunday.updatedAt || new Date().toISOString()
        };
        try {
          localStorage.setItem(THIS_SUNDAY_STORAGE_KEY, JSON.stringify(mergedSunday));
          emitSyncEvent('chordician:this-sunday-updated', mergedSunday);
        } catch {}
      } else if (localSunday.songIds.length > 0 && (!remoteSunday.songIds || remoteSunday.songIds.length === 0)) {
        // Local has items, cloud was empty -> push local to cloud
        pushThisSundayToCloud(auth?.currentUser, localSunday).catch(() => {});
      }
    }

    // 2. Sync "Communion" Songs Setlist
    if (remoteData.communion && typeof remoteData.communion === 'object') {
      const remoteCommunion = remoteData.communion;
      const localCommunion = getCommunionData();

      const remoteTime = remoteCommunion.updatedAt ? new Date(remoteCommunion.updatedAt).getTime() : 0;
      const localTime = localCommunion.updatedAt ? new Date(localCommunion.updatedAt).getTime() : 0;

      if (remoteCommunion.songIds && (remoteTime >= localTime || localCommunion.songIds.length === 0)) {
        const mergedCommunion = {
          songIds: remoteCommunion.songIds || [],
          notes: remoteCommunion.notes || '',
          updatedAt: remoteCommunion.updatedAt || new Date().toISOString()
        };
        try {
          localStorage.setItem(COMMUNION_STORAGE_KEY, JSON.stringify(mergedCommunion));
          emitSyncEvent('chordician:communion-updated', mergedCommunion);
        } catch {}
      } else if (localCommunion.songIds.length > 0 && (!remoteCommunion.songIds || remoteCommunion.songIds.length === 0)) {
        pushCommunionToCloud(auth?.currentUser, localCommunion).catch(() => {});
      }
    }

    // 3. Sync "Custom Notes"
    if (Array.isArray(remoteData.customNotes)) {
      let localNotes = [];
      try {
        const raw = localStorage.getItem(NOTES_STORAGE_KEY);
        localNotes = raw ? JSON.parse(raw) : [];
      } catch {
        localNotes = [];
      }

      if (remoteData.customNotes.length > 0) {
        // Merge notes: combine cloud notes with any new unique local notes
        const noteMap = new Map();
        remoteData.customNotes.forEach((n) => {
          if (n && n.id) noteMap.set(n.id, n);
        });
        localNotes.forEach((n) => {
          if (n && n.id && !noteMap.has(n.id)) {
            noteMap.set(n.id, n);
          }
        });
        const mergedNotes = Array.from(noteMap.values()).sort(
          (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
        );

        try {
          localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(mergedNotes));
          emitSyncEvent('chordician:custom-notes-updated', mergedNotes);
        } catch {}

        // If local had extra notes, sync merged back to cloud
        if (mergedNotes.length > remoteData.customNotes.length) {
          pushCustomNotesToCloud(auth?.currentUser, mergedNotes).catch(() => {});
        }
      } else if (localNotes.length > 0) {
        pushCustomNotesToCloud(auth?.currentUser, localNotes).catch(() => {});
      }
    }

    // 4. Sync "Favorites"
    if (Array.isArray(remoteData.favorites)) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(remoteData.favorites));
        emitSyncEvent('chordician:favorites-updated', remoteData.favorites);
      } catch {}
    }

    // 5. Sync "Preferences" (viewMode, theme, desktopMode)
    if (remoteData.preferences && typeof remoteData.preferences === 'object') {
      const { viewMode, desktopMode } = remoteData.preferences;
      if (viewMode === 'grid' || viewMode === 'list') {
        setStoredViewMode(viewMode);
      }
      if (typeof desktopMode === 'boolean') {
        setStoredDesktopMode(desktopMode);
      }
      emitSyncEvent('chordician:preferences-updated', remoteData.preferences);
    }
  } finally {
    _isApplyingRemoteSnapshot = false;
  }
}

/**
 * Initializes real-time listener for user profile document (/users/{uid}).
 * Synchronizes This Sunday, Communion, Notes, and Preferences in real-time across devices.
 *
 * @param {Object} user Authenticated user object
 * @returns {Function} Unsubscribe cleanup function
 */
export function initUserProfileSync(user) {
  if (!user || !user.uid || !db) return () => {};

  // Clean up any existing listener
  if (_activeSnapshotUnsub) {
    try {
      _activeSnapshotUnsub();
    } catch {}
    _activeSnapshotUnsub = null;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        applyRemoteUserDataToLocal(data);
      },
      (err) => {
        console.warn('[UserSync] Realtime profile sync notice:', err.message);
      }
    );

    _activeSnapshotUnsub = unsub;
    return unsub;
  } catch (err) {
    console.warn('[UserSync] initUserProfileSync exception:', err.message);
    return () => {};
  }
}
