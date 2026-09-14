/**
 * Deterministic 24-Key Major and Minor Chord-Theory Key Detection Engine.
 *
 * Evaluates chords against all 24 key families (12 Major + 12 Minor) using
 * weighted compatibility scoring, harmonic relationships, and tonal-center analysis.
 */

import {
  MAJOR_KEY_FAMILIES,
  MINOR_KEY_FAMILIES,
  ALL_KEY_FAMILIES,
  ENHARMONIC_EQUIVALENTS
} from '../data/keyChordFamilies.js';

/**
 * Checks if a key string represents a minor key.
 * e.g. 'Am', 'G#m', 'C#m', 'Fm' -> true; 'C', 'G#', 'F#' -> false.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function isMinorKey(key) {
  if (!key || typeof key !== 'string') return false;
  const clean = key.trim();
  // Strip slash if any
  const root = clean.split('/')[0].trim();
  return /^[A-G][#b]?m(?:in(?:or)?)?$/i.test(root) && !/maj/i.test(root);
}

/**
 * Strips slash bass and normalizes chord string for analysis.
 * Preserves chord quality (minor, maj7, dim, 7, sus, etc.).
 *
 * @param {string} rawChord
 * @returns {{ root: string, quality: string, baseChord: string, isMinor: boolean, isDim: boolean, isDiminished: boolean, isDom7: boolean, isDominant7: boolean, isMajor7: boolean, isSus: boolean, isSuspended: boolean }}
 */
export function normalizeChordForTheory(rawChord) {
  if (!rawChord || typeof rawChord !== 'string') {
    return {
      root: '',
      quality: '',
      baseChord: '',
      isMinor: false,
      isDim: false,
      isDiminished: false,
      isDom7: false,
      isDominant7: false,
      isMajor7: false,
      isSus: false,
      isSuspended: false
    };
  }

  // 1. Strip slash bass (e.g. 'Am/G' -> 'Am', 'G/B' -> 'G')
  let chord = rawChord.trim().split('/')[0].trim();

  // Strip wrapping parentheses or brackets
  chord = chord.replace(/^[([{]+|[)\]}]+$/g, '');

  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    return {
      root: '',
      quality: '',
      baseChord: '',
      isMinor: false,
      isDim: false,
      isDiminished: false,
      isDom7: false,
      isDominant7: false,
      isMajor7: false,
      isSus: false,
      isSuspended: false
    };
  }

  const root = match[1];
  const rawQuality = match[2] || '';
  const qLower = rawQuality.toLowerCase();

  let isMinor = false;
  let isDim = false;
  let isDom7 = false;
  let isMajor7 = false;
  let isSus = false;
  let baseChord = root;

  if (qLower.includes('dim') || qLower.includes('°') || qLower.includes('o')) {
    isDim = true;
    baseChord = `${root}dim`;
  } else if (
    (qLower.startsWith('m') && !qLower.startsWith('maj')) ||
    qLower.startsWith('min') ||
    qLower.startsWith('-')
  ) {
    isMinor = true;
    baseChord = `${root}m`;
  } else if (qLower.startsWith('maj7') || qLower.startsWith('m7+') || qLower.startsWith('Δ')) {
    isMajor7 = true;
    baseChord = root;
  } else if (qLower === '7' || qLower.startsWith('7') || qLower.startsWith('9') || qLower.startsWith('11') || qLower.startsWith('13')) {
    isDom7 = true;
    baseChord = root;
  } else if (qLower.includes('sus') || qLower.includes('add')) {
    isSus = true;
    baseChord = root;
  }

  return {
    root,
    quality: rawQuality,
    baseChord,
    isMinor,
    isDim,
    isDiminished: isDim,
    isDom7,
    isDominant7: isDom7,
    isMajor7,
    isSus,
    isSuspended: isSus
  };
}

/**
 * Checks if two chord strings are equivalent, accounting for enharmonics comparison-only.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function areChordsEquivalent(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;

  const normA = normalizeChordForTheory(a);
  const normB = normalizeChordForTheory(b);

  if (normA.isMinor !== normB.isMinor) return false;
  if (normA.isDim !== normB.isDim) return false;

  if (normA.root === normB.root) return true;

  const altA = ENHARMONIC_EQUIVALENTS[normA.root];
  if (altA && altA === normB.root) return true;

  const altB = ENHARMONIC_EQUIVALENTS[normB.root];
  if (altB && altB === normA.root) return true;

  return false;
}

/**
 * Extracts all raw chord tokens from a song object or array of section lines.
 *
 * @param {Object|Array} songOrSections
 * @returns {string[]}
 */
