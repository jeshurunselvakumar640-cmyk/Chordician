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

async function inspectDatabase() {
  console.log('Fetching songs from Firestore pianonotes-1bd94...');
  const snapshot = await getDocs(collection(db, 'songs'));
  console.log(`Total songs found: ${snapshot.size}`);

  const songsWithNotes = [];
  const keyDistribution = {};
  const allSongKeys = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const title = data.title || 'Untitled';
    const originalKey = data.originalKey || '(none)';
    const notes = data.notes || '';

    keyDistribution[originalKey] = (keyDistribution[originalKey] || 0) + 1;
    allSongKeys.push({ id, title, originalKey });

    if (notes && notes.trim() !== '') {
      songsWithNotes.push({ id, title, notes, originalKey });
    }
  });

  console.log('\n--- KEY / SCALE DISTRIBUTION ---');
  console.table(keyDistribution);

  console.log(`\n--- SONGS WITH MASTER NOTES: ${songsWithNotes.length} ---`);
  songsWithNotes.forEach((s, idx) => {
    console.log(`${idx + 1}. [${s.id}] "${s.title}" (Key: ${s.originalKey}) -> Notes: "${s.notes}"`);
  });
}

inspectDatabase().catch(err => {
  console.error('Error inspecting database:', err);
  process.exit(1);
});
