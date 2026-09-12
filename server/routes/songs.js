import express from 'express';
import { broadcastNewSongNotification } from './notifications.js';

const router = express.Router();

const OWNER_EMAILS = [
  'jeshurunselvakumar@gmail.com',
  'jeshurunselvakumar640@gmail.com'
];

const AUTH_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCaxt7IyXNAm5N41gWX0AJA3iJsq9_O-Cc';
const FIRESTORE_API_KEY = process.env.VITE_FIRESTORE_API_KEY || 'AIzaSyB_4AdPTivYU0wmU-w8ra2MsM6oPJr9SYs';
const FIRESTORE_PROJECT_ID = 'pianonotes-1bd94';

/**
 * Checks whether an email belongs to the verified Owner.
 */
function isOwnerEmail(email) {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Cryptographically verifies Firebase ID token using Google Identity Toolkit API.
 * Returns authoritative user information (uid, email, displayName) or null.
 */
async function verifyFirebaseIdToken(idToken) {
  if (!idToken) return null;
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${AUTH_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const user = data.users?.[0];
    if (!user || !user.localId) return null;

    return {
      uid: user.localId,
      email: user.email || '',
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Musician')
    };
  } catch (err) {
    console.warn('[Songs API] Token verification failure:', err.message);
    return null;
  }
}

/**
 * Converts a JavaScript value to Firestore REST API value format
 */
function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Converts a JavaScript object to Firestore REST API `fields` structure
 */
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      fields[key] = toFirestoreValue(val);
    }
  }
  return fields;
}

/**
 * Converts a Firestore REST document value back to JavaScript value
 */
function fromFirestoreValue(val) {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

/**
 * Converts a Firestore REST document to a clean JavaScript object with `id`
 */
function fromFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const docPath = doc.name || '';
  const id = docPath ? docPath.split('/').pop() : null;
  const data = {};
  for (const [key, val] of Object.entries(doc.fields)) {
    data[key] = fromFirestoreValue(val);
  }
  return { id, ...data };
}

/**
 * Helper to fetch a single song document from Firestore REST API
 */
async function getFirestoreSongDoc(songId) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/songs/${encodeURIComponent(songId)}?key=${FIRESTORE_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    const doc = await res.json();
    return fromFirestoreDoc(doc);
  } catch (err) {
    console.warn(`[Songs API] Failed to fetch song "${songId}":`, err.message);
    return null;
  }
}

/**
 * POST /api/songs
 *
 * Secure song creation:
 * - Requires verified Firebase authentication ID token
 * - Forcibly assigns createdByUid = caller.uid
 * - Rejects unauthenticated attempts
 */
router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing authentication token' });
  }

  const caller = await verifyFirebaseIdToken(idToken);
  if (!caller || !caller.uid) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }

  const songData = req.body || {};
  const title = (songData.title || '').trim();

  if (!title) {
    return res.status(400).json({ success: false, error: 'Song title cannot be empty' });
  }

  const isOwner = isOwnerEmail(caller.email);
  const rawCreator = isOwner
    ? 'Jeshurun Selvakumar'
    : (songData.createdByName || caller.displayName || (caller.email ? caller.email.split('@')[0] : 'Musician'));
  const createdByName = (rawCreator || 'Jeshurun Selvakumar').replace(/\s*\([Oo]wner\)/g, '').trim() || 'Jeshurun Selvakumar';

  const nowIso = new Date().toISOString();

  // Authoritative server-stamped song payload
  const cleanData = {
    title,
    secondaryTitle: songData.secondaryTitle ? songData.secondaryTitle.trim() : null,
    artist: (songData.artist || '').trim(),
    originalKey: songData.originalKey || 'C',
    category: songData.category || 'Other',
    style: songData.style || null,
    favorite: Boolean(songData.favorite),
    sections: Array.isArray(songData.sections) ? songData.sections : [],
    tempo: songData.tempo || null,
    timeSignature: songData.timeSignature || '4/4',
    notes: songData.notes || '',
    // Authoritative ownership fields (client cannot forge or override)
    createdByUid: caller.uid,
    createdByName: createdByName,
    userId: caller.uid,
    ownerId: caller.uid,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/songs?key=${FIRESTORE_API_KEY}`;
    const firestoreRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(cleanData) })
    });

    if (!firestoreRes.ok) {
      const errBody = await firestoreRes.text();
      console.error('[Songs API] Firestore add error:', errBody);
      return res.status(500).json({ success: false, error: 'Failed to create song in Firestore database' });
    }

    const createdDoc = await firestoreRes.json();
    const docPath = createdDoc.name || '';
    const newId = docPath ? docPath.split('/').pop() : null;

    if (newId) {
      broadcastNewSongNotification(newId, cleanData, caller.uid).catch((err) => {
        console.warn('[Songs API] Automatic notification broadcast notice:', err.message);
      });
    }

    return res.status(201).json({
      success: true,
      id: newId,
      error: null
    });
  } catch (err) {
    console.error('[Songs API] Exception during song creation:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while creating song' });
  }
});

/**
 * PUT /api/songs/:id
 *
 * Secure song update:
 * - Requires verified Firebase authentication ID token
 * - Verifies ownership: Owner can edit all songs; normal users can only edit their own songs
 * - Strips and prohibits any modification to createdByUid / createdByName (immutability guarantee)
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Song ID is required' });
  }

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing authentication token' });
  }

  const caller = await verifyFirebaseIdToken(idToken);
  if (!caller || !caller.uid) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }

  // 1. Fetch existing song from Firestore
  const existingSong = await getFirestoreSongDoc(id);
  if (!existingSong) {
    return res.status(404).json({ success: false, error: `Song with ID "${id}" was not found` });
  }

  // 2. Authoritative ownership authorization check
  const isOwner = isOwnerEmail(caller.email);
  const songCreatorUid = existingSong.createdByUid || existingSong.userId || existingSong.ownerId || null;

  if (!isOwner) {
    if (!songCreatorUid || songCreatorUid !== caller.uid) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You only have permission to edit songs you created'
      });
    }
  }

  const songData = req.body || {};
  const title = (songData.title || '').trim();

  if (!title) {
    return res.status(400).json({ success: false, error: 'Song title cannot be empty' });
  }

  // 3. Construct update payload strictly from musical fields (createdByUid is immutable)
  const cleanUpdateData = {
    title,
    secondaryTitle: songData.secondaryTitle ? songData.secondaryTitle.trim() : null,
    artist: (songData.artist || '').trim(),
    originalKey: songData.originalKey || 'C',
    category: songData.category || 'Other',
    style: songData.style || null,
    favorite: Boolean(songData.favorite),
    sections: Array.isArray(songData.sections) ? songData.sections : [],
    tempo: songData.tempo || null,
    timeSignature: songData.timeSignature || '4/4',
    notes: songData.notes || '',
    updatedAt: new Date().toISOString()
  };

  try {
    // Update document in Firestore via PATCH with updateMask
    const fieldMaskParams = Object.keys(cleanUpdateData)
      .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
      .join('&');

    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/songs/${encodeURIComponent(id)}?${fieldMaskParams}&key=${FIRESTORE_API_KEY}`;
    
    const firestoreRes = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(cleanUpdateData) })
    });

    if (!firestoreRes.ok) {
      const errBody = await firestoreRes.text();
      console.error('[Songs API] Firestore update error:', errBody);
      return res.status(500).json({ success: false, error: 'Failed to update song in Firestore database' });
    }

    return res.status(200).json({ success: true, error: null });
  } catch (err) {
    console.error('[Songs API] Exception during song update:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while updating song' });
  }
});

