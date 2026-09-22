import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth, ensureAuthReady, firebaseConfig } from './config.js';
import { transliterateSong } from '../transliteration/index.js';
import { OWNER_EMAIL, OWNER_DEFAULT_NAME } from '../utils/authConstants.js';
import {
  getAllSongs as getOfflineAllSongs,
  getSong as getOfflineSong,
  saveSongs as saveOfflineSongs,
  saveSong as saveOfflineSong,
  deleteSong as deleteOfflineSong
} from '../services/offline/songDatabase.js';

const SONGS_COLLECTION = 'songs';

// High-performance in-memory cache
let _cachedSongs = null;
let _lastCacheTimestamp = 0;
const CACHE_TTL_MS = 45 * 1000; // 45 seconds fresh cache TTL
const _songMapCache = new Map();

/**
 * Invalidate in-memory and local storage song cache
 */
export function invalidateSongCache(songId = null) {
  if (songId) {
    _songMapCache.delete(songId);
  } else {
    _songMapCache.clear();
  }
  _cachedSongs = null;
  _lastCacheTimestamp = 0;
  try {
    sessionStorage.removeItem('chordician_songs_cache_v3');
  } catch {}
}

/**
 * Update memory cache optimistically
 */
export function updateMemorySongCache(updater) {
  if (_cachedSongs && typeof updater === 'function') {
    _cachedSongs = updater(_cachedSongs);
    _lastCacheTimestamp = Date.now();
  }
}

/**
 * Structured diagnostic logger for Firestore operations (safe - no secrets exposed)
 */
function logFirestoreDiagnostic(operation, path, error) {
  const isAuth = Boolean(auth?.currentUser);
  const uid = auth?.currentUser?.uid || 'none';
  const errorCode = error?.code || 'unknown';
  const errorMessage = error?.message || String(error);

  console.error(`[Firestore Diagnostic] ❌ ${operation} failed on "${path}"`, {
    operation,
    targetPath: path,
    firebaseProject: firebaseConfig.projectId,
    errorCode,
    errorMessage,
    authStatus: isAuth ? 'authenticated' : 'unauthenticated',
    userUid: isAuth ? uid : 'none'
  });
}

/**
 * Format Firestore technical errors into informative user messages with developer context
 */
export function formatFirestoreError(error, context = '') {
  if (!error) return 'An unexpected database error occurred.';
  
  const code = error.code || '';
  const message = error.message || '';

  if (code.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return `Firestore permission denied on collection '${SONGS_COLLECTION}'. Verify your Firestore Security Rules in the Firebase Console.`;
  }
  if (code.includes('unavailable') || message.includes('offline') || message.includes('network')) {
    return 'Unable to reach Firestore database. Please check your internet connection.';
  }
  if (code.includes('not-found')) {
    return 'The requested song document was not found in Firestore.';
  }
  if (code.includes('resource-exhausted')) {
    return 'Firestore quota exceeded. Please check your Firebase project usage in the console.';
  }

  return error.message || `Firestore operation failed (${context || 'unknown error'}).`;
}

/**
 * Fetch all songs from Firestore (/songs) with high-speed multi-tier caching
 */
export async function getSongs({ forceRefresh = false } = {}) {
  const now = Date.now();

  // 1. Fast in-memory cache hit (< 0.1ms)
  if (!forceRefresh && _cachedSongs && (now - _lastCacheTimestamp < CACHE_TTL_MS)) {
    return { data: _cachedSongs, error: null };
  }

  await ensureAuthReady();
  const path = SONGS_COLLECTION;

  try {
    const songsRef = collection(db, SONGS_COLLECTION);
    let q = query(songsRef, orderBy('updatedAt', 'desc'));
    let snapshot;
    
    try {
      snapshot = await getDocs(q);
    } catch {
      // Fallback query if composite index or timestamp ordering is initializing
      snapshot = await getDocs(songsRef);
    }

    const songs = [];
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const songItem = {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
      };
      songs.push(songItem);
      // Populate individual song cache
      _songMapCache.set(docSnapshot.id, songItem);
    });

    _cachedSongs = songs;
    _lastCacheTimestamp = Date.now();

    try {
      sessionStorage.setItem('chordician_songs_cache_v3', JSON.stringify(songs));
    } catch {}

    // Persist complete fresh catalog to local IndexedDB asynchronously
    saveOfflineSongs(songs).catch(() => {});

    return { data: songs, error: null };
  } catch (err) {
    // 2. Offline Fallback Tier 1: In-memory cache
    if (_cachedSongs && _cachedSongs.length > 0) {
      return { data: _cachedSongs, error: null };
    }

    // 3. Offline Fallback Tier 2: IndexedDB offline song database
    try {
      const offlineRes = await getOfflineAllSongs();
      if (offlineRes && Array.isArray(offlineRes.data) && offlineRes.data.length > 0) {
        _cachedSongs = offlineRes.data;
        _lastCacheTimestamp = Date.now();
        offlineRes.data.forEach((s) => {
          if (s && s.id) {
            _songMapCache.set(s.id, s);
          }
        });
        return { data: offlineRes.data, error: null };
      }
    } catch (offlineErr) {
      console.warn('[SongsService] IndexedDB fallback notice:', offlineErr);
    }

    // 4. Offline Fallback Tier 3: sessionStorage
    try {
      const saved = sessionStorage.getItem('chordician_songs_cache_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          _cachedSongs = parsed;
          return { data: parsed, error: null };
        }
      }
    } catch {}

    logFirestoreDiagnostic('getDocs', path, err);
    return { data: [], error: formatFirestoreError(err, 'getSongs') };
  }
}

