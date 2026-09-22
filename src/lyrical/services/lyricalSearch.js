/**
 * Lyrical Intelligent Search & Secondary Title Matching Engine
 *
 * Implements:
 * 1. Sanitization & deduplication of secondary titles
 * 2. Multi-lingual Unicode normalization (Tamil, Devanagari, Latin)
 * 3. Exact and fuzzy similarity matching (0 to 100) with >= 80% threshold
 * 4. Priority ranking (Exact match -> Highest similarity -> Artist/Language -> Default)
 */

/**
 * Calculates Levenshtein edit distance between two strings.
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

  // Single-row memory optimized Levenshtein
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) prevRow[j] = j;

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,      // deletion
        currRow[j - 1] + 1,  // insertion
        prevRow[j - 1] + cost // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

/**
 * Normalizes text for robust multi-lingual comparison (Unicode NFC, punctuation stripped).
 * Preserves all Tamil, Devanagari, and Latin alphabetic characters and numbers.
 * @param {string} text
 * @returns {string}
 */
export function normalizeSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates a normalized similarity score (0 to 100) between query and target string.
 * @param {string} query
 * @param {string} target
 * @returns {number} 0 - 100
 */
export function calculateLyricalSimilarity(query, target) {
  const qRaw = String(query || '').trim();
  const tRaw = String(target || '').trim();

  if (!qRaw || !tRaw) return 0;

  const qClean = normalizeSearchText(qRaw);
  const tClean = normalizeSearchText(tRaw);

  if (!qClean || !tClean) return 0;

  // 1. Exact match (100%)
  if (qClean === tClean) return 100;

  // 2. Compact match ignoring all internal spaces (100%)
  const qCompact = qClean.replace(/\s+/g, '');
  const tCompact = tClean.replace(/\s+/g, '');
  if (qCompact === tCompact) return 100;

  // 3. Prefix match: Target starts with query (85% - 99%)
  if (tClean.startsWith(qClean)) {
    const ratio = qClean.length / tClean.length;
    return Math.round(Math.max(85, 80 + 20 * ratio));
  }
  if (tCompact.startsWith(qCompact)) {
    const ratio = qCompact.length / tCompact.length;
    return Math.round(Math.max(85, 80 + 20 * ratio));
  }

  // 4. Query starts with target (80% - 99%)
  if (qClean.startsWith(tClean)) {
    const ratio = tClean.length / qClean.length;
    return Math.round(Math.max(80, 80 + 20 * ratio));
  }

  // 5. Substring / phrase inclusion (80% - 95%)
  if (tClean.includes(qClean) && qClean.length >= 3) {
    const ratio = qClean.length / tClean.length;
    return Math.round(Math.max(80, 80 + 15 * ratio));
  }
  if (tCompact.includes(qCompact) && qCompact.length >= 3) {
    const ratio = qCompact.length / tCompact.length;
    return Math.round(Math.max(80, 80 + 15 * ratio));
  }

  // 6. Token-level word alignment
  const qWords = qClean.split(/\s+/).filter(Boolean);
  const tWords = tClean.split(/\s+/).filter(Boolean);

  let tokenScore = 0;
  if (qWords.length > 0 && tWords.length > 0) {
    let wordScoresSum = 0;
    for (const qw of qWords) {
      let bestWScore = 0;
      for (const tw of tWords) {
        if (qw === tw) {
          bestWScore = 1.0;
          break;
        }
        if (tw.startsWith(qw) || qw.startsWith(tw)) {
          const ratio = Math.min(qw.length, tw.length) / Math.max(qw.length, tw.length);
          bestWScore = Math.max(bestWScore, Math.max(0.85, 0.80 + 0.20 * ratio));
          continue;
        }
        const maxLen = Math.max(qw.length, tw.length);
        const dist = levenshteinDistance(qw, tw);
        const sim = Math.max(0, 1 - dist / maxLen);
        if (sim > bestWScore) {
          bestWScore = sim;
        }
      }
      wordScoresSum += bestWScore;
    }
    tokenScore = Math.round((wordScoresSum / qWords.length) * 100);
  }

  // 7. Full string Levenshtein distance similarity
  const fullMax = Math.max(qClean.length, tClean.length);
  const fullDist = levenshteinDistance(qClean, tClean);
  const levScore = Math.round(Math.max(0, (1 - fullDist / fullMax) * 100));

  return Math.min(100, Math.max(tokenScore, levScore));
}

/**
 * Sanitizes and deduplicates an array of secondary titles.
 * Removes empty strings, removes duplicates, and removes entries identical to the main title.
 * Preserves user's original casing, punctuation, and script.
 * @param {Array<string>} secondaryTitles
 * @param {string} mainTitle
 * @returns {Array<string>}
 */
export function sanitizeSecondaryTitles(secondaryTitles, mainTitle = '') {
  if (!Array.isArray(secondaryTitles)) return [];
  const normalizedMain = normalizeSearchText(mainTitle);
  const seen = new Set();
  const sanitized = [];

  for (const raw of secondaryTitles) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const norm = normalizeSearchText(trimmed);
    if (!norm) continue;
    if (norm === normalizedMain) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    sanitized.push(trimmed);
  }

  return sanitized;
}

