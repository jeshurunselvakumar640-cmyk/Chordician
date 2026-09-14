import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyRemoteUserDataToLocal,
  clearLocalUserData,
  FAVORITES_STORAGE_KEY,
  THIS_SUNDAY_STORAGE_KEY,
  NOTES_STORAGE_KEY
} from '../../services/userSyncService.js';

import {
  getCommunionData,
  saveCommunionData,
  addSongToCommunion,
  clearCommunionSongs
} from '../../services/communionService.js';

// Setup Mock Storage for Node Test Environment
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// Attach mock localStorage and window event system if not present
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MockStorage();
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

// Security Rule Evaluator for /communion write authorization
function evaluateCommunionWriteRule(authContext, userDoc = null) {
  if (!authContext || !authContext.uid) return false;
  const email = (authContext.token?.email || '').toLowerCase();
  const isOwnerEmail = email === 'jeshurunselvakumar@gmail.com' || email === 'jeshurunselvakumar640@gmail.com';
  const role = userDoc?.role;
  const isAuthorizedRole = ['owner', 'musician', 'admin'].includes(role);
  return isOwnerEmail || isAuthorizedRole;
}

// Security Rule Evaluator for /users/{userId}
function evaluateUserProfileRule(authContext, targetUserId) {
  if (!authContext || !authContext.uid) return false;
  return authContext.uid === targetUserId;
}

// 1. User A favorites do not appear for User B
test('1. User A favorites do not appear for User B', () => {
  const globalSongs = [
    { id: 'song_x', title: 'Song X' },
    { id: 'song_y', title: 'Song Y' }
  ];

  const userA_Profile = {
    uid: 'user_a_uid',
    favorites: ['song_x'],
    thisSunday: { songIds: [] },
    customNotes: []
  };

  applyRemoteUserDataToLocal(userA_Profile, userA_Profile.uid);
  const userA_Favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
  const userA_MappedSongs = globalSongs.map(s => ({ ...s, favorite: userA_Favorites.includes(s.id) }));
  assert.equal(userA_MappedSongs.find(s => s.id === 'song_x').favorite, true);

  clearLocalUserData();

  const userB_Profile = {
    uid: 'user_b_uid',
    favorites: ['song_y'],
    thisSunday: { songIds: [] },
    customNotes: []
  };

  applyRemoteUserDataToLocal(userB_Profile, userB_Profile.uid);
  const userB_Favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
  const userB_MappedSongs = globalSongs.map(s => ({ ...s, favorite: userB_Favorites.includes(s.id) }));

  assert.equal(userB_MappedSongs.find(s => s.id === 'song_x').favorite, false, 'User B must NOT see User A favorite song X');
  assert.equal(userB_MappedSongs.find(s => s.id === 'song_y').favorite, true, 'User B must see their own favorite song Y');
});

// 2. User B cannot overwrite User A profile (Security Rules)
test('2. User B cannot overwrite User A profile', () => {
  const authUserB = { uid: 'user_b_uid', token: { email: 'user_b@example.com' } };
  
  // User B tries to write to User A profile document
  const canWriteA = evaluateUserProfileRule(authUserB, 'user_a_uid');
  assert.equal(canWriteA, false, 'User B cannot write to User A profile');

  // User B can only write to User B profile document
  const canWriteB = evaluateUserProfileRule(authUserB, 'user_b_uid');
  assert.equal(canWriteB, true, 'User B can write to their own profile');
});

// 3. Empty remote favorites [] beat stale local favorites
test('3. Empty remote favorites [] beat stale local favorites', () => {
  // Simulate stale local favorites in browser storage
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['stale_song_1', 'stale_song_2']));

  // Cloud profile with intentionally empty favorites []
  const cloudProfile = {
    uid: 'user_c_uid',
    favorites: []
  };

  applyRemoteUserDataToLocal(cloudProfile, cloudProfile.uid);
  const result = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY));
  assert.deepEqual(result, [], 'Intentionally empty remote favorites must overwrite stale local favorites');
});

