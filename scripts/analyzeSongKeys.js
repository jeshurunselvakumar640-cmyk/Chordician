import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firestoreDbConfig = {
  apiKey: "AIzaSyB_4AdPTivYU0wmU-w8ra2MsM6oPJr9SYs",
  authDomain: "pianonotes-1bd94.firebaseapp.com",
  projectId: "pianonotes-1bd94",
  storageBucket: "pianonotes-1bd94.firebasestorage.app",
  messagingSenderId: "540352442337",
  appId: "1:540352442337:web:65e3bc6eccc26058656ca0",
  measurementId: "G-M9KMH89JQ8"
};

const app = getApps().length === 0 ? initializeApp(firestoreDbConfig, 'databaseMigrationApp') : getApps()[0];
const db = getFirestore(app);

// Standard Key profiles with scale degrees and weights
const KEY_PROFILES = {
  // Major Keys (I, ii, iii, IV, V, vi, vii°)
  'C':   { tonic: 'C',   type: 'major', primary: ['C', 'F', 'G', 'G7'], secondary: ['Am', 'Dm', 'Em'], dominant: 'G' },
  'C#':  { tonic: 'C#',  type: 'major', primary: ['C#', 'F#', 'G#', 'G#7'], secondary: ['A#m', 'D#m', 'Fm'], dominant: 'G#' },
  'Db':  { tonic: 'Db',  type: 'major', primary: ['Db', 'Gb', 'Ab', 'Ab7'], secondary: ['Bbm', 'Ebm', 'Fm'], dominant: 'Ab' },
  'D':   { tonic: 'D',   type: 'major', primary: ['D', 'G', 'A', 'A7'], secondary: ['Bm', 'Em', 'F#m'], dominant: 'A' },
  'D#':  { tonic: 'D#',  type: 'major', primary: ['D#', 'G#', 'A#', 'A#7'], secondary: ['Cm', 'Fm', 'Gm'], dominant: 'A#' },
  'Eb':  { tonic: 'Eb',  type: 'major', primary: ['Eb', 'Ab', 'Bb', 'Bb7'], secondary: ['Cm', 'Fm', 'Gm'], dominant: 'Bb' },
  'E':   { tonic: 'E',   type: 'major', primary: ['E', 'A', 'B', 'B7'], secondary: ['C#m', 'F#m', 'G#m'], dominant: 'B' },
  'F':   { tonic: 'F',   type: 'major', primary: ['F', 'Bb', 'C', 'C7'], secondary: ['Dm', 'Gm', 'Am'], dominant: 'C' },
  'F#':  { tonic: 'F#',  type: 'major', primary: ['F#', 'B', 'C#', 'C#7'], secondary: ['D#m', 'G#m', 'A#m'], dominant: 'C#' },
  'Gb':  { tonic: 'Gb',  type: 'major', primary: ['Gb', 'Cb', 'Db', 'Db7'], secondary: ['Ebm', 'Abm', 'Bbm'], dominant: 'Db' },
  'G':   { tonic: 'G',   type: 'major', primary: ['G', 'C', 'D', 'D7'], secondary: ['Em', 'Am', 'Bm'], dominant: 'D' },
  'G#':  { tonic: 'G#',  type: 'major', primary: ['G#', 'C#', 'D#', 'D#7'], secondary: ['Fm', 'A#m', 'Cm'], dominant: 'D#' },
  'Ab':  { tonic: 'Ab',  type: 'major', primary: ['Ab', 'Db', 'Eb', 'Eb7'], secondary: ['Fm', 'Bbm', 'Cm'], dominant: 'Eb' },
  'A':   { tonic: 'A',   type: 'major', primary: ['A', 'D', 'E', 'E7'], secondary: ['F#m', 'Bm', 'C#m'], dominant: 'E' },
  'A#':  { tonic: 'A#',  type: 'major', primary: ['A#', 'D#', 'F', 'F7'], secondary: ['Gm', 'Cm', 'Dm'], dominant: 'F' },
  'Bb':  { tonic: 'Bb',  type: 'major', primary: ['Bb', 'Eb', 'F', 'F7'], secondary: ['Gm', 'Cm', 'Dm'], dominant: 'F' },
  'B':   { tonic: 'B',   type: 'major', primary: ['B', 'E', 'F#', 'F#7'], secondary: ['G#m', 'C#m', 'D#m'], dominant: 'F#' },

  // Minor Keys (i, ii°, III, iv, v/V, VI, VII)
  'Am':  { tonic: 'Am',  type: 'minor', primary: ['Am', 'Dm', 'E', 'E7', 'Em'], secondary: ['F', 'G', 'C'], dominant: 'E' },
  'A#m': { tonic: 'A#m', type: 'minor', primary: ['A#m', 'D#m', 'F', 'F7', 'Fm'], secondary: ['F#', 'G#', 'C#'], dominant: 'F' },
  'Bbm': { tonic: 'Bbm', type: 'minor', primary: ['Bbm', 'Ebm', 'F', 'F7', 'Fm'], secondary: ['Gb', 'Ab', 'Db'], dominant: 'F' },
  'Bm':  { tonic: 'Bm',  type: 'minor', primary: ['Bm', 'Em', 'F#', 'F#7', 'F#m'], secondary: ['G', 'A', 'D'], dominant: 'F#' },
  'Cm':  { tonic: 'Cm',  type: 'minor', primary: ['Cm', 'Fm', 'G', 'G7', 'Gm'], secondary: ['Ab', 'Bb', 'Eb'], dominant: 'G' },
  'C#m': { tonic: 'C#m', type: 'minor', primary: ['C#m', 'F#m', 'G#', 'G#7', 'G#m'], secondary: ['A', 'B', 'E'], dominant: 'G#' },
  'Dm':  { tonic: 'Dm',  type: 'minor', primary: ['Dm', 'Gm', 'A', 'A7', 'Am'], secondary: ['Bb', 'C', 'F'], dominant: 'A' },
  'D#m': { tonic: 'D#m', type: 'minor', primary: ['D#m', 'G#m', 'A#', 'A#7', 'A#m'], secondary: ['B', 'C#', 'F#'], dominant: 'A#' },
  'Ebm': { tonic: 'Ebm', type: 'minor', primary: ['Ebm', 'Abm', 'Bb', 'Bb7', 'Bbm'], secondary: ['Cb', 'Db', 'Gb'], dominant: 'Bb' },
  'Em':  { tonic: 'Em',  type: 'minor', primary: ['Em', 'Am', 'B', 'B7', 'Bm'], secondary: ['C', 'D', 'G'], dominant: 'B' },
  'Fm':  { tonic: 'Fm',  type: 'minor', primary: ['Fm', 'Bbm', 'C', 'C7', 'Cm'], secondary: ['Db', 'Eb', 'Ab'], dominant: 'C' },
  'F#m': { tonic: 'F#m', type: 'minor', primary: ['F#m', 'Bm', 'C#', 'C#7', 'C#m'], secondary: ['D', 'E', 'A'], dominant: 'C#' },
  'Gm':  { tonic: 'Gm',  type: 'minor', primary: ['Gm', 'Cm', 'D', 'D7', 'Dm'], secondary: ['Eb', 'F', 'Bb'], dominant: 'D' },
  'G#m': { tonic: 'G#m', type: 'minor', primary: ['G#m', 'C#m', 'D#', 'D#7', 'D#m'], secondary: ['E', 'F#', 'B'], dominant: 'D#' },
  'Abm': { tonic: 'Abm', type: 'minor', primary: ['Abm', 'Dbm', 'Eb', 'Eb7', 'Ebm'], secondary: ['Fb', 'Gb', 'B'], dominant: 'Eb' }
};