/**
 * Evaluates whether a Lyrical song matches a search query using the 80% threshold rule on
 * main title OR any secondary title, plus standard artist/language matching.
 * @param {Object} song
 * @param {string} searchQuery
 * @param {number} threshold Default 80
 * @returns {{ isMatch: boolean, bestTitleScore: number, score: number, matchedField: string }}
 */
export function matchLyricalSong(song, searchQuery, threshold = 80) {
  if (!song) return { isMatch: false, bestTitleScore: 0, score: 0, matchedField: 'none' };
  if (!searchQuery || !searchQuery.trim()) {
    return { isMatch: true, bestTitleScore: 0, score: 0, matchedField: 'all' };
  }

  const qClean = normalizeSearchText(searchQuery);
  if (!qClean) return { isMatch: true, bestTitleScore: 0, score: 0, matchedField: 'all' };

  // 1. Main Title Score
  const mainTitleScore = calculateLyricalSimilarity(searchQuery, song.title || '');

  // 2. Secondary Titles Score (maximum across all aliases)
  const secondaryTitles = Array.isArray(song.secondaryTitles) ? song.secondaryTitles : [];
  let bestSecondaryScore = 0;
  for (const st of secondaryTitles) {
    const sc = calculateLyricalSimilarity(searchQuery, st);
    if (sc > bestSecondaryScore) {
      bestSecondaryScore = sc;
    }
  }

  // 3. Best Title Score
  const bestTitleScore = Math.max(mainTitleScore, bestSecondaryScore);
  const isTitleMatch = bestTitleScore >= threshold;

  // 4. Other fields: Artist, Language, Lyrics
  const songArtist = normalizeSearchText(song.artist || song.singer || '');
  const artistScore = calculateLyricalSimilarity(searchQuery, songArtist);
  const isArtistMatch = songArtist.includes(qClean) || artistScore >= threshold;

  const isLangMatch = normalizeSearchText(song.language || '').includes(qClean);

  const isMatch = isTitleMatch || isArtistMatch || isLangMatch;

  let matchedField = 'none';
  if (isTitleMatch) {
    matchedField = bestTitleScore === mainTitleScore ? 'mainTitle' : 'secondaryTitle';
  } else if (isArtistMatch) {
    matchedField = 'artist';
  } else if (isLangMatch) {
    matchedField = 'language';
  }

  // Calculate composite rank score
  const finalScore = isTitleMatch
    ? bestTitleScore
    : (isArtistMatch ? Math.max(75, artistScore) : (isLangMatch ? 50 : 0));

  return {
    isMatch,
    bestTitleScore,
    score: finalScore,
    matchedField
  };
}

/**
 * Filters and ranks a list of Lyrical songs by search query, category, and selected artist.
 * Applies 80% threshold rule on title/secondary titles and ranks by relevance.
 * @param {Array<Object>} songs
 * @param {string} searchQuery
 * @param {string} activeCategory 'ALL' | 'TAMIL' | 'ENGLISH' | 'HINDI' | 'WORSHIP'
 * @param {string|null} selectedArtist
 * @param {number} threshold Default 80
 * @returns {Array<Object>}
 */
export function filterAndRankLyricalSongs(
  songs,
  searchQuery = '',
  activeCategory = 'ALL',
  selectedArtist = null,
  threshold = 80
) {
  if (!Array.isArray(songs)) return [];

  const hasSearch = Boolean(searchQuery && searchQuery.trim());

  // 1. Initial filter by Artist and Category
  const baseFiltered = songs.filter((song) => {
    if (!song) return false;

    // Sidebar artist filter
    if (selectedArtist) {
      const songArtist = (song.artist || song.singer || '').trim().toLowerCase();
      if (songArtist !== selectedArtist.trim().toLowerCase()) {
        return false;
      }
    }

    // Category filter
    if (activeCategory !== 'ALL') {
      const lang = (song.language || '').toLowerCase();
      if (activeCategory === 'TAMIL' && lang !== 'tamil') return false;
      if (activeCategory === 'ENGLISH' && lang !== 'english') return false;
      if (activeCategory === 'HINDI' && lang !== 'hindi') return false;
      if (activeCategory === 'WORSHIP' && song.category?.toLowerCase() !== 'worship' && song.isCommunion) return false;
    }

    return true;
  });

  if (!hasSearch) {
    return baseFiltered;
  }

  // 2. Evaluate search similarity & filter
  const scoredSongs = [];
  for (let i = 0; i < baseFiltered.length; i++) {
    const song = baseFiltered[i];
    const match = matchLyricalSong(song, searchQuery, threshold);
    if (match.isMatch) {
      scoredSongs.push({
        song,
        score: match.score,
        bestTitleScore: match.bestTitleScore,
        matchedField: match.matchedField,
        originalIndex: i
      });
    }
  }

  // 3. Sort by match quality
  scoredSongs.sort((a, b) => {
    // Exact title match comes first
    if (a.bestTitleScore === 100 && b.bestTitleScore !== 100) return -1;
    if (b.bestTitleScore === 100 && a.bestTitleScore !== 100) return 1;

    // Highest score first
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Maintain stable original ordering
    return a.originalIndex - b.originalIndex;
  });

  return scoredSongs.map((item) => item.song);
}
