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

// Standard Key profiles with scale degrees and harmonic weights
const KEY_PROFILES = {
  // Major Keys
  'C':   { tonic: 'C',   type: 'major', primary: ['C', 'F', 'G', 'G7'], secondary: ['Am', 'Dm', 'Em'] },
  'C#':  { tonic: 'C#',  type: 'major', primary: ['C#', 'F#', 'G#', 'G#7'], secondary: ['A#m', 'D#m', 'Fm'] },
  'Db':  { tonic: 'Db',  type: 'major', primary: ['Db', 'Gb', 'Ab', 'Ab7'], secondary: ['Bbm', 'Ebm', 'Fm'] },
  'D':   { tonic: 'D',   type: 'major', primary: ['D', 'G', 'A', 'A7'], secondary: ['Bm', 'Em', 'F#m'] },
  'D#':  { tonic: 'D#',  type: 'major', primary: ['D#', 'G#', 'A#', 'A#7'], secondary: ['Cm', 'Fm', 'Gm'] },
  'Eb':  { tonic: 'Eb',  type: 'major', primary: ['Eb', 'Ab', 'Bb', 'Bb7'], secondary: ['Cm', 'Fm', 'Gm'] },
  'E':   { tonic: 'E',   type: 'major', primary: ['E', 'A', 'B', 'B7'], secondary: ['C#m', 'F#m', 'G#m'] },
  'F':   { tonic: 'F',   type: 'major', primary: ['F', 'Bb', 'C', 'C7'], secondary: ['Dm', 'Gm', 'Am'] },
  'F#':  { tonic: 'F#',  type: 'major', primary: ['F#', 'B', 'C#', 'C#7'], secondary: ['D#m', 'G#m', 'A#m'] },
  'Gb':  { tonic: 'Gb',  type: 'major', primary: ['Gb', 'Cb', 'Db', 'Db7'], secondary: ['Ebm', 'Abm', 'Bbm'] },
  'G':   { tonic: 'G',   type: 'major', primary: ['G', 'C', 'D', 'D7'], secondary: ['Em', 'Am', 'Bm'] },
  'G#':  { tonic: 'G#',  type: 'major', primary: ['G#', 'C#', 'D#', 'D#7'], secondary: ['Fm', 'A#m', 'Cm'] },
  'Ab':  { tonic: 'Ab',  type: 'major', primary: ['Ab', 'Db', 'Eb', 'Eb7'], secondary: ['Fm', 'Bbm', 'Cm'] },
  'A':   { tonic: 'A',   type: 'major', primary: ['A', 'D', 'E', 'E7'], secondary: ['F#m', 'Bm', 'C#m'] },
  'A#':  { tonic: 'A#',  type: 'major', primary: ['A#', 'D#', 'F', 'F7'], secondary: ['Gm', 'Cm', 'Dm'] },
  'Bb':  { tonic: 'Bb',  type: 'major', primary: ['Bb', 'Eb', 'F', 'F7'], secondary: ['Gm', 'Cm', 'Dm'] },
  'B':   { tonic: 'B',   type: 'major', primary: ['B', 'E', 'F#', 'F#7'], secondary: ['G#m', 'C#m', 'D#m'] },

  // Minor Keys
  'Am':  { tonic: 'Am',  type: 'minor', primary: ['Am', 'Dm', 'E', 'E7', 'Em'], secondary: ['F', 'G', 'C'] },
  'A#m': { tonic: 'A#m', type: 'minor', primary: ['A#m', 'D#m', 'F', 'F7', 'Fm'], secondary: ['F#', 'G#', 'C#'] },
  'Bbm': { tonic: 'Bbm', type: 'minor', primary: ['Bbm', 'Ebm', 'F', 'F7', 'Fm'], secondary: ['Gb', 'Ab', 'Db'] },
  'Bm':  { tonic: 'Bm',  type: 'minor', primary: ['Bm', 'Em', 'F#', 'F#7', 'F#m'], secondary: ['G', 'A', 'D'] },
  'Cm':  { tonic: 'Cm',  type: 'minor', primary: ['Cm', 'Fm', 'G', 'G7', 'Gm'], secondary: ['Ab', 'Bb', 'Eb'] },
  'C#m': { tonic: 'C#m', type: 'minor', primary: ['C#m', 'F#m', 'G#', 'G#7', 'G#m'], secondary: ['A', 'B', 'E'] },
  'Dm':  { tonic: 'Dm',  type: 'minor', primary: ['Dm', 'Gm', 'A', 'A7', 'Am'], secondary: ['Bb', 'C', 'F'] },
  'D#m': { tonic: 'D#m', type: 'minor', primary: ['D#m', 'G#m', 'A#', 'A#7', 'A#m'], secondary: ['B', 'C#', 'F#'] },
  'Ebm': { tonic: 'Ebm', type: 'minor', primary: ['Ebm', 'Abm', 'Bb', 'Bb7', 'Bbm'], secondary: ['Cb', 'Db', 'Gb'] },
  'Em':  { tonic: 'Em',  type: 'minor', primary: ['Em', 'Am', 'B', 'B7', 'Bm'], secondary: ['C', 'D', 'G'] },
  'Fm':  { tonic: 'Fm',  type: 'minor', primary: ['Fm', 'Bbm', 'C', 'C7', 'Cm'], secondary: ['Db', 'Eb', 'Ab'] },
  'F#m': { tonic: 'F#m', type: 'minor', primary: ['F#m', 'Bm', 'C#', 'C#7', 'C#m'], secondary: ['D', 'E', 'A'] },
  'Gm':  { tonic: 'Gm',  type: 'minor', primary: ['Gm', 'Cm', 'D', 'D7', 'Dm'], secondary: ['Eb', 'F', 'Bb'] },
  'G#m': { tonic: 'G#m', type: 'minor', primary: ['G#m', 'C#m', 'D#', 'D#7', 'D#m'], secondary: ['E', 'F#', 'B'] },
  'Abm': { tonic: 'Abm', type: 'minor', primary: ['Abm', 'Dbm', 'Eb', 'Eb7', 'Ebm'], secondary: ['Fb', 'Gb', 'B'] }
};

