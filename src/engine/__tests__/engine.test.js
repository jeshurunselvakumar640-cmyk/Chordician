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

// Test 11: Real-World Import with Empty Bracket Markers [] and Trailing Website Junk
console.log('\n--- Test 11: Real-World Tamil/Transliterated Import with [] Anchors ---');
const t11Raw = `   F
4/4
Aaraathippaen Naan Aaraathippaen Chords
 F         A           C7          F     C               C7             F
[]Aaraathi[]Ppaen Naan[] Aaraathip[]Paen[]Aanndavar Yesu[]Vai Aaraathip[]Paen
 F                               C7 Bb                        F
[]Vallavarae Ummai Aaraathippaen[][]Nallavarae Ummai Aaraathi[]Ppaen...aaraathippaen
 F                                 C7     C               C7             F
[]Parisuththa Ullaththodu Aaraathi[]Ppaen[]Panninthu Kuni[]Nthu Aaraathi[]Ppaen...aaraathippaen
 F                              C7 C              C7             F
[]Aaviyilae Ummai Aaraathippaen[][]Unnmaiyilae Um[]Mai Aaraathip[]Paen...aaraathippaen
 F                             C7 C                C7             F
[]Thootharkalodu Aaraathippaen[][]Sthoththira Pali[]Yodu Aaraathi[]Ppaen...aaraathippaen
 F                                C7 C                C7             F
[]Kaannpavarai Naan Aaraathippaen[][]Kaappavarai Naan[] Aaraathippae[]N...aaraathippaen
 F                               C7    C                C7             F
[]Vennnnaatai Anninthu Aaraathip[]Paen[]Kuruththolai Ae[]Nthi Aaraathi[]Ppaen...aaraathippaen
Aaraathippaen Naan Aaraathippaen Chords Guitar
Aaraathippaen Naan Aaraathippaen Chords for Keyboard, Guitar and Piano
Your Account
Your Favourites
Interactive chord editor`;

const t11Result = parseSmartPaste(t11Raw);
assert(t11Result.success, 'Test 11 smart paste succeeded');
assertEqual(t11Result.song.title, 'Aaraathippaen Naan Aaraathippaen', 'Title extracted cleanly');
assertEqual(t11Result.song.originalKey, 'F', 'Key extracted as F');

// Verify all rows have zero brackets and clean content
const allRows = t11Result.song.sections.flatMap(s => s.rows);
const rowsWithBrackets = allRows.filter(r => r.content.includes('[]') || r.content.includes('[ ]'));
assertEqual(rowsWithBrackets.length, 0, 'Zero empty brackets [] in all generated rows');

// Verify first lyric row is clean
const firstLyricRow = allRows.find(r => r.type === 'lyrics');
assert(firstLyricRow && !firstLyricRow.content.includes('[]'), 'First lyric row has no empty brackets');
assert(firstLyricRow.content.includes('AaraathiPpaen Naan'), 'First lyric contains correct words');

// Test 12: Emoji & Waste Text Purge Test
console.log('\n--- Test 12: Full Emoji & Web Junk Purge ---');
const t12Raw = `🎵🎶🎸 [Chorus] ✝️
E                  A
Kaun Hai, Kaun Hai Rajao Ka Raja 🙏
E                  A
Kaun Hai, Kaun Hai Duniya Ka ❤️
Badhshah 👑
F#m             B
Yeshu Hai Uska  Naam ⭐
F#m              B
Yeshu Hai Uska  Naam 🔔
                 E  E/G#  A  B
Toh Karo Jai Jai Kar 🎉

Interactive chord editor
Leave a Reply
Recent Posts
You May Also Like`;

const t12Result = parseSmartPaste(t12Raw);
assert(t12Result.success, 'Test 12 smart paste succeeded');
const t12AllRows = t12Result.song.sections.flatMap(s => s.rows);
const emojiRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/u;
const rowsWithEmojis = t12AllRows.filter(r => emojiRegex.test(r.content));
assertEqual(rowsWithEmojis.length, 0, 'Zero emojis present in all generated rows');

