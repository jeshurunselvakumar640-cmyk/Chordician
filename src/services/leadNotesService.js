import {
  LEAD_NOTES_STORAGE_KEY,
  pushLeadNotesToCloud
} from './userSyncService.js';

/**
 * Detects whether a song contains meaningful, non-empty Lead notes content.
 * Handles songs with sections, rows, lines, or flat structures.
 *
 * @param {Object} song
 * @returns {boolean}
 */
export function hasMeaningfulLead(song) {
  if (!song || typeof song !== 'object') return false;

  const hasContent = (val) => {
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.some((item) => typeof item === 'string' && item.trim().length > 0);
    return false;
  };

  // 1. Check sections array
  if (Array.isArray(song.sections)) {
    for (const section of song.sections) {
      if (!section) continue;

      // Check section.rows
      if (Array.isArray(section.rows)) {
        for (const row of section.rows) {
          if (!row) continue;
          if (row.type === 'lead') {
            const rowContent =
              row.displayContent !== undefined
                ? row.displayContent
                : row.content !== undefined
                ? row.content
                : row.text || row.chords || '';
            if (hasContent(rowContent)) return true;
          }
          if (row.lead && hasContent(row.lead)) return true;
        }
      }

      // Check section.lines
      if (Array.isArray(section.lines)) {
        for (const line of section.lines) {
          if (!line) continue;
          if (line.lead && hasContent(line.lead)) return true;
          if (Array.isArray(line.rows)) {
            for (const r of line.rows) {
              if (r && r.type === 'lead') {
                const rContent =
                  r.displayContent !== undefined
                    ? r.displayContent
                    : r.content !== undefined
                    ? r.content
                    : r.text || '';
                if (hasContent(rContent)) return true;
              }
            }
          }
        }
      }
    }
  }

  // 2. Check flat song.rows
  if (Array.isArray(song.rows)) {
    for (const row of song.rows) {
      if (!row) continue;
      if (row.type === 'lead') {
        const rowContent =
          row.displayContent !== undefined
            ? row.displayContent
            : row.content !== undefined
            ? row.content
            : row.text || '';
        if (hasContent(rowContent)) return true;
      }
      if (row.lead && hasContent(row.lead)) return true;
    }
  }

  // 3. Direct song.lead property
  if (song.lead && hasContent(song.lead)) return true;

  return false;
}

/**
 * Retrieves the current user's saved Lead Note song IDs from local storage.
 *
 * @returns {Array<string>}
 */
export function getStoredLeadNotes() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LEAD_NOTES_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Adds a song ID to the user's personal Lead Notes list.
 * Deduplicates, stores locally, emits sync event, and queues Firestore write.
 *
 * @param {string} songId
 * @returns {Array<string>} Updated lead note song IDs
 */
export function addSongToLeadNotes(songId) {
  if (!songId) return getStoredLeadNotes();

  const current = getStoredLeadNotes();
  if (current.includes(songId)) return current;

  const next = [...current, songId];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LEAD_NOTES_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chordician:lead-notes-updated', { detail: next }));
  }

  pushLeadNotesToCloud(null, next).catch(() => {});
  return next;
}

/**
 * Removes a song ID from the user's personal Lead Notes list.
 * Stores locally, emits sync event, and queues Firestore write.
 *
 * @param {string} songId
 * @returns {Array<string>} Updated lead note song IDs
 */
export function removeSongFromLeadNotes(songId) {
  if (!songId) return getStoredLeadNotes();

  const current = getStoredLeadNotes();
  const next = current.filter((id) => id !== songId);

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LEAD_NOTES_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chordician:lead-notes-updated', { detail: next }));
  }

  pushLeadNotesToCloud(null, next).catch(() => {});
  return next;
}
