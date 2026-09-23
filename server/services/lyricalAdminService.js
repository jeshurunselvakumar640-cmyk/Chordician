import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let cachedToken = null;
let tokenExpiresAt = 0;

const LYRICAL_FIRESTORE_PROJECT_ID = process.env.VITE_LYRICAL_FIREBASE_PROJECT_ID || 'notespiano';
const LYRICAL_API_KEY = process.env.VITE_LYRICAL_FIREBASE_API_KEY || 'AIzaSyCzO-j-0IwhSlukRcHPJ0p2s9zaKOu-iaA';

/**
 * Loads the Lyrical Service Account configuration from server environment variables or credential files.
 * NEVER exposed to frontend or client bundles.
 */
function getServiceAccountConfig() {
  // 1. JSON string or base64 JSON in LYRICAL_SERVICE_ACCOUNT_JSON
  if (process.env.LYRICAL_SERVICE_ACCOUNT_JSON) {
    try {
      const raw = process.env.LYRICAL_SERVICE_ACCOUNT_JSON.trim();
      const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      const parsed = JSON.parse(jsonStr);
      if (parsed.client_email && parsed.private_key) {
        return parsed;
      }
    } catch (err) {
      console.warn('[Lyrical Admin] Failed to parse LYRICAL_SERVICE_ACCOUNT_JSON:', err.message);
    }
  }

  // 2. Individual environment variables
  if (process.env.LYRICAL_SERVICE_ACCOUNT_EMAIL && process.env.LYRICAL_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return {
      client_email: process.env.LYRICAL_SERVICE_ACCOUNT_EMAIL.trim(),
      private_key: process.env.LYRICAL_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      project_id: process.env.LYRICAL_SERVICE_ACCOUNT_PROJECT_ID || LYRICAL_FIRESTORE_PROJECT_ID
    };
  }

  // 3. File path in GOOGLE_APPLICATION_CREDENTIALS or local key files
  const rawPaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS ? `${process.env.GOOGLE_APPLICATION_CREDENTIALS}.json` : null,
    './notespiano-key.json',
    './notespiano-key.json.json',
    'notespiano-key.json',
    'notespiano-key.json.json'
  ].filter(Boolean);

  const candidatePaths = [];
  for (const p of rawPaths) {
    candidatePaths.push(p);
    candidatePaths.push(path.resolve(process.cwd(), p));
  }

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed.client_email && parsed.private_key) {
          return parsed;
        }
      } catch (err) {
        console.warn('[Lyrical Admin] Failed to load credentials from', filePath, err.message);
      }
    }
  }

  return null;
}

/**
 * Obtains an OAuth2 access token for Google Cloud Datastore / Firestore.
 * Caches token in memory until 5 minutes before expiry.
 */
async function getAdminAccessToken() {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt > nowSec + 300) {
    return cachedToken;
  }

  const sa = getServiceAccountConfig();
  if (!sa) {
    return null;
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: nowSec + 3600,
    iat: nowSec
  };

  const base64UrlEncode = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  sign.end();

  const signature = sign.sign(sa.private_key, 'base64url');
  const assertion = `${unsignedToken}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[Lyrical Admin] OAuth2 Token Error:', res.status, errText);
    return null;
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = nowSec + (data.expires_in || 3600);
  return cachedToken;
}

/**
 * Executes an authenticated Firestore REST write (PATCH) using the server's privileged token.
 */
export async function adminWriteFirestoreDoc(collectionName, docId, fields) {
  const token = await getAdminAccessToken();
  const headers = {
    'Content-Type': 'application/json'
  };

  let firestoreUrl;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    firestoreUrl = `https://firestore.googleapis.com/v1/projects/${LYRICAL_FIRESTORE_PROJECT_ID}/databases/(default)/documents/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`;
  } else {
    // Fallback URL with API key (subject to rules if Service Account not yet supplied in env)
    firestoreUrl = `https://firestore.googleapis.com/v1/projects/${LYRICAL_FIRESTORE_PROJECT_ID}/databases/(default)/documents/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}?key=${LYRICAL_API_KEY}`;
  }

  const response = await fetch(firestoreUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields })
  });

  return response;
}

/**
 * Executes an authenticated Firestore REST delete (DELETE) using the server's privileged token.
 */
export async function adminDeleteFirestoreDoc(collectionName, docId) {
  const token = await getAdminAccessToken();
  const headers = {};

  let firestoreUrl;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    firestoreUrl = `https://firestore.googleapis.com/v1/projects/${LYRICAL_FIRESTORE_PROJECT_ID}/databases/(default)/documents/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`;
  } else {
    firestoreUrl = `https://firestore.googleapis.com/v1/projects/${LYRICAL_FIRESTORE_PROJECT_ID}/databases/(default)/documents/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}?key=${LYRICAL_API_KEY}`;
  }

  const response = await fetch(firestoreUrl, {
    method: 'DELETE',
    headers
  });

  return response;
}
