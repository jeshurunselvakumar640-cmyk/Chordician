import express from 'express';

const router = express.Router();

const OWNER_EMAIL = 'jeshurunselvakumar640@gmail.com';
const AUTH_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCaxt7IyXNAm5N41gWX0AJA3iJsq9_O-Cc';
const FIRESTORE_API_KEY = process.env.VITE_FIRESTORE_API_KEY || 'AIzaSyB_4AdPTivYU0wmU-w8ra2MsM6oPJr9SYs';
const FIRESTORE_PROJECT_ID = 'pianonotes-1bd94';

/**
 * Cryptographically verifies Firebase ID token using Google Identity Toolkit API.
 * Returns the decoded user account info or null if invalid/expired.
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
    if (!user || !user.email) return null;

    return {
      uid: user.localId,
      email: user.email,
      displayName: user.displayName || ''
    };
  } catch (err) {
    console.warn('[Notification API] Token verification network failure:', err.message);
    return null;
  }
}

/**
 * Fetches authoritative song title & details from Firestore /songs/{songId}.
 */
async function getAuthoritativeSong(songId, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/songs/${encodeURIComponent(songId)}?key=${FIRESTORE_API_KEY}`;
  try {
    const headers = {};
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return null;
    }
    const doc = await res.json();
    if (!doc || !doc.fields) return null;

    const title = doc.fields.title?.stringValue || 'New Song';
    const artist = doc.fields.artist?.stringValue || '';
    const secondaryTitle = doc.fields.secondaryTitle?.stringValue || '';

    return { id: songId, title, artist, secondaryTitle };
  } catch (err) {
    console.warn('[Notification API] Failed to fetch authoritative song from Firestore:', err.message);
    return null;
  }
}

/**
 * Fetches existing notification log from Firestore /notification_logs/{songId}.
 */
async function getNotificationLog(songId, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/notification_logs/${encodeURIComponent(songId)}?key=${FIRESTORE_API_KEY}`;
  try {
    const headers = {};
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    const res = await fetch(url, { headers });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const doc = await res.json();
    if (!doc || !doc.fields) return null;

    return {
      songId,
      status: doc.fields.status?.stringValue || 'unknown',
      updatedAt: doc.fields.updatedAt?.stringValue || '',
      attemptCount: parseInt(doc.fields.attemptCount?.integerValue || '0', 10)
    };
  } catch (err) {
    return null;
  }
}

/**
 * Updates or creates notification log document in /notification_logs/{songId}.
 */
async function setNotificationLog(songId, data, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/notification_logs/${encodeURIComponent(songId)}?key=${FIRESTORE_API_KEY}`;
  try {
    const fields = {
      songId: { stringValue: songId },
      status: { stringValue: data.status || 'processing' },
      updatedAt: { stringValue: new Date().toISOString() }
    };
    if (data.triggeredBy) fields.triggeredBy = { stringValue: data.triggeredBy };
    if (data.sentAt) fields.sentAt = { stringValue: data.sentAt };
    if (data.error) fields.error = { stringValue: data.error };
    if (typeof data.recipientCount === 'number') fields.recipientCount = { integerValue: String(data.recipientCount) };
    if (typeof data.attemptCount === 'number') fields.attemptCount = { integerValue: String(data.attemptCount) };

    const headers = { 'Content-Type': 'application/json' };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

    await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
  } catch (err) {
    console.warn('[Notification API] Notice: setNotificationLog failure:', err.message);
  }
}

/**
 * Retrieves registered tokens from /fcm_tokens collection.
 */
async function getRegisteredTokens(idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/fcm_tokens?pageSize=500&key=${FIRESTORE_API_KEY}`;
  try {
    const headers = {};
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];

    const data = await res.json();
    const documents = data.documents || [];
    const tokens = [];

    for (const doc of documents) {
      const docPath = doc.name; // projects/.../documents/fcm_tokens/DOC_ID
      const docId = docPath ? docPath.split('/').pop() : null;
      const token = doc.fields?.token?.stringValue;
      const userId = doc.fields?.userId?.stringValue;

      if (token && docId) {
        tokens.push({ docId, token, userId });
      }
    }

    return tokens;
  } catch (err) {
    console.warn('[Notification API] Notice: getRegisteredTokens failure:', err.message);
    return [];
  }
}

/**
 * Deletes invalid/expired token document from /fcm_tokens.
 */
