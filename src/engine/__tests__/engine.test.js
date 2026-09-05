/**
 * Comprehensive Test Suite for Chordician Song Parsing Engine.
 */

import {
  parseSong,
  parseSmartPaste,
  tokenizeLine,
  isChord,
  isChordLine,
  buildAlignedChordString,
  normalizeChordString
} from '../index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}\n    Expected: ${JSON.stringify(expected)}\n    Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

console.log('\n=== RUNNING CHORDICIAN ENGINE TEST SUITE ===\n');

// Test 1: Attached Chord + English Lyric ("DmAmazing Grace")
console.log('--- Test 1: Attached Chord + English Lyric ---');
const t1 = tokenizeLine('DmAmazing Grace');
assertEqual(t1.lyrics, 'Amazing Grace', 'Lyrics separated correctly');
assertEqual(t1.chords.length, 1, 'Found 1 chord');
assertEqual(t1.chords[0].chord, 'Dm', 'Chord is Dm');
assertEqual(t1.chords[0].position, 0, 'Chord position is 0');

// Test 2: Attached Chords + Tamil Unicode ("Dmமறவாமல் நினைத்தீரையாAmA#")
console.log('\n--- Test 2: Attached Chords + Tamil Unicode ---');
const t2 = tokenizeLine('Dmமறவாமல் நினைத்தீரையாAmA#');
assertEqual(t2.lyrics, 'மறவாமல் நினைத்தீரையா', 'Tamil lyrics extracted cleanly');
assertEqual(t2.chords.length, 3, 'Found 3 chords (Dm, Am, A#)');
assertEqual(t2.chords[0].chord, 'Dm', 'First chord is Dm at pos 0');
assertEqual(t2.chords[0].position, 0, 'Dm pos 0');
assertEqual(t2.chords[1].chord, 'Am', 'Second chord is Am at pos 21');
assertEqual(t2.chords[2].chord, 'A#', 'Third chord is A# at pos 21');

// Test 3: Inline Bracketed Chords ("[Dm]Amazing Grace [Am]How sweet")
console.log('\n--- Test 3: Inline Bracketed Chords ---');
const t3 = tokenizeLine('[Dm]Amazing Grace [Am]How sweet');
assertEqual(t3.lyrics, 'Amazing Grace How sweet', 'Bracketed lyrics cleaned');
assertEqual(t3.chords.length, 2, 'Found 2 bracketed chords');
assertEqual(t3.chords[0].chord, 'Dm', 'First chord is Dm');
assertEqual(t3.chords[0].position, 0, 'Dm at position 0');
assertEqual(t3.chords[1].chord, 'Am', 'Second chord is Am');
assertEqual(t3.chords[1].position, 14, 'Am at position 14');

// Test 4: Two-Line Chord Sheet with Horizontal Whitespace Alignment
console.log('\n--- Test 4: Two-Line Chord Sheet Alignment ---');
const t4Raw = `Dm              Am
Amazing Grace how sweet the sound`;
const t4Parsed = parseSong(t4Raw);
assertEqual(t4Parsed.sections.length, 1, 'Single section parsed');
const t4Line = t4Parsed.sections[0].lines[0];
assertEqual(t4Line.lyrics, 'Amazing Grace how sweet the sound', 'Lyric line matched');
assertEqual(t4Line.chords.length, 2, 'Found 2 chords');
assertEqual(t4Line.chords[0].chord, 'Dm', 'First chord is Dm');
assertEqual(t4Line.chords[0].position, 0, 'Dm at position 0');
assertEqual(t4Line.chords[1].chord, 'Am', 'Second chord is Am');
assertEqual(t4Line.chords[1].position, 16, 'Am at position 16');

// Test 5: Section Detection (Verse 1, Chorus, Pallavi, சரணம்)
console.log('\n--- Test 5: Section Detection ---');
const t5Raw = `[Verse 1]
C             F
This is verse one

[Chorus]
G             C
This is chorus

பல்லவி
F             C
Tamil pallavi

சரணம் 1
Dm            Am
Tamil charanam`;
const t5Parsed = parseSong(t5Raw);
assertEqual(t5Parsed.sections.length, 4, 'Detected 4 distinct sections');
assertEqual(t5Parsed.sections[0].name, 'Verse 1', 'Section 1 is Verse 1');
assertEqual(t5Parsed.sections[1].name, 'Chorus', 'Section 2 is Chorus');
assertEqual(t5Parsed.sections[2].name, 'Chorus (Pallavi)', 'Section 3 formatted as Chorus (Pallavi)');
assertEqual(t5Parsed.sections[3].name, 'Verse 1 (Charanam)', 'Section 4 formatted as Verse 1 (Charanam)');

