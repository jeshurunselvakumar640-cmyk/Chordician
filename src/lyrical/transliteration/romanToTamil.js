/**
 * Converts Roman/English pronunciation to Tamil script.
 * Respects established Christian song preferences (Yeshu -> இயேசு/இயேஷு, Amen -> ஆமேன், hai -> ஹே).
 */

import { lookupWordOverride, applyPhraseOverrides, tokenizeLine } from './textFormatter.js';

const TAMIL_CONSONANT_MAP = [
  { roman: 'chch', tamil: 'ச்ச', pulli: 'ச்ச்' },
  { roman: 'ttr', tamil: 'ற்ற', pulli: 'ற்' },
  { roman: 'ndr', tamil: 'ன்ற', pulli: 'ன்' },
  { roman: 'thth', tamil: 'த்த', pulli: 'த்' },
  { roman: 'ksh', tamil: 'க்ஷ', pulli: 'க்ஷ்' },
  { roman: 'sh', tamil: 'ஷ', pulli: 'ஷ்' },
  { roman: 'zh', tamil: 'ழ', pulli: 'ழ்' },
  { roman: 'ng', tamil: 'ங', pulli: 'ங்' },
  { roman: 'nj', tamil: 'ஞ', pulli: 'ஞ்' },
  { roman: 'th', tamil: 'த', pulli: 'த்' },
  { roman: 'dh', tamil: 'த', pulli: 'த்' },
  { roman: 'ch', tamil: 'ச', pulli: 'ச்' },
  { roman: 'kh', tamil: 'க', pulli: 'க்' },
  { roman: 'gh', tamil: 'க', pulli: 'க்' },
  { roman: 'ph', tamil: 'ப', pulli: 'ப்' },
  { roman: 'bh', tamil: 'ப', pulli: 'ப்' },
  { roman: 'k', tamil: 'க', pulli: 'க்' },
  { roman: 'g', tamil: 'க', pulli: 'க்' },
  { roman: 'j', tamil: 'ஜ', pulli: 'ஜ்' },
  { roman: 't', tamil: 'ட', pulli: 'ட்' },
  { roman: 'd', tamil: 'ட', pulli: 'ட்' },
  { roman: 'n', tamil: 'ந', pulli: 'ன்' },
  { roman: 'p', tamil: 'ப', pulli: 'ப்' },
  { roman: 'b', tamil: 'ப', pulli: 'ப்' },
  { roman: 'm', tamil: 'ம', pulli: 'ம்' },
  { roman: 'y', tamil: 'ய', pulli: 'ய்' },
  { roman: 'r', tamil: 'ர', pulli: 'ர்' },
  { roman: 'l', tamil: 'ல', pulli: 'ல்' },
  { roman: 'v', tamil: 'வ', pulli: 'வ்' },
  { roman: 'w', tamil: 'வ', pulli: 'வ்' },
  { roman: 's', tamil: 'ச', pulli: 'ஸ்' }, // Rule: use ச where appropriate, avoid unnecessary ஸ except pulli/final
  { roman: 'h', tamil: 'ஹ', pulli: 'ஹ்' },
  { roman: 'z', tamil: 'ஜ', pulli: 'ஜ்' } // Rule: z -> j (ஜ)
];

const TAMIL_VOWEL_MAP = [
  { roman: 'aai', initial: 'ஆய்', sign: 'ாய்' },
  { roman: 'aae', initial: 'ஆயே', sign: 'ாயே' },
  { roman: 'aa', initial: 'ஆ', sign: 'ா' },
  { roman: 'ee', initial: 'ஈ', sign: 'ீ' },
  { roman: 'ii', initial: 'ஈ', sign: 'ீ' },
  { roman: 'oo', initial: 'ஊ', sign: 'ூ' },
  { roman: 'uu', initial: 'ஊ', sign: 'ூ' },
  { roman: 'ae', initial: 'ஏ', sign: 'ே' },
  { roman: 'ai', initial: 'ஐ', sign: 'ை' },
  { roman: 'au', initial: 'ஔ', sign: 'ௌ' },
  { roman: 'e', initial: 'எ', sign: 'ெ' },
  { roman: 'i', initial: 'இ', sign: 'ி' },
  { roman: 'o', initial: 'ஒ', sign: 'ொ' },
  { roman: 'u', initial: 'உ', sign: 'ு' },
  { roman: 'a', initial: 'அ', sign: '' }
];

/**
 * Transliterates a single Roman word into Tamil script.
 */
export function transliterateRomanWordToTamil(word) {
  if (!word || typeof word !== 'string') return word;

  // 1. Check dictionary overrides first
  const override = lookupWordOverride(word, 'Roman', 'Tamil');
  if (override) return override;

  const lower = word.toLowerCase();

  // Special rule for 'Yeshu' / 'Iyeshu'
  if (lower === 'yeshu' || lower === 'iyeshu') return 'இயேஷு';
  if (lower === 'hai') return 'ஹே';
  if (lower === 'amen') return 'ஆமேன்';

  let result = '';
  let i = 0;
  const n = lower.length;

  while (i < n) {
    // Check initial independent vowel
    if (i === 0 || isPrevBoundary(lower, i)) {
      let matchedVowel = null;
      for (const v of TAMIL_VOWEL_MAP) {
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
    for (const c of TAMIL_CONSONANT_MAP) {
      if (lower.startsWith(c.roman, i)) {
        matchedCons = c;
        break;
      }
    }

    if (matchedCons) {
      i += matchedCons.roman.length;

      // Check if followed by vowel
      let matchedVowel = null;
      for (const v of TAMIL_VOWEL_MAP) {
        if (lower.startsWith(v.roman, i)) {
          matchedVowel = v;
          break;
        }
      }

      if (matchedVowel) {
        result += matchedCons.tamil + matchedVowel.sign;
        i += matchedVowel.roman.length;
      } else {
        // Pure consonant with pulli
        result += matchedCons.pulli;
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
 * Transliterates full Roman lyric text into Tamil script.
 */
export function romanToTamil(text = '') {
  if (!text || typeof text !== 'string') return '';

  const lines = text.split(/\r?\n/);
  const outputLines = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      outputLines.push('');
      continue;
    }

    // 1. Apply phrase overrides
    let processedLine = applyPhraseOverrides(rawLine, 'Roman', 'Tamil');

    // 2. Tokenize words and non-word separators
    const tokens = tokenizeLine(processedLine);
    const lineOutput = tokens.map((token) => {
      if (/[A-Za-z]/.test(token)) {
        return transliterateRomanWordToTamil(token);
      }
      return token;
    }).join('');

    outputLines.push(lineOutput);
  }

  return outputLines.join('\n');
}