function simplifyChord(chordStr) {
  if (!chordStr || typeof chordStr !== 'string') return '';
  const clean = chordStr.trim().split('/')[0];
  
  const minorMatch = clean.match(/^([A-Ga-g][#b]?)(?:m|min)(?:aj)?[0-9]*/);
  if (minorMatch && !clean.includes('maj') && !clean.includes('M')) {
    const root = minorMatch[1].charAt(0).toUpperCase() + minorMatch[1].slice(1);
    return `${root}m`;
  }

  const dom7Match = clean.match(/^([A-Ga-g][#b]?)7$/);
  if (dom7Match) {
    const root = dom7Match[1].charAt(0).toUpperCase() + dom7Match[1].slice(1);
    return `${root}7`;
  }

  const majorMatch = clean.match(/^([A-Ga-g][#b]?)/);
  if (majorMatch) {
    const root = majorMatch[1].charAt(0).toUpperCase() + majorMatch[1].slice(1);
    return root;
  }

  return '';
}

function extractSongChords(song) {
  const chords = [];
  if (!song || !Array.isArray(song.sections)) return chords;

  for (const sec of song.sections) {
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

function detectAccurateKey(song) {
  const chords = extractSongChords(song);
  const currentKey = song.originalKey || 'C';

  if (chords.length === 0) {
    return currentKey;
  }

  const firstChord = chords[0];
  const lastChord = chords[chords.length - 1];

  const counts = {};
  for (const c of chords) {
    counts[c] = (counts[c] || 0) + 1;
  }

  let bestKey = currentKey;
  let highestScore = -1;

  for (const [keyCandidate, profile] of Object.entries(KEY_PROFILES)) {
    let score = 0;

    const tonicCount = counts[profile.tonic] || 0;
    score += tonicCount * 10;

    if (firstChord === profile.tonic) {
      score += 18;
    } else if (firstChord.startsWith(profile.tonic) && profile.type === 'minor' && firstChord.endsWith('m')) {
      score += 18;
    }

    if (lastChord === profile.tonic) {
      score += 10;
    }

    for (const pc of profile.primary) {
      score += (counts[pc] || 0) * 5;
    }

    for (const sc of profile.secondary) {
      score += (counts[sc] || 0) * 3;
    }

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

  if (firstChord && firstChord.endsWith('m') && KEY_PROFILES[firstChord]) {
    const minorTonicCount = counts[firstChord] || 0;
    if (minorTonicCount >= 1) {
      bestKey = firstChord;
    }
  }

  return bestKey;
}

async function updateAllSongKeys() {
  console.log('Fetching songs from Firestore pianonotes-1bd94...');
  const snapshot = await getDocs(collection(db, 'songs'));
  console.log(`Total songs found: ${snapshot.size}`);

  let updatedCount = 0;
  let unchangedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const title = data.title || 'Untitled';
    const currentKey = data.originalKey || 'C';

    const accurateKey = detectAccurateKey(data);

    if (accurateKey !== currentKey) {
      const songRef = doc(db, 'songs', id);
      await updateDoc(songRef, {
        originalKey: accurateKey
      });
      updatedCount++;
      console.log(`[${updatedCount}] Updated: "${title}" | Key: "${currentKey}" -> "${accurateKey}"`);
    } else {
      unchangedCount++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 COMPLETED DATABASE KEY RE-ASSIGNMENT!`);
  console.log(`- Songs updated with accurate Major/Minor/Sharp Minor keys: ${updatedCount}`);
  console.log(`- Songs already having exact matching keys: ${unchangedCount}`);
  console.log(`- Total songs in library: ${snapshot.size}`);
  console.log(`======================================================`);
}

updateAllSongKeys().catch(err => {
  console.error('Error updating song keys in database:', err);
  process.exit(1);
});
