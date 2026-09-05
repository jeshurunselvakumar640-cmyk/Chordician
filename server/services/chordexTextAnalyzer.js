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
     - Handle slash chords (e.g. "E/G#", "C/E", "G/B", "D/F#", "F#/A#") as single chord units.
     - Handle trailing/leading chords (e.g. "                 E  E/G#  A  B" above "Toh Karo Jai Jai Kar").
2. ATTACHED / TOUCHING CHORDS:
   - When chords are glued directly to words without spaces due to bad formatting:
     - "DmMaravaamal" => Chord: "Dm" at position 0, Lyrics: "Maravaamal"
     - "AmA#Manathaara" => Chords: "Am" at position 0, "A#" at position 3, Lyrics: "Manathaara"
3. INLINE BRACKETED CHORDS:
   - "[C]Amazing grace, how [F]sweet the [C]sound" => Extract bracketed chords with character offsets and strip brackets from lyrics.
4. SECTION STRUCTURE & HEADERS:
   - Respect and preserve section headers like "[Chorus]", "[Verse 1]", "[Verse 2]", "[Bridge]", "[Intro]", "[Outro]", "[Pre-Chorus]", "[Ending]".
   - Keep sections in sequential order. If the same section is repeated (e.g. multiple "[Chorus]" blocks), output each section block in order.
5. PRESERVE ORIGINAL LYRICS & MULTI-LANGUAGE TRANSLITERATIONS:
   - Do NOT translate, summarize, or rewrite lyric words.
   - Preserve Hindi, Tamil, Telugu, and English transliterated words, punctuation, and repetition markers (e.g. "Pani Pe Chalta Hai", "Krus Ko Uthaya Hai", "...X2", "(2)", "-2").
6. MUSICAL KEY:
   - Detect the root musical key (e.g. "E", "D", "Dm", "C", "G", "F", "A", "Em").
7. STYLE IDENTIFICATION:
   - If a distinct style (e.g. "Indian -> Dandiya", "Indian -> Bhajan", "Pop & Rock -> 8Beat", "Ballad -> PianoBallad", "Worship -> Contemporary") is recognizable, provide it.

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
let cachedFastestModel = 'gemini-3.6-flash';
const FAST_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

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

/**
 * Cleans any residual glued chord prefixes from lyric words
 */
function cleanLyricString(lyrics, chords = []) {
  if (!lyrics) return '';
  let clean = lyrics.trim();

  // Remove bracketed notation like [Dm] from lyrics
  clean = clean.replace(/\[[A-G][#b]?[^\]\s]*\]|\([A-G][#b]?[^)\s]*\)/g, '').trim();

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
