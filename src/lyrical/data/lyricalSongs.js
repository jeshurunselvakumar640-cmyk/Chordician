import { collection, getDocs } from 'firebase/firestore';
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
 * Converts a Firestore Chordician song document into Lyrical format.
 */
export function convertFirestoreSongToLyrical(docId, data) {
  if (!data) return null;

  let lyricsText = '';
  if (data.originalLyrics && typeof data.originalLyrics === 'string') {
    lyricsText = data.originalLyrics;
  } else if (data.lyrics && typeof data.lyrics === 'string') {
    lyricsText = data.lyrics;
  } else if (Array.isArray(data.sections)) {
    const sectionBlocks = [];
    for (const section of data.sections) {
      if (!section || !Array.isArray(section.rows)) continue;
      const sectionLines = [];
      for (const row of section.rows) {
        if (row && row.type === 'lyrics' && row.content) {
          const trimmed = String(row.content).replace(/\t+/g, ' ').trim();
          if (trimmed && !/^\d+$/.test(trimmed) && !/buy.*book/i.test(trimmed)) {
            sectionLines.push(trimmed);
          }
        }
      }
      if (sectionLines.length > 0) {
        sectionBlocks.push(sectionLines.join('\n'));
      }
    }
    lyricsText = sectionBlocks.join('\n\n');
  }

  const secondaryTitles = [];
  if (data.secondaryTitle && typeof data.secondaryTitle === 'string') {
    secondaryTitles.push(data.secondaryTitle.trim());
  }
  if (Array.isArray(data.secondaryTitles)) {
    secondaryTitles.push(...data.secondaryTitles.filter(Boolean));
  }

  return {
    id: data.lyricalId || docId,
    chordicianSongId: docId,
    title: data.title || 'Untitled Song',
    secondaryTitles: Array.from(new Set(secondaryTitles)),
    artist: data.artist || data.singer || 'Unknown Artist',
    originalLyrics: lyricsText,
    originalLanguage: data.category === 'Hindi' ? 'Hindi' : (data.category === 'Marathi' ? 'Marathi' : (data.category === 'Telugu' ? 'Telugu' : 'Tamil')),
    tamilLyrics: data.tamilLyrics || '',
    englishLyrics: data.englishLyrics || '',
    hindiLyrics: data.hindiLyrics || '',
    isCommunion: Boolean(data.isCommunion || /communion/i.test(data.category || '') || /communion/i.test(data.title || '')),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

/**
 * Fetches the entire 369+ songs library from Firestore and merges with local custom songs.
 */
export async function fetchCloudLyricalSongs() {
  try {
    const snap = await getDocs(collection(db, 'songs'));
    const cloudSongs = [];
    snap.docs.forEach((doc) => {
      const lyricalSong = convertFirestoreSongToLyrical(doc.id, doc.data());
      if (lyricalSong && lyricalSong.originalLyrics) {
        cloudSongs.push(lyricalSong);
      }
    });

    if (cloudSongs.length > 0) {
      // Merge with custom local songs from localStorage
      const localSongs = getInitialLyricalSongs();
      const localCustom = localSongs.filter(s => s && s.id && !cloudSongs.some(c => c.id === s.id || c.chordicianSongId === s.id));
      const combined = [...localCustom, ...cloudSongs];
      saveLyricalSongs(combined);
      return combined;
    }
  } catch (err) {
    console.warn('[Lyrical Cloud Sync] Error fetching Firestore songs:', err);
  }
  return getInitialLyricalSongs();
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