export function extractChordsFromSong(songOrSections) {
  if (!songOrSections) return [];

  const chords = [];

  const sections = Array.isArray(songOrSections)
    ? songOrSections
    : Array.isArray(songOrSections.sections)
    ? songOrSections.sections
    : [];

  sections.forEach((section) => {
    if (!section) return;

    // Format A: section.rows (Chordician Row Schema: type === 'chords')
    if (Array.isArray(section.rows)) {
      section.rows.forEach((row) => {
        if (row && row.type === 'chords' && typeof row.content === 'string') {
          const tokens = row.content.trim().split(/\s+/).filter(Boolean);
          chords.push(...tokens);
        }
      });
    }

    // Format B: section.lines (Parsed Line Schema: line.chords array or line.rawChordLine)
    if (Array.isArray(section.lines)) {
      section.lines.forEach((line) => {
        if (!line) return;
        if (Array.isArray(line.chords)) {
          line.chords.forEach((c) => {
            const chordStr = typeof c === 'string' ? c : c?.chord;
            if (chordStr) chords.push(chordStr);
          });
        } else if (line.rawChordLine && typeof line.rawChordLine === 'string') {
          const tokens = line.rawChordLine.trim().split(/\s+/).filter(Boolean);
          chords.push(...tokens);
        }
      });
    }
  });

  return chords;
}

/**
 * Detects the musical key and mode from an array of chords using 24-candidate weighted theory scoring.
 *
 * @param {string[]} chords Array of chord strings from song
 * @param {Object} [options] Optional configuration
 * @returns {{
 *   detectedKey: string,
 *   mode: 'major' | 'minor',
 *   isMinor: boolean,
 *   confidence: number,
 *   runnerUp: Object | null,
 *   scoreBreakdown: Object
 * }}
 */
