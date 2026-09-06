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
      return Math.max(0.80, lenRatio);
    }
  }

  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Calculates similarity ratio between 0.0 and 1.0 comparing user query against target text.
 * Measures character/letter match across full string, word sequences, and individual tokens.
 *
 * @param {string} query
 * @param {string} target
 * @returns {number}
 */
export function calculateSimilarity(query, target) {
  const q = String(query || '').toLowerCase().trim();
  const t = String(target || '').toLowerCase().trim();

  if (!q || !t) return 0;
  if (q === t) return 1.0;
  if (t.includes(q)) return 1.0;

  const qClean = q.replace(/[^a-z0-9\s]/gi, '');
  const tClean = t.replace(/[^a-z0-9\s]/gi, '');
  if (tClean.includes(qClean) && qClean.length >= 3) return 1.0;

  const qWords = qClean.split(/\s+/).filter(Boolean);
  const tWords = tClean.split(/\s+/).filter(Boolean);
  if (qWords.length === 0 || tWords.length === 0) return 0;

  // 1. Direct full string letter similarity
  const fullScore = 1 - (levenshteinDistance(qClean, tClean) / Math.max(qClean.length, tClean.length));

  // 2. Token-level best match alignment (compares each query word to target words)
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

  // 3. Exact phrase window slice match (for multi-word queries like 'mere jevan' vs 'Mere Jeevan')
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

  // 4. Compact string match (e.g. 'uthavivarum' vs 'uthavivarumkanmalai')
  let compactScore = 0;
  if (qWords.length === 1 && tWords.length > 1) {
    const compactTarget = tWords.join('');
    if (compactTarget.includes(qClean)) {
      compactScore = 1.0;
    }
  }

  return Math.max(fullScore, tokenScore, phraseScore, compactScore);
}

/**
 * Searches a list of songs with exact matching and intelligent fuzzy spell fallback.
 * If > 50% letters match the title or song content, returns the song card.
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
    const secondaryTitle = (song.secondaryTitle || '').toLowerCase();
    const artist = (song.artist || '').toLowerCase();
    const category = (song.category || '').toLowerCase();

    if (
      title.includes(q) ||
      secondaryTitle.includes(q) ||
      artist.includes(q) ||
      category.includes(q)
    ) {
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

  // 2. Fuzzy Spell Correction & Similarity Matching (>= 50% letter match)
  const scored = [];

  for (const song of songs) {
    const title = song.title || '';
    const secondaryTitle = song.secondaryTitle || '';
    const artist = song.artist || '';

    const titleScore = calculateSimilarity(q, title);
    const secondaryTitleScore = secondaryTitle ? calculateSimilarity(q, secondaryTitle) : 0;
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

    const maxScore = Math.max(titleScore, secondaryTitleScore, artistScore * 0.95, bestLyricScore * 0.9);

    // If more than 50% match (>= 0.50), include the song card
    if (maxScore >= 0.50) {
      scored.push({
        song,
        score: maxScore,
        matchedTitle: secondaryTitleScore > titleScore && secondaryTitle ? `${title} (${secondaryTitle})` : title,
        titleScore: Math.max(titleScore, secondaryTitleScore)
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
