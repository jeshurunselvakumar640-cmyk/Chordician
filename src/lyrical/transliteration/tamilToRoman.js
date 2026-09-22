/**
 * Deterministic phonetic Tamil to Roman transliteration engine.
 * Converts Tamil script into natural, singable Christian worship English pronunciation.
 */

import {
  TAMIL_VOWELS,
  TAMIL_VOWEL_SIGNS,
  TAMIL_PULLI,
  TAMIL_CONSONANTS
} from './transliterationRules.js';
import { lookupWordOverride, applyPhraseOverrides, tokenizeLine, matchCasing } from './textFormatter.js';

/**
 * Transliterates a single Tamil word to phonetic Roman script.
 */
export function transliterateTamilWord(word) {
  if (!word || typeof word !== 'string') return word;

  // 1. Check dictionary overrides first
  const override = lookupWordOverride(word, 'Tamil', 'Roman');
  if (override) return override;

  const chars = Array.from(word);
  const n = chars.length;
  let result = '';
  let i = 0;

  while (i < n) {
    const ch = chars[i];

    // Check independent vowel
    if (TAMIL_VOWELS[ch]) {
      // Special initial vowel cases for Christian songs:
      // இயே -> Ye (e.g. இயேசு -> Yeshu)
      if (ch === 'இ' && i + 1 < n && chars[i + 1] === 'ய' && i + 2 < n && (chars[i + 2] === '\u0BC7' || chars[i + 2] === '\u0BC6')) {
        result += (i === 0 ? 'Ye' : 'ye');
        i += 3;
        continue;
      }
      result += (i === 0 ? capitalize(TAMIL_VOWELS[ch]) : TAMIL_VOWELS[ch]);
      i++;
      continue;
    }

    // Check consonant
    if (TAMIL_CONSONANTS[ch]) {
      const next1 = i + 1 < n ? chars[i + 1] : null;
      const next2 = i + 2 < n ? chars[i + 2] : null;
      const prev = i > 0 ? chars[i - 1] : null;

      let consPhoneme = TAMIL_CONSONANTS[ch];

      // Contextual Consonant Rules
      if (ch === 'க') { // k vs g
        if (i > 0 && prev !== TAMIL_PULLI && next1 !== TAMIL_PULLI) {
          consPhoneme = 'g'; // Intervocalic க -> g (e.g. சிறகுகளின் -> siragugalin)
        }
      } else if (ch === 'ச') { // ch vs s
        if (i === 0) {
          consPhoneme = 's'; // Initial ச -> s or ch
        } else if (prev === TAMIL_PULLI && i >= 2 && chars[i - 2] === 'ச') {
          consPhoneme = 'ch'; // ச்ச -> chch / ch
        }
      } else if (ch === 'த') { // th vs dh vs d
        if (i === 0) {
          consPhoneme = 'th';
        } else if (prev === TAMIL_PULLI && i >= 2 && chars[i - 2] === 'ந்') {
          consPhoneme = 'dh'; // ந்த -> ndh / ndha
        } else if (i > 0 && prev !== TAMIL_PULLI && next1 !== TAMIL_PULLI) {
          consPhoneme = 'dh'; // Intervocalic த -> dh (e.g. ஆராதனை -> Aaraadhanai)
        }
      } else if (ch === 'ப') { // p vs b / v
        if (i > 0 && prev !== TAMIL_PULLI && next1 !== TAMIL_PULLI) {
          consPhoneme = 'b'; // Intervocalic ப -> b (e.g. கிருபை -> Kirubai)
        }
      } else if (ch === 'ற') { // r vs tr
        if (prev === TAMIL_PULLI && i >= 2 && chars[i - 2] === 'ன்') {
          consPhoneme = 'dr'; // ன்ற -> ndr / ndri (e.g. நன்றி -> Nandri)
        } else if (prev === TAMIL_PULLI && i >= 2 && chars[i - 2] === 'ற்') {
          consPhoneme = 'ttr'; // ற்ற -> ttr
        }
      } else if (ch === 'ட') { // t vs d
        if (prev === TAMIL_PULLI && i >= 2 && chars[i - 2] === 'ண்') {
          consPhoneme = 'd'; // ண்ட -> nda (e.g. ஆண்டவர் -> Aandavar)
        } else if (i > 0 && prev !== TAMIL_PULLI && next1 !== TAMIL_PULLI) {
          consPhoneme = 'd'; // Intervocalic ட -> d
        }
      }

      // Check if followed by pulli (virama / pure consonant)
      if (next1 === TAMIL_PULLI) {
        if (i === 0) consPhoneme = capitalize(consPhoneme);
        result += consPhoneme;
        i += 2;
        continue;
      }

      // Check if followed by vowel sign (kombu, kaal, etc.)
      if (next1 && TAMIL_VOWEL_SIGNS[next1]) {
        const vowelSound = TAMIL_VOWEL_SIGNS[next1];
        let combined = consPhoneme + vowelSound;
        if (i === 0) combined = capitalize(combined);
        result += combined;
        i += 2;
        continue;
      }

      // Inherent 'a' vowel
      let combined = consPhoneme + 'a';
      if (i === 0) combined = capitalize(combined);
      result += combined;
      i++;
      continue;
    }

    // Non-Tamil characters (numbers, English, punctuation)
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
 * Transliterates full Tamil lyric text into Roman pronunciation.
 */
export function tamilToRoman(text = '') {
  if (!text || typeof text !== 'string') return '';

  const lines = text.split(/\r?\n/);
  const outputLines = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      outputLines.push('');
      continue;
    }

    // 1. Apply phrase-level overrides first
    let processedLine = applyPhraseOverrides(rawLine, 'Tamil', 'Roman');

    // 2. Tokenize words and non-word separators
    const tokens = tokenizeLine(processedLine);
    const lineOutput = tokens.map((token) => {
      // If token is a word in Tamil script, transliterate
      if (/[\u0B80-\u0BFF]/.test(token)) {
        return transliterateTamilWord(token);
      }
      return token;
    }).join('');

    outputLines.push(lineOutput);
  }

  return outputLines.join('\n');
}