// Test 6: Purge Transpose Button Ladders & Web Noise
console.log('\n--- Test 6: Transpose Note Ladder & Noise Purge ---');
const t6Raw = `   F
4/4
Aaraathippaen Naan Aaraathippaen Chords
A
A
A
B
B
C
C
D
D
D
E
E
F
F
G
G
G

[Verse 1]
F                  Bb
Aaraathippaen Naan Aaraathippaen
C                  F
Aandavar Yesuvaik Kaalamaellaam`;
const t6Result = parseSmartPaste(t6Raw);
assert(t6Result.success, 'Smart paste succeeded');
assertEqual(t6Result.song.title, 'Aaraathippaen Naan Aaraathippaen', 'Title extracted without "Chords" suffix');
assertEqual(t6Result.song.originalKey, 'F', 'Original key detected as F');
assertEqual(t6Result.song.timeSignature, '4/4', 'Time signature detected as 4/4');
assertEqual(t6Result.song.sections.length, 1, 'Noise stripped; only Verse 1 remains');
assertEqual(t6Result.song.sections[0].rows.length, 4, 'Verse 1 has 4 rows (2 chord + 2 lyric)');
assertEqual(t6Result.song.sections[0].rows[1].content, 'Aaraathippaen Naan Aaraathippaen', 'Clean lyric row 1');

// Test 7: English Transliteration with Repetition Markers
console.log('\n--- Test 7: Transliterated Lyrics with Repetition Markers ---');
const t7Raw = `E       A      E   B
Pani Pe Chalta Hai
E        A        E   B
Bheed Ko Khilata Hai ...X2`;
const t7Parsed = parseSong(t7Raw);
assertEqual(t7Parsed.sections[0].lines[1].lyrics, 'Bheed Ko Khilata Hai ...X2', 'Repeat marker ...X2 preserved');

// Test 8: Hindi / Devanagari Lyrics
console.log('\n--- Test 8: Hindi / Devanagari Lyrics ---');
const t8Raw = `[Chorus]
E                  A
कौन है राजाओं का राजा
E                  A
कौन है दुनिया का बादशाह`;
const t8Parsed = parseSong(t8Raw);
assertEqual(t8Parsed.sections[0].lines[0].lyrics, 'कौन है राजाओं का राजा', 'Devanagari lyric preserved');
assertEqual(t8Parsed.sections[0].lines[0].chords.length, 2, '2 chords paired with Devanagari line');

// Test 9: Multiple Consecutive Chords (AmA#Lyrics)
console.log('\n--- Test 9: Multiple Consecutive Chords ---');
const t9 = tokenizeLine('AmA#Lyrics');
assertEqual(t9.lyrics, 'Lyrics', 'Lyrics is "Lyrics"');
assertEqual(t9.chords.length, 2, 'Found 2 chords');
assertEqual(t9.chords[0].chord, 'Am', 'First chord Am');
assertEqual(t9.chords[0].position, 0, 'Am position 0');
assertEqual(t9.chords[1].chord, 'A#', 'Second chord A#');
assertEqual(t9.chords[1].position, 0, 'A# position 0');

// Test 10: Slash and Composite Chords (C7/Am, G/B, D/F#, C/E)
console.log('\n--- Test 10: Slash & Composite Chords ---');
assert(isChord('C7/Am', true), 'C7/Am is a valid composite chord');
assert(isChord('G/B', true), 'G/B is a valid slash chord');
assert(isChord('D/F#', true), 'D/F# is a valid slash chord');
assert(isChord('C/E', true), 'C/E is a valid slash chord');
assert(isChord('F#/A#', true), 'F#/A# is a valid slash chord');
const t10Raw = `C7/Am          G/B
Amazing Grace how sweet`;
const t10Parsed = parseSong(t10Raw);
assertEqual(t10Parsed.sections[0].lines[0].chords[0].chord, 'C7/Am', 'C7/Am parsed as single chord unit');
assertEqual(t10Parsed.sections[0].lines[0].chords[1].chord, 'G/B', 'G/B parsed as single chord unit');

console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
  process.exit(1);
}
