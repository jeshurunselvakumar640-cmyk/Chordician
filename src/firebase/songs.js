import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, ensureAuthReady, firebaseConfig } from './config.js';
import { transliterateSong } from '../transliteration/index.js';

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

    return { data: songs, error: null };
  } catch (err) {
    // Graceful offline fallback to memory/sessionStorage cache
    if (_cachedSongs && _cachedSongs.length > 0) {
      return { data: _cachedSongs, error: null };
    }
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

  // Check fast in-memory map
  if (_songMapCache.has(id)) {
    const cached = _songMapCache.get(id);
    if (cached && Array.isArray(cached.sections)) {
      return { data: cached, error: null };
    }
  }

  // Check in _cachedSongs array
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

    return {
      data: songData,
      error: null
    };
  } catch (err) {
    logFirestoreDiagnostic('getDoc', path, err);
    return { data: null, error: formatFirestoreError(err, `getSongById(${id})`) };
  }
}

/**
 * Add a new song to Firestore (/songs)
 */
export async function addSong(songData) {
  await ensureAuthReady();
  const path = SONGS_COLLECTION;
  const currentUid = auth?.currentUser?.uid || null;

  try {
    const cleanData = {
      title: (songData.title || '').trim(),
      secondaryTitle: songData.secondaryTitle ? songData.secondaryTitle.trim() : null,
      artist: (songData.artist || '').trim(),
      originalKey: songData.originalKey || 'C',
      category: songData.category || 'Other',
      style: songData.style || null,
      favorite: Boolean(songData.favorite),
      sections: Array.isArray(songData.sections) ? songData.sections : [],
      tempo: songData.tempo || null,
      timeSignature: songData.timeSignature || '4/4',
      notes: songData.notes || '',
      ...(currentUid ? { userId: currentUid, ownerId: currentUid } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (!cleanData.title) {
      return { id: null, error: 'Song title cannot be empty' };
    }

    const docRef = await addDoc(collection(db, SONGS_COLLECTION), cleanData);
    invalidateSongCache();
    return { id: docRef.id, error: null };
  } catch (err) {
    logFirestoreDiagnostic('addDoc', path, err);
    return { id: null, error: formatFirestoreError(err, 'addSong') };
  }
}

/**
 * Update an existing song in Firestore (/songs/{id})
 */
export async function updateSong(id, songData) {
  if (!id) return { success: false, error: 'Song ID is required' };
  await ensureAuthReady();
  const path = `${SONGS_COLLECTION}/${id}`;
  const currentUid = auth?.currentUser?.uid || null;

  try {
    const docRef = doc(db, SONGS_COLLECTION, id);
    const cleanData = {
      title: (songData.title || '').trim(),
      secondaryTitle: songData.secondaryTitle ? songData.secondaryTitle.trim() : null,
      artist: (songData.artist || '').trim(),
      originalKey: songData.originalKey || 'C',
      category: songData.category || 'Other',
      style: songData.style || null,
      favorite: Boolean(songData.favorite),
      sections: Array.isArray(songData.sections) ? songData.sections : [],
      tempo: songData.tempo || null,
      timeSignature: songData.timeSignature || '4/4',
      notes: songData.notes || '',
      ...(currentUid ? { userId: currentUid, ownerId: currentUid } : {}),
      updatedAt: serverTimestamp()
    };

    if (!cleanData.title) {
      return { success: false, error: 'Song title cannot be empty' };
    }

    await updateDoc(docRef, cleanData);
    invalidateSongCache(id);
    invalidateSongCache();
    return { success: true, error: null };
  } catch (err) {
    logFirestoreDiagnostic('updateDoc', path, err);
    return { success: false, error: formatFirestoreError(err, `updateSong(${id})`) };
  }
}

/**
 * Delete a song from Firestore (/songs/{id})
 */
export async function deleteSong(id) {
  if (!id) return { success: false, error: 'Song ID is required' };
  await ensureAuthReady();
  const path = `${SONGS_COLLECTION}/${id}`;

  try {
    const docRef = doc(db, SONGS_COLLECTION, id);
    await deleteDoc(docRef);
    invalidateSongCache(id);
    invalidateSongCache();
    return { success: true, error: null };
  } catch (err) {
    logFirestoreDiagnostic('deleteDoc', path, err);
    return { success: false, error: formatFirestoreError(err, `deleteSong(${id})`) };
  }
}

/**
 * Toggle favorite status of a song (/songs/{id})
 */
export async function toggleFavoriteSong(id, currentStatus) {
  if (!id) return { success: false, error: 'Song ID is required' };
  await ensureAuthReady();
  const path = `${SONGS_COLLECTION}/${id}`;

  try {
    const docRef = doc(db, SONGS_COLLECTION, id);
    await updateDoc(docRef, {
      favorite: !currentStatus,
      updatedAt: serverTimestamp()
    });
    updateMemorySongCache((prev) =>
      prev.map((s) => (s.id === id ? { ...s, favorite: !currentStatus } : s))
    );
    if (_songMapCache.has(id)) {
      const existing = _songMapCache.get(id);
      _songMapCache.set(id, { ...existing, favorite: !currentStatus });
    }
    return { success: true, newStatus: !currentStatus, error: null };
  } catch (err) {
    logFirestoreDiagnostic('updateDoc (toggleFavorite)', path, err);
    return { success: false, error: formatFirestoreError(err, `toggleFavorite(${id})`) };
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
 * Updates the Firestore documents in place while preserving chords, structures, and metadata.
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
        try {
          const docRef = doc(db, SONGS_COLLECTION, docSnap.id);
          await updateDoc(docRef, {
            title: updatedSong.title || songData.title,
            secondaryTitle: updatedSong.secondaryTitle || songData.secondaryTitle || null,
            sections: updatedSong.sections || [],
            updatedAt: serverTimestamp()
          });
          totalTransliterated++;
          modifiedSongs.push({ id: docSnap.id, title: updatedSong.title });
        } catch (updateErr) {
          errors.push({ id: docSnap.id, error: updateErr.message });
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


