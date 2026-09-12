import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  computeLevenshteinDistance,
  computeStringSimilarity,
  findPotentialDuplicateSong
} from '../../utils/duplicateDetection.js';

test('Duplicate Detection - Text Normalization', () => {
  assert.equal(normalizeText('  Ennai   Nadathum  Deva  '), 'ennai nadathum deva');
  assert.equal(normalizeText('Yesu Podhum (He is Enough)'), 'yesu podhum he is enough');
  assert.equal(normalizeText('Athisayam Seikiravar! - Live'), 'athisayam seikiravar live');
  assert.equal(normalizeText('Café Worship'), 'cafe worship');
  assert.equal(normalizeText(''), '');
  assert.equal(normalizeText(null), '');
});

test('Duplicate Detection - Levenshtein Distance & Similarity Calculation', () => {
  // Exact match
  assert.equal(computeStringSimilarity('Ennai Nadathum Deva', 'Ennai Nadathum Deva'), 1.0);
  assert.equal(computeStringSimilarity('ennai nadathum deva', 'Ennai Nadathum Deva'), 1.0);
  assert.equal(computeStringSimilarity('EnnaiNadathumDeva', 'Ennai Nadathum Deva'), 1.0);

  // Minor single-char typo in 20-char string: "Ennai Nadathum Dheva" vs "Ennai Nadathum Deva"
  // "ennai nadathum dheva" (len 20) vs "ennai nadathum deva" (len 19) -> dist 1 -> sim = 1 - 1/20 = 0.95
  const typoSim = computeStringSimilarity('Ennai Nadathum Dheva', 'Ennai Nadathum Deva');
  assert.ok(typoSim >= 0.95, `Expected typoSim (${typoSim}) >= 0.95`);

  // Partial overlap (< 95%): "Aaraathanai Umakkae" vs "Aaraathanai Yesuvalke"
  const partialSim = computeStringSimilarity('Aaraathanai Umakkae', 'Aaraathanai Yesuvalke');
  assert.ok(partialSim < 0.95, `Expected partialSim (${partialSim}) < 0.95`);

  // Completely different strings
  const diffSim = computeStringSimilarity('Jesus Loves Me', 'Holy Spirit Come');
  assert.ok(diffSim < 0.5, `Expected diffSim (${diffSim}) < 0.5`);

  // Short words (false positive prevention): "Holy" vs "Hold" -> dist 1, len 4 -> 0.75 < 0.95
  const shortSim = computeStringSimilarity('Holy', 'Hold');
  assert.equal(shortSim, 0.75);
  assert.ok(shortSim < 0.95, `Expected shortSim (${shortSim}) < 0.95`);
});

test('Duplicate Detection - 4-Way Combinatorial Matching', () => {
  const existingLibrary = [
    {
      id: 'song_1',
      title: 'Ennai Nadathum Deva',
      secondaryTitle: 'Lead Me Oh Lord',
      originalKey: 'D',
      artist: 'Gersson Edinbaro',
      category: 'Worship'
    },
    {
      id: 'song_2',
      title: 'Miracle Worker',
      secondaryTitle: 'Athisayam Seikiravar',
      originalKey: 'G',
      artist: 'Unknown',
      category: 'Praise'
    },
    {
      id: 'song_3',
      title: 'Maravaamal Ninaiththeeraiyaa',
      secondaryTitle: null,
      originalKey: 'Dm',
      artist: 'Fr. Berchmans',
      category: 'Worship'
    }
  ];

  // 1. Combination 1: New Title -> Existing Title
  const match1 = findPotentialDuplicateSong(
    { title: 'Ennai Nadathum Deva' },
    existingLibrary,
    0.95
  );
  assert.equal(match1.isDuplicate, true);
  assert.equal(match1.matchedSong.id, 'song_1');
  assert.equal(match1.matchPercentage, 100);
  assert.equal(match1.matchedField, 'title_to_title');

  // 2. Combination 2: New Title -> Existing Subtitle
  const match2 = findPotentialDuplicateSong(
    { title: 'Lead Me Oh Lord' },
    existingLibrary,
    0.95
  );
  assert.equal(match2.isDuplicate, true);
  assert.equal(match2.matchedSong.id, 'song_1');
  assert.equal(match2.matchPercentage, 100);
  assert.equal(match2.matchedField, 'title_to_subtitle');

  // 3. Combination 3: New Subtitle -> Existing Title
  const match3 = findPotentialDuplicateSong(
    { title: 'Unrelated English Title', secondaryTitle: 'Maravaamal Ninaiththeeraiyaa' },
    existingLibrary,
    0.95
  );
  assert.equal(match3.isDuplicate, true);
  assert.equal(match3.matchedSong.id, 'song_3');
  assert.equal(match3.matchPercentage, 100);
  assert.equal(match3.matchedField, 'subtitle_to_title');

  // 4. Combination 4: New Subtitle -> Existing Subtitle
  const match4 = findPotentialDuplicateSong(
    { title: 'New Song Name', secondaryTitle: 'Athisayam Seikiravar' },
    existingLibrary,
    0.95
  );
  assert.equal(match4.isDuplicate, true);
  assert.equal(match4.matchedSong.id, 'song_2');
  assert.equal(match4.matchPercentage, 100);
  assert.equal(match4.matchedField, 'subtitle_to_subtitle');

  // 5. Non-duplicate check (< 95%)
  const nonMatch = findPotentialDuplicateSong(
    { title: 'Aaraathanai Umakkae', secondaryTitle: 'Worship Unto You' },
    existingLibrary,
    0.95
  );
  assert.equal(nonMatch.isDuplicate, false);
  assert.equal(nonMatch.matchedSong, null);

  // 6. excludeSongId parameter test
  const excludedMatch = findPotentialDuplicateSong(
    { title: 'Ennai Nadathum Deva' },
    existingLibrary,
    0.95,
    'song_1' // Exclude song_1
  );
  assert.equal(excludedMatch.isDuplicate, false);
});