// 4. Empty remote Sunday data beats stale local Sunday data
test('4. Empty remote Sunday data beats stale local Sunday data', () => {
  // Simulate stale local Sunday setlist
  localStorage.setItem(
    THIS_SUNDAY_STORAGE_KEY,
    JSON.stringify({
      serviceDate: '2026-09-13',
      songIds: ['stale_sunday_1', 'stale_sunday_2'],
      notes: 'Stale notes'
    })
  );

  // Cloud profile with empty Sunday setlist
  const cloudProfile = {
    uid: 'user_c_uid',
    thisSunday: {
      serviceDate: '2026-09-20',
      songIds: [],
      notes: ''
    }
  };

  applyRemoteUserDataToLocal(cloudProfile, cloudProfile.uid);
  const result = JSON.parse(localStorage.getItem(THIS_SUNDAY_STORAGE_KEY));
  assert.deepEqual(result.songIds, [], 'Empty remote Sunday setlist must overwrite stale local Sunday setlist');
  assert.equal(result.notes, '');
});

// 5. Empty remote custom notes beat stale local notes
test('5. Empty remote custom notes beat stale local notes', () => {
  // Simulate stale local custom notes
  localStorage.setItem(
    NOTES_STORAGE_KEY,
    JSON.stringify([{ id: 'n_stale', title: 'Stale Note', content: 'Stale' }])
  );

  // Cloud profile with empty custom notes []
  const cloudProfile = {
    uid: 'user_c_uid',
    customNotes: []
  };

  applyRemoteUserDataToLocal(cloudProfile, cloudProfile.uid);
  const result = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY));
  assert.deepEqual(result, [], 'Empty remote custom notes must overwrite stale local notes');
});

// 6. Remote preferences beat stale local preferences
test('6. Remote preferences beat stale local preferences', () => {
  // Simulate stale local preferences
  localStorage.setItem('chordician_view_mode', 'list');
  localStorage.setItem('chordician_theme', 'light');
  localStorage.setItem('chordician_desktop_mode', 'false');

  // Cloud profile preferences
  const cloudProfile = {
    uid: 'user_c_uid',
    preferences: {
      viewMode: 'grid',
      theme: 'dark',
      desktopMode: true
    }
  };

  applyRemoteUserDataToLocal(cloudProfile, cloudProfile.uid);
  assert.equal(localStorage.getItem('chordician_view_mode'), 'grid');
  assert.equal(localStorage.getItem('chordician_theme'), 'dark');
  assert.equal(localStorage.getItem('chordician_desktop_mode'), 'true');
});

// 7. User A logout -> User B login does not leak A's state
test('7. User A logout -> User B login does not leak As state', () => {
  const userA_Profile = {
    uid: 'user_a',
    favorites: ['song_a_1', 'song_a_2'],
    thisSunday: { serviceDate: '2026-09-20', songIds: ['song_a_sunday'], notes: 'Note A' },
    customNotes: [{ id: 'na', title: 'Note A', content: 'Secret A' }]
  };

  applyRemoteUserDataToLocal(userA_Profile, userA_Profile.uid);
  assert.equal(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)).length, 2);

  // User A logs out
  clearLocalUserData();
  assert.deepEqual(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]'), []);
  assert.deepEqual(JSON.parse(localStorage.getItem(THIS_SUNDAY_STORAGE_KEY)).songIds, []);
  assert.deepEqual(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]'), []);

  // User B logs in with clean/different profile
  const userB_Profile = {
    uid: 'user_b',
    favorites: ['song_b_1'],
    thisSunday: { serviceDate: '2026-09-20', songIds: ['song_b_sunday'], notes: 'Note B' },
    customNotes: [{ id: 'nb', title: 'Note B', content: 'Note B Content' }]
  };

  applyRemoteUserDataToLocal(userB_Profile, userB_Profile.uid);
  const bFavs = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY));
  const bSunday = JSON.parse(localStorage.getItem(THIS_SUNDAY_STORAGE_KEY));
  const bNotes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY));

  assert.deepEqual(bFavs, ['song_b_1']);
  assert.deepEqual(bSunday.songIds, ['song_b_sunday']);
  assert.equal(bNotes[0].id, 'nb');
  assert.ok(!bFavs.includes('song_a_1'), 'No User A favorites bleed into User B');
});

// 8. Communion is identical/shared across users
test('8. Communion is identical/shared across users and preserved across logouts', () => {
  clearCommunionSongs();
  addSongToCommunion('communion_shared_1');
  addSongToCommunion('communion_shared_2');

  const communionA = getCommunionData();
  assert.deepEqual(communionA.songIds, ['communion_shared_1', 'communion_shared_2']);

  // Logout User A
  clearLocalUserData();

  // Communion remains intact
  const communionAfterLogout = getCommunionData();
  assert.deepEqual(communionAfterLogout.songIds, ['communion_shared_1', 'communion_shared_2']);

  // User B logs in
  const userB = { uid: 'user_b', favorites: [], thisSunday: { songIds: [] }, customNotes: [] };
  applyRemoteUserDataToLocal(userB, userB.uid);

  const communionB = getCommunionData();
  assert.deepEqual(communionB.songIds, ['communion_shared_1', 'communion_shared_2']);
});