// Verify junk was stripped
const junkPresent = t12AllRows.some(r => /Interactive chord editor|Leave a Reply|Recent Posts|You May Also Like/i.test(r.content));
assert(!junkPresent, 'Website footer junk properly stopped and stripped');

// Test 13: Header Prefix Splitting and Attached Section Markers
console.log('\n--- Test 13: Section Header Prefix Splitting ---');
const t13Raw = `#intro: [Dm-C-Bdim-Em](X3) [Dm-C-Em]
#hook[Am]Enthan Nambikkai [Em]Neere[Dm]Enthan [Em]Nangooram [Am]Neere (2)
#pre-Chorus[Am]Enthan Maraividam [Dm]Neere[G]Enthan Kedagam [C]Neere
#chorus[Am]Yegovaayeere Neer [Em]Paarththuk Kolveer[Dm]Thevaigal Ellaam [Em]Neer [Am]Sandhippeer
#verse 1[Am]Illaadhavaigalai [Dm]Iruppadhu Pol[G]Azhaiththidum [C]Deivam Neer Allavo (2)`;

const t13Result = parseSmartPaste(t13Raw);
assert(t13Result.success, 'Test 13 smart paste succeeded');
assertEqual(t13Result.song.sections.length, 5, 'Found 5 distinct sections from prefix headers');
assertEqual(t13Result.song.sections[0].name, 'Intro', 'Section 1 is Intro');
assertEqual(t13Result.song.sections[1].name, 'Chorus (Hook)', 'Section 2 is Chorus (Hook)');
assertEqual(t13Result.song.sections[2].name, 'Pre-Chorus', 'Section 3 is Pre-Chorus');
assertEqual(t13Result.song.sections[3].name, 'Chorus', 'Section 4 is Chorus');
assertEqual(t13Result.song.sections[4].name, 'Verse 1', 'Section 5 is Verse 1');

// Test 14: Transliterated Lyrics with Internal Uppercase Vowels
console.log('\n--- Test 14: Transliterated Words with Uppercase Letters ---');
const t14Raw = `Eb                   Bb
என் இயேசு ராஜாவுக்கே
en iyEsu rajavukkE
Bb7                   Eb
எந்நாளும் ஸ்தோத்திரம்
ennaLum sthOththiram
                      Bb  
என்னோடு வாழ்பவர்க்கே
ennOtu vazhpavarkkE`;

const t14Result = parseSmartPaste(t14Raw);
assert(t14Result.success, 'Test 14 smart paste succeeded');
const t14Rows = t14Result.song.sections[0].rows;
const t14Lyrics = t14Rows.filter(r => r.type === 'lyrics').map(r => r.content);
assert(t14Lyrics.includes('en iyEsu rajavukkE'), 'Preserved exact transliterated line without false trailing chord E');
assert(t14Lyrics.includes('ennOtu vazhpavarkkE'), 'Preserved exact transliterated line without false chord E');

// Test 15: Attached Chords Glued to Tamil Unicode Lyrics
console.log('\n--- Test 15: Attached Chords in Tamil Unicode Lyrics ---');
const t15Raw = `Am                              Em
என் பெலணாக கிரிஸ்து இருப்பதினால்எந்த பயமும் எனக்கில்லை
என் பலப்பாக்கத்தில்அவர் துணை நின்றால்
Dm   Em  Am
நான் ஜெய்யம் பெற்றுத் எழும்பிடுவேன்
Chorus
Amஎல் ஷDmத்தை என் தேவமேGஎல் ரCோய் என் தகப்பனேFயேசுDmஎன் ராஜனே (x2)
Verse
AmயேசுEmஎந்நாளும் எழுந்தருளிDmசத்துEmறு வைத்திய வெற்றி தந்தீர் (x2)
Amஎன் கDmண்ணிரின் பல்லட்டாகில்Gகொண்டCாட்டு வேலை ஆக்கினீர் (x2)`;

const t15Result = parseSmartPaste(t15Raw);
assert(t15Result.success, 'Test 15 smart paste succeeded');
assertEqual(t15Result.song.sections.length, 3, 'Detected 3 sections: Verse 1, Chorus, Verse');

