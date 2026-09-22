/**
 * Converts Roman/English pronunciation to singable Devanagari script.
 * Follows established Christian worship pronunciation rules (த -> द, Yeshu -> येशु, Nandri -> नन्ड्री).
 */

import { lookupWordOverride, applyPhraseOverrides, tokenizeLine } from './textFormatter.js';

// Multi-character and single-character consonant phonemes sorted by descending length
const CONSONANT_MAP = [
  { roman: 'chch', dev: 'च्च', halant: 'च्च्' },
  { roman: 'ttr', dev: 'त्र', halant: 'त्' },
  { roman: 'ndr', dev: 'न्ड्र', halant: 'न्ड्र्' },
  { roman: 'thth', dev: 'त्त', halant: 'त्त्' },
  { roman: 'ksh', dev: 'क्ष', halant: 'क्ष्' },
  { roman: 'chh', dev: 'छ', halant: 'छ्' },
  { roman: 'kh', dev: 'ख', halant: 'ख्' },
  { roman: 'gh', dev: 'घ', halant: 'घ्' },
  { roman: 'ch', dev: 'च', halant: 'च्' },
  { roman: 'jh', dev: 'झ', halant: 'झ्' },
  { roman: 'th', dev: 'त', halant: 'त्' }, // Tamil த sound -> त (unaspirated dental consonant, not aspirated थ)
  { roman: 'dh', dev: 'द', halant: 'द्' }, // Tamil த (voiced) -> द (Aaraadhanai -> आराधनै)
  { roman: 'ph', dev: 'फ', halant: 'फ्' },
  { roman: 'bh', dev: 'भ', halant: 'भ्' },
  { roman: 'sh', dev: 'श', halant: 'श्' },
  { roman: 'zh', dev: 'ऴ', halant: 'ऴ्' },
  { roman: 'ng', dev: 'ंग', halant: 'ङ्' },
  { roman: 'nj', dev: 'ंज', halant: 'ञ्' },
  { roman: 'k', dev: 'क', halant: 'क्' },
  { roman: 'g', dev: 'ग', halant: 'ग्' },
  { roman: 'j', dev: 'ज', halant: 'ज्' },
  { roman: 't', dev: 'त', halant: 'त्' },
  { roman: 'd', dev: 'द', halant: 'द्' },
  { roman: 'n', dev: 'न', halant: 'न्' },
  { roman: 'p', dev: 'प', halant: 'प्' },
  { roman: 'b', dev: 'ब', halant: 'ब्' },
  { roman: 'm', dev: 'म', halant: 'म्' },
  { roman: 'y', dev: 'य', halant: 'य्' },
  { roman: 'r', dev: 'र', halant: 'र्' },
  { roman: 'l', dev: 'ल', halant: 'ल्' },
  { roman: 'v', dev: 'व', halant: 'व्' },
  { roman: 'w', dev: 'व', halant: 'व्' },
  { roman: 's', dev: 'स', halant: 'स्' },
  { roman: 'h', dev: 'ह', halant: 'ह्' },
  { roman: 'z', dev: 'ज़', halant: 'ज़्' }
];

const VOWEL_MAP = [
  { roman: 'aai', initial: 'आई', matra: 'ाई' },
  { roman: 'aae', initial: 'आए', matra: 'ाए' },
  { roman: 'aa', initial: 'आ', matra: 'ा' },
  { roman: 'ee', initial: 'ई', matra: 'ी' },
  { roman: 'ii', initial: 'ई', matra: 'ी' },
  { roman: 'oo', initial: 'ऊ', matra: 'ू' },
  { roman: 'uu', initial: 'ऊ', matra: 'ू' },
  { roman: 'ae', initial: 'ए', matra: 'े' },
  { roman: 'ai', initial: 'ऐ', matra: 'ै' },
  { roman: 'au', initial: 'औ', matra: 'ौ' },
  { roman: 'e', initial: 'ए', matra: 'े' },
  { roman: 'i', initial: 'इ', matra: 'ि' },
  { roman: 'o', initial: 'ओ', matra: 'ो' },
  { roman: 'u', initial: 'उ', matra: 'ु' },
  { roman: 'a', initial: 'अ', matra: '' }
];

/**
 * Transliterates a single Roman word into Devanagari script.
 */
export function transliterateRomanWordToHindi(word) {
  if (!word || typeof word !== 'string') return word;

  // 1. Check dictionary overrides first
  const override = lookupWordOverride(word, 'Roman', 'Devanagari');
  if (override) return override;

  const lower = word.toLowerCase();
  let result = '';
  let i = 0;
  const n = lower.length;

  while (i < n) {
    // Check initial independent vowel
    if (i === 0 || isPrevBoundary(lower, i)) {
      let matchedVowel = null;
      for (const v of VOWEL_MAP) {
        if (lower.startsWith(v.roman, i)) {
          matchedVowel = v;
          break;
        }
      }
      if (matchedVowel) {
        result += matchedVowel.initial;
        i += matchedVowel.roman.length;
        continue;
      }
    }

    // Check consonant
    let matchedCons = null;
    for (const c of CONSONANT_MAP) {
      if (lower.startsWith(c.roman, i)) {
        matchedCons = c;
        break;
      }
    }

    if (matchedCons) {
      i += matchedCons.roman.length;

      // Check if followed by a vowel
      let matchedVowel = null;
      for (const v of VOWEL_MAP) {
        if (lower.startsWith(v.roman, i)) {
          matchedVowel = v;
          break;
        }
      }

      if (matchedVowel) {
        result += matchedCons.dev + matchedVowel.matra;
        i += matchedVowel.roman.length;
      } else {
        // Pure consonant with halant (or end of word)
        if (i === n) {
          result += matchedCons.dev; // Hindi typically drops terminal halant on common pronunciation
        } else {
          result += matchedCons.halant;
        }
      }
      continue;
    }

    // Non-alphabet token (number, symbol, punctuation)
    result += word[i];
    i++;
  }

  return result;
}

function isPrevBoundary(str, idx) {
  if (idx <= 0) return true;
  return /[^a-z]/i.test(str[idx - 1]);
}

/**
 * Transliterates full Roman lyric text into Devanagari script.
 */
export function romanToHindi(text = '') {
  if (!text || typeof text !== 'string') return '';

  const lines = text.split(/\r?\n/);
  const outputLines = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      outputLines.push('');
      continue;
    }

    // 1. Apply phrase-level overrides
    let processedLine = applyPhraseOverrides(rawLine, 'Roman', 'Devanagari');

    // 2. Tokenize words and non-word separators
    const tokens = tokenizeLine(processedLine);
    const lineOutput = tokens.map((token) => {
      if (/[A-Za-z]/.test(token)) {
        return transliterateRomanWordToHindi(token);
      }
      return token;
    }).join('');

    outputLines.push(lineOutput);
  }

  return outputLines.join('\n');
}
