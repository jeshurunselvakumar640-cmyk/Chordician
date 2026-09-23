import { collection, getDocs } from 'firebase/firestore';
import { lyricalDb } from '../firebase/config.js';
import { generateSongTransliterations } from '../transliteration/index.js';

const OLD_STALE_STORAGE_KEY = 'lyrical_songs_v1';
const LYRICAL_SONGS_STORAGE_KEY = 'lyrical_cloud_songs_cache_v1';
const LYRICAL_FAVORITES_STORAGE_KEY = 'lyrical_favorites_v1';
const LYRICAL_SONGS_COLLECTION = 'lyrical_songs';

// Known sample song IDs created during development that must be purged
const SAMPLE_SONG_IDS = new Set([
  'lyr-1', 'lyr-2', 'lyr-3', 'lyr-4', 'lyr-5',
  'lyr-6', 'lyr-7', 'lyr-8', 'lyr-9', 'lyr-10'
]);

/**
 * Fetches dedicated Lyrical songs from Firestore (Project: notespiano, Collection: /lyrical_songs).
 * Public read access - completely separated from Chordician's pianonotes-1bd94 database.
 * If notespiano /lyrical_songs is empty, returns [] and purges any stale legacy cache.
 */
export async function fetchCloudLyricalSongs() {
  // Purge legacy stale cache key immediately
  try {
    localStorage.removeItem(OLD_STALE_STORAGE_KEY);
  } catch {}

  try {
    if (!lyricalDb) {
      return getInitialLyricalSongs();
    }

    const snap = await getDocs(collection(lyricalDb, LYRICAL_SONGS_COLLECTION));
    const cloudSongs = [];
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data) {
        cloudSongs.push({
          id: d.id,
          ...data,
          secondaryTitles: Array.isArray(data.secondaryTitles)
            ? data.secondaryTitles
            : (data.secondaryTitle ? [data.secondaryTitle] : [])
        });
      }
    });

    // notespiano /lyrical_songs is the sole canonical source of truth for Lyrical songs
    saveLyricalSongs(cloudSongs);
    return cloudSongs;
  } catch (err) {
    console.warn('[Lyrical Cloud Sync] Error fetching Lyrical songs from notespiano:', err.message);
  }
  return getInitialLyricalSongs();
}

/**
 * Saves a dedicated Lyrical song to notespiano Firestore via the secure Owner Backend API.
 * Requires an authorized Owner ID token.
 */
export async function saveLyricalSongToCloud(song, idToken = null) {
  if (!song) return { success: false, error: 'Song data is required' };

  // Always persist to local device storage first
  const currentLocal = getInitialLyricalSongs();
  const existingIdx = currentLocal.findIndex(s => s.id === song.id);
  let updatedLocal;
  if (existingIdx >= 0) {
    updatedLocal = [...currentLocal];
    updatedLocal[existingIdx] = song;
  } else {
    updatedLocal = [song, ...currentLocal];
  }
  saveLyricalSongs(updatedLocal);

  // If user is authenticated with an ID token, dispatch write to the secure Owner Backend
  if (idToken) {
    try {
      const res = await fetch('/api/lyrical/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(song)
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        console.warn('[Lyrical Cloud Save Warning]:', result.error);
        return { success: false, error: result.error, localSaved: true };
      }
      return { success: true, id: result.id, song: result.song };
    } catch (err) {
      console.warn('[Lyrical Cloud Save Exception]:', err.message);
      return { success: false, error: err.message, localSaved: true };
    }
  }

  return { success: true, id: song.id, song, localSaved: true };
}

/**
 * Deletes a Lyrical song from notespiano Firestore via the secure Owner Backend API.
 * Requires an authorized Owner ID token.
 */
export async function deleteLyricalSongFromCloud(songId, idToken = null) {
  if (!songId) return { success: false, error: 'Song ID is required' };

  // Always delete from local device storage
  const currentLocal = getInitialLyricalSongs();
  const updatedLocal = currentLocal.filter(s => s.id !== songId);
  saveLyricalSongs(updatedLocal);

  // If user is authenticated with an ID token, dispatch delete to the secure Owner Backend
  if (idToken) {
    try {
      const res = await fetch(`/api/lyrical/songs/${encodeURIComponent(songId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        console.warn('[Lyrical Cloud Delete Warning]:', result.error);
        return { success: false, error: result.error };
      }
      return { success: true, id: songId };
    } catch (err) {
      console.warn('[Lyrical Cloud Delete Exception]:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: true, id: songId };
}

export function getInitialLyricalSongs() {
  try {
    // Proactively purge old stale cache from prior development step
    if (localStorage.getItem(OLD_STALE_STORAGE_KEY)) {
      localStorage.removeItem(OLD_STALE_STORAGE_KEY);
    }

    const raw = localStorage.getItem(LYRICAL_SONGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any leftover mock/sample development songs, preserving real/imported songs
        const realSongs = parsed.filter((s) => s && s.id && !SAMPLE_SONG_IDS.has(s.id));
        if (realSongs.length !== parsed.length) {
          saveLyricalSongs(realSongs);
        }
        return realSongs;
      }
    }
  } catch (e) {
    // Ignore storage errors in restricted environments
  }
  return [];
}

export function saveLyricalSongs(songs) {
  try {
    const validSongs = Array.isArray(songs)
      ? songs.filter((s) => s && s.id && !SAMPLE_SONG_IDS.has(s.id))
      : [];
    localStorage.setItem(LYRICAL_SONGS_STORAGE_KEY, JSON.stringify(validSongs));
  } catch (e) {
    // Ignore storage errors
  }
}

export function getInitialLyricalFavorites() {
  try {
    const raw = localStorage.getItem(LYRICAL_FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const realFavs = parsed.filter((id) => !SAMPLE_SONG_IDS.has(id));
        if (realFavs.length !== parsed.length) {
          saveLyricalFavorites(realFavs);
        }
        return realFavs;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  return [];
}

export function saveLyricalFavorites(favIds) {
  try {
    const validFavs = Array.isArray(favIds)
      ? favIds.filter((id) => !SAMPLE_SONG_IDS.has(id))
      : [];
    localStorage.setItem(LYRICAL_FAVORITES_STORAGE_KEY, JSON.stringify(validFavs));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Resolves the appropriate lyrics string for the selected transliteration tab.
 * Uses stored script version if present, or computes on demand via the transliteration engine.
 */
export function resolveLyricsForTab(song, tab) {
  if (!song) return '';

  if (tab === 'tamil') {
    if (song.tamilLyrics && typeof song.tamilLyrics === 'string' && song.tamilLyrics.trim()) {
      return song.tamilLyrics.trim();
    }
    const generated = generateSongTransliterations(song);
    return generated.tamilLyrics || '';
  }

  if (tab === 'english') {
    if (song.englishLyrics && typeof song.englishLyrics === 'string' && song.englishLyrics.trim()) {
      return song.englishLyrics.trim();
    }
    const generated = generateSongTransliterations(song);
    return generated.englishLyrics || '';
  }

  if (tab === 'hindi') {
    if (song.hindiLyrics && typeof song.hindiLyrics === 'string' && song.hindiLyrics.trim()) {
      return song.hindiLyrics.trim();
    }
    const generated = generateSongTransliterations(song);
    return generated.hindiLyrics || '';
  }

  return '';
}



