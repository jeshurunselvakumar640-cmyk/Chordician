import express from 'express';
import { adminWriteFirestoreDoc, adminDeleteFirestoreDoc } from '../services/lyricalAdminService.js';

const router = express.Router();

const OWNER_EMAILS = [
  'jeshurunselvakumar@gmail.com',
  'jeshurunselvakumar640@gmail.com'
];

// Configuration for verifying Chordician Auth tokens (Project: authentication-2708d)
const AUTH_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCaxt7IyXNAm5N41gWX0AJA3iJsq9_O-Cc';
const EXPECTED_AUTH_PROJECT_ID = 'authentication-2708d';

// Configuration for writing to Lyrical Firestore (Project: notespiano)
const LYRICAL_FIRESTORE_PROJECT_ID = process.env.VITE_LYRICAL_FIREBASE_PROJECT_ID || 'notespiano';
const LYRICAL_API_KEY = process.env.VITE_LYRICAL_FIREBASE_API_KEY || 'AIzaSyCzO-j-0IwhSlukRcHPJ0p2s9zaKOu-iaA';

/**
 * Validates whether an email belongs to the server-side authorized Owner allowlist.
 */
function isAuthorizedOwner(email) {
  if (!email || typeof email !== 'string') return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Cryptographically verifies that the Firebase ID token was issued by project authentication-2708d.
 * Validates token signature, project audience, expiration, and returns verified user claims.
 */
async function verifyChordicianOwnerToken(idToken) {
  if (!idToken || typeof idToken !== 'string') return null;

  try {
    // 1. Validate JWT structure and verify audience/project claim
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    let payload = null;
    try {
      const decodedJson = Buffer.from(parts[1], 'base64').toString('utf8');
      payload = JSON.parse(decodedJson);
    } catch {
      return null;
    }

    // Verify token claims: audience must match authentication-2708d, issuer must match securetoken.google.com/authentication-2708d
    if (!payload || payload.aud !== EXPECTED_AUTH_PROJECT_ID || payload.iss !== `https://securetoken.google.com/${EXPECTED_AUTH_PROJECT_ID}`) {
      console.warn('[Lyrical Auth Security] Token audience/issuer mismatch:', payload?.aud, payload?.iss);
      return null;
    }

    // Check expiration timestamp
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      console.warn('[Lyrical Auth Security] Token expired');
      return null;
    }

    // 2. Cryptographic signature verification via Google Identity Toolkit endpoint
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${AUTH_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (!res.ok) {
      console.warn('[Lyrical Auth Security] Google Identity Toolkit signature verification rejected');
      return null;
    }

    const data = await res.json();
    const user = data.users?.[0];
    if (!user || !user.localId) return null;

    const verifiedEmail = (user.email || '').trim().toLowerCase();
    if (!isAuthorizedOwner(verifiedEmail)) {
      console.warn('[Lyrical Auth Security] Authenticated user is not an authorized owner:', verifiedEmail);
      return { authorized: false, email: verifiedEmail };
    }

    return {
      authorized: true,
      uid: user.localId,
      email: verifiedEmail,
      displayName: user.displayName || 'Owner'
    };
  } catch (err) {
    console.error('[Lyrical Auth Security] Token verification exception:', err.message);
    return null;
  }
}

/**
 * Middleware enforcing Owner-only authorization for write operations.
 */
async function requireOwnerAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Authorization Bearer token missing.'
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  const authResult = await verifyChordicianOwnerToken(idToken);

  if (!authResult) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }

  if (!authResult.authorized) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. Owner permissions required to modify Lyrical library.'
    });
  }

  req.ownerUser = authResult;
  next();
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
 * Converts a JavaScript object to Firestore REST API fields object
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
 * POST /api/lyrical/songs
 * Creates or updates a Lyrical song in notespiano /lyrical_songs collection.
 */
