import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { generateSongTransliterations } from '../transliteration/index.js';

const LYRICAL_SONGS_STORAGE_KEY = 'lyrical_songs_v1';
const LYRICAL_FAVORITES_STORAGE_KEY = 'lyrical_favorites_v1';

// Known sample song IDs created during development that must be purged
const SAMPLE_SONG_IDS = new Set([
  'lyr-1', 'lyr-2', 'lyr-3', 'lyr-4', 'lyr-5',
  'lyr-6', 'lyr-7', 'lyr-8', 'lyr-9', 'lyr-10'
]);

/**
 * Fetches dedicated Lyrical songs from Firestore (ONLY documents with isLyrical: true or lyr_ prefix)
 * Keeps Lyrical library strictly separated from Chordician's chord chart database.
 */
export async function fetchCloudLyricalSongs() {
  try {
    const snap = await getDocs(collection(db, 'songs'));
    const cloudSongs = [];
    snap.docs.forEach((d) => {
      const data = d.data();
      // Only include songs specifically added to Lyrical
      if (data && (data.isLyrical === true || d.id.startsWith('lyr_'))) {
        cloudSongs.push({
          id: d.id,
          ...data,
          secondaryTitles: Array.isArray(data.secondaryTitles)
            ? data.secondaryTitles
            : (data.secondaryTitle ? [data.secondaryTitle] : [])
        });
      }
    });

    // Merge with any local custom lyrical songs from localStorage
    const localSongs = getInitialLyricalSongs();
    const songMap = new Map();
    cloudSongs.forEach((s) => songMap.set(s.id, s));
    localSongs.forEach((s) => {
      if (s && s.id && !songMap.has(s.id)) {
        songMap.set(s.id, s);
        // Upload un-synced local song to Firestore in background
        saveLyricalSongToCloud(s).catch(() => {});
      }
    });

    const combined = Array.from(songMap.values());
    saveLyricalSongs(combined);
    return combined;
  } catch (err) {
    console.warn('[Lyrical Cloud Sync] Error fetching Lyrical songs:', err);
  }
  return getInitialLyricalSongs();
}

/**
 * Saves a dedicated Lyrical song to Firestore cloud database with isLyrical: true.
 */
export async function saveLyricalSongToCloud(song) {
  if (!song || !song.id) return;
  try {
    const songId = song.id.startsWith('lyr_') ? song.id : `lyr_${song.id}`;
    const payload = {
      ...song,
      id: songId,
      isLyrical: true,
      updatedAt: new Date().toISOString()
    };
    if (!payload.createdAt) {
      payload.createdAt = new Date().toISOString();
    }
    await setDoc(doc(db, 'songs', songId), payload);
    return payload;
  } catch (err) {
    console.warn('[Lyrical Save to Cloud Warning]:', err);
  }
}

/**
 * Deletes a Lyrical song from Firestore cloud database.
 */
export async function deleteLyricalSongFromCloud(songId) {
  if (!songId) return;
  try {
    const targetId = songId.startsWith('lyr_') ? songId : `lyr_${songId}`;
    await deleteDoc(doc(db, 'songs', targetId));
  } catch (err) {
    console.warn('[Lyrical Delete from Cloud Warning]:', err);
  }
}

export function getInitialLyricalSongs() {
  try {
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



