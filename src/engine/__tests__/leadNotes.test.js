import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  hasMeaningfulLead,
  getStoredLeadNotes,
  addSongToLeadNotes,
  removeSongFromLeadNotes
} from '../../services/leadNotesService.js';

import {
  applyRemoteUserDataToLocal,
  clearLocalUserData,
  LEAD_NOTES_STORAGE_KEY
} from '../../services/userSyncService.js';

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

describe('Lead Notes Feature Tests', () => {
  // 1. Song with meaningful Lead in rows -> eligible
  test('1. Song with meaningful Lead in rows -> eligible', () => {
    const songWithLead = {
      id: 'song_1',
      title: 'Ennullam Engum',
      sections: [
        {
          name: 'Verse 1',
          rows: [
            { type: 'chords', content: 'D    G' },
            { type: 'lyrics', content: 'Ennullam engum' },
            { type: 'lead', content: 'D4 E4 F#4 G4' }
          ]
        }
      ]
    };
    assert.equal(hasMeaningfulLead(songWithLead), true);
  });

  // 2. Song with empty Lead string / whitespace -> not eligible
  test('2. Song with empty Lead string / whitespace -> not eligible', () => {
    const songWithEmptyLead = {
      id: 'song_2',
      title: 'Empty Lead Song',
      sections: [
        {
          name: 'Verse 1',
          rows: [
            { type: 'chords', content: 'D    G' },
            { type: 'lyrics', content: 'Ennullam engum' },
            { type: 'lead', content: '   ' }
          ]
        }
      ]
    };
    assert.equal(hasMeaningfulLead(songWithEmptyLead), false);
  });

  // 3. Song without Lead rows -> not eligible
  test('3. Song without Lead rows -> not eligible', () => {
    const songWithoutLead = {
      id: 'song_3',
      title: 'Regular Song',
      sections: [
        {
          name: 'Chorus',
          rows: [
            { type: 'chords', content: 'C    F    G' },
            { type: 'lyrics', content: 'Alleluia praise the Lord' }
          ]
        }
      ]
    };
    assert.equal(hasMeaningfulLead(songWithoutLead), false);
  });

  // 4. Multi-section song with Lead in second section -> eligible
  test('4. Multi-section song with Lead in second section -> eligible', () => {
    const multiSectionSong = {
      id: 'song_4',
      title: 'Multi Section Song',
      sections: [
        {
          name: 'Intro',
          rows: [
            { type: 'chords', content: 'Am  F  C  G' }
          ]
        },
        {
          name: 'Solo',
          rows: [
            { type: 'lead', content: 'A4 B4 C5 D5 E5' }
          ]
        }
      ]
    };
    assert.equal(hasMeaningfulLead(multiSectionSong), true);
  });

  // 5. Prevent duplicate adds in addSongToLeadNotes
  test('5. Prevent duplicate adds in addSongToLeadNotes', () => {
    localStorage.clear();
    const res1 = addSongToLeadNotes('song_lead_1');
    assert.deepEqual(res1, ['song_lead_1']);

    const res2 = addSongToLeadNotes('song_lead_1');
    assert.deepEqual(res2, ['song_lead_1'], 'Duplicate add must not create duplicate entries');
    assert.equal(getStoredLeadNotes().length, 1);
  });

  // 6. Removal from removeSongFromLeadNotes works
  test('6. Removal from removeSongFromLeadNotes works', () => {
    localStorage.clear();
    addSongToLeadNotes('song_a');
    addSongToLeadNotes('song_b');
    assert.deepEqual(getStoredLeadNotes(), ['song_a', 'song_b']);

    const afterRemove = removeSongFromLeadNotes('song_a');
    assert.deepEqual(afterRemove, ['song_b']);
    assert.deepEqual(getStoredLeadNotes(), ['song_b']);
  });

  // 7. Add after removal works seamlessly
  test('7. Add after removal works seamlessly', () => {
    localStorage.clear();
    addSongToLeadNotes('song_a');
    removeSongFromLeadNotes('song_a');
    assert.deepEqual(getStoredLeadNotes(), []);

    const reAdded = addSongToLeadNotes('song_a');
    assert.deepEqual(reAdded, ['song_a']);
  });

  // 8. Real Account Switching & Per-User Isolation
  test('8. Real Account Switching & Per-User Isolation (User A vs User B)', () => {
    localStorage.clear();

    // User A logs in and has Song X in Lead Notes
    const userA_Profile = {
      uid: 'user_a_uid',
      leadNotes: ['song_x'],
      favorites: [],
      thisSunday: { songIds: [] }
    };
    applyRemoteUserDataToLocal(userA_Profile, userA_Profile.uid);
    assert.deepEqual(getStoredLeadNotes(), ['song_x']);

    // User A logs out -> clearLocalUserData resets state
    clearLocalUserData();
    assert.deepEqual(getStoredLeadNotes(), []);

    // User B logs in and has Song Y in Lead Notes
    const userB_Profile = {
      uid: 'user_b_uid',
      leadNotes: ['song_y'],
      favorites: [],
      thisSunday: { songIds: [] }
    };
    applyRemoteUserDataToLocal(userB_Profile, userB_Profile.uid);
    const userB_Lead = getStoredLeadNotes();

    assert.equal(userB_Lead.includes('song_x'), false, 'User B must NOT see User A lead note song X');
    assert.equal(userB_Lead.includes('song_y'), true, 'User B must see their own lead note song Y');

    // User B logs out -> User A logs back in
    clearLocalUserData();
    applyRemoteUserDataToLocal(userA_Profile, userA_Profile.uid);
    assert.deepEqual(getStoredLeadNotes(), ['song_x'], 'User A must see song X restored upon returning');
  });

  // 9. Lead data itself on song object is never mutated by add/remove operations
  test('9. Lead data itself on song object is never mutated by add/remove operations', () => {
    localStorage.clear();
    const originalSong = {
      id: 'song_immutable_lead',
      title: 'Original Song',
      sections: [
        {
          name: 'Verse',
          rows: [
            { type: 'chords', content: 'G  C  D' },
            { type: 'lyrics', content: 'Test lyrics' },
            { type: 'lead', content: 'G4 A4 B4 C5' }
          ]
        }
      ]
    };

    const songDeepCopy = JSON.parse(JSON.stringify(originalSong));

    addSongToLeadNotes(originalSong.id);
    removeSongFromLeadNotes(originalSong.id);

    assert.deepEqual(originalSong, songDeepCopy, 'Song object structure and content must remain strictly untouched');
  });
});
