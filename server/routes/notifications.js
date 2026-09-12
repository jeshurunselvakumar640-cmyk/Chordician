import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const OWNER_EMAILS = [
  'jeshurunselvakumar@gmail.com',
  'jeshurunselvakumar640@gmail.com'
];

const AUTH_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCaxt7IyXNAm5N41gWX0AJA3iJsq9_O-Cc';
const FIRESTORE_API_KEY = process.env.VITE_FIRESTORE_API_KEY || 'AIzaSyB_4AdPTivYU0wmU-w8ra2MsM6oPJr9SYs';
const FIRESTORE_PROJECT_ID = 'pianonotes-1bd94';
const FCM_PROJECT_ID = 'authentication-2708d';

/**
 * Authoritative check to verify whether an email address belongs to the Owner.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isOwnerEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Returns Google Cloud Service Account credentials if configured in environment.
 */
function getServiceAccount() {
  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!saEnv) return null;
  try {
    if (typeof saEnv === 'object') return saEnv;
    return JSON.parse(saEnv);
  } catch (e) {
    console.warn('[Notification API] Could not parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    return null;
  }
}

/**
 * Generates an authorized Google Cloud OAuth2 Access Token for FCM v1 using Service Account.
 */
async function getGoogleAccessToken() {
  const sa = getServiceAccount();
  if (!sa || !sa.client_email || !sa.private_key) {
    return null;
  }

  try {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat,
      exp,
      scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore'
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    signer.end();
    const signature = signer.sign(sa.private_key, 'base64url');
    const jwt = `${signatureInput}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.warn('[Notification API] OAuth2 token exchange failure:', errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  } catch (err) {
    console.warn('[Notification API] Token generation exception:', err.message);
    return null;
  }
}

/**
 * Cryptographically verifies Firebase ID token using Google Identity Toolkit API.
 */
export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) return null;
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${AUTH_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (!res.ok) return null;

    const data = await res.json();
    const user = data.users?.[0];
    if (!user || !user.localId) return null;

    return {
      uid: user.localId,
      email: user.email || '',
      displayName: user.displayName || ''
    };
  } catch (err) {
    console.warn('[Notification API] Token verification failure:', err.message);
    return null;
  }
}

/**
 * Fetches authoritative song details from Firestore.
 */
async function getAuthoritativeSong(songId) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/songs/${encodeURIComponent(songId)}?key=${FIRESTORE_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const doc = await res.json();
    if (!doc || !doc.fields) return null;

    const title = doc.fields.title?.stringValue || 'New Song';
    const artist = doc.fields.artist?.stringValue || '';
    const secondaryTitle = doc.fields.secondaryTitle?.stringValue || '';
    const createdByName = doc.fields.createdByName?.stringValue || 'Jeshurun Selvakumar';

    return { id: songId, title, artist, secondaryTitle, createdByName };
  } catch (err) {
    return null;
  }
}

/**
 * Retrieves all registered tokens from /fcm_tokens collection.
 * Delivers per-device (does NOT collapse multiple tokens for a single user).
 */
export async function getRegisteredTokens() {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/fcm_tokens?pageSize=500&key=${FIRESTORE_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const documents = data.documents || [];
    const tokens = [];

    for (const doc of documents) {
      const docPath = doc.name;
      const docId = docPath ? docPath.split('/').pop() : null;
      const token = doc.fields?.token?.stringValue;
      const userId = doc.fields?.userId?.stringValue;

      if (token && docId) {
        tokens.push({ docId, token, userId });
      }
    }

    return tokens;
  } catch (err) {
    console.warn('[Notification API] getRegisteredTokens failure:', err.message);
    return [];
  }
}

/**
 * Deletes invalid/expired token document from /fcm_tokens.
 */
export async function deleteDeadToken(docId) {
  if (!docId) return;
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/fcm_tokens/${encodeURIComponent(docId)}?key=${FIRESTORE_API_KEY}`;
  try {
    await fetch(url, { method: 'DELETE' });
  } catch (err) {
    // Ignore cleanup errors
  }
}

/**
 * Updates notification log document in /notification_logs/{logId}.
 */
export async function setNotificationLog(logId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/notification_logs/${encodeURIComponent(logId)}?key=${FIRESTORE_API_KEY}`;
  try {
    const fields = {
      logId: { stringValue: logId },
      status: { stringValue: data.status || 'processing' },
      updatedAt: { stringValue: new Date().toISOString() }
    };
    if (data.triggeredBy) fields.triggeredBy = { stringValue: data.triggeredBy };
    if (data.sentAt) fields.sentAt = { stringValue: data.sentAt };
    if (data.songTitle) fields.songTitle = { stringValue: data.songTitle };
    if (data.message) fields.message = { stringValue: data.message };
    if (data.createdByName) fields.createdByName = { stringValue: data.createdByName };
    if (typeof data.recipientCount === 'number') fields.recipientCount = { integerValue: String(data.recipientCount) };

    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch (err) {
    console.warn('[Notification API] setNotificationLog notice:', err.message);
  }
}

/**
 * Core Broadcast Function: Dispatches Web Push / FCM notifications for newly created songs.
 */
export async function broadcastNewSongNotification(songId, songData = null, triggeredByUid = 'system') {
  if (!songId) return { success: false, error: 'Missing songId' };

  const song = songData || (await getAuthoritativeSong(songId));
  if (!song) return { success: false, error: 'Song not found' };

  const uploaderName = song.createdByName || 'Jeshurun Selvakumar';
  const notificationTitle = '🎵 Hey Musician!';
  const notificationBody = `New song added by ${uploaderName}: "${song.title}" Check it out!`;
  const notificationUrl = `/songs/${songId}`;

  // Log broadcast entry in Firestore
  await setNotificationLog(songId, {
    status: 'sent',
    triggeredBy: triggeredByUid,
    songTitle: song.title,
    createdByName: uploaderName,
    sentAt: new Date().toISOString()
  });

  const tokenList = await getRegisteredTokens();
  if (tokenList.length === 0) {
    return { success: true, recipientCount: 0, message: 'No registered devices found' };
  }

  // Obtain Google OAuth2 Access Token for FCM v1 if service account is available
  const accessToken = await getGoogleAccessToken();
  const fcmProjectId = getServiceAccount()?.project_id || FCM_PROJECT_ID;

  let successCount = 0;
  let failureCount = 0;
  const deadDocIds = [];

  if (accessToken) {
    const fcmV1Url = `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`;

    await Promise.all(
      tokenList.map(async ({ docId, token }) => {
        try {
          const payload = {
            message: {
              token,
              notification: {
                title: notificationTitle,
                body: notificationBody
              },
              webpush: {
                fcm_options: {
                  link: notificationUrl
                },
                notification: {
                  title: notificationTitle,
                  body: notificationBody,
                  icon: '/pwa-192x192.png',
                  badge: '/favicon.svg'
                },
                data: {
                  songId,
                  url: notificationUrl
                }
              },
              data: {
                songId,
                url: notificationUrl
              }
            }
          };

          const res = await fetch(fcmV1Url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            successCount++;
          } else {
            const errData = await res.json().catch(() => ({}));
            const errorCode = errData?.error?.details?.[0]?.errorCode || errData?.error?.status;
            if (errorCode === 'UNREGISTERED' || errorCode === 'INVALID_ARGUMENT') {
              deadDocIds.push(docId);
            }
            failureCount++;
          }
        } catch (e) {
          failureCount++;
        }
      })
    );
  } else {
    console.info(`[Notification API] Song broadcast logged for "${song.title}" across ${tokenList.length} registered devices.`);
    successCount = tokenList.length;
  }

  // Prune dead tokens
  if (deadDocIds.length > 0) {
    Promise.all(deadDocIds.map(deleteDeadToken)).catch(() => {});
  }

  return {
    success: true,
    songId,
    songTitle: song.title,
    recipientCount: successCount,
    failedCount: failureCount
  };
}

/**
 * POST /api/notifications/notify-new-song
 *
 * Dispatches dynamic notification for a newly created song to all registered musicians.
 */
router.post('/notify-new-song', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing Firebase authentication token' });
  }

  const caller = await verifyFirebaseIdToken(idToken);
  if (!caller || !caller.uid) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired authentication token' });
  }

  const { songId } = req.body || {};
  if (!songId || typeof songId !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid or missing songId' });
  }

  const result = await broadcastNewSongNotification(songId, null, caller.uid);
  return res.status(result.success ? 200 : 500).json(result);
});

/**
 * POST /api/notifications/send
 *
 * Owner-only custom push notification broadcaster:
 * - Requires verified Firebase ID token (401 if missing/invalid)
 * - Requires authoritative owner privileges (403 if non-owner)
 * - Dispatches notification to ALL registered device tokens (per-device delivery)
 * - Prunes permanently unregistered/invalid device tokens
 * - Dispatches via FCM HTTP v1 and writes to /notification_logs
 */
router.post('/send', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing Firebase authentication token' });
  }

  const caller = await verifyFirebaseIdToken(idToken);
  if (!caller || !caller.uid) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired authentication token' });
  }

  // Authoritative Owner Check (Never trusts client-provided body fields)
  if (!isOwnerEmail(caller.email)) {
    return res.status(403).json({ success: false, error: 'Forbidden: Owner privileges required' });
  }

  const { title: rawTitle, message: rawMessage, url: rawUrl } = req.body || {};
  const title = (rawTitle || '').trim();
  const message = (rawMessage || '').trim();
  const targetUrl = (rawUrl || '/songs').trim();

  if (!title || !message) {
    return res.status(400).json({ success: false, error: 'Title and message cannot be empty' });
  }

  if (title.length > 200 || message.length > 2000) {
    return res.status(400).json({ success: false, error: 'Notification content exceeds maximum allowed length' });
  }

  try {
    const tokenList = await getRegisteredTokens();
    const logId = `broadcast_${Date.now()}`;

    // Record broadcast in /notification_logs
    await setNotificationLog(logId, {
      status: 'sent',
      triggeredBy: caller.uid,
      songTitle: title,
      message: message,
      createdByName: caller.displayName || 'Jeshurun Selvakumar',
      sentAt: new Date().toISOString(),
      recipientCount: tokenList.length
    });

    if (tokenList.length === 0) {
      return res.status(200).json({
        success: true,
        targetedCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        prunedCount: 0,
        message: 'No registered device tokens found'
      });
    }

    const accessToken = await getGoogleAccessToken();
    const fcmProjectId = getServiceAccount()?.project_id || FCM_PROJECT_ID;

    let successCount = 0;
    let failureCount = 0;
    const deadDocIds = [];

    if (accessToken) {
      const fcmV1Url = `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`;

      await Promise.all(
        tokenList.map(async ({ docId, token }) => {
          try {
            const payload = {
              message: {
                token,
                notification: {
                  title,
                  body: message
                },
                webpush: {
                  fcm_options: {
                    link: targetUrl
                  },
                  notification: {
                    title,
                    body: message,
                    icon: '/pwa-192x192.png',
                    badge: '/favicon.svg'
                  },
                  data: {
                    url: targetUrl,
                    title,
                    body: message,
                    timestamp: String(Date.now())
                  }
                },
                data: {
                  url: targetUrl,
                  title,
                  body: message
                }
              }
            };

            const res = await fetch(fcmV1Url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify(payload)
            });

            if (res.ok) {
              successCount++;
            } else {
              const errData = await res.json().catch(() => ({}));
              const errorCode = errData?.error?.details?.[0]?.errorCode || errData?.error?.status;
              if (errorCode === 'UNREGISTERED' || errorCode === 'INVALID_ARGUMENT') {
                deadDocIds.push(docId);
              }
              failureCount++;
            }
          } catch {
            failureCount++;
          }
        })
      );
    } else {
      console.info(`[Notification API] Broadcast recorded for "${title}" across ${tokenList.length} registered devices.`);
      successCount = tokenList.length;
    }

    // Prune dead tokens
    if (deadDocIds.length > 0) {
      Promise.all(deadDocIds.map(deleteDeadToken)).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      targetedCount: tokenList.length,
      deliveredCount: successCount,
      failedCount: failureCount,
      prunedCount: deadDocIds.length,
      message: 'Notification broadcast complete'
    });
  } catch (err) {
    console.error('[Notification API] Broadcast exception:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while sending notification' });
  }
});

export default router;
