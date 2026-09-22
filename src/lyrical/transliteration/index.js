/**
 * Lyrical Complete Transliteration Engine API
 * Deterministic phonetic transliteration between Tamil, Roman (English pronunciation),
 * and Devanagari (Hindi/Marathi representation).
 */

import { detectLyricScript } from './scriptDetector.js';
import { normalizeUnicode } from './textFormatter.js';
import { tamilToRoman } from './tamilToRoman.js';
import { romanToHindi } from './romanToHindi.js';
import { hindiToRoman } from './hindiToRoman.js';
import { romanToTamil } from './romanToTamil.js';
import { devanagariToTamil } from './devanagariToTamil.js';

export {
  detectLyricScript,
  tamilToRoman,
  romanToHindi,
  hindiToRoman,
  romanToTamil,
  devanagariToTamil,
  normalizeUnicode
};

/**
 * Transliterates lyric text between any two supported scripts.
 * @param {string} text - Source lyric text
 * @param {'Tamil' | 'Roman' | 'Devanagari'} sourceScript
 * @param {'Tamil' | 'Roman' | 'Devanagari'} targetScript
 * @returns {string} Transliterated lyric text
 */
export function transliterateLyrics(text = '', sourceScript = null, targetScript = 'Roman') {
  if (!text || typeof text !== 'string') return '';

  const cleanText = normalizeUnicode(text);
  const detectedSource = sourceScript || detectLyricScript(cleanText);

  if (detectedSource === targetScript) {
    return cleanText;
  }

  // Tamil Source
  if (detectedSource === 'Tamil') {
    if (targetScript === 'Roman') {
      return tamilToRoman(cleanText);
    }
    if (targetScript === 'Devanagari') {
      const roman = tamilToRoman(cleanText);
      return romanToHindi(roman);
    }
  }

  // Devanagari Source (Hindi / Marathi)
  if (detectedSource === 'Devanagari') {
    if (targetScript === 'Roman') {
      return hindiToRoman(cleanText);
    }
    if (targetScript === 'Tamil') {
      return devanagariToTamil(cleanText);
    }
  }

  // Roman Source
  if (detectedSource === 'Roman') {
    if (targetScript === 'Tamil') {
      return romanToTamil(cleanText);
    }
    if (targetScript === 'Devanagari') {
      return romanToHindi(cleanText);
    }
  }

  return cleanText;
}

/**
 * Generates all 3 script representations (Tamil, English, Hindi) from authoritative original lyrics.
 * @param {Object|string} songOrLyrics - Song object or raw lyrics string
 * @param {string} [declaredLanguage] - Optional declared language
 * @returns {Object} { originalLyrics, originalLanguage, tamilLyrics, englishLyrics, hindiLyrics }
 */
export function generateSongTransliterations(songOrLyrics, declaredLanguage = '') {
  let rawLyrics = '';
  let originalLang = declaredLanguage || '';

  if (typeof songOrLyrics === 'object' && songOrLyrics !== null) {
    rawLyrics = songOrLyrics.originalLyrics || songOrLyrics.lyrics || '';
    originalLang = songOrLyrics.originalLanguage || songOrLyrics.language || originalLang;
  } else if (typeof songOrLyrics === 'string') {
    rawLyrics = songOrLyrics;
  }

  const cleanLyrics = normalizeUnicode(rawLyrics).trim();
  if (!cleanLyrics) {
    return {
      originalLyrics: '',
      originalLanguage: originalLang || 'Tamil',
      tamilLyrics: '',
      englishLyrics: '',
      hindiLyrics: ''
    };
  }

  const detectedScript = detectLyricScript(cleanLyrics);
  let tamilLyrics = '';
  let englishLyrics = '';
  let hindiLyrics = '';

  if (detectedScript === 'Tamil') {
    tamilLyrics = cleanLyrics;
    englishLyrics = tamilToRoman(cleanLyrics);
    hindiLyrics = romanToHindi(englishLyrics);
    if (!originalLang) originalLang = 'Tamil';
  } else if (detectedScript === 'Devanagari') {
    hindiLyrics = cleanLyrics;
    englishLyrics = hindiToRoman(cleanLyrics);
    tamilLyrics = devanagariToTamil(cleanLyrics);
    if (!originalLang) originalLang = 'Hindi';
  } else {
    // Roman / Latin script
    englishLyrics = cleanLyrics;
    tamilLyrics = romanToTamil(cleanLyrics);
    hindiLyrics = romanToHindi(cleanLyrics);
    if (!originalLang) originalLang = 'English';
  }

  return {
    originalLyrics: cleanLyrics,
    originalLanguage: originalLang,
    tamilLyrics,
    englishLyrics,
    hindiLyrics
  };
}

/**
 * Ensures a song object has all 3 transliterated versions without overwriting existing manual edits.
 */
export function transliterateSong(song) {
  if (!song || typeof song !== 'object') return song;

  const rawLyrics = (song.originalLyrics || song.lyrics || '').trim();
  if (!rawLyrics) return song;

  const generated = generateSongTransliterations(song);

  return {
    ...song,
    originalLyrics: song.originalLyrics || rawLyrics,
    originalLanguage: song.originalLanguage || song.language || generated.originalLanguage,
    tamilLyrics: song.tamilLyrics || generated.tamilLyrics,
    englishLyrics: song.englishLyrics || generated.englishLyrics,
    hindiLyrics: song.hindiLyrics || generated.hindiLyrics
  };
}
