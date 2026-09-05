/**
 * Communion Songs Service.
 * Manages the Communion / Lord's Supper songs collection with persistence,
 * reordering, setlist navigation, and real-time reactive event synchronization.
 */

const STORAGE_KEY = 'chordician_communion_songs';
const EVENT_NAME = 'chordician:communion-updated';

/**
 * Loads the current Communion Songs data from localStorage.
 * @returns {{ songIds: string[], notes: string, updatedAt: string }}
 */
export function getCommunionData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultData = {
        songIds: [],
        notes: '',
        updatedAt: new Date().toISOString()
      };
      saveCommunionData(defaultData);
      return defaultData;
    }

    const parsed = JSON.parse(raw);
    return {
      songIds: Array.isArray(parsed.songIds) ? parsed.songIds : [],
      notes: parsed.notes || '',
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch (err) {
    console.error('[Communion Service] Failed to load from storage:', err);
    return {
      songIds: [],
      notes: '',
      updatedAt: new Date().toISOString()
    };
  }
}

/**
 * Saves Communion Songs data to localStorage and emits a reactive event.
 * @param {{ songIds: string[], notes?: string }} data
 */
export function saveCommunionData(data) {
  try {
    const payload = {
      songIds: Array.isArray(data.songIds) ? data.songIds : [],
      notes: data.notes || '',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
    }
  } catch (err) {
    console.error('[Communion Service] Failed to save to storage:', err);
  }
}

/**
 * Adds a song ID to Communion Songs collection.
 * @param {string} songId
 * @returns {string[]}
 */
export function addSongToCommunion(songId) {
  if (!songId) return [];
  const current = getCommunionData();
  if (!current.songIds.includes(songId)) {
    const updated = [...current.songIds, songId];
    saveCommunionData({ ...current, songIds: updated });
    return updated;
  }
  return current.songIds;
}

/**
 * Removes a song ID from Communion Songs collection.
 * @param {string} songId
 * @returns {string[]}
 */
export function removeSongFromCommunion(songId) {
  if (!songId) return [];
  const current = getCommunionData();
  const updated = current.songIds.filter((id) => id !== songId);
  saveCommunionData({ ...current, songIds: updated });
  return updated;
}

/**
 * Toggles a song ID in Communion Songs collection.
 * @param {string} songId
 * @returns {boolean} true if added, false if removed
 */
export function toggleSongInCommunion(songId) {
  if (!songId) return false;
  const current = getCommunionData();
  const exists = current.songIds.includes(songId);
  if (exists) {
    removeSongFromCommunion(songId);
    return false;
  } else {
    addSongToCommunion(songId);
    return true;
  }
}

/**
 * Checks if a song ID is in the Communion Songs collection.
 * @param {string} songId
 * @returns {boolean}
 */
export function isSongInCommunion(songId) {
  if (!songId) return false;
  const current = getCommunionData();
  return current.songIds.includes(songId);
}

/**
 * Reorders songs in the Communion collection.
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {string[]}
 */
export function reorderCommunionSongs(fromIndex, toIndex) {
  const current = getCommunionData();
  const list = [...current.songIds];
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return list;
  }
  const [removed] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, removed);
  saveCommunionData({ ...current, songIds: list });
  return list;
}

/**
 * Clears all songs from Communion collection.
 */
export function clearCommunionSongs() {
  const current = getCommunionData();
  saveCommunionData({ ...current, songIds: [], notes: '' });
}

/**
 * Finds adjacent songs for Next / Previous navigation within the Communion collection.
 * @param {string} currentSongId
 * @param {Array} allSongs Full songs list from database
 * @returns {{
 *   inCommunion: boolean,
 *   currentIndex: number,
 *   totalCount: number,
 *   prevSong: any | null,
 *   nextSong: any | null,
 *   communionSongs: Array
 * }}
 */
export function getAdjacentCommunionSongs(currentSongId, allSongs = []) {
  const data = getCommunionData();
  const songMap = new Map((allSongs || []).map((s) => [s.id, s]));
  const communionSongs = data.songIds.map((id) => songMap.get(id)).filter(Boolean);

  const currentIndex = communionSongs.findIndex((s) => s.id === currentSongId);
  const inCommunion = currentIndex !== -1;

  const prevSong = inCommunion && currentIndex > 0 ? communionSongs[currentIndex - 1] : null;
  const nextSong =
    inCommunion && currentIndex < communionSongs.length - 1
      ? communionSongs[currentIndex + 1]
      : null;

  return {
    inCommunion,
    currentIndex,
    position: inCommunion ? currentIndex + 1 : 0,
    total: communionSongs.length,
    totalCount: communionSongs.length,
    prevSong,
    nextSong,
    communionSongs
  };
}
