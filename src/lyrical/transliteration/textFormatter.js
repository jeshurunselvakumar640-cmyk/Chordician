/**
 * Text formatting, structural preservation, and token pipeline.
 * Ensures lines, stanzas, numbers, repeat markers (2, -2, x2),
 * and punctuation are 100% preserved.
 */

import { PHRASE_OVERRIDES } from './phraseOverrides.js';
import { TAMIL_WORD_MAP, ROMAN_WORD_MAP, HINDI_WORD_MAP } from './wordOverrides.js';

/**
 * Normalizes Unicode safely without stripping valid combining marks.
 */
export function normalizeUnicode(text = '') {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFC')
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '') // Remove hidden zero-width marks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Checks casing of a word and applies similar casing to target word.
 */
export function matchCasing(sourceWord, targetWord) {
  if (!sourceWord || !targetWord) return targetWord;
  // If source is not Latin (e.g. Tamil or Devanagari), return targetWord as-is
  if (!/[A-Za-z]/.test(sourceWord)) {
    return targetWord;
  }
  if (sourceWord === sourceWord.toUpperCase() && sourceWord.length > 1) {
    return targetWord.toUpperCase();
  }
  if (sourceWord[0] === sourceWord[0].toUpperCase()) {
    return targetWord.charAt(0).toUpperCase() + targetWord.slice(1);
  }
  return targetWord.toLowerCase();
}

/**
 * Splits a line into tokens of words and non-word separators (spaces, punctuation, repeat numbers).
 */
export function tokenizeLine(line) {
  // Matches words in any script (Latin, Tamil, Devanagari) vs non-word tokens
  const regex = /([\p{L}\p{M}]+|[^\p{L}\p{M}]+)/gu;
  const tokens = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match[0]) {
      tokens.push(match[0]);
    }
  }
  return tokens;
}

/**
 * Applies phrase-level overrides on a line.
 */
export function applyPhraseOverrides(line, sourceScript, targetScript) {
  let result = line;
  for (const item of PHRASE_OVERRIDES) {
    let sourcePhrase = '';
    let targetPhrase = '';

    if (sourceScript === 'Tamil') sourcePhrase = item.tamil;
    else if (sourceScript === 'Roman') sourcePhrase = item.roman;
    else if (sourceScript === 'Devanagari') sourcePhrase = item.hindi;

    if (targetScript === 'Tamil') targetPhrase = item.tamil;
    else if (targetScript === 'Roman') targetPhrase = item.roman;
    else if (targetScript === 'Devanagari') targetPhrase = item.hindi;

    if (sourcePhrase && targetPhrase && sourcePhrase !== targetPhrase) {
      // Case-insensitive replace with boundary support
      const escaped = sourcePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(escaped, 'gi');
      result = result.replace(reg, targetPhrase);
    }
  }
  return result;
}

/**
 * Looks up word-level dictionary overrides.
 */
export function lookupWordOverride(word, sourceScript, targetScript) {
  const cleanWord = word.trim();
  if (!cleanWord) return null;

  if (sourceScript === 'Tamil') {
    const entry = TAMIL_WORD_MAP.get(cleanWord);
    if (entry) {
      if (targetScript === 'Roman') return matchCasing(word, entry.roman);
      if (targetScript === 'Devanagari') return entry.hindi;
    }
  } else if (sourceScript === 'Roman') {
    const entry = ROMAN_WORD_MAP.get(cleanWord.toLowerCase());
    if (entry) {
      if (targetScript === 'Tamil') return entry.tamil;
      if (targetScript === 'Devanagari') return entry.hindi;
    }
  } else if (sourceScript === 'Devanagari') {
    const entry = HINDI_WORD_MAP.get(cleanWord);
    if (entry) {
      if (targetScript === 'Tamil') return entry.tamil;
      if (targetScript === 'Roman') return matchCasing(word, entry.roman);
    }
  }

  return null;
}
