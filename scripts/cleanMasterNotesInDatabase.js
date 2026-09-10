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

async function cleanMasterNotes() {
  console.log('Fetching songs from Firestore pianonotes-1bd94...');
  const snapshot = await getDocs(collection(db, 'songs'));
  console.log(`Total songs found: ${snapshot.size}`);

  let updatedCount = 0;
  let alreadyEmptyCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const notes = data.notes;

    if (notes && notes.trim() !== '') {
      // Clear master notes without modifying any other part of the song document
      const songRef = doc(db, 'songs', id);
      await updateDoc(songRef, {
        notes: ''
      });
      updatedCount++;
      if (updatedCount % 20 === 0) {
        console.log(`Updated ${updatedCount} songs so far...`);
      }
    } else {
      alreadyEmptyCount++;
    }
  }

  console.log(`\n🎉 Successfully cleaned master notes in Firestore database!`);
  console.log(`- Songs updated (notes cleared to ''): ${updatedCount}`);
  console.log(`- Songs already having empty notes: ${alreadyEmptyCount}`);
  console.log(`- Total songs in library: ${snapshot.size}`);
}

cleanMasterNotes().catch(err => {
  console.error('Error cleaning master notes:', err);
  process.exit(1);
});
