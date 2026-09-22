/**
 * Converts Devanagari (Hindi / Marathi) script to Roman pronunciation.
 * Preserves singable pronunciation without semantic translation.
 */

import {
  DEVANAGARI_VOWELS,
  DEVANAGARI_MATRAS,
  DEVANAGARI_VIRAMA,
  DEVANAGARI_CONSONANTS
} from './transliterationRules.js';
import { lookupWordOverride, applyPhraseOverrides, tokenizeLine, matchCasing } from './textFormatter.js';

/**
 * Transliterates a single Devanagari word to Roman pronunciation.
 */
export function transliterateDevanagariWordToRoman(word) {
  if (!word || typeof word !== 'string') return word;

  // 1. Check dictionary overrides first
  const override = lookupWordOverride(word, 'Devanagari', 'Roman');
  if (override) return override;

  const chars = Array.from(word);
  const n = chars.length;
  let result = '';
  let i = 0;

  while (i < n) {
    const ch = chars[i];

    // Check independent vowel
    if (DEVANAGARI_VOWELS[ch]) {
      result += (i === 0 ? capitalize(DEVANAGARI_VOWELS[ch]) : DEVANAGARI_VOWELS[ch]);
      i++;
      continue;
    }

    // Check consonant
    if (DEVANAGARI_CONSONANTS[ch]) {
      let consPhoneme = DEVANAGARI_CONSONANTS[ch];
      const next1 = i + 1 < n ? chars[i + 1] : null;

      // Followed by virama (halant / pure consonant)
      if (next1 === DEVANAGARI_VIRAMA) {
        if (i === 0) consPhoneme = capitalize(consPhoneme);
        result += consPhoneme;
        i += 2;
        continue;
      }

      // Followed by matra (vowel sign)
      if (next1 && DEVANAGARI_MATRAS[next1]) {
        const matraSound = DEVANAGARI_MATRAS[next1];
        let combined = consPhoneme + matraSound;
        if (i === 0) combined = capitalize(combined);
        result += combined;
        i += 2;
        continue;
      }

      // Inherent 'a' vowel
      let combined = consPhoneme + (i === n - 1 && n > 1 ? '' : 'a'); // In Hindi/Marathi, final inherent 'a' is often schwa-dropped
      if (i === 0) combined = capitalize(combined);
      result += combined;
      i++;
      continue;
    }

    // Matra without consonant (e.g. trailing anusvara)
    if (DEVANAGARI_MATRAS[ch]) {
      result += DEVANAGARI_MATRAS[ch];
      i++;
      continue;
    }

    // Non-Devanagari char
    result += ch;
    i++;
  }

  return matchCasing(word, result);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Transliterates full Devanagari lyric text into Roman pronunciation.
 */
export function hindiToRoman(text = '') {
  if (!text || typeof text !== 'string') return '';

  const lines = text.split(/\r?\n/);
  const outputLines = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      outputLines.push('');
      continue;
    }

    // 1. Apply phrase overrides
    let processedLine = applyPhraseOverrides(rawLine, 'Devanagari', 'Roman');

    // 2. Tokenize words and non-word separators
    const tokens = tokenizeLine(processedLine);
    const lineOutput = tokens.map((token) => {
      if (/[\u0900-\u097F]/.test(token)) {
        return transliterateDevanagariWordToRoman(token);
      }
      return token;
    }).join('');

    outputLines.push(lineOutput);
  }

  return outputLines.join('\n');
}