const chorusSec = t15Result.song.sections.find(s => s.name === 'Chorus');
assert(chorusSec, 'Chorus section exists');
const chorusChords = chorusSec.rows.find(r => r.type === 'chords');
assert(chorusChords && chorusChords.content.includes('Am') && chorusChords.content.includes('Dm') && chorusChords.content.includes('G') && chorusChords.content.includes('C') && chorusChords.content.includes('F'), 'Chorus contains all attached chords Am, Dm, G, C, F');
const chorusLyric = chorusSec.rows.find(r => r.type === 'lyrics');
assert(chorusLyric && chorusLyric.content.includes('(x2)') && !chorusLyric.content.includes('Am') && !chorusLyric.content.includes('Dm'), 'Chorus lyrics cleanly separated without chord pollution and with (x2) preserved');

const verseSec = t15Result.song.sections.find(s => s.name === 'Verse');
assert(verseSec, 'Verse section exists');
const verseChords = verseSec.rows.filter(r => r.type === 'chords');
assert(verseChords.length >= 2, 'Verse contains at least 2 chord rows');
const verse1Chords = verseChords[0].content;
assert(verse1Chords.includes('Am') && verse1Chords.includes('Em') && verse1Chords.includes('Dm'), 'Verse row 1 contains Am, Em, Dm');

// Test 16: Continuous Chord Stream without Enter/Spaces
console.log('\n--- Test 16: Continuous Chord Stream without Enter/Spaces ---');
const t16Raw = `Cmஇஸ்ரவேலே Bbபயப்பEbடாதேBbநானே உன் தேவன்Cm

Bbவழியும் சத்தியமுEbம்Bbஜீவனும் நானேCm

Cmஉன்னை நானே தெரிந்துBb கொண்டேனே மகனேCm(ளே)Bb CmBbஉன் பெயர் சொல்லி நான்Eb அழைத்தேனேCmGmஒரு போதும் நான் கைவிEbடமாட்டேன்BbCmகைவிடமாட்டேன் வழியும்...வழியும்`;

const t16Result = parseSmartPaste(t16Raw);
assert(t16Result.success, 'Test 16 smart paste succeeded');
assertEqual(t16Result.song.sections.length, 3, 'Partitioned into 3 distinct sections across empty lines');

// Section 1
const sec1 = t16Result.song.sections[0];
assertEqual(sec1.rows.length, 4, 'Section 1 has 4 rows (2 chord + 2 lyric lines)');
assertEqual(sec1.rows[1].content, 'இஸ்ரவேலே பயப்படாதே', 'Section 1 lyric 1 clean');
assertEqual(sec1.rows[3].content, 'நானே உன் தேவன்', 'Section 1 lyric 2 clean');

// Section 2
const sec2 = t16Result.song.sections[1];
assertEqual(sec2.rows.length, 4, 'Section 2 has 4 rows (2 chord + 2 lyric lines)');
assertEqual(sec2.rows[1].content, 'வழியும் சத்தியமும்', 'Section 2 lyric 1 clean');
assertEqual(sec2.rows[3].content, 'ஜீவனும் நானே', 'Section 2 lyric 2 clean');

// Section 3
const sec3 = t16Result.song.sections[2];
assertEqual(sec3.rows[1].content, 'உன்னை நானே தெரிந்து கொண்டேனே மகனே(ளே)', 'Section 3 lyric 1 clean with proper word spacing');
assertEqual(sec3.rows[3].content, 'உன் பெயர் சொல்லி நான் அழைத்தேனே', 'Section 3 lyric 2 clean with proper word spacing');
assertEqual(sec3.rows[5].content, 'ஒரு போதும் நான் கைவிடமாட்டேன்', 'Section 3 lyric 3 clean');
assertEqual(sec3.rows[7].content, 'கைவிடமாட்டேன் வழியும்', 'Section 3 lyric 4 clean');
assertEqual(sec3.rows[8].content, '...வழியும்', 'Section 3 lyric 5 echo clean');

// Test 17: Automatic Title (Tamil/Tanglish) & Musical Key Detection from Lyrics & Chords
console.log('\n--- Test 17: Automatic Tanglish Title & Key Detection ---');