router.post('/songs', requireOwnerAuth, async (req, res) => {
  try {
    const songData = req.body;
    if (!songData || !songData.title) {
      return res.status(400).json({ success: false, error: 'Song title is required' });
    }

    const rawId = songData.id || `lyr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const songId = (rawId.startsWith('lyr_') || rawId.startsWith('lyr-')) ? rawId : `lyr_${rawId}`;

    const nowIso = new Date().toISOString();
    const payload = {
      id: songId,
      title: String(songData.title).trim(),
      secondaryTitles: Array.isArray(songData.secondaryTitles) ? songData.secondaryTitles : [],
      artist: String(songData.artist || songData.singer || 'Unknown Artist').trim(),
      originalLanguage: songData.originalLanguage || 'Tamil',
      originalLyrics: songData.originalLyrics || '',
      tamilLyrics: songData.tamilLyrics || '',
      englishLyrics: songData.englishLyrics || '',
      hindiLyrics: songData.hindiLyrics || '',
      chordicianSongId: songData.chordicianSongId || null,
      isCommunion: Boolean(songData.isCommunion),
      isLyrical: true,
      createdAt: songData.createdAt || nowIso,
      updatedAt: nowIso
    };

    const response = await adminWriteFirestoreDoc('lyrical_songs', songId, toFirestoreFields(payload));

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Lyrical Backend] Firestore write failed:', response.status, errText);
      let parsedErr = null;
      try { parsedErr = JSON.parse(errText); } catch {}
      const detailedMessage = parsedErr?.error?.message || errText || 'Unknown Firestore error';
      return res.status(response.status).json({
        success: false,
        error: `Failed to save song to Lyrical Firestore database: ${detailedMessage}`,
        status: response.status,
        details: parsedErr || errText
      });
    }

    return res.json({ success: true, id: songId, song: payload });
  } catch (err) {
    console.error('[Lyrical Backend] Error saving song:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while saving Lyrical song' });
  }
});

/**
 * DELETE /api/lyrical/songs/:id
 * Deletes a Lyrical song from notespiano /lyrical_songs collection.
 */
router.delete('/songs/:id', requireOwnerAuth, async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).json({ success: false, error: 'Song ID is required' });
    }

    const songId = rawId.startsWith('lyr_') ? rawId : `lyr_${rawId}`;
    const response = await adminDeleteFirestoreDoc('lyrical_songs', songId);

    if (!response.ok && response.status !== 404) {
      const errText = await response.text();
      console.error('[Lyrical Backend] Firestore delete failed:', response.status, errText);
      return res.status(response.status).json({ success: false, error: 'Failed to delete song from Lyrical Firestore database' });
    }

    return res.json({ success: true, id: songId });
  } catch (err) {
    console.error('[Lyrical Backend] Error deleting song:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while deleting Lyrical song' });
  }
});

/**
 * POST /api/lyrical/sunday
 * Updates the Sunday Setlist in notespiano /lyrical_sunday_setlist collection.
 */
router.post('/sunday', requireOwnerAuth, async (req, res) => {
  try {
    const setlistData = req.body;
    const docId = 'active_setlist';
    const nowIso = new Date().toISOString();

    const payload = {
      id: docId,
      date: setlistData.date || nowIso.split('T')[0],
      serviceTitle: setlistData.serviceTitle || 'Sunday Worship Service',
      songs: Array.isArray(setlistData.songs) ? setlistData.songs : [],
      notes: setlistData.notes || '',
      updatedAt: nowIso
    };

    const response = await adminWriteFirestoreDoc('lyrical_sunday_setlist', docId, toFirestoreFields(payload));

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Lyrical Backend] Sunday setlist write failed:', response.status, errText);
      return res.status(response.status).json({ success: false, error: 'Failed to save Sunday setlist' });
    }

    return res.json({ success: true, setlist: payload });
  } catch (err) {
    console.error('[Lyrical Backend] Error updating Sunday setlist:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while updating Sunday setlist' });
  }
});

export default router;