export function detectKeyFromChords(chords, options = {}) {
  const safeChords = Array.isArray(chords)
    ? chords.filter((c) => c && typeof c === 'string' && c.trim().length > 0)
    : [];

  if (safeChords.length === 0) {
    return {
      detectedKey: 'C',
      mode: 'major',
      isMinor: false,
      confidence: 0,
      runnerUp: null,
      scoreBreakdown: {}
    };
  }

  const normalizedList = safeChords.map(normalizeChordForTheory).filter((n) => n.root);
  if (normalizedList.length === 0) {
    return {
      detectedKey: 'C',
      mode: 'major',
      isMinor: false,
      confidence: 0,
      runnerUp: null,
      scoreBreakdown: {}
    };
  }

  const firstChord = normalizedList[0];
  const lastChord = normalizedList[normalizedList.length - 1];

  // Count frequency of each base chord
  const chordFreqMap = new Map();
  let minorChordCount = 0;
  let majorChordCount = 0;

  normalizedList.forEach((item) => {
    chordFreqMap.set(item.baseChord, (chordFreqMap.get(item.baseChord) || 0) + 1);
    if (item.isMinor) minorChordCount++;
    else if (!item.isDim) majorChordCount++;
  });

  // Evaluate all 24 candidates
  const scoredCandidates = ALL_KEY_FAMILIES.map((family) => {
    let score = 0;
    const isMajor = family.mode === 'major';
    const breakdown = {
      tonicScore: 0,
      coreScore: 0,
      relativeScore: 0,
      dimScore: 0,
      dominant7Score: 0,
      penalties: 0
    };

    // 1. Tonic Match Weight
    normalizedList.forEach((chord) => {
      if (areChordsEquivalent(chord.baseChord, family.tonic)) {
        score += 5.0;
        breakdown.tonicScore += 5.0;
      }
    });

    // First Chord Bonus (Strong indicator of tonal center)
    if (areChordsEquivalent(firstChord.baseChord, family.tonic)) {
      score += 6.0;
      breakdown.tonicScore += 6.0;
    }

    // Last Chord Bonus (Resolution)
    if (areChordsEquivalent(lastChord.baseChord, family.tonic)) {
      score += 4.0;
      breakdown.tonicScore += 4.0;
    }

    // 2. Core Chords Weight
    const coreList = family.core || [];
    coreList.forEach((coreChord) => {
      normalizedList.forEach((chord) => {
        if (areChordsEquivalent(chord.baseChord, coreChord)) {
          const weight = isMajor ? 4.0 : 4.5;
          score += weight;
          breakdown.coreScore += weight;
        }
      });
    });

    // 3. Relative / Diatonic Chords Weight
    const relativeList = isMajor ? (family.relative || []) : (family.relativeMajor || []);
    relativeList.forEach((relChord) => {
      normalizedList.forEach((chord) => {
        if (areChordsEquivalent(chord.baseChord, relChord)) {
          score += 2.2;
          breakdown.relativeScore += 2.2;
        }
      });
    });

    // 4. Diminished Chord Weight
    if (family.dim) {
      normalizedList.forEach((chord) => {
        if (areChordsEquivalent(chord.baseChord, family.dim)) {
          score += 2.0;
          breakdown.dimScore += 2.0;
        }
      });
    }

    // 5. Dominant 7 / Harmonic Minor V7 (e.g. E7/E in Am, G7 in C)
    const dom7 = isMajor ? family.dominant7 : family.harmonicV7;
    if (dom7) {
      normalizedList.forEach((chord) => {
        if (chord.isDom7 && areChordsEquivalent(chord.root, normalizeChordForTheory(dom7).root)) {
          const weight = isMajor ? 3.5 : 4.5;
          score += weight;
          breakdown.dominant7Score += weight;
        }
      });
    }

    // 6. Out-of-key Penalty
    const allDiatonic = [...coreList, ...relativeList, family.dim, family.tonic, dom7].filter(Boolean);
    normalizedList.forEach((chord) => {
      const isInKey = allDiatonic.some((d) => areChordsEquivalent(chord.baseChord, d) || (chord.isDom7 && areChordsEquivalent(chord.root, normalizeChordForTheory(d).root)));
      if (!isInKey) {
        score -= 2.5;
        breakdown.penalties -= 2.5;
      }
    });

    // 7. Minor vs Major Tonal Center Modifier
    if (!isMajor && minorChordCount > majorChordCount) {
      score += 3.0;
    } else if (isMajor && majorChordCount > minorChordCount) {
      score += 2.0;
    }

    return {
      key: family.key,
      mode: family.mode,
      isMinor: !isMajor,
      score,
      breakdown
    };
  });

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  const best = scoredCandidates[0];
  const runnerUp = scoredCandidates[1] || null;

  // Confidence Calculation
  let confidence = 0.5;
  if (runnerUp && runnerUp.score > 0) {
    const diff = best.score - runnerUp.score;
    confidence = Math.min(0.99, Math.max(0.4, 0.5 + diff / (best.score + 10)));
  } else if (best.score > 0) {
    confidence = 0.95;
  }

  return {
    detectedKey: best.key,
    mode: best.mode,
    isMinor: best.isMinor,
    confidence: Number(confidence.toFixed(2)),
    runnerUp: runnerUp ? { key: runnerUp.key, mode: runnerUp.mode, score: runnerUp.score } : null,
    scoreBreakdown: best.breakdown
  };
}

/**
 * Detects key & mode from a song object while respecting manual key declarations.
 *
 * @param {Object} song
 * @returns {{
 *   originalKey: string,
 *   detectedKey: string,
 *   mode: 'major' | 'minor',
 *   isMinor: boolean,
 *   confidence: number,
 *   hasExplicitKey: boolean
 * }}
 */
export function detectKeyFromSong(song) {
  if (!song) {
    return {
      originalKey: 'C',
      detectedKey: 'C',
      mode: 'major',
      isMinor: false,
      confidence: 0,
      hasExplicitKey: false
    };
  }

  const chords = extractChordsFromSong(song);
  const detected = detectKeyFromChords(chords);

  const rawKey = (song.originalKey || '').trim();
  const hasExplicitKey = Boolean(rawKey);

  // If song has an explicit key, determine its mode directly
  const isExplicitMinor = isMinorKey(rawKey);
  const effectiveKey = hasExplicitKey ? rawKey : detected.detectedKey;
  const effectiveMode = hasExplicitKey
    ? isExplicitMinor
      ? 'minor'
      : 'major'
    : detected.mode;

  return {
    originalKey: effectiveKey,
    detectedKey: detected.detectedKey,
    mode: effectiveMode,
    isMinor: effectiveMode === 'minor',
    confidence: detected.confidence,
    hasExplicitKey
  };
}
