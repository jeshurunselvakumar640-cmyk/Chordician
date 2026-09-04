import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { findStyle } from '../../src/data/songStyles.js';
import { buildAlignedChordString } from './chordParser.js';

dotenv.config();

const CHORDEX_TEXT_SYSTEM_INSTRUCTION = `You are Chordex AI, the intelligent song and chord sheet reconstruction engine for Chordician.

Your job is to analyze raw text extracted from a song/chord webpage, understand the musical chords and lyrics, remove all web noise, and RECONSTRUCT it into a clean, professional chord sheet.

CRITICAL RULES:
1. CHORDS ABOVE LYRICS: For each lyric line, determine the exact chords and their horizontal character position relative to that lyric (0-based character index).
2. ATTACHED / TOUCHING CHORDS: Chords frequently stick directly to words without spaces due to bad web formatting:
   - "DmMaravaamal" => Chord: "Dm" at position 0, Lyrics: "Maravaamal"
   - "AmA#Manathaara" => Chords: "Am" at position 0, "A#" at position 3, Lyrics: "Manathaara"
   - "C                     Dm" above "Manathaara Nanri Solvaen" => Position chords above the corresponding lyric syllables.
3. REMOVE WEB NOISE: Completely remove website navigation, breadcrumbs, search bars, "Lyrics", "Chords", "Home", "Share", emoji icons (🏠, 🎵), advertisement fragments, chord finger diagrams, and page footers.
4. SECTION STRUCTURE: Organize into clear sections (Verse 1, Verse 2, Chorus, Bridge, Intro, Outro, Pre-Chorus, Ending).
5. DO NOT MODIFY LYRICS: Do NOT translate, summarize, or rewrite the lyric words. Preserve transliteration, punctuation, and repetition markers (e.g. "-2", "x2", "(2)").
6. MUSICAL KEY: Detect the song's musical root key (e.g. "D", "Dm", "C", "G", "F", "A", "Em").
7. STYLE IDENTIFICATION: If a distinct style (e.g. "Indian -> Dandiya", "Indian -> Bhajan", "Pop & Rock -> 8Beat", "Ballad -> PianoBallad") is recognizable, provide it.

OUTPUT FORMAT: Return ONLY valid JSON matching this schema:
{
  "title": "Clean Song Title",
  "artist": "Artist name or empty string",
  "originalKey": "Musical Key (e.g. Dm, D, C, G)",
  "timeSignature": "4/4 or 3/4 or 6/8",
  "style": {
    "category": "Indian",
    "name": "Dandiya"
  },
  "sections": [
    {
      "id": "section-1",
      "type": "verse",
      "name": "Verse 1",
      "lines": [
        {
          "id": "line-1",
          "lyrics": "Maravaamal Ninaiththeeraiyaa",
          "chords": [
            { "chord": "Dm", "position": 0, "confidence": 0.99 },
            { "chord": "Am", "position": 11, "confidence": 0.96 }
          ]
        }
      ]
    }
  ]
}`;

// Cache the fastest working model to eliminate retry overhead on subsequent imports
let cachedFastestModel = null;
const FAST_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash'];

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
          maxOutputTokens: 4096
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const chordexData = JSON.parse(responseText);
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
      const lineLyrics = (line.lyrics || '').trim();
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
