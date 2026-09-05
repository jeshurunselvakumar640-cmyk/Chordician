import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { findStyle } from '../../src/data/songStyles.js';
import { buildAlignedChordString } from './chordParser.js';

dotenv.config();

const CHORDEX_TEXT_SYSTEM_INSTRUCTION = `You are Chordex AI, the intelligent song and chord sheet reconstruction engine for Chordician.

Your job is to analyze raw text extracted from a song/chord webpage or smart paste input, understand the musical chords and lyrics, remove all web noise, and RECONSTRUCT it into a clean, professional chord sheet.

CRITICAL RULES:
1. STRUCTURED TWO-LINE INPUT (CHORDS DIRECTLY ABOVE LYRICS):
   - When text already has chords on separate lines positioned above their respective lyrics:
     Example:
     [Chorus]
     E                  A
     Kaun Hai, Kaun Hai Rajao Ka Raja
     - Faithfully pair each chord line with its matching lyric line.
     - Calculate the exact 0-based character horizontal offset where each chord begins above the lyrics (e.g. 'E' at 0, 'A' at 19 above 'Rajao').
     - Handle slash chords and composite/alternative chords (e.g. "C7/Am", "G/Em", "E/G#", "C/E", "G/B", "D/F#", "F#/A#") as single chord units in the chords line (do NOT split them or push either chord into lyrics).
     - Handle trailing/leading chords (e.g. "                 E  E/G#  A  B" above "Toh Karo Jai Jai Kar").
2. ATTACHED / TOUCHING CHORDS (ENGLISH, TAMIL, HINDI & INDIC SCRIPTS):
   - When Latin chord letters (A-G, Am, Dm, Em, F, G, C, Bb, etc.) are embedded or glued directly inside or in front of words without spaces:
     - Example: "Amஎல் ஷDmத்தை என் தேவமேGஎல் ரCோய் என் தகப்பனேFயேசுDmஎன் ராஜனே (x2)"
       => Chords line: "Am" (pos 0), "Dm", "G", "C", "F", "Dm" positioned over their respective words
       => Lyrics line: "எல் ஷத்தை என் தேவமேஎல் ரோய் என் தகப்பனேயேசுஎன் ராஜனே (x2)"
     - Example: "AmயேசுEmஎந்நாளும் எழுந்தருளிDmசத்துEmறு வைத்திய வெற்றி தந்தீர் (x2)"
       => Chords line: "Am" (pos 0), "Em", "Dm", "Em"
       => Lyrics line: "யேசுஎந்நாளும் எழுந்தருளிசத்துறு வைத்திய வெற்றி தந்தீர் (x2)"
     - Example: "DmMaravaamal" => Chord: "Dm" at position 0, Lyrics: "Maravaamal"
     - Example: "AmA#Manathaara" => Chords: "Am" at position 0, "A#" at position 3, Lyrics: "Manathaara"

3. UNFORMATTED CONTINUOUS CHORD STREAMS (WITHOUT ENTER, SPACES, OR ALIGNMENT):
   - When text is pasted as a continuous unformatted stream with chords embedded inside and between phrases:
     Example Input:
     Cmஇஸ்ரவேலே Bbபயப்பEbடாதேBbநானே உன் தேவன்Cm

     Bbவழியும் சத்தியமுEbம்Bbஜீவனும் நானேCm

     Cmஉன்னை நானே தெரிந்துBb கொண்டேனே மகனேCm(ளே)Bb CmBbஉன் பெயர் சொல்லி நான்Eb அழைத்தேனேCmGmஒரு போதும் நான் கைவிEbடமாட்டேன்BbCmகைவிடமாட்டேன் வழியும்...வழியும்

     Expected Output Structure:
     [Section 1 / Chorus / Pallavi]
     Line 1: Chords: "Cm        Bb    Eb", Lyrics: "இஸ்ரவேலே பயப்படாதே"
     Line 2: Chords: "Bb             Cm", Lyrics: "நானே உன் தேவன்"

     [Section 2 / Refrain]
     Line 1: Chords: "Bb              Eb", Lyrics: "வழியும் சத்தியமும்"
     Line 2: Chords: "Bb          Cm", Lyrics: "ஜீவனும் நானே"

     [Section 3 / Verse 1 / Charanam 1]
     Line 1: Chords: "Cm                            Bb                   Cm  Bb Cm", Lyrics: "உன்னை நானே தெரிந்து கொண்டேனே மகனே(ளே)"
     Line 2: Chords: "Bb                     Eb          Cm", Lyrics: "உன் பெயர் சொல்லி நான் அழைத்தேனே"
     Line 3: Chords: "Gm                     Eb          Bb", Lyrics: "ஒரு போதும் நான் கைவிடமாட்டேன்"
     Line 4: Chords: "Cm", Lyrics: "கைவிடமாட்டேன் வழியும்"
     Line 5: Chords: "", Lyrics: "...வழியும்"

   - Critical requirements for continuous streams:
     1. Separate lines and sections at natural poetic and musical phrase boundaries (e.g. at clause breaks, turnaround chords like "Cm(ளே)Bb CmBb", or transition chords like "CmGm", "BbCm").
     2. Restore natural word spacing so words are never jammed together (e.g. "பயப்படாதே நானே", "சத்தியமும் ஜீவனும்", "மகனே(ளே) உன்", "அழைத்தேனே ஒரு", "கைவிடமாட்டேன் கைவிடமாட்டேன்").
     3. Keep chords that appear inside words (e.g. "பயப்பEbடாதே" -> chord "Eb" over "பயப்படாதே", "சத்தியமுEbம்" -> chord "Eb" over "சத்தியமும்", "கைவிEbடமாட்டேன்" -> chord "Eb" over "கைவிடமாட்டேன்") intact over that word, while cleanly healing the word.

4. HORIZONTALLY CONCATENATED MULTI-PHRASE TWO-LINE INPUT:
   - When a chord line and lyric line contain multiple poetic phrases concatenated into a single long horizontal line without line breaks:
     Example Input:
     Verse 1
     G                C                  D   D7                       G
     உதவி வரும் கன்மலைநோக்கிப் பார்க்கின்றேன்வானமும் வையமும் படைத்தவரைநான் பார்க்கின்றேன்
     Verse 2
     G                   C     Am            D7 G          D                 D7 G
     கால்கள் தள்ளாட விடமாட்டார்காக்கும் தேவன் உறங்கமாட்டார்இஸ்ரவேலைக் காக்கிறவர்
     D        B7             G
     எந்நாளும் தூங்க மாட்டார்
     ...உதவி வரும்
     Verse 3
     G                    C       Am            D7  G       D                  D7 G
     கர்த்தர் என்னைக் காக்கின்றார்எனது நிழலாய் இருக்கின்றார்பகலினிலும் இரவினிலும்பாதுகாக்கின்றார்
     ...உதவி வரும்

     Expected Output Structure:
     [Section: Verse 1]
     Line 1: Chords: [{ chord: 'G', position: 0 }], Lyrics: 'உதவி வரும் கன்மலை'
     Line 2: Chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 18 }], Lyrics: 'நோக்கிப் பார்க்கின்றேன்'
     Line 3: Chords: [{ chord: 'D7', position: 0 }], Lyrics: 'வானமும் வையமும் படைத்தவரை'
     Line 4: Chords: [{ chord: 'G', position: 0 }], Lyrics: 'நான் பார்க்கின்றேன்'

     [Section: Verse 2]
     Line 1: Chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 22 }], Lyrics: 'கால்கள் தள்ளாட விடமாட்டார்'
     Line 2: Chords: [{ chord: 'Am', position: 0 }, { chord: 'D7', position: 16 }, { chord: 'G', position: 19 }], Lyrics: 'காக்கும் தேவன் உறங்கமாட்டார்'
     Line 3: Chords: [{ chord: 'D', position: 0 }, { chord: 'D7', position: 19 }, { chord: 'G', position: 22 }], Lyrics: 'இஸ்ரவேலைக் காக்கிறவர்'
     Line 4: Chords: [{ chord: 'D', position: 0 }, { chord: 'B7', position: 9 }, { chord: 'G', position: 24 }], Lyrics: 'எந்நாளும் தூங்க மாட்டார்'
     Line 5: Chords: [], Lyrics: '...உதவி வரும்'

     [Section: Verse 3]
     Line 1: Chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 23 }], Lyrics: 'கர்த்தர் என்னைக் காக்கின்றார்'
     Line 2: Chords: [{ chord: 'Am', position: 0 }, { chord: 'D7', position: 16 }, { chord: 'G', position: 19 }], Lyrics: 'எனது நிழலாய் இருக்கின்றார்'
     Line 3: Chords: [{ chord: 'D', position: 0 }, { chord: 'D7', position: 18 }, { chord: 'G', position: 21 }], Lyrics: 'பகலினிலும் இரவினிலும்'
     Line 4: Chords: [{ chord: 'G', position: 0 }], Lyrics: 'பாதுகாக்கின்றார்'
     Line 5: Chords: [], Lyrics: '...உதவி வரும்'

     Example Input 2:
     Verse 1
     C              F                C                     Bb  C       G7           C
     எத்தனை நன்மைகள்எனக்குச் செய்தீர்எப்படி நன்றி சொல்வேன் நான்எப்படி நன்றி சொல்வேன்
     C                         Gsus44
     நன்றி ராஜா... நன்றி ராஜா..
     Verse 2
     F         C                F        C Bb              F      C
     தாழ்மையில் இருந்தேன் தயவாய் நினைத்தீர்தேவனே உம்மை துதிப்பேன் ... எத்தனை
     Verse 3
     F        C             F    C
     பெலவீனன் என்று தள்ளி விடாமல்
     Bb              F         C
     பெலத்தால் இடைக் கட்டினீர் ... எத்தனை
     Verse 4
     F        C            F         C   Bb          F          C
     பாவத்தினாலே மரித்துப் போய் இருந்தேன்கிருபையால் இரட்சித்தீரே... எத்தனை

     Expected Output Structure:
     [Section: Verse 1]
     Line 1: Chords: [{ chord: 'C', position: 0 }], Lyrics: 'எத்தனை நன்மைகள்'
     Line 2: Chords: [{ chord: 'F', position: 0 }], Lyrics: 'எனக்குச் செய்தீர்'
     Line 3: Chords: [{ chord: 'C', position: 0 }, { chord: 'Bb', position: 24 }], Lyrics: 'எப்படி நன்றி சொல்வேன் நான்'
     Line 4: Chords: [{ chord: 'C', position: 0 }, { chord: 'G7', position: 9 }, { chord: 'C', position: 24 }], Lyrics: 'எப்படி நன்றி சொல்வேன்'
     Line 5: Chords: [{ chord: 'C', position: 0 }, { chord: 'Gsus4', position: 25 }], Lyrics: 'நன்றி ராஜா... நன்றி ராஜா..(4)'

     [Section: Verse 2]
     Line 1: Chords: [{ chord: 'F', position: 0 }, { chord: 'C', position: 10 }, { chord: 'F', position: 27 }, { chord: 'C', position: 36 }], Lyrics: 'தாழ்மையில் இருந்தேன் தயவாய் நினைத்தீர்'
     Line 2: Chords: [{ chord: 'Bb', position: 0 }, { chord: 'F', position: 16 }, { chord: 'C', position: 23 }], Lyrics: 'தேவனே உம்மை துதிப்பேன்'
     Line 3: Chords: [], Lyrics: '... எத்தனை'

     [Section: Verse 3]
     Line 1: Chords: [{ chord: 'F', position: 0 }, { chord: 'C', position: 11 }, { chord: 'F', position: 25 }, { chord: 'C', position: 30 }], Lyrics: 'பெலவீனன் என்று தள்ளி விடாமல்'
     Line 2: Chords: [{ chord: 'Bb', position: 0 }, { chord: 'F', position: 16 }, { chord: 'C', position: 23 }], Lyrics: 'பெலத்தால் இடைக் கட்டினீர்'
     Line 3: Chords: [], Lyrics: '... எத்தனை'

     [Section: Verse 4]
     Line 1: Chords: [{ chord: 'F', position: 0 }, { chord: 'C', position: 9 }, { chord: 'F', position: 23 }, { chord: 'C', position: 33 }], Lyrics: 'பாவத்தினாலே மரித்துப் போய் இருந்தேன்'
     Line 2: Chords: [{ chord: 'Bb', position: 0 }, { chord: 'F', position: 12 }, { chord: 'C', position: 23 }], Lyrics: 'கிருபையால் இரட்சித்தீரே'
     Line 3: Chords: [], Lyrics: '... எத்தனை'

5. INLINE BRACKETED CHORDS:
   - "[C]Amazing grace, how [F]sweet the [C]sound" => Extract bracketed chords with character offsets and strip brackets from lyrics.
   - Preserve non-chord parentheses like "(x2)", "(2)", "(ஆ.....ஆ)" in lyrics.
6. SECTION STRUCTURE & HEADERS:
   - Respect and preserve section headers like "[Chorus]", "[Verse 1]", "[Verse 2]", "[Bridge]", "[Intro]", "[Outro]", "[Pre-Chorus]", "[Ending]".
   - Keep sections in sequential order. If the same section is repeated (e.g. multiple "[Chorus]" blocks), output each section block in order.
7. PRESERVE ORIGINAL LYRICS & MULTI-LANGUAGE TRANSLITERATIONS:
   - Do NOT translate, summarize, or rewrite lyric words.
   - Preserve Hindi, Tamil, Telugu, and English transliterated words, punctuation, and repetition markers (e.g. "Pani Pe Chalta Hai", "Krus Ko Uthaya Hai", "...X2", "(2)", "-2").
8. MUSICAL KEY:
   - Detect the root musical key (e.g. "E", "D", "Dm", "C", "G", "F", "A", "Em", "Cm", "Eb", "Bb").
9. STYLE IDENTIFICATION:
   - If a distinct style (e.g. "Indian -> Dandiya", "Indian -> Bhajan", "Pop & Rock -> 8Beat", "Ballad -> PianoBallad", "Worship -> Contemporary") is recognizable, provide it.
10. DEEP NOISE, EMOJI & CLUTTER PURGE:
   - Completely strip all emoji icons (e.g. 🏠, 🎵, 🎶, ✝️, 🎸, 👍, ❤️, 🙏, 🔔, ⭐, etc.).
   - Completely strip empty anchor brackets (e.g. "[]", "[ ]", "()"). Never output "[]" inside lyrics.
   - Completely strip website navigation, breadcrumbs, search bars, UI labels ("Lyrics", "Chords", "Home", "Share"), social media promotions ("Join WhatsApp group", "Subscribe to YouTube channel", "Follow on Instagram"), advertisement text, chord finger/tab diagrams, author credits, related songs lists, account menus, interactive chord editors, and page footers.
   - If both native script and transliterated versions exist, produce clean organized sections.
   - Retain ONLY authentic song lyrics and positioned chords organized into clean musical sections.

OUTPUT FORMAT: Return ONLY valid JSON matching this schema:
{
  "title": "Clean Song Title",
  "artist": "Artist name or empty string",
  "originalKey": "Musical Key (e.g. E, Dm, D, C, G)",
  "timeSignature": "4/4 or 3/4 or 6/8",
  "style": {
    "category": "Worship",
    "name": "Contemporary"
  },
  "sections": [
    {
      "id": "section-1",
      "type": "chorus",
      "name": "Chorus",
      "lines": [
        {
          "id": "line-1",
          "lyrics": "Kaun Hai, Kaun Hai Rajao Ka Raja",
          "chords": [
            { "chord": "E", "position": 0, "confidence": 0.99 },
            { "chord": "A", "position": 19, "confidence": 0.98 }
          ]
        }
      ]
    }
  ]
}`;

