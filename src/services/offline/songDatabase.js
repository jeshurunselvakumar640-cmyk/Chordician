import Dexie from 'dexie';

/**
 * Chordician Offline Song Database (IndexedDB powered by Dexie)
 *
 * Dedicated local repository for instant offline songbook access.
 * Stores untransformed, complete Chordician song objects indexed by Firestore document ID.
 */

const DB_NAME = 'chordician-offline';
const DB_VERSION = 1;

export const offlineDb = new Dexie(DB_NAME);

offlineDb.version(DB_VERSION).stores({
  songs: 'id, title, originalKey, category, updatedAt'
});

/**
 * Checks if IndexedDB is supported and accessible in the current runtime environment.
 */
export function isIndexedDbSupported() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Save or update a single song in the local IndexedDB database.
 * Preserves the complete, untransformed song object schema.
 *
 * @param {Object} song - Complete song document object with valid `id`
 * @returns {Promise<{ success: boolean, id: string|null, error: string|null }>}
 */
export async function saveSong(song) {
  if (!song || typeof song !== 'object' || !song.id) {
    return { success: false, id: null, error: 'Invalid song object: valid string ID is required' };
  }

  if (!isIndexedDbSupported()) {
    return { success: false, id: song.id, error: 'IndexedDB is not supported in this environment' };
  }

  try {
    await offlineDb.songs.put(song);
    return { success: true, id: song.id, error: null };
  } catch (err) {
    console.warn('[OfflineSongDB] Failed to save song:', err);
    return { success: false, id: song.id, error: err.message || 'Failed to save song to local database' };
  }
}

/**
 * Bulk save/update multiple songs in a single transaction.
 *
 * @param {Array<Object>} songs - Array of complete song objects
 * @returns {Promise<{ success: boolean, count: number, error: string|null }>}
 */
export async function saveSongs(songs) {
  if (!Array.isArray(songs) || songs.length === 0) {
    return { success: true, count: 0, error: null };
  }

  if (!isIndexedDbSupported()) {
    return { success: false, count: 0, error: 'IndexedDB is not supported in this environment' };
  }

  const validSongs = songs.filter((s) => s && typeof s === 'object' && s.id);
  if (validSongs.length === 0) {
    return { success: false, count: 0, error: 'No valid songs with IDs found in input array' };
  }

  try {
    await offlineDb.songs.bulkPut(validSongs);
    return { success: true, count: validSongs.length, error: null };
  } catch (err) {
    console.warn('[OfflineSongDB] Bulk save error:', err);
    return { success: false, count: 0, error: err.message || 'Bulk save transaction failed' };
  }
}

/**
 * Fetch a single song by its Firestore document ID from the local database.
 *
 * @param {string} id - Firestore Document ID
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function getSong(id) {
  if (!id || typeof id !== 'string') {
    return { data: null, error: 'Song ID string is required' };
  }

  if (!isIndexedDbSupported()) {
    return { data: null, error: 'IndexedDB is not supported in this environment' };
  }

  try {
    const song = await offlineDb.songs.get(id);
    return { data: song || null, error: null };
  } catch (err) {
    console.warn('[OfflineSongDB] getSong error for ID', id, ':', err);
    return { data: null, error: err.message || 'Failed to fetch song from local database' };
  }
}

/**
 * Retrieve all locally stored songs from the database.
 *
 * @returns {Promise<{ data: Array<Object>, error: string|null }>}
 */
export async function getAllSongs() {
  if (!isIndexedDbSupported()) {
    return { data: [], error: 'IndexedDB is not supported in this environment' };
  }

  try {
    const songs = await offlineDb.songs.toArray();
    return { data: Array.isArray(songs) ? songs : [], error: null };
  } catch (err) {
    console.warn('[OfflineSongDB] getAllSongs error:', err);
    return { data: [], error: err.message || 'Failed to retrieve songs from local database' };
  }
}

/**
 * Delete a song from the local database by ID.
 *
 * @param {string} id - Firestore Document ID
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export async function deleteSong(id) {
  if (!id || typeof id !== 'string') {
    return { success: false, error: 'Song ID string is required' };
  }

  if (!isIndexedDbSupported()) {
    return { success: false, error: 'IndexedDB is not supported in this environment' };
  }

  try {
    await offlineDb.songs.delete(id);
    return { success: true, error: null };
  } catch (err) {
    console.warn('[OfflineSongDB] deleteSong error for ID', id, ':', err);
    return { success: false, error: err.message || 'Failed to delete song from local database' };
  }
}

/**
 * Clears all songs from the local IndexedDB database.
 *
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export async function clearSongs() {
  if (!isIndexedDbSupported()) {
    return { success: false, error: 'IndexedDB is not supported in this environment' };
  }

  try {
    await offlineDb.songs.clear();
    return { success: true, error: null };
  } catch (err) {
    console.warn('[OfflineSongDB] clearSongs error:', err);
    return { success: false, error: err.message || 'Failed to clear local database' };
  }
}

/**
 * Returns the total count of locally cached songs.
 *
 * @returns {Promise<{ count: number, error: string|null }>}
 */
export async function getSongCount() {
  if (!isIndexedDbSupported()) {
    return { count: 0, error: 'IndexedDB is not supported in this environment' };
  }

  try {
    const count = await offlineDb.songs.count();
    return { count: typeof count === 'number' ? count : 0, error: null };
  } catch (err) {
    console.warn('[OfflineSongDB] getSongCount error:', err);
    return { count: 0, error: err.message || 'Failed to count local songs' };
  }
}

/**
 * Provides diagnostic telemetry and metadata for the offline database.
 *
 * @returns {Promise<{
 *   name: string,
 *   version: number,
 *   isOpen: boolean,
 *   isAvailable: boolean,
 *   songCount: number,
 *   error: string|null
 * }>}
 */
export async function getDatabaseStats() {
  const isAvailable = isIndexedDbSupported();

  if (!isAvailable) {
    return {
      name: DB_NAME,
      version: DB_VERSION,
      isOpen: false,
      isAvailable: false,
      songCount: 0,
      error: 'IndexedDB is not supported in this environment'
    };
  }

  try {
    const count = await offlineDb.songs.count();
    return {
      name: DB_NAME,
      version: DB_VERSION,
      isOpen: offlineDb.isOpen(),
      isAvailable: true,
      songCount: count,
      error: null
    };
  } catch (err) {
    return {
      name: DB_NAME,
      version: DB_VERSION,
      isOpen: offlineDb.isOpen(),
      isAvailable: true,
      songCount: 0,
      error: err.message || 'Failed to read database stats'
    };
  }
}
