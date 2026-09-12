/**
 * Isolated Duplicate Song Detection Utility for Chordician.
 *
 * Compares title and subtitle/secondaryTitle across 4 permutations:
 * 1. New Title -> Existing Title
 * 2. New Title -> Existing Subtitle
 * 3. New Subtitle -> Existing Title
 * 4. New Subtitle -> Existing Subtitle
 *
 * Triggers duplicate warning when highest similarity >= threshold (default: 0.95).
 */

/**
 * Normalizes text for conservative and safe duplicate comparison.
 * - Converts to lowercase
 * - Strips Unicode diacritics / accents
 * - Strips punctuation and symbols (parentheses, hyphens, brackets, quotes, etc.)
 * - Collapses consecutive whitespace to a single space
 * - Trims leading and trailing spaces
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes the Levenshtein distance between two strings.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function computeLevenshteinDistance(a, b) {
  const s1 = String(a || '');
  const s2 = String(b || '');

  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Calculates similarity ratio between two strings (0.0 to 1.0).
 *
 * @param {string} str1
 * @param {string} str2
 * @returns {number} 0.0 to 1.0
 */
export function computeStringSimilarity(str1, str2) {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  if (!norm1 || !norm2) return 0;

  // 1. Exact normalized match
  if (norm1 === norm2) return 1.0;

  // 2. Compact match (ignoring all spaces e.g. "EnnaiNadathumDeva" === "Ennai Nadathum Deva")
  const comp1 = norm1.replace(/\s+/g, '');
  const comp2 = norm2.replace(/\s+/g, '');
  if (comp1 === comp2) return 1.0;

  // 3. Normalized Levenshtein distance ratio
  const dist = computeLevenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);

  return maxLen > 0 ? Math.max(0, 1 - dist / maxLen) : 0;
}

/**
 * Evaluates whether a new song candidate is a potential duplicate against an existing song list.
 *
 * Checks all 4 permutations:
 * 1. New Title <-> Existing Title
 * 2. New Title <-> Existing Subtitle
 * 3. New Subtitle <-> Existing Title
 * 4. New Subtitle <-> Existing Subtitle
 *
 * @param {Object} candidateSong Song object being added ({ title, secondaryTitle, ... })
 * @param {Array<Object>} allSongs Existing songs array in songbook
 * @param {number} threshold Similarity threshold (default: 0.95)
 * @param {string|null} excludeSongId Optional song ID to exclude (useful for future edit flows)
 * @returns {{
 *   isDuplicate: boolean,
 *   similarity: number,
 *   matchPercentage: number,
 *   matchedSong: Object|null,
 *   matchedField: string|null,
 *   matchLabel: string|null
 * }}
 */
export function findPotentialDuplicateSong(
  candidateSong,
  allSongs = [],
  threshold = 0.95,
  excludeSongId = null
) {
  if (!candidateSong || !Array.isArray(allSongs) || allSongs.length === 0) {
    return {
      isDuplicate: false,
      similarity: 0,
      matchPercentage: 0,
      matchedSong: null,
      matchedField: null,
      matchLabel: null
    };
  }

  const newTitle = String(candidateSong.title || '').trim();
  const newSubtitle = String(candidateSong.secondaryTitle || candidateSong.subtitle || '').trim();

  if (!newTitle && !newSubtitle) {
    return {
      isDuplicate: false,
      similarity: 0,
      matchPercentage: 0,
      matchedSong: null,
      matchedField: null,
      matchLabel: null
    };
  }

  let bestMatch = null;
  let highestSimilarity = 0;
  let bestField = null;
  let bestLabel = null;

  for (const existingSong of allSongs) {
    if (!existingSong) continue;
    if (excludeSongId && existingSong.id === excludeSongId) continue;

    const existingTitle = String(existingSong.title || '').trim();
    const existingSubtitle = String(existingSong.secondaryTitle || existingSong.subtitle || '').trim();

    const comparisons = [];

    // Combination 1: New Title -> Existing Title
    if (newTitle && existingTitle) {
      comparisons.push({
        similarity: computeStringSimilarity(newTitle, existingTitle),
        field: 'title_to_title',
        label: 'Title Matched Existing Title'
      });
    }

    // Combination 2: New Title -> Existing Subtitle
    if (newTitle && existingSubtitle) {
      comparisons.push({
        similarity: computeStringSimilarity(newTitle, existingSubtitle),
        field: 'title_to_subtitle',
        label: 'Title Matched Existing Subtitle'
      });
    }

    // Combination 3: New Subtitle -> Existing Title
    if (newSubtitle && existingTitle) {
      comparisons.push({
        similarity: computeStringSimilarity(newSubtitle, existingTitle),
        field: 'subtitle_to_title',
        label: 'Subtitle Matched Existing Title'
      });
    }

    // Combination 4: New Subtitle -> Existing Subtitle
    if (newSubtitle && existingSubtitle) {
      comparisons.push({
        similarity: computeStringSimilarity(newSubtitle, existingSubtitle),
        field: 'subtitle_to_subtitle',
        label: 'Subtitle Matched Existing Subtitle'
      });
    }

    for (const comp of comparisons) {
      if (comp.similarity > highestSimilarity) {
        highestSimilarity = comp.similarity;
        bestMatch = existingSong;
        bestField = comp.field;
        bestLabel = comp.label;
      }
    }
  }

  const isDuplicate = highestSimilarity >= threshold;

  return {
    isDuplicate,
    similarity: highestSimilarity,
    matchPercentage: Math.round(highestSimilarity * 100),
    matchedSong: isDuplicate ? bestMatch : null,
    matchedField: isDuplicate ? bestField : null,
    matchLabel: isDuplicate ? bestLabel : null
  };
}