// Cache the fastest working model to eliminate retry overhead on subsequent imports
let cachedFastestModel = 'gemini-3.5-flash-lite';
const FAST_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];

/**
 * Safely parses JSON with auto-repair for trailing brackets/quotes
 */
function safeJsonParse(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') return null;
  const clean = jsonString.replace(/^```json\s*|^```\s*|```$/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (err) {
    let repaired = clean;
    const openQuotes = (repaired.match(/(?<!\\)"/g) || []).length;
    if (openQuotes % 2 !== 0) {
      repaired += '"';
    }

    const stack = [];
    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop();
        }
      }
    }

    while (stack.length > 0) {
      repaired += stack.pop();
    }

    try {
      return JSON.parse(repaired);
    } catch {
      throw err;
    }
  }
}

/**
 * Uses Google Gemini AI to intelligently analyze and reconstruct raw webpage text into clean chord sheets.
 */
export async function analyzeSongTextWithChordexAI(rawText, metadata = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // If we already know a working model, try it first
  const modelCandidateList = cachedFastestModel
    ? [cachedFastestModel, ...FAST_MODELS.filter(m => m !== cachedFastestModel)]
    : FAST_MODELS;

  let lastError = null;

  // Trim raw text to safe token window (focusing on the essential chord sheet content)
  const trimmedInput = (rawText || '').substring(0, 16000);

  const prompt = `Analyze and reconstruct this song chord sheet text into structured sections with chords placed above their lyric positions:

Website Metadata:
- Extracted Title: ${metadata.title || 'Unknown'}
- Extracted Artist: ${metadata.artist || 'Unknown'}
- Extracted Key: ${metadata.originalKey || 'Unknown'}

Raw Webpage Song Content:
"""
${trimmedInput}
"""`;

  for (const modelName of modelCandidateList) {
    try {
      console.log(`[Chordex AI URL] Running reconstruction with model: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: CHORDEX_TEXT_SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const chordexData = safeJsonParse(responseText);
      cachedFastestModel = modelName; // Store working model
      console.log(`[Chordex AI URL] Successfully reconstructed "${chordexData.title || 'Untitled'}" with ${chordexData.sections?.length || 0} sections!`);

      return convertChordexAiToChordician(chordexData, metadata.sourceUrl);
    } catch (err) {
      console.warn(`[Chordex AI URL] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to reconstruct song with Chordex AI.');
}

function removeEmojis(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(
    /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu,
    ''
  );
}

/**
 * Cleans any residual glued chord prefixes, emojis, or empty brackets from lyric words
 */
function cleanLyricString(lyrics, chords = []) {
  if (!lyrics) return '';
  let clean = removeEmojis(lyrics).trim();

  // Remove bracketed notation like [Dm] and empty anchor brackets [] from lyrics
  clean = clean.replace(/\[[A-G][#b]?[^\]\s]*\]|\([A-G][#b]?[^)\s]*\)/g, '').replace(/\[\s*\]|\(\s*\)/g, '').trim();

  // If word starts with chord name glued (e.g. "DmMaravaamal" when chord is Dm)
  for (const c of chords) {
    const chordName = c.chord;
    if (chordName && clean.startsWith(chordName) && clean.length > chordName.length + 2) {
      const remainder = clean.substring(chordName.length);
      if (/^[A-Za-z\u0B80-\u0BFF\u0900-\u097F]/.test(remainder)) {
        clean = remainder;
      }
    }
  }

  return clean;
}

/**
 * Converts Chordex AI structured JSON into Chordician's official song data model.
 */
export function convertChordexAiToChordician(chordexData, sourceUrl = '') {
  if (!chordexData) return null;

  const title = (chordexData.title || '').trim() || 'Imported Song';
  const artist = (chordexData.artist || '').trim() || '';
  const originalKey = chordexData.originalKey ? chordexData.originalKey.replace(/m$/, '') : 'C';

  // Validate style if suggested
  let validatedStyle = null;
  if (chordexData.style && typeof chordexData.style === 'object') {
    const matched = findStyle(chordexData.style.category, chordexData.style.name);
    if (matched) {
      validatedStyle = {
        category: matched.category,
        name: matched.name,
        churchStyleNumber: matched.churchStyleNumber,
        keyboardStyleNumber: matched.keyboardStyleNumber
      };
    }
  }

  const sections = (chordexData.sections || []).map((sec, sIdx) => {
    const sectionName = (sec.name || '').trim() || `Section ${sIdx + 1}`;
    const rows = [];

    (sec.lines || []).forEach((line, lIdx) => {
      const lineLyrics = cleanLyricString(line.lyrics, line.chords || []);
      const lineChords = buildAlignedChordString(line.chords);

      // If line has chords, add chords row
      if (lineChords) {
        rows.push({
          id: `r_${sIdx + 1}_${lIdx * 2 + 1}`,
          type: 'chords',
          content: lineChords
        });
      }

      // If line has lyrics, add lyrics row
      if (lineLyrics) {
        rows.push({
          id: `r_${sIdx + 1}_${lIdx * 2 + 2}`,
          type: 'lyrics',
          content: lineLyrics
        });
      }
    });

    // Fallback if section has no rows
    if (rows.length === 0) {
      rows.push({
        id: `r_${sIdx + 1}_1`,
        type: 'chords',
        content: 'C'
      });
      rows.push({
        id: `r_${sIdx + 1}_2`,
        type: 'lyrics',
        content: ''
      });
    }

    return {
      id: `sec_${sIdx + 1}`,
      name: sectionName,
      rows
    };
  });

  return {
    title,
    artist,
    originalKey: originalKey || 'C',
    category: 'Worship',
    style: validatedStyle,
    tempo: chordexData.tempo ? parseInt(chordexData.tempo, 10) : null,
    timeSignature: chordexData.timeSignature || '4/4',
    notes: sourceUrl ? `Imported from URL: ${sourceUrl}` : 'Imported via Chordex AI',
    sections,
    _chordexMeta: {
      sourceUrl,
      reconstructedBy: 'Chordex AI Vision & Intelligence',
      sectionsCount: sections.length,
      linesCount: (chordexData.sections || []).reduce((acc, s) => acc + (s.lines?.length || 0), 0),
      chordsCount: (chordexData.sections || []).reduce((acc, s) =>
        acc + (s.lines || []).reduce((lAcc, l) => lAcc + (l.chords?.length || 0), 0), 0)
    }
  };
}