/**
 * Fetch a single song by ID (/songs/{id}) with instant memory cache
 */
export async function getSongById(id) {
  if (!id) return { data: null, error: 'Song ID is required' };

  // 1. Check fast in-memory map
  if (_songMapCache.has(id)) {
    const cached = _songMapCache.get(id);
    if (cached && Array.isArray(cached.sections)) {
      return { data: cached, error: null };
    }
  }

  // 2. Check in _cachedSongs array
  if (_cachedSongs) {
    const found = _cachedSongs.find((s) => s.id === id);
    if (found && Array.isArray(found.sections) && found.sections.length > 0) {
      _songMapCache.set(id, found);
      return { data: found, error: null };
    }
  }

  await ensureAuthReady();
  const path = `${SONGS_COLLECTION}/${id}`;

  try {
    const docRef = doc(db, SONGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // If doc does not exist in Firestore, check if stored in local IndexedDB
      const offlineRes = await getOfflineSong(id);
      if (offlineRes && offlineRes.data) {
        _songMapCache.set(id, offlineRes.data);
        return { data: offlineRes.data, error: null };
      }
      return { data: null, error: 'Song not found' };
    }

    const data = docSnap.data();
    const songData = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
    };

    _songMapCache.set(id, songData);

    // Save to IndexedDB asynchronously
    saveOfflineSong(songData).catch(() => {});

    return {
      data: songData,
      error: null
    };
  } catch (err) {
    // Offline Fallback: Try fetching from local IndexedDB
    try {
      const offlineRes = await getOfflineSong(id);
      if (offlineRes && offlineRes.data) {
        _songMapCache.set(id, offlineRes.data);
        return { data: offlineRes.data, error: null };
      }
    } catch (offlineErr) {
      console.warn('[SongsService] getSongById IndexedDB fallback notice:', offlineErr);
    }

    logFirestoreDiagnostic('getDoc', path, err);
    return { data: null, error: formatFirestoreError(err, `getSongById(${id})`) };
  }
}

/**
 * Add a new song to Firestore via Trusted Backend (/api/songs)
 */
export async function addSong(songData) {
  await ensureAuthReady();
  const currentUser = auth?.currentUser || null;

  if (!currentUser) {
    return { id: null, error: 'Authentication required. Please sign in to create or import songs.' };
  }

  try {
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/songs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(songData)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { id: null, error: data.error || 'Failed to create song' };
    }

    invalidateSongCache();
    return { id: data.id, error: null };
  } catch (err) {
    console.error('addSong error:', err);
    return { id: null, error: err.message || 'Network error while adding song' };
  }
}

/**
 * Update an existing song in Firestore via Trusted Backend (/api/songs/{id})
 */
export async function updateSong(id, songData) {
  if (!id) return { success: false, error: 'Song ID is required' };
  await ensureAuthReady();
  const currentUser = auth?.currentUser || null;

  if (!currentUser) {
    return { success: false, error: 'Authentication required. Please sign in to edit songs.' };
  }

  try {
    const idToken = await currentUser.getIdToken();
    const res = await fetch(`/api/songs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(songData)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update song' };
    }

    invalidateSongCache(id);
    invalidateSongCache();
    saveOfflineSong({ id, ...songData }).catch(() => {});
    return { success: true, error: null };
  } catch (err) {
    console.error('updateSong error:', err);
    return { success: false, error: err.message || 'Network error while updating song' };
  }
}

/**
 * Delete a song from Firestore via Trusted Backend (/api/songs/{id})
 */
export async function deleteSong(id) {
  if (!id) return { success: false, error: 'Song ID is required' };
  await ensureAuthReady();
  const currentUser = auth?.currentUser || null;

  if (!currentUser) {
    return { success: false, error: 'Authentication required. Please sign in to delete songs.' };
  }

  try {
    const idToken = await currentUser.getIdToken();
    const res = await fetch(`/api/songs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to delete song' };
    }

    invalidateSongCache(id);
    invalidateSongCache();
    deleteOfflineSong(id).catch(() => {});
    return { success: true, error: null };
  } catch (err) {
    console.error('deleteSong error:', err);
    return { success: false, error: err.message || 'Network error while deleting song' };
  }
}

