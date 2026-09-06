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

const SONGS_COLLECTION = 'songs';

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
 * Fetch all songs from Firestore (/songs)
 */
export async function getSongs() {
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
      songs.push({
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
      });
    });

    return { data: songs, error: null };
  } catch (err) {
    logFirestoreDiagnostic('getDocs', path, err);
    return { data: [], error: formatFirestoreError(err, 'getSongs') };
  }
}

/**
 * Fetch a single song by ID (/songs/{id})
 */
export async function getSongById(id) {
  if (!id) return { data: null, error: 'Song ID is required' };
  await ensureAuthReady();
  const path = `${SONGS_COLLECTION}/${id}`;

  try {
    const docRef = doc(db, SONGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { data: null, error: 'Song not found' };
    }

    const data = docSnap.data();
    return {
      data: {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
      },
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