// 17.1: Ethanai Nanmaigal
const ethanaiRaw = `Verse 1
C              F                C                     Bb  C       G7           C
எத்தனை நன்மைகள்எனக்குச் செய்தீர்எப்படி நன்றி சொல்வேன் நான்எப்படி நன்றி சொல்வேன்
C                         Gsus4
நன்றி ராஜா... நன்றி ராஜா..`;

const ethanaiRes = parseSmartPaste(ethanaiRaw);
assert(ethanaiRes.success, 'Ethanai Nanmaigal parsed successfully');
assert(ethanaiRes.song.title.toLowerCase().includes('ethanai nanmaigal'), `Title auto-detected as Tanglish: "${ethanaiRes.song.title}"`);
assertEqual(ethanaiRes.song.originalKey, 'C', 'Root key auto-detected as C');

// 17.2: Uthavi Varum Kanmalai
const uthaviRaw = `Verse 1
G                C                  D   D7                       G
உதவி வரும் கன்மலைநோக்கிப் பார்க்கின்றேன்வானமும் வையமும் படைத்தவரைநான் பார்க்கின்றேன்`;

const uthaviRes = parseSmartPaste(uthaviRaw);
assert(uthaviRes.success, 'Uthavi Varum Kanmalai parsed successfully');
assert(uthaviRes.song.title.toLowerCase().includes('uthavi varum kanmalai'), `Title auto-detected as Tanglish: "${uthaviRes.song.title}"`);
assertEqual(uthaviRes.song.originalKey, 'G', 'Root key auto-detected as G');

// 17.3: Isravelae
assert(t16Result.song.title.toLowerCase().includes('isravelae'), `Isravelae title auto-detected as Tanglish: "${t16Result.song.title}"`);
assertEqual(t16Result.song.originalKey, 'C', 'Root key auto-detected as C for Cm chord');

// 17.4: Explicit Title Preservation
const explicitRaw = `[Verse 1]
[C]Amazing grace, how [F]sweet the [C]sound`;
const explicitRes = parseSmartPaste(explicitRaw, { title: 'Amazing Grace (Custom)' });
assertEqual(explicitRes.song.title, 'Amazing Grace (Custom)', 'Explicit custom title preserved without alteration');
assertEqual(explicitRes.song.originalKey, 'C', 'Key auto-detected as C');

// Test 18: Horizontally Concatenated Two-Line Phrases & Stanza Splitting (Magimai Umakkanro)
console.log('\n--- Test 18: Horizontally Concatenated Phrases & Sections (Magimai Umakkanro) ---');

const magimaiRaw = `F                C           C7     F Bb             F             C F    C      F F7
மகிமை உமக்கன்றோ மாட்சிமை உமக்கன்றோ துதியும் புகழும் ஸ்தோத்திரமும் தூயவர் உமக்கன்றோ
Bb      F       C C7 A F   C         Bb F
ஆராதனை ஆராதனை என் அன்பர் இயேசுவுக்கே
Verse 1
F                               A7                  Bb Gm           C7     Dm        C              Bb F
விலையேறப் பெற்ற உம் இரத்தத்தால் விடுதலை கொடுத்தீர் இராஜாக்களாக லேவியராக உமக்கென தெரிந்து கொண்டீர்`;

const magimaiRes = parseSmartPaste(magimaiRaw);
assert(magimaiRes.success, 'Magimai Umakkanro parsed successfully');
assert(magimaiRes.song.title.toLowerCase().includes('magimai umakkanro'), `Title auto-detected as Tanglish: "${magimaiRes.song.title}"`);
assertEqual(magimaiRes.song.originalKey, 'F', 'Root key auto-detected as F');
assertEqual(magimaiRes.song.sections.length, 3, 'Split into 3 distinct musical sections');

// Section 1 has 4 lines (8 rows)
const mSec1 = magimaiRes.song.sections[0];
assertEqual(mSec1.rows.length, 8, 'Section 1 has 8 rows (4 chord + 4 lyric rows)');
assertEqual(mSec1.rows[1].content, 'மகிமை உமக்கன்றோ', 'Sec 1 lyric line 1');
assertEqual(mSec1.rows[3].content, 'மாட்சிமை உமக்கன்றோ', 'Sec 1 lyric line 2');
assertEqual(mSec1.rows[5].content, 'துதியும் புகழும் ஸ்தோத்திரமும்', 'Sec 1 lyric line 3');
assertEqual(mSec1.rows[7].content, 'தூயவர் உமக்கன்றோ', 'Sec 1 lyric line 4');

