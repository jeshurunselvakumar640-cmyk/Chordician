/**
 * Converts Devanagari (Hindi / Marathi) script directly to Tamil script pronunciation representation.
 * Follows the user's complete Hindi -> English + Tamil rulebook:
 * - च -> ச்ச, च्च -> ச்ச
 * - श, ष -> ஷ
 * - ज़ -> ஜ
 * - स -> ச / final स -> ஸ்
 * - है -> ஹே, हैं -> ஹைன், में -> மே
 * - उठाया -> உட்டாயா
 * - यीशु -> இயேஷு, प्रभु -> பிரபு
 */

import { lookupWordOverride, applyPhraseOverrides, tokenizeLine } from './textFormatter.js';
import { hindiToRoman } from './hindiToRoman.js';
import { romanToTamil } from './romanToTamil.js';

const DEVANAGARI_VOWEL_MAP = {
  'अ': 'அ',
  'आ': 'ஆ',
  'इ': 'இ',
  'ई': 'ஈ',
  'उ': 'உ',
  'ऊ': 'ஊ',
  'ऋ': 'ரி',
  'ए': 'ஏ',
  'ऐ': 'ஐ',
  'ओ': 'ஓ',
  'औ': 'ஔ'
};

const DEVANAGARI_MATRA_MAP = {
  'ा': 'ா',
  'ि': 'ி',
  'ी': 'ீ',
  'ु': 'ு',
  'ू': 'ூ',
  'ृ': '்ரி',
  'े': 'ே',
  'ै': 'ை',
  'ो': 'ோ',
  'ौ': 'ௌ'
};

const DEVANAGARI_CONSONANT_MAP = {
  'क': 'க', 'ख': 'க', 'ग': 'க', 'घ': 'க', 'ङ': 'ங',
  'च': 'ச்ச', 'छ': 'ச்ச்',
  'ज': 'ஜ', 'झ': 'ஜ்', 'ञ': 'ஞ',
  'ट': 'ட', 'ठ': 'ட', 'ड': 'ட', 'ढ': 'ட', 'ण': 'ண',
  'त': 'த', 'थ': 'த', 'द': 'த', 'ध': 'த', 'न': 'ந',
  'प': 'ப', 'फ': 'ப', 'ब': 'ப', 'भ': 'ப', 'म': 'ம',
  'य': 'ய', 'र': 'ர', 'ल': 'ல', 'व': 'வ',
  'श': 'ஷ', 'ष': 'ஷ', 'स': 'ச', 'ह': 'ஹ',
  'क़': 'க', 'ख़': 'க', 'ग़': 'க', 'ज़': 'ஜ', 'ड़': 'ட', 'ढ़': 'ட', 'फ़': 'ஃப', 'य़': 'ய'
};

/**
 * Transliterates a single Devanagari word into Tamil script.
 * @param {string} word
 * @returns {string}
 */