// Clean chord token to basic chord (e.g. "Cmaj7" -> "C", "F#m7/E" -> "F#m", "B7" -> "B7" or "B")
function simplifyChord(chordStr) {
  if (!chordStr || typeof chordStr !== 'string') return '';
  const clean = chordStr.trim().split('/')[0]; // Remove bass note
  
  // Check minor first: e.g. "F#m7", "Am9", "C#min"
  const minorMatch = clean.match(/^([A-Ga-g][#b]?)(?:m|min)(?:aj)?[0-9]*/);
  if (minorMatch && !clean.includes('maj') && !clean.includes('M')) {
    const root = minorMatch[1].charAt(0).toUpperCase() + minorMatch[1].slice(1);
    return `${root}m`;
  }

  // 7th chords: e.g. "G7", "E7", "B7"
  const dom7Match = clean.match(/^([A-Ga-g][#b]?)7$/);
  if (dom7Match) {
    const root = dom7Match[1].charAt(0).toUpperCase() + dom7Match[1].slice(1);
    return `${root}7`;
  }

  // Major / other roots
  const majorMatch = clean.match(/^([A-Ga-g][#b]?)/);
  if (majorMatch) {
    const root = majorMatch[1].charAt(0).toUpperCase() + majorMatch[1].slice(1);
    return root;
  }

  return '';
}

// Extract all chords from a song in chronological order
function extractSongChords(song) {
  const chords = [];
  if (!song || !Array.isArray(song.sections)) return chords;

  for (const sec of song.sections) {
    // Check rows
    for (const row of sec.rows || []) {
      if (row.type === 'chords' && row.content) {
        if (Array.isArray(row.content)) {
          for (const c of row.content) chords.push(c);
        } else if (typeof row.content === 'string') {
          const tokens = row.content.trim().split(/\s+/).filter(Boolean);
          for (const t of tokens) chords.push(t);
        }
      }
    }
    // Check lines (legacy format)
    for (const line of sec.lines || []) {
      if (Array.isArray(line.chords)) {
        for (const c of line.chords) {
          const name = typeof c === 'string' ? c : c?.chord;
          if (name) chords.push(name);
        }
      } else if (typeof line.chords === 'string') {
        const tokens = line.chords.trim().split(/\s+/).filter(Boolean);
        for (const t of tokens) chords.push(t);
      }
    }
  }

  return chords.map(simplifyChord).filter(Boolean);
}

// Detect the most accurate key for a song
function detectAccurateKey(song) {
  const chords = extractSongChords(song);
  const currentKey = song.originalKey || 'C';

  if (chords.length === 0) {
    return { detectedKey: currentKey, confidence: 0, reason: 'No chords found' };
  }

  const firstChord = chords[0];
  const lastChord = chords[chords.length - 1];

  // Frequency count of simplified chords
  const counts = {};
  for (const c of chords) {
    counts[c] = (counts[c] || 0) + 1;
  }

  let bestKey = currentKey;
  let highestScore = -1;

  for (const [keyCandidate, profile] of Object.entries(KEY_PROFILES)) {
    let score = 0;

    // 1. Tonic chord frequency (huge indicator)
    const tonicCount = counts[profile.tonic] || 0;
    score += tonicCount * 10;

    // 2. First chord matches tonic (+15 points)
    if (firstChord === profile.tonic) {
      score += 18;
    } else if (firstChord.startsWith(profile.tonic) && profile.type === 'minor' && firstChord.endsWith('m')) {
      score += 18;
    }

    // 3. Last chord matches tonic (+10 points)
    if (lastChord === profile.tonic) {
      score += 10;
    }

    // 4. Primary key chords (I, IV, V or i, iv, V/v)
    for (const pc of profile.primary) {
      score += (counts[pc] || 0) * 5;
    }

    // 5. Secondary chords (ii, iii, vi or III, VI, VII)
    for (const sc of profile.secondary) {
      score += (counts[sc] || 0) * 3;
    }

    // 6. Penalty for foreign out-of-scale chords
    for (const [chord, count] of Object.entries(counts)) {
      const isPrimary = profile.primary.includes(chord);
      const isSecondary = profile.secondary.includes(chord);
      const isTonic = chord === profile.tonic;
      if (!isPrimary && !isSecondary && !isTonic) {
        score -= count * 4;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestKey = keyCandidate;
    }
  }

  // Strong Minor Decision Rule:
  // If the first chord is explicitly Minor (e.g. 'Em', 'Am', 'Dm', 'F#m', 'C#m', 'Bm', 'Gm', 'Cm', 'G#m', 'Bbm')
  // and the tonic of that minor key is present throughout the song, the song IS minor.
  const firstChordClean = firstChord;
  if (firstChordClean && firstChordClean.endsWith('m') && KEY_PROFILES[firstChordClean]) {
    const minorProfile = KEY_PROFILES[firstChordClean];
    const minorTonicCount = counts[firstChordClean] || 0;
    if (minorTonicCount >= 1) {
      bestKey = firstChordClean;
    }
  }

  return {
    detectedKey: bestKey,
    confidence: highestScore,
    firstChord,
    lastChord,
    chordsSummary: Object.entries(counts).map(([c, n]) => `${c}(${n})`).join(', ')
  };
}

async function analyzeAllSongKeys() {
  console.log('Fetching songs from Firestore pianonotes-1bd94...');
  const snapshot = await getDocs(collection(db, 'songs'));
  console.log(`Total songs to analyze: ${snapshot.size}`);

  const changes = [];
  const unchanged = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const title = data.title || 'Untitled';
    const currentKey = data.originalKey || 'C';

    const analysis = detectAccurateKey(data);
    const newKey = analysis.detectedKey;

    if (newKey !== currentKey) {
      changes.push({
        id,
        title,
        currentKey,
        newKey,
        firstChord: analysis.firstChord,
        chords: analysis.chordsSummary
      });
    } else {
      unchanged.push({ id, title, key: currentKey });
    }
  }

  console.log(`\n======================================================`);
  console.log(`SONGS REQUIRING KEY CORRECTION (Major -> Minor / Scale adjustments): ${changes.length}`);
  console.log(`======================================================`);
  changes.forEach((c, i) => {
    console.log(`${i + 1}. [${c.id}] "${c.title}"`);
    console.log(`   Current: "${c.currentKey}"  -->  Detected: "${c.newKey}" (First chord: ${c.firstChord})`);
    console.log(`   Chords: ${c.chords}`);
  });

  console.log(`\nSongs already matching correct key: ${unchanged.length}`);
  console.log(`Total songs: ${snapshot.size}`);

  return changes;
}

analyzeAllSongKeys().catch(err => {
  console.error('Error analyzing song keys:', err);
  process.exit(1);
});
