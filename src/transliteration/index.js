/**
 * Unified Regional Script -> English Transliteration Hub for Chordician.
 * Supports Tamil, Hindi / Devanagari, and Indic scripts.
 */

import {
  hasTamilScript,
  transliterateTamilLine,
  transliterateTamilToEnglish
} from './tamilToEnglish.js';
import {
  hasHindiScript,
  transliterateHindiLine,
  transliterateHindiToEnglish
} from './hindiToEnglish.js';

/**
 * Checks if a string contains regional Indian scripts (Tamil or Hindi).
 * @param {string} text
 * @returns {boolean}
 */
export function hasRegionalScript(text) {
  if (typeof text !== 'string') return false;
  return hasTamilScript(text) || hasHindiScript(text);
}

/**
 * Transliterates a single line of lyrics (Tamil or Hindi) into natural English phonetics.
 * Preserves chords, punctuation, spacing, and casing.
 * @param {string} line
 * @returns {string}
 */
export function transliterateLyricToEnglish(line) {
  if (typeof line !== 'string' || !hasRegionalScript(line)) {
    return line;
  }

  let result = line;
  if (hasTamilScript(result)) {
    result = transliterateTamilLine(result);
  }
  if (hasHindiScript(result)) {
    result = transliterateHindiLine(result);
  }

  return result;
}

/**
 * Transliterates entire song lyrics in sections from Tamil/Hindi to English phonetics.
 * Leaves chords, lead notes, metadata, and IDs completely intact.
 * @param {object} song
 * @returns {{ song: object, modified: boolean }}
 */
export function transliterateSong(song) {
  if (!song) return { song, modified: false };

  let modified = false;
  let newTitle = song.title;
  let newSecondaryTitle = song.secondaryTitle;

  // Transliterate title if it contains regional script
  if (song.title && typeof song.title === 'string' && hasRegionalScript(song.title)) {
    const transliteratedTitle = transliterateLyricToEnglish(song.title);
    if (transliteratedTitle !== song.title) {
      if (!newSecondaryTitle) {
        newSecondaryTitle = song.title;
      }
      newTitle = transliteratedTitle;
      modified = true;
    }
  }

  const newSections = (song.sections || []).map((section) => {
    let sectionChanged = false;

    const newRows = (section.rows || []).map((row) => {
      if (row.type === 'lyrics' && typeof row.content === 'string' && hasRegionalScript(row.content)) {
        const transliterated = transliterateLyricToEnglish(row.content);
        if (transliterated !== row.content) {
          sectionChanged = true;
          modified = true;
          return {
            ...row,
            content: transliterated
          };
        }
      }
      return row;
    });

    if (sectionChanged) {
      return {
        ...section,
        rows: newRows
      };
    }
    return section;
  });

  if (!modified) {
    return { song, modified: false };
  }

  return {
    song: {
      ...song,
      title: newTitle,
      secondaryTitle: newSecondaryTitle,
      sections: newSections
    },
    modified: true
  };
}

export {
  hasTamilScript,
  transliterateTamilToEnglish,
  hasHindiScript,
  transliterateHindiToEnglish
};