/**
 * DELETE /api/songs/:id
 *
 * Secure song deletion:
 * - Requires verified Firebase authentication ID token
 * - Verifies ownership: Owner can delete all songs; normal users can only delete their own songs
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Song ID is required' });
  }

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing authentication token' });
  }

  const caller = await verifyFirebaseIdToken(idToken);
  if (!caller || !caller.uid) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }

  // 1. Fetch existing song from Firestore
  const existingSong = await getFirestoreSongDoc(id);
  if (!existingSong) {
    return res.status(404).json({ success: false, error: `Song with ID "${id}" was not found` });
  }

  // 2. Authoritative ownership authorization check
  const isOwner = isOwnerEmail(caller.email);
  const songCreatorUid = existingSong.createdByUid || existingSong.userId || existingSong.ownerId || null;

  if (!isOwner) {
    if (!songCreatorUid || songCreatorUid !== caller.uid) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You only have permission to delete songs you created'
      });
    }
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/songs/${encodeURIComponent(id)}?key=${FIRESTORE_API_KEY}`;
    const firestoreRes = await fetch(url, { method: 'DELETE' });

    if (!firestoreRes.ok) {
      const errBody = await firestoreRes.text();
      console.error('[Songs API] Firestore delete error:', errBody);
      return res.status(500).json({ success: false, error: 'Failed to delete song from Firestore database' });
    }

    return res.status(200).json({ success: true, error: null });
  } catch (err) {
    console.error('[Songs API] Exception during song deletion:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while deleting song' });
  }
});

/**
 * PATCH /api/songs/:id/favorite
 *
 * Toggles or sets favorite status for a song:
 * - Requires verified Firebase authentication ID token
 * - Allows authenticated users/owner to toggle favorite
 * - Strictly mutates ONLY the `favorite` field (rejects tampering with other fields)
 */
router.patch('/:id/favorite', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, error: 'Song ID is required' });

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing authentication token' });
  }

  const caller = await verifyFirebaseIdToken(idToken);
  if (!caller || !caller.uid) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }

  const { favorite } = req.body || {};
  const isFav = Boolean(favorite);

  try {
    const updateData = {
      favorite: isFav,
      updatedAt: new Date().toISOString()
    };

    const fieldMask = 'updateMask.fieldPaths=favorite&updateMask.fieldPaths=updatedAt';
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/songs/${encodeURIComponent(id)}?${fieldMask}&key=${FIRESTORE_API_KEY}`;

    const firestoreRes = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(updateData) })
    });

    if (!firestoreRes.ok) {
      const errText = await firestoreRes.text();
      console.error('[Songs API] Firestore favorite patch error:', errText);
      return res.status(500).json({ success: false, error: 'Failed to update favorite status in database' });
    }

    return res.status(200).json({ success: true, favorite: isFav });
  } catch (err) {
    console.error('[Songs API] Exception during favorite toggle:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while updating favorite' });
  }
});

export default router;
