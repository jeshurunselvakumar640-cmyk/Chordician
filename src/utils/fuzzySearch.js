/**
 * Fuzzy Search & Spell Correction Engine for Chordician.
 * Provides typo tolerance, phonetic/transliteration matching, and "Did you mean?" suggestions.
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
 * Calculates similarity ratio between 0.0 and 1.0.
 * @param {string} query
 * @param {string} target
 * @returns {number}
 */
export function calculateSimilarity(query, target) {
  const q = String(query || '').toLowerCase().trim();
  const t = String(target || '').toLowerCase().trim();

  if (!q || !t) return 0;
  if (q === t) return 1.0;

  // Exact substring match bonus
  if (t.includes(q)) {
    return Math.max(0.85, q.length / t.length);
  }

  // Token / word level matching (e.g. query "uthavi kanmalai" matches "Uthavi Varum Kanmalai")
  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/\s+/).filter(Boolean);

  let wordMatchCount = 0;
  for (const qw of qWords) {
    for (const tw of tWords) {
      if (tw === qw || tw.startsWith(qw) || (qw.length >= 3 && tw.includes(qw))) {
        wordMatchCount++;
        break;
      } else {
        const dist = levenshteinDistance(qw, tw);
        if (dist <= 2 && dist < Math.max(qw.length, tw.length) / 2) {
          wordMatchCount += 0.8;
          break;
        }
      }
    }
  }

  if (qWords.length > 0 && wordMatchCount > 0) {
    const wordScore = wordMatchCount / qWords.length;
    if (wordScore >= 0.7) {
      return Math.min(0.95, 0.7 + (wordScore * 0.25));
    }
  }

  // Character-level normalized distance
  const maxLen = Math.max(q.length, t.length);
  const dist = levenshteinDistance(q, t);
  const rawScore = 1 - (dist / maxLen);

  // Substring prefix/acronym boost
  if (t.startsWith(q.slice(0, Math.min(4, q.length)))) {
    return Math.min(1.0, rawScore + 0.15);
  }

  return Math.max(0, rawScore);
}

/**
 * Searches a list of songs with exact matching and intelligent fuzzy spell fallback.
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
  const q = String(query || '').toLowerCase().trim();

  if (!q) {
    return {
      results: songs,
      didYouMean: null,
      isFuzzyMatch: false,
      matchedTarget: null
    };
  }

  // 1. Direct / Exact Substring Search
  const exactMatches = songs.filter((song) => {
    const title = (song.title || '').toLowerCase();
    const artist = (song.artist || '').toLowerCase();
    const category = (song.category || '').toLowerCase();

    if (title.includes(q) || artist.includes(q) || category.includes(q)) {
      return true;
    }

    // Search lyrics content
    return (song.sections || []).some((sec) =>
      (sec.rows || []).some((row) =>
        row.type === 'lyrics' && (row.content || '').toLowerCase().includes(q)
      )
    );
  });

  if (exactMatches.length > 0) {
    return {
      results: exactMatches,
      didYouMean: null,
      isFuzzyMatch: false,
      matchedTarget: null
    };
  }

  // 2. Fuzzy Spell Correction & Similarity Matching
  const scored = [];

  for (const song of songs) {
    const title = song.title || '';
    const artist = song.artist || '';

    const titleScore = calculateSimilarity(q, title);
    const artistScore = calculateSimilarity(q, artist);

    // Also check lyric lines for close phonetic / word matches
    let bestLyricScore = 0;
    for (const sec of song.sections || []) {
      for (const row of sec.rows || []) {
        if (row.type === 'lyrics' && row.content) {
          const lScore = calculateSimilarity(q, row.content);
          if (lScore > bestLyricScore) bestLyricScore = lScore;
        }
      }
    }

    const maxScore = Math.max(titleScore, artistScore * 0.9, bestLyricScore * 0.85);

    if (maxScore >= 0.42) {
      scored.push({
        song,
        score: maxScore,
        matchedTitle: title,
        titleScore
      });
    }
  }

  // Sort by highest similarity score
  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const bestCandidate = scored[0];
    const topSongs = scored.map((s) => s.song);

    return {
      results: topSongs,
      didYouMean: bestCandidate.song.title,
      isFuzzyMatch: true,
      matchedTarget: bestCandidate.matchedTitle
    };
  }

  // No exact or fuzzy matches found
  return {
    results: [],
    didYouMean: null,
    isFuzzyMatch: false,
    matchedTarget: null
  };
}