// Section 2 has 2 lines (4 rows)
const mSec2 = magimaiRes.song.sections[1];
assertEqual(mSec2.rows.length, 4, 'Section 2 has 4 rows (2 chord + 2 lyric rows)');
assertEqual(mSec2.rows[1].content, 'ஆராதனை ஆராதனை என்', 'Sec 2 lyric line 1');
assertEqual(mSec2.rows[3].content, 'அன்பர் இயேசுவுக்கே', 'Sec 2 lyric line 2');

// Section 3 (Verse 1) has 4 lines (8 rows)
const mSec3 = magimaiRes.song.sections[2];
assertEqual(mSec3.rows.length, 8, 'Section 3 has 8 rows (4 chord + 4 lyric rows)');
assertEqual(mSec3.rows[1].content, 'விலையேறப் பெற்ற உம் இரத்தத்தால்', 'Sec 3 lyric line 1');
assertEqual(mSec3.rows[3].content, 'விடுதலை கொடுத்தீர்', 'Sec 3 lyric line 2');
assertEqual(mSec3.rows[5].content, 'இராஜாக்களாக லேவியராக', 'Sec 3 lyric line 3');
assertEqual(mSec3.rows[7].content, 'உமக்கென தெரிந்து கொண்டீர்', 'Sec 3 lyric line 4');

// --- Test 19: Attached Chords in Continuous Tamil Stream (Idho Manidhargal) ---
console.log('\n--- Test 19: Attached Chords in Continuous Tamil Stream (Idho Manidhargal) ---');
const idhoRaw = `Aஇதோ மனிதர்கள் மத்திDbmயில்Dவாசம் செEய்பவரேAAஎங்கள் நடுவிலே வசித்DbmதிடDவிரும்பிடும் Eதெய்வமே(தேAவனே)

Aஉமக்கு சிங்காசனம் அமைத்திடBmEஉம்மைத் துதிக்கின்றோம் இயேசுவேAAபரிசுத்த அலங்காரத்துBmடனேEஉம்மைத் தொழுகின்றோம் இயேசுவே A

Aஎங்கள் மத்தியில் உலாBmவிடும்...(2)Dஎங்களோடென்றும் வாசம்E செய்யும் A...இதோ மனிதர்கள்`;

const idhoRes = parseSmartPaste(idhoRaw);
assert(idhoRes.success, 'Idho Manidhargal parsed successfully');
assertEqual(idhoRes.song.originalKey, 'A', 'Root key detected as A');
assertEqual(idhoRes.song.sections.length, 3, 'Split into 3 distinct sections');

// Section 1 checks
const idhoSec1 = idhoRes.song.sections[0];
assertEqual(idhoSec1.rows.length, 6, 'Section 1 has 6 rows (3 chord + 3 lyric rows)');
assert(idhoSec1.rows[1].content.includes('இதோ மனிதர்கள் மத்தியில்') && idhoSec1.rows[1].content.includes('செய்பவரே'), 'Sec 1 line 1 lyrics');
assert(idhoSec1.rows[3].content.includes('எங்கள் நடுவிலே வசித்திட'), 'Sec 1 line 2 lyrics');
assert(idhoSec1.rows[5].content.includes('விரும்பிடும் தெய்வமே(தேவனே)'), 'Sec 1 line 3 lyrics');

// Section 2 checks
const idhoSec2 = idhoRes.song.sections[1];
assertEqual(idhoSec2.rows.length, 8, 'Section 2 has 8 rows (4 chord + 4 lyric rows)');
assert(idhoSec2.rows[1].content.includes('உமக்கு சிங்காசனம் அமைத்திட'), 'Sec 2 line 1 lyrics');
assert(idhoSec2.rows[3].content.includes('உம்மைத் துதிக்கின்றோம் இயேசுவே'), 'Sec 2 line 2 lyrics');
assert(idhoSec2.rows[5].content.includes('பரிசுத்த அலங்காரத்துடனே'), 'Sec 2 line 3 lyrics');
assert(idhoSec2.rows[7].content.includes('உம்மைத் தொழுகின்றோம் இயேசுவே'), 'Sec 2 line 4 lyrics');