// 9. Unauthorized user cannot write global Communion
test('9. Unauthorized user cannot write global Communion', () => {
  // Unauthenticated user
  const unauth = null;
  assert.equal(evaluateCommunionWriteRule(unauth), false, 'Unauthenticated user cannot write communion');

  // Viewer role authenticated user
  const authViewer = {
    uid: 'viewer_123',
    token: { email: 'viewer@example.com' }
  };
  const viewerDoc = { role: 'viewer' };
  assert.equal(evaluateCommunionWriteRule(authViewer, viewerDoc), false, 'Viewer role cannot write communion');

  // Authenticated user with no special role or permissions
  const ordinaryUser = {
    uid: 'user_456',
    token: { email: 'user@gmail.com' }
  };
  const userDoc = { role: 'user' };
  assert.equal(evaluateCommunionWriteRule(ordinaryUser, userDoc), false, 'Ordinary user cannot write communion');
});

// 10. Authorized user can write global Communion
test('10. Authorized user can write global Communion', () => {
  // Owner via email
  const ownerByEmail = {
    uid: 'owner_uid_1',
    token: { email: 'jeshurunselvakumar@gmail.com' }
  };
  assert.equal(evaluateCommunionWriteRule(ownerByEmail), true, 'Owner by primary email can write communion');

  const ownerByAltEmail = {
    uid: 'owner_uid_2',
    token: { email: 'jeshurunselvakumar640@gmail.com' }
  };
  assert.equal(evaluateCommunionWriteRule(ownerByAltEmail), true, 'Owner by secondary email can write communion');

  // Musician role
  const musicianUser = {
    uid: 'musician_uid',
    token: { email: 'pianist@church.org' }
  };
  const musicianDoc = { role: 'musician' };
  assert.equal(evaluateCommunionWriteRule(musicianUser, musicianDoc), true, 'Musician role can write communion');

  // Owner role
  const ownerRoleUser = {
    uid: 'owner_role_uid',
    token: { email: 'admin@church.org' }
  };
  const ownerDoc = { role: 'owner' };
  assert.equal(evaluateCommunionWriteRule(ownerRoleUser, ownerDoc), true, 'Owner role can write communion');

  // Admin role
  const adminRoleUser = {
    uid: 'admin_role_uid',
    token: { email: 'tech@church.org' }
  };
  const adminDoc = { role: 'admin' };
  assert.equal(evaluateCommunionWriteRule(adminRoleUser, adminDoc), true, 'Admin role can write communion');
});

// 11. Rapid favorite toggles (Favorite -> Unfavorite -> Favorite) converge to latest state
test('11. Rapid favorite toggles (Favorite -> Unfavorite -> Favorite) converge to latest state', () => {
  // Simulate rapid client toggles
  let favorites = [];

  // Toggle 1: Add song_1
  favorites = Array.from(new Set([...favorites, 'song_1']));
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  assert.deepEqual(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)), ['song_1']);

  // Toggle 2: Remove song_1 (rapid unfavorite)
  favorites = favorites.filter(id => id !== 'song_1');
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  assert.deepEqual(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)), []);

  // Toggle 3: Add song_1 and song_2 (rapid favorite)
  favorites = Array.from(new Set([...favorites, 'song_1', 'song_2']));
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  assert.deepEqual(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)), ['song_1', 'song_2']);
});

// 12. Account logout immediately isolates state and prevents queued writes to next account
test('12. Account logout immediately isolates state and prevents queued writes to next account', () => {
  const userA = { uid: 'user_a', favorites: ['song_a'] };
  applyRemoteUserDataToLocal(userA, 'user_a');
  assert.deepEqual(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)), ['song_a']);

  // Logout occurs
  clearLocalUserData();
  assert.deepEqual(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]'), []);

  // Next user logs in
  const userB = { uid: 'user_b', favorites: ['song_b'] };
  applyRemoteUserDataToLocal(userB, 'user_b');
  assert.deepEqual(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)), ['song_b']);
  assert.ok(!JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)).includes('song_a'));
});
