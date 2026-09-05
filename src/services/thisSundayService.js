/**
 * This Sunday Service.
 * Manages the Sunday worship service setlist with date-based auto-expiration,
 * custom service dates, and real-time reactive updates.
 */

const STORAGE_KEY = 'chordician_this_sunday_setlist';
const EVENT_NAME = 'chordician:this-sunday-updated';

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 * @returns {string}
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the next upcoming Sunday date as YYYY-MM-DD in local time.
 * If today is Sunday, returns today.
 * @returns {string}
 */
export function getUpcomingSunday() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);

  const year = sunday.getFullYear();
  const month = String(sunday.getMonth() + 1).padStart(2, '0');
  const day = String(sunday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given YYYY-MM-DD date has already passed (i.e. is before today).
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isDateExpired(dateStr) {
  if (!dateStr) return false;
  const today = getTodayDateString();
  return dateStr < today;
}

/**
 * Returns a human-friendly countdown or status for a service date.
 * @param {string} dateStr
 * @returns {string}
 */
export function getDaysUntil(dateStr) {
  if (!dateStr) return '';
  const today = getTodayDateString();

  if (dateStr < today) {
    return 'Expired';
  }
  if (dateStr === today) {
    return 'Today';
  }

  const d1 = new Date(today + 'T00:00:00');
  const d2 = new Date(dateStr + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

/**
 * Returns the numeric difference in days between today and the service date.
 * (0 = today, 1 = tomorrow, negative = past)
 * @param {string} dateStr
 * @returns {number}
 */
export function getDaysUntilNumber(dateStr) {
  if (!dateStr) return 0;
  const today = getTodayDateString();
  const d1 = new Date(today + 'T00:00:00');
  const d2 = new Date(dateStr + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats a YYYY-MM-DD string into a nice readable format (e.g. "Sunday, Sep 6, 2026").
 * @param {string} dateStr
 * @returns {string}
 */
export function formatServiceDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Loads the current "This Sunday" data from localStorage.
 * Automatically clears the setlist if the service date has expired!
 * @returns {{ serviceDate: string, songIds: string[], notes: string, updatedAt: string, isExpired: boolean }}
 */
export function getThisSundayData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const upcomingSunday = getUpcomingSunday();

    if (!raw) {
      const defaultData = {
        serviceDate: upcomingSunday,
        songIds: [],
        notes: '',
        updatedAt: new Date().toISOString()
      };
      saveThisSundayData(defaultData);
      return { ...defaultData, isExpired: false };
    }

    const parsed = JSON.parse(raw);
    const serviceDate = parsed.serviceDate || upcomingSunday;
    const songIds = Array.isArray(parsed.songIds) ? parsed.songIds : [];

    // Check for expiration
    if (isDateExpired(serviceDate)) {
      console.log(`[This Sunday] Service date ${serviceDate} has passed. Resetting to ${upcomingSunday}.`);
      const resetData = {
        serviceDate: upcomingSunday,
        songIds: [],
        notes: '',
        updatedAt: new Date().toISOString()
      };
      saveThisSundayData(resetData);
      return { ...resetData, isExpired: true };
    }

    return {
      serviceDate,
      songIds,
      notes: parsed.notes || '',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      isExpired: false
    };
  } catch (err) {
    console.error('[This Sunday] Failed to load from storage:', err);
    return {
      serviceDate: getUpcomingSunday(),
      songIds: [],
      notes: '',
      updatedAt: new Date().toISOString(),
      isExpired: false
    };
  }
}

/**
 * Saves "This Sunday" data to localStorage and emits an update event.
 * @param {{ serviceDate: string, songIds: string[], notes?: string }} data
 */
export function saveThisSundayData(data) {
  try {
    const payload = {
      serviceDate: data.serviceDate || getUpcomingSunday(),
      songIds: Array.isArray(data.songIds) ? data.songIds : [],
      notes: data.notes || '',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
    }
  } catch (err) {
    console.error('[This Sunday] Failed to save to storage:', err);
  }
}

/**
 * Adds a song ID to This Sunday setlist.
 * @param {string} songId
 * @returns {string[]}
 */
export function addSongToThisSunday(songId) {
  if (!songId) return [];
  const current = getThisSundayData();
  if (!current.songIds.includes(songId)) {
    const updated = [...current.songIds, songId];
    saveThisSundayData({ ...current, songIds: updated });
    return updated;
  }
  return current.songIds;
}

/**
 * Removes a song ID from This Sunday setlist.
 * @param {string} songId
 * @returns {string[]}
 */
export function removeSongFromThisSunday(songId) {
  if (!songId) return [];
  const current = getThisSundayData();
  const updated = current.songIds.filter(id => id !== songId);
  saveThisSundayData({ ...current, songIds: updated });
  return updated;
}

/**
 * Toggles a song ID in This Sunday setlist.
 * @param {string} songId
 * @returns {boolean} true if now added, false if removed
 */
export function toggleSongInThisSunday(songId) {
  if (!songId) return false;
  const current = getThisSundayData();
  const exists = current.songIds.includes(songId);
  if (exists) {
    removeSongFromThisSunday(songId);
    return false;
  } else {
    addSongToThisSunday(songId);
    return true;
  }
}

/**
 * Checks if a song ID is in This Sunday setlist.
 * @param {string} songId
 * @returns {boolean}
 */
export function isSongInThisSunday(songId) {
  if (!songId) return false;
  const current = getThisSundayData();
  return current.songIds.includes(songId);
}

/**
 * Reorders songs in This Sunday setlist.
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {string[]}
 */
export function reorderThisSunday(fromIndex, toIndex) {
  const current = getThisSundayData();
  const list = [...current.songIds];
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return list;
  }
  const [removed] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, removed);
  saveThisSundayData({ ...current, songIds: list });
  return list;
}

/**
 * Sets a custom service date for This Sunday.
 * @param {string} dateStr YYYY-MM-DD
 */
export function setThisSundayDate(dateStr) {
  const current = getThisSundayData();
  saveThisSundayData({ ...current, serviceDate: dateStr });
}

/**
 * Clears all songs from This Sunday setlist.
 */
export function clearThisSunday() {
  const current = getThisSundayData();
  saveThisSundayData({ ...current, songIds: [], notes: '' });
}

/**
 * Finds adjacent songs for Next / Previous navigation within a setlist.
 * @param {string} currentSongId
 * @param {Array} allSongs Full songs list from database
 * @returns {{
 *   inSetlist: boolean,
 *   currentIndex: number,
 *   totalCount: number,
 *   prevSong: any | null,
 *   nextSong: any | null,
 *   setlistSongs: Array
 * }}
 */
export function getAdjacentSongs(currentSongId, allSongs = []) {
  const data = getThisSundayData();
  const songMap = new Map((allSongs || []).map(s => [s.id, s]));
  const setlistSongs = data.songIds.map(id => songMap.get(id)).filter(Boolean);

  const currentIndex = setlistSongs.findIndex(s => s.id === currentSongId);
  const inSetlist = currentIndex !== -1;

  const prevSong = inSetlist && currentIndex > 0 ? setlistSongs[currentIndex - 1] : null;
  const nextSong = inSetlist && currentIndex < setlistSongs.length - 1 ? setlistSongs[currentIndex + 1] : null;

  return {
    inSetlist,
    currentIndex,
    position: inSetlist ? currentIndex + 1 : 0,
    total: setlistSongs.length,
    totalCount: setlistSongs.length,
    prevSong,
    nextSong,
    setlistSongs
  };
}