async function deleteDeadToken(docId, idToken) {
  if (!docId) return;
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/fcm_tokens/${encodeURIComponent(docId)}?key=${FIRESTORE_API_KEY}`;
  try {
    const headers = {};
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    await fetch(url, { method: 'DELETE', headers });
  } catch (err) {
    // Non-critical token cleanup notice
  }
}

/**
 * POST /api/notifications/notify-new-song
 *
 * Dispatches dynamic Web Push notification for a newly created song to all registered musicians.
 * Uses atomic claim deduplication with failure recovery and strict owner authentication.
 */
router.post('/notify-new-song', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing Firebase authentication token' });
  }

  // 1. Cryptographic token verification
  const caller = await verifyFirebaseIdToken(idToken);
  if (!caller || !caller.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired authentication token' });
  }

  // 2. Strict Owner Email authorization check
  if (caller.email.trim().toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
    return res.status(403).json({ success: false, error: 'Forbidden: Only the verified owner can trigger new song broadcasts' });
  }

  const { songId } = req.body || {};
  if (!songId || typeof songId !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid or missing songId' });
  }

  // 3. Verify song exists in Firestore and fetch authoritative title
  const song = await getAuthoritativeSong(songId, idToken);
  if (!song) {
    return res.status(404).json({ success: false, error: `Song document "${songId}" not found in Firestore` });
  }

  // 4. Atomic Claim on /notification_logs/{songId} (Best-Effort Duplicate Prevention)
  const existingLog = await getNotificationLog(songId, idToken);

  if (existingLog) {
    if (existingLog.status === 'sent') {
      return res.status(200).json({
        success: true,
        alreadySent: true,
        message: `Notification for "${song.title}" was already successfully sent.`
      });
    }

    if (existingLog.status === 'processing') {
      const updatedAtMs = existingLog.updatedAt ? new Date(existingLog.updatedAt).getTime() : 0;
      const ageMs = Date.now() - updatedAtMs;
      if (ageMs < 60000) {
        // Active processing within last 60 seconds -> prevent concurrent duplicate broadcast
        return res.status(200).json({
          success: true,
          alreadyProcessing: true,
          message: 'Notification is currently being processed by another worker.'
        });
      }
      // If older than 60s, stale claim recovery kicks in
      console.info(`[Notification API] Stale processing claim detected on song "${songId}" (${Math.round(ageMs / 1000)}s old). Reclaiming.`);
    }
  }

  // Claim the task
  const attemptCount = (existingLog?.attemptCount || 0) + 1;
  await setNotificationLog(songId, {
    status: 'processing',
    triggeredBy: caller.uid,
    attemptCount
  }, idToken);

  // 5. Query all registered device tokens
  const tokenList = await getRegisteredTokens(idToken);
  if (tokenList.length === 0) {
    await setNotificationLog(songId, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      recipientCount: 0
    }, idToken);

    return res.status(200).json({
      success: true,
      recipientCount: 0,
      message: 'No registered user devices found.'
    });
  }

  // 6. Construct dynamic notification payload
  const notificationTitle = '🎵 Hey Musician!';
  const notificationBody = `New song is added: "${song.title}" Check it out!`;
  const notificationUrl = `/songs/${songId}`;

  // 7. Dispatch notifications to all registered tokens
  let successCount = 0;
  let failureCount = 0;
  const deadTokenDocIds = [];

  // Parallel dispatch across all registered tokens
  await Promise.all(
    tokenList.map(async ({ docId, token }) => {
      try {
        // FCM Direct Web Push Send using Legacy or Webpush protocol
        const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
        const fcmPayload = {
          to: token,
          notification: {
            title: notificationTitle,
            body: notificationBody,
            icon: '/pwa-192x192.png',
            badge: '/favicon.svg',
            click_action: notificationUrl
          },
          data: {
            songId,
            url: notificationUrl,
            title: notificationTitle,
            body: notificationBody
          }
        };

        const fcmRes = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${AUTH_API_KEY}`
          },
          body: JSON.stringify(fcmPayload)
        });

        if (fcmRes.ok) {
          const resJson = await fcmRes.json().catch(() => ({}));
          if (resJson.success >= 1) {
            successCount++;
          } else if (resJson.results?.[0]?.error) {
            const errCode = resJson.results[0].error;
            if (
              errCode === 'NotRegistered' ||
              errCode === 'InvalidRegistration' ||
              errCode === 'MismatchSenderId'
            ) {
              deadTokenDocIds.push(docId);
            }
            failureCount++;
          } else {
            successCount++;
          }
        } else {
          failureCount++;
        }
      } catch (e) {
        failureCount++;
      }
    })
  );

  // 8. Prune dead/unregistered tokens in background
  if (deadTokenDocIds.length > 0) {
    Promise.all(deadTokenDocIds.map((dId) => deleteDeadToken(dId, idToken))).catch(() => {});
  }

  // 9. Update notification log with final status
  const sentTimestamp = new Date().toISOString();
  await setNotificationLog(songId, {
    status: 'sent',
    sentAt: sentTimestamp,
    recipientCount: successCount
  }, idToken);

  console.log(`[Notification API] Broadcast complete for "${song.title}": ${successCount} sent, ${failureCount} failed, ${deadTokenDocIds.length} pruned.`);

  return res.status(200).json({
    success: true,
    songId,
    songTitle: song.title,
    recipientCount: successCount,
    failedCount: failureCount,
    prunedCount: deadTokenDocIds.length
  });
});

export default router;