/**
 * Toggle favorite status of a song per user profile (/users/{uid}.favorites)
 */
export async function toggleFavoriteSong(id, currentStatus) {
  if (!id) return { success: false, error: 'Song ID is required' };

  try {
    let currentFavorites = [];
    try {
      const raw = localStorage.getItem('chordician_user_favorites');
      currentFavorites = raw ? JSON.parse(raw) : [];
    } catch {
      currentFavorites = [];
    }

    const newStatus = !currentStatus;
    const nextFavorites = newStatus
      ? Array.from(new Set([...currentFavorites, id]))
      : currentFavorites.filter((favId) => favId !== id);

    try {
      localStorage.setItem('chordician_user_favorites', JSON.stringify(nextFavorites));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chordician:favorites-updated', { detail: nextFavorites }));
    }

    // If authenticated, push updated favorites to cloud profile
    if (auth?.currentUser) {
      import('../services/userSyncService.js').then(({ pushFavoritesToCloud }) => {
        pushFavoritesToCloud(auth.currentUser, nextFavorites).catch(() => {});
      }).catch(() => {});
    }

    return { success: true, newStatus, error: null };
  } catch (err) {
    console.error('toggleFavoriteSong error:', err);
    return { success: false, error: err.message || 'Error updating favorite' };
  }
}

/**
 * Internal diagnostic function reporting real-time Firebase / Firestore health
 */
export async function runFirebaseDiagnostics() {
  const result = {
    firebaseInitialized: Boolean(db && db.app),
    authInitialized: Boolean(auth),
    currentUserAuthenticated: Boolean(auth?.currentUser),
    uidPresent: Boolean(auth?.currentUser?.uid),
    firestoreInitialized: Boolean(db),
    projectId: firebaseConfig.projectId,
    testPath: `/${SONGS_COLLECTION}`,
    testReadStatus: 'pending',
    testWriteStatus: 'pending',
    errorCode: null,
    errorMessage: null
  };

  try {
    const snap = await getDocs(collection(db, SONGS_COLLECTION));
    result.testReadStatus = 'success';
    result.docsCount = snap.size;
  } catch (err) {
    result.testReadStatus = 'failed';
    result.errorCode = err.code || 'unknown';
    result.errorMessage = err.message || String(err);
  }

  return result;
}

/**
 * Transliterates all regional language (Tamil, Hindi) songs stored in the Firestore database to English phonetics.
 * Updates the Firestore documents via Trusted Backend while preserving chords, structures, and metadata.
 */
export async function transliterateAllRegionalSongsInDb() {
  await ensureAuthReady();
  const path = SONGS_COLLECTION;

  try {
    const songsRef = collection(db, SONGS_COLLECTION);
    const snapshot = await getDocs(songsRef);

    let totalProcessed = 0;
    let totalTransliterated = 0;
    const modifiedSongs = [];
    const errors = [];

    for (const docSnap of snapshot.docs) {
      totalProcessed++;
      const songData = { id: docSnap.id, ...docSnap.data() };
      
      const { song: updatedSong, modified } = transliterateSong(songData);

      if (modified) {
        const updateRes = await updateSong(docSnap.id, {
          ...songData,
          title: updatedSong.title || songData.title,
          secondaryTitle: updatedSong.secondaryTitle || songData.secondaryTitle || null,
          sections: updatedSong.sections || []
        });

        if (updateRes.success) {
          totalTransliterated++;
          modifiedSongs.push({ id: docSnap.id, title: updatedSong.title });
        } else {
          errors.push({ id: docSnap.id, error: updateRes.error });
        }
      }
    }

    return {
      success: true,
      totalProcessed,
      totalTransliterated,
      modifiedSongs,
      errors
    };
  } catch (err) {
    logFirestoreDiagnostic('transliterateAllRegionalSongsInDb', path, err);
    return {
      success: false,
      totalProcessed: 0,
      totalTransliterated: 0,
      modifiedSongs: [],
      errors: [formatFirestoreError(err, 'transliterateAllRegionalSongsInDb')]
    };
  }
}


