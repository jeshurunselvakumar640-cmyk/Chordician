import { transliterateTamilToEnglish } from '../transliteration/tamilToEnglish.js';

/**
 * Fuzzy Search & Spell Correction Engine for Chordician (v2.1).
 *
 * Prioritization Hierarchy:
 * 1. Primary/Main Title (100% exact match down to 80% descending by ~5% bands)
 * 2. Secondary Title (100% match down to 80% descending, appearing after 80% Primary Title)
 * 3. Primary Title partial/fuzzy matches (79% down to 50%)
 * 4. Secondary Title partial/fuzzy matches (79% down to 50%)
 * 5. Artist Name matches (100% down to 50%)
 * 6. Song Content / Lyrics / Chords / Notes matches (100% down to 50%)
 */

/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshteinDistance(a, b) {
  const s1 = String(a || '').toLowerCase();
  const s2 = String(b || '').toLowerCase();

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
 * Calculates letter similarity between two single words (0.0 to 1.0).
 * @param {string} w1
 * @param {string} w2
 * @returns {number}
 */
export function wordLetterSimilarity(w1, w2) {
  const a = String(w1 || '').toLowerCase().trim();
  const b = String(w2 || '').toLowerCase().trim();

  if (!a || !b) return 0;
  if (a === b) return 1.0;

  const minLen = Math.min(a.length, b.length);
  const maxLen = Math.max(a.length, b.length);

  // If one is very short and the other is long, ratio must reflect true length
  if (minLen <= 2 && maxLen >= 4) {
    const dist = levenshteinDistance(a, b);
    return Math.max(0, 1 - dist / maxLen);
  }

  // If one contains the other as prefix or substring (e.g. 'yesh' in 'yeshu')
  if (b.includes(a) || a.includes(b)) {
    const lenRatio = minLen / maxLen;
    if (lenRatio >= 0.6) {
      return Math.max(0.85, lenRatio);
    }
  }

  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Normalizes text for robust comparisons (strips accents, punctuation, extra spaces).
 * @param {string} text
 * @returns {string}
 */
function normalizeSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates similarity ratio between 0.0 and 1.0 comparing user query against target text.
 * Measures exact equality, prefixes, word boundaries, substrings, and phonetic/Levenshtein similarity.
 *
 * @param {string} query
 * @param {string} target
 * @returns {number}
 */
// Fast similarity memoization cache (capped at 4,000 entries)
const _similarityCache = new Map();
const MAX_SIMILARITY_CACHE = 4000;

export function calculateSimilarity(query, target) {
  const qRaw = String(query || '').trim();
  const tRaw = String(target || '').trim();

  if (!qRaw || !tRaw) return 0;

  const cacheKey = `${qRaw}§${tRaw}`;
  if (_similarityCache.has(cacheKey)) {
    return _similarityCache.get(cacheKey);
  }

  const qClean = normalizeSearchText(qRaw);
  const tClean = normalizeSearchText(tRaw);

  if (!qClean || !tClean) return 0;

  // 1. Exact string match (100%)
  if (qClean === tClean) return 1.0;

  // Also check without any spaces (e.g. 'uthavivarum' === 'uthavi varum')
  const qCompact = qClean.replace(/\s+/g, '');
  const tCompact = tClean.replace(/\s+/g, '');
  if (qCompact === tCompact) return 1.0;

  // 2. Starts with / Prefix match (95% - 99%)
  if (tClean.startsWith(qClean)) {
    const ratio = qClean.length / tClean.length;
    return Math.max(0.95, 0.95 + 0.04 * ratio);
  }
  if (tCompact.startsWith(qCompact)) {
    const ratio = qCompact.length / tCompact.length;
    return Math.max(0.95, 0.95 + 0.04 * ratio);
  }

  const qWords = qClean.split(/\s+/).filter(Boolean);
  const tWords = tClean.split(/\s+/).filter(Boolean);

  // 3. First word exact prefix or word boundary match (92% - 96%)
  if (tWords.length > 0 && qWords.length > 0) {
    if (tWords[0].startsWith(qWords[0]) && qWords[0].length >= 3) {
      const wRatio = qWords[0].length / tWords[0].length;
      if (qWords.length === 1) {
        return Math.max(0.92, 0.90 + 0.06 * wRatio);
      }
    }
  }

  // 4. Substring phrase inclusion (88% - 95%)
  if (tClean.includes(qClean) && qClean.length >= 3) {
    const ratio = qClean.length / tClean.length;
    return Math.max(0.88, 0.88 + 0.08 * ratio);
  }
  if (tCompact.includes(qCompact) && qCompact.length >= 4) {
    const ratio = qCompact.length / tCompact.length;
    return Math.max(0.88, 0.88 + 0.07 * ratio);
  }

  // 5. Transliteration Check (Tamil -> English phonetic)
  let translitScore = 0;
  try {
    const tTranslit = normalizeSearchText(transliterateTamilToEnglish(tRaw));
    if (tTranslit && tTranslit !== tClean) {
      if (tTranslit === qClean) return 1.0;
      if (tTranslit.startsWith(qClean)) {
        translitScore = Math.max(translitScore, 0.95);
      } else if (tTranslit.includes(qClean)) {
        translitScore = Math.max(translitScore, 0.90);
      } else {
        const dist = levenshteinDistance(qClean, tTranslit);
        const sc = 1 - (dist / Math.max(qClean.length, tTranslit.length));
        if (sc > translitScore) translitScore = sc;
      }
    }
  } catch (e) {
    // Ignore transliteration errors
  }

  if (qWords.length === 0 || tWords.length === 0) {
    return Math.max(translitScore, 0);
  }

  // 6. Direct full string letter similarity via Levenshtein
  const fullScore = 1 - (levenshteinDistance(qClean, tClean) / Math.max(qClean.length, tClean.length));

  // 7. Token-level best match alignment
  let tokenScoreSum = 0;
  let matchedWordCount = 0;
  for (const qw of qWords) {
    let bestWordScore = 0;
    for (const tw of tWords) {
      const score = wordLetterSimilarity(qw, tw);
      if (score > bestWordScore) {
        bestWordScore = score;
      }
    }
    if (bestWordScore >= 0.5) {
      tokenScoreSum += bestWordScore;
      matchedWordCount++;
    }
  }

  const tokenScore = (matchedWordCount / qWords.length >= 0.5)
    ? tokenScoreSum / qWords.length
    : 0;

  // 8. Exact phrase window slice match (for multi-word queries)
  let phraseScore = 0;
  if (qWords.length > 1 && tWords.length >= qWords.length) {
    for (let i = 0; i <= tWords.length - qWords.length; i++) {
      const slice = tWords.slice(i, i + qWords.length).join(' ');
      const dist = levenshteinDistance(qClean, slice);
      const sc = 1 - (dist / Math.max(qClean.length, slice.length));
      if (sc >= 0.5 && sc > phraseScore) {
        phraseScore = sc;
      }
    }
  }

  const finalScore = Math.max(fullScore, tokenScore, phraseScore, translitScore, 0);

  if (_similarityCache.size >= MAX_SIMILARITY_CACHE) {
    // Evict oldest entries
    const firstKey = _similarityCache.keys().next().value;
    _similarityCache.delete(firstKey);
  }
  _similarityCache.set(cacheKey, finalScore);

  return finalScore;
}

/**
 * Computes the best similarity score for a query across all content rows in a song.
 * Checks lyrics, chords, notes, lead sheets, and bass lines.
 *
 * @param {Object} song
 * @param {string} query
 * @returns {number} 0.0 to 1.0
 */
export function computeSongContentScore(song, query) {
  if (!song || !query || !Array.isArray(song.sections)) return 0;

  let maxScore = 0;
  const qClean = normalizeSearchText(query);

  for (const sec of song.sections) {
    for (const row of sec.rows || []) {
      const content = row.content || '';
      if (!content) continue;

      const cClean = normalizeSearchText(content);
      if (!cClean) continue;

      // Substring match in lyric/content line
      if (cClean.includes(qClean) && qClean.length >= 3) {
        const ratio = qClean.length / cClean.length;
        const subScore = Math.max(0.90, 0.90 + 0.10 * ratio);
        if (subScore > maxScore) maxScore = subScore;
        continue;
      }

      // Fuzzy check
      const score = calculateSimilarity(query, content);
      if (score > maxScore) {
        maxScore = score;
      }
    }
  }

  return maxScore;
}

/**
 * Calculates hierarchical relevance score for a song based on the user-specified priority:
 *
 * 1. Primary Title >= 80% (100% -> 95% -> 90% -> 85% -> 80%) [Tier 1: 20000 - 22000]
 * 2. Secondary Title >= 80% (100% -> 95% -> 90% -> 85% -> 80%) [Tier 2: 18000 - 19800]
 * 3. Primary Title 50% - 79% [Tier 3: 14000 - 16900]
 * 4. Secondary Title 50% - 79% [Tier 4: 10000 - 12320]
 * 5. Artist Name >= 50% [Tier 5: 6000 - 9000]
 * 6. Song Content / Lyrics >= 50% [Tier 6: 2000 - 4000]
 *
 * @param {Object} song
 * @param {string} query
 * @returns {{
 *   finalScore: number,
 *   primaryScore: number,
 *   secondaryScore: number,
 *   artistScore: number,
 *   contentScore: number,
 *   matchType: string
 * }}
 */
export function calculateSongRelevance(song, query) {
  if (!song || !query) {
    return {
      finalScore: 0,
      primaryScore: 0,
      secondaryScore: 0,
      artistScore: 0,
      contentScore: 0,
      matchType: 'none'
    };
  }

  const primaryScore = calculateSimilarity(query, song.title || '') * 100;
  const secondaryScore = song.secondaryTitle ? calculateSimilarity(query, song.secondaryTitle) * 100 : 0;
  const artistScore = song.artist ? calculateSimilarity(query, song.artist) * 100 : 0;
  const contentScore = computeSongContentScore(song, query) * 100;
  const categoryScore = song.category ? calculateSimilarity(query, song.category) * 100 : 0;

  let tierBase = 0;
  let matchType = 'none';

  // Tier 1: Primary Title >= 80%
  if (primaryScore >= 80) {
    tierBase = 20000 + (primaryScore - 80) * 100;
    matchType = 'primary_title';
  }
  // Tier 2: Secondary Title >= 80% (appears strictly after 80% Primary Title)
  else if (secondaryScore >= 80) {
    tierBase = 18000 + (secondaryScore - 80) * 90;
    matchType = 'secondary_title';
  }
  // Tier 3: Primary Title 50% - 79%
  else if (primaryScore >= 50) {
    tierBase = 14000 + (primaryScore - 50) * 100;
    matchType = 'primary_title_fuzzy';
  }
  // Tier 4: Secondary Title 50% - 79%
  else if (secondaryScore >= 50) {
    tierBase = 10000 + (secondaryScore - 50) * 80;
    matchType = 'secondary_title_fuzzy';
  }
  // Tier 5: Artist Match >= 50%
  else if (artistScore >= 50) {
    tierBase = 6000 + (artistScore - 50) * 60;
    matchType = 'artist';
  }
  // Tier 6: Song Content / Lyrics >= 50%
  else if (contentScore >= 50) {
    tierBase = 2000 + (contentScore - 50) * 40;
    matchType = 'content';
  }
  // Fallback: Category match
  else if (categoryScore >= 85) {
    tierBase = 1000 + (categoryScore - 85) * 20;
    matchType = 'category';
  }

  if (tierBase === 0) {
    return {
      finalScore: 0,
      primaryScore,
      secondaryScore,
      artistScore,
      contentScore,
      matchType: 'none'
    };
  }

  // Subtle multi-field tiebreaker bonuses
  const tiebreaker = (primaryScore * 0.05) + (secondaryScore * 0.04) + (artistScore * 0.02) + (contentScore * 0.01);
  const finalScore = tierBase + tiebreaker;

  return {
    finalScore,
    primaryScore,
    secondaryScore,
    artistScore,
    contentScore,
    matchType
  };
}

/**
 * Searches a list of songs with prioritized multi-tier matching and intelligent fuzzy spell correction.
 *
 * @param {Array<Object>} songs
 * @param {string} query
 * @returns {{
 *   results: Array<Object>,
 *   didYouMean: string | null,
 *   isFuzzyMatch: boolean,
 *   matchedTarget: string | null
 * }}
 */
export function searchSongsWithFuzzy(songs = [], query = '') {
  const q = String(query || '').trim();

  if (!q) {
    return {
      results: songs,
      didYouMean: null,
      isFuzzyMatch: false,
      matchedTarget: null
    };
  }

  const scored = [];
  let bestFuzzyTitleCandidate = null;
  let bestFuzzyTitleScore = 0;

  for (const song of songs) {
    const rel = calculateSongRelevance(song, q);

    if (rel.finalScore > 0) {
      scored.push({
        song,
        relevance: rel
      });
    }

    // Keep track of the closest title for "Did you mean?" suggestions
    const titleSim = Math.max(rel.primaryScore, rel.secondaryScore);
    if (titleSim > bestFuzzyTitleScore) {
      bestFuzzyTitleScore = titleSim;
      bestFuzzyTitleCandidate = rel.secondaryScore > rel.primaryScore && song.secondaryTitle
        ? song.secondaryTitle
        : song.title;
    }
  }

  // Sort by highest relevance score descending
  scored.sort((a, b) => b.relevance.finalScore - a.relevance.finalScore);

  if (scored.length > 0) {
    const topSong = scored[0].song;
    const topRel = scored[0].relevance;

    // Check if the top result was an exact substring or exact string match
    const qClean = normalizeSearchText(q);
    const topTitleClean = normalizeSearchText(topSong.title || '');
    const topSecClean = normalizeSearchText(topSong.secondaryTitle || '');
    const isExactOrSubstring =
      topTitleClean.includes(qClean) ||
      topSecClean.includes(qClean) ||
      (topSong.artist && normalizeSearchText(topSong.artist).includes(qClean));

    const isFuzzyMatch = !isExactOrSubstring && topRel.finalScore > 0;
    const didYouMean = isFuzzyMatch && bestFuzzyTitleCandidate && bestFuzzyTitleScore >= 50
      ? bestFuzzyTitleCandidate
      : null;

    return {
      results: scored.map((s) => s.song),
      didYouMean,
      isFuzzyMatch,
      matchedTarget: topRel.matchType
    };
  }

  // No matches found
  return {
    results: [],
    didYouMean: bestFuzzyTitleCandidate && bestFuzzyTitleScore >= 50 ? bestFuzzyTitleCandidate : null,
    isFuzzyMatch: Boolean(bestFuzzyTitleCandidate && bestFuzzyTitleScore >= 50),
    matchedTarget: null
  };
}