export function transliterateDevanagariWordToTamil(word) {
  if (!word || typeof word !== 'string') return word;

  // 1. Check exact dictionary word override first
  const override = lookupWordOverride(word, 'Devanagari', 'Tamil');
  if (override) return override;

  // 2. Direct phoneme-by-phoneme conversion
  let result = '';
  let i = 0;
  const n = word.length;

  while (i < n) {
    const ch = word[i];
    const nextCh = i + 1 < n ? word[i + 1] : '';
    const isLastChar = i === n - 1;

    // A. Independent Vowel
    if (DEVANAGARI_VOWEL_MAP[ch]) {
      result += DEVANAGARI_VOWEL_MAP[ch];
      i++;
      continue;
    }

    // B. Nushta combinations like ज़, फ़, क़
    let combinedConsonant = ch;
    if (nextCh === '\u093C') { // Nukta
      combinedConsonant = ch + nextCh;
      i++;
    }

    // C. Consonant
    if (DEVANAGARI_CONSONANT_MAP[combinedConsonant]) {
      const tamilBase = DEVANAGARI_CONSONANT_MAP[combinedConsonant];
      i++;

      const matraOrVirama = i < n ? word[i] : '';

      // Check if followed by Virama (Halant / Pulli)
      if (matraOrVirama === '\u094D') { // Halant ्
        i++; // skip halant
        if (combinedConsonant === 'स') {
          result += 'ஸ்';
        } else if (combinedConsonant === 'श' || combinedConsonant === 'ष') {
          result += 'ஷ்';
        } else if (combinedConsonant === 'च') {
          result += 'ச்';
        } else if (combinedConsonant === 'ज') {
          result += 'ஜ்';
        } else if (combinedConsonant === 'त' || combinedConsonant === 'थ' || combinedConsonant === 'द') {
          result += 'த்';
        } else if (combinedConsonant === 'क') {
          result += 'க்';
        } else if (combinedConsonant === 'प' || combinedConsonant === 'ब') {
          result += 'ப்';
        } else if (combinedConsonant === 'म') {
          result += 'ம்';
        } else if (combinedConsonant === 'न') {
          result += 'ந்';
        } else if (combinedConsonant === 'र') {
          result += 'ர்';
        } else if (combinedConsonant === 'ल') {
          result += 'ல்';
        } else if (combinedConsonant === 'व') {
          result += 'வ்';
        } else if (combinedConsonant === 'य') {
          result += 'ய்';
        } else if (combinedConsonant === 'ट' || combinedConsonant === 'ड') {
          result += 'ட்';
        } else {
          result += (tamilBase.endsWith('்') ? tamilBase : tamilBase + '்');
        }
        continue;
      }

      // Check if followed by vowel Matra
      if (DEVANAGARI_MATRA_MAP[matraOrVirama]) {
        i++;
        const matra = DEVANAGARI_MATRA_MAP[matraOrVirama];
        // Combine base consonant with matra
        if (matraOrVirama === 'े') {
          result += 'ே' + tamilBase; // Tamil left-side matra positioning in standard unicode is base + ே
        } else if (matraOrVirama === 'ै') {
          result += 'ை' + tamilBase;
        } else if (matraOrVirama === 'ो') {
          result += 'ோ' + tamilBase;
        } else if (matraOrVirama === 'ौ') {
          result += 'ௌ' + tamilBase;
        } else {
          result += tamilBase + matra;
        }
        continue;
      }

      // Special word-final स rule: स at end of word -> ஸ் (e.g. बस -> பஸ், क्रूस -> க்ரூஸ், विश्वास -> விஷ்வாஸ்)
      if (combinedConsonant === 'स' && (i === n || !/[\u0900-\u097F]/.test(word[i]))) {
        result += 'ஸ்';
        continue;
      }

      // Inherent 'a' vowel
      result += tamilBase;
      continue;
    }

    // D. Anusvara (ं) or Candrabindu (ँ)
    if (ch === '\u0902' || ch === '\u0901') {
      result += 'ன்';
      i++;
      continue;
    }

    // E. Visarga (ः)
    if (ch === '\u0903') {
      result += 'ஹ்';
      i++;
      continue;
    }

    // Other characters unchanged
    result += ch;
    i++;
  }

  // If conversion yielded a valid result, return it; otherwise fallback to romanToTamil
  if (result && /[\u0B80-\u0BFF]/.test(result)) {
    return result;
  }

  const roman = hindiToRoman(word);
  return romanToTamil(roman);
}

/**
 * Converts a full Devanagari text into Tamil script.
 * @param {string} text
 * @returns {string}
 */
export function devanagariToTamil(text = '') {
  if (!text || typeof text !== 'string') return '';

  const lines = text.split(/\r?\n/);
  const outputLines = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      outputLines.push('');
      continue;
    }

    // 1. Check phrase overrides from Devanagari directly to Tamil
    let processedLine = applyPhraseOverrides(rawLine, 'Devanagari', 'Tamil');

    // 2. Tokenize words and non-word separators
    const tokens = tokenizeLine(processedLine);
    const lineOutput = tokens.map((token) => {
      if (/[\u0900-\u097F]/.test(token)) {
        return transliterateDevanagariWordToTamil(token);
      }
      return token;
    }).join('');

    outputLines.push(lineOutput);
  }

  return outputLines.join('\n');
}
