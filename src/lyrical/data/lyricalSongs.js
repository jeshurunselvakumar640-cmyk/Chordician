import { generateSongTransliterations } from '../transliteration/index.js';

const LYRICAL_SONGS_STORAGE_KEY = 'lyrical_songs_v1';
const LYRICAL_FAVORITES_STORAGE_KEY = 'lyrical_favorites_v1';

// Known sample song IDs created during development that must be purged
const SAMPLE_SONG_IDS = new Set([
  'lyr-1', 'lyr-2', 'lyr-3', 'lyr-4', 'lyr-5',
  'lyr-6', 'lyr-7', 'lyr-8', 'lyr-9', 'lyr-10'
]);

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



