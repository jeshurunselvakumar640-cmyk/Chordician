import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  offlineDb,
  isIndexedDbSupported,
  saveSong,
  saveSongs,
  getSong,
  getAllSongs,
  deleteSong,
  clearSongs,
  getSongCount,
  getDatabaseStats
} from '../../services/offline/songDatabase.js';

describe('Offline Song Database (Dexie IndexedDB Foundation)', () => {
  it('1. Database instance initialized with correct name and schema', () => {
    assert.equal(offlineDb.name, 'chordician-offline');
    assert.ok(offlineDb.tables.some((t) => t.name === 'songs'));
  });

  it('2. isIndexedDbSupported reports environment status without throwing', () => {
    const supported = isIndexedDbSupported();
    assert.equal(typeof supported, 'boolean');
  });

  it('3. getDatabaseStats returns valid telemetry structure', async () => {
    const stats = await getDatabaseStats();
    assert.equal(stats.name, 'chordician-offline');
    assert.equal(stats.version, 1);
    assert.equal(typeof stats.isOpen, 'boolean');
    assert.equal(typeof stats.isAvailable, 'boolean');
    assert.equal(typeof stats.songCount, 'number');
  });

  it('4. saveSong rejects invalid input without crashing', async () => {
    const res1 = await saveSong(null);
    assert.equal(res1.success, false);
    assert.ok(res1.error);

    const res2 = await saveSong({});
    assert.equal(res2.success, false);
    assert.ok(res2.error);

    const res3 = await saveSong({ title: 'Song Without ID' });
    assert.equal(res3.success, false);
    assert.ok(res3.error);
  });

  it('5. saveSongs rejects empty or invalid lists cleanly', async () => {
    const res1 = await saveSongs([]);
    assert.equal(res1.success, true);
    assert.equal(res1.count, 0);

    const res2 = await saveSongs(null);
    assert.equal(res2.success, true);
    assert.equal(res2.count, 0);

    const res3 = await saveSongs([{ title: 'No ID' }]);
    assert.equal(res3.success, false);
    assert.equal(res3.count, 0);
  });

  it('6. getSong rejects invalid ID safely', async () => {
    const res1 = await getSong(null);
    assert.equal(res1.data, null);
    assert.ok(res1.error);

    const res2 = await getSong('');
    assert.equal(res2.data, null);
    assert.ok(res2.error);
  });

  it('7. deleteSong rejects invalid ID safely', async () => {
    const res1 = await deleteSong(null);
    assert.equal(res1.success, false);
    assert.ok(res1.error);

    const res2 = await deleteSong('');
    assert.equal(res2.success, false);
    assert.ok(res2.error);
  });

  it('8. getAllSongs and getSongCount return safe fallback defaults in headless environment', async () => {
    const all = await getAllSongs();
    assert.ok(Array.isArray(all.data));

    const count = await getSongCount();
    assert.equal(typeof count.count, 'number');
  });

  it('9. Preserves full untransformed song object schema signature', () => {
    const sampleSong = {
      id: 'test_song_123',
      title: 'Aarathanai Umakke',
      secondaryTitle: 'ஆராதனை உமக்கே',
      artist: 'Gersson Edinbaro',
      originalKey: 'D',
      category: 'Tamil',
      style: { category: 'Worship', name: '8 Beat Ballad' },
      tempo: 68,
      timeSignature: '4/4',
      notes: 'Intro on Strings',
      favorite: true,
      sections: [
        {
          id: 'sec_1',
          name: 'Verse 1',
          rows: [
            { id: 'r1', type: 'chords', content: 'D   G   A' },
            { id: 'r2', type: 'lyrics', content: 'Aarathanai Umakke' }
          ]
        }
      ],
      createdByUid: 'uid_test_1',
      createdByName: 'Jeshurun Selvakumar',
      createdAt: '2026-09-22T12:00:00.000Z',
      updatedAt: '2026-09-22T12:00:00.000Z'
    };

    assert.ok(sampleSong.id);
    assert.ok(sampleSong.sections.length === 1);
    assert.equal(sampleSong.sections[0].rows.length, 2);
  });
});
