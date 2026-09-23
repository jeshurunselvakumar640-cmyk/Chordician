import { doc, getDoc } from 'firebase/firestore';
import { lyricalDb } from '../firebase/config.js';

const LYRICAL_SUNDAY_COLLECTION = 'lyrical_sunday_setlist';
const ACTIVE_SETLIST_DOC_ID = 'active_setlist';
const LOCAL_SUNDAY_CACHE_KEY = 'lyrical_sunday_setlist_cache_v1';

/**
 * Fetches the active Sunday Setlist from Lyrical Firestore (Project: notespiano).
 * Public read - no authentication required.
 */
export async function fetchLyricalSundaySetlist() {
  try {
    if (lyricalDb) {
      const docRef = doc(lyricalDb, LYRICAL_SUNDAY_COLLECTION, ACTIVE_SETLIST_DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const setlist = {
          id: snap.id,
          ...data
        };
        try {
          localStorage.setItem(LOCAL_SUNDAY_CACHE_KEY, JSON.stringify(setlist));
        } catch {}
        return { data: setlist, error: null };
      }
    }
  } catch (err) {
    console.warn('[Lyrical Sunday] Firestore fetch notice:', err.message);
  }

  // Fallback to local storage cache if offline
  try {
    const cached = localStorage.getItem(LOCAL_SUNDAY_CACHE_KEY);
    if (cached) {
      return { data: JSON.parse(cached), error: null };
    }
  } catch {}

  return { data: null, error: null };
}

/**
 * Saves or updates the Sunday Setlist via the secure Owner Backend API.
 * Requires an authorized Owner ID token.
 */
export async function saveLyricalSundaySetlist(setlistData, idToken) {
  if (!idToken) {
    return { success: false, error: 'Authentication required to publish Sunday Setlist.' };
  }

  try {
    const res = await fetch('/api/lyrical/sunday', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(setlistData)
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Failed to update Sunday Setlist' };
    }

    try {
      localStorage.setItem(LOCAL_SUNDAY_CACHE_KEY, JSON.stringify(result.setlist));
    } catch {}

    return { success: true, setlist: result.setlist, error: null };
  } catch (err) {
    console.error('[Lyrical Sunday Save Error]:', err);
    return { success: false, error: err.message || 'Network error while saving Sunday Setlist' };
  }
}