// Section 3 checks
const idhoSec3 = idhoRes.song.sections[2];
assertEqual(idhoSec3.rows.length, 4, 'Section 3 has 4 rows (2 chord + 2 lyric rows)');
assert(idhoSec3.rows[1].content.includes('எங்கள் மத்தியில் உலாவிடும்...(2)'), 'Sec 3 line 1 lyrics');
assert(idhoSec3.rows[3].content.includes('எங்களோடென்றும் வாசம் செய்யும்'), 'Sec 3 line 2 lyrics');

// --- Test 20: Lead / Melody Notes Lines (Mere Jeevan Mai) ---
console.log('\n--- Test 20: Lead / Melody Notes Lines (Mere Jeevan Mai) ---');
const mereJeevanRaw = `A               G               D               A
Mere Jeevan mai Yeshu tera naam jalal pata rahe
EE      AAA     AC#         BA BG       C# C#BAGA
 
A               G       D               G  D  A
Mera uthna baithna, chalna tujhe bhata rahe..
C# D   EEE     EF#ED    DC#B     BBBDDC#BA
 
Verse 1
A               G               A               G               A
Baimisal hai tu bamisal banu, tu hai kamal mai bhi kamal banu
C# C# C# BA AB AG GAABC#         C# C# C# BA AB AG GAAB C#
A               D               A               D               A
Baimisal hai tu bamisal banu, tu hai kamal mai bhi kamal banu
C#C#C#DEEF#F#F#EDEDC#   DDDDDBGGC#BA
A               G                 D             A
Duniya ka noor hai yeshu meri rahe sajata rahe.
EEA    AAAB B A G       GG C#C# C#C#BAGA
Mera uthna …
Mere jivan mai..`;

const mereJeevanRes = parseSmartPaste(mereJeevanRaw);
assert(mereJeevanRes.success, 'Mere Jeevan Mai parsed successfully');
assertEqual(mereJeevanRes.song.originalKey, 'A', 'Root key detected as A');
assertEqual(mereJeevanRes.song.sections.length, 2, 'Parsed 2 sections');

// Section 1 verification
const sec1Rows = mereJeevanRes.song.sections[0].rows;
assertEqual(sec1Rows.length, 6, 'Section 1 has 6 rows (chords, lyrics, lead triplets)');
assertEqual(sec1Rows[0].type, 'chords', 'Row 1 is chords');
assertEqual(sec1Rows[1].type, 'lyrics', 'Row 2 is lyrics');
assertEqual(sec1Rows[2].type, 'lead', 'Row 3 is lead');
assert(sec1Rows[2].content.includes('EE') && sec1Rows[2].content.includes('C#BAGA'), 'Row 3 contains lead notes');
assertEqual(sec1Rows[3].type, 'chords', 'Row 4 is chords');
assertEqual(sec1Rows[4].type, 'lyrics', 'Row 5 is lyrics');
assertEqual(sec1Rows[5].type, 'lead', 'Row 6 is lead');
assert(sec1Rows[5].content.includes('EF#ED') && sec1Rows[5].content.includes('BBBDDC#BA'), 'Row 6 contains lead notes');

// Section 2 verification
const sec2Rows = mereJeevanRes.song.sections[1].rows;
const leadRowsInSec2 = sec2Rows.filter(r => r.type === 'lead');
assertEqual(leadRowsInSec2.length, 3, 'Section 2 contains 3 lead rows');
assert(leadRowsInSec2[0].content.includes('GAABC#'), 'Sec 2 lead 1 contains GAABC#');
assert(leadRowsInSec2[1].content.includes('C#C#C#DEEF#F#F#EDEDC#'), 'Sec 2 lead 2 contains long note run');
assert(leadRowsInSec2[2].content.includes('EEA') && leadRowsInSec2[2].content.includes('C#C#BAGA'), 'Sec 2 lead 3 contains notes');

console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
  process.exit(1);
}



