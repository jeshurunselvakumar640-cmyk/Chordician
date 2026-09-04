import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import importUrlRouter from './routes/importUrl.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all incoming clients
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Request logger
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[HTTP API] ${req.method} ${req.url}`);
  }
  next();
});

// Register URL and Text routes under /api and root fallback
app.use('/api', importUrlRouter);
app.use('/', importUrlRouter);

// Multer memory storage for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

const CHORDEX_SYSTEM_INSTRUCTION = `You are Chordex AI, a specialized visual chord-sheet analyzer for Chordician.

Analyze the supplied image of a song/chord sheet containing lyrics and musical chords.

Your task is to reconstruct the image into structured song data that can be imported into a music editor.

This is NOT ordinary OCR.

You must understand the visual relationship between:
- lyric lines
- musical chords
- chord placement
- sections
- reading order

Analyze the image itself.

For every chord determine:
1. The chord name.
2. Which lyric line it belongs to.
3. Its approximate horizontal position relative to that lyric (0-based character index).
4. Your confidence (0.0 to 1.0).

IMPORTANT RULES:
1. Preserve lyrics as accurately as possible.
2. Do not translate lyrics.
3. Do not rewrite lyrics.
4. Do not summarize lyrics.
5. Do not invent missing chords.
6. Do not add chords because they are musically likely.
7. Only identify chords supported by the image.
8. Distinguish musical chords from normal words.
9. Handle chords that touch lyric text because of poor formatting (e.g. "DmMaravaamal" => Chord: "Dm", Lyrics: "Maravaamal").
10. Handle consecutive chords touching text (e.g. "AmA#Manathaara" => Chords: "Am", "A#", Lyrics: "Manathaara").
11. Preserve repeated lyrics and repeat markers (e.g. "-2", "x2", "(2)").
12. Preserve punctuation (e.g. "...", "–", ".").
13. Preserve the original reading order.
14. Handle multiple columns correctly.
15. Estimate the chord's horizontal character position within that lyric line.
16. If something is uncertain, lower its confidence rather than inventing information.

Musical chord examples include:
C, Cm, C#, C#m, D, Dm, D7, Dmaj7, E, Em, F, Fm, F#, G, Gm, G7, A, Am, A7, B, Bm, Bb, and slash chords such as C/E, G/B and D/F#.

OUTPUT FORMAT:
Return valid JSON adhering to this exact schema:
{
  "title": "Song Title",
  "artist": "Artist name or empty string",
  "originalKey": "Key of song (e.g. C, Dm, G, A#)",
  "sections": [
    {
      "id": "section-1",
      "type": "verse",
      "name": "Verse 1",
      "lines": [
        {
          "id": "line-1",
          "lyrics": "Exact line lyrics",
          "chords": [
            {
              "chord": "Dm",
              "position": 0,
              "confidence": 0.98
            }
          ],
          "confidence": 0.98
        }
      ]
    }
  ],
  "overallConfidence": 0.95
}`;

async function analyzeChordSheetWithGemini(imageBuffer, mimeType) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const genAI = new GoogleGenerativeAI(key);

  const modelNames = [
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.6-flash'
  ];
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: CHORDEX_SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const prompt = 'Analyze this chord sheet image and output structured JSON adhering to the Chordex format with title, sections, lines, lyrics, and positioned chords.';

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg'
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error('Empty response received from Gemini Vision.');
      }

      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`[Chordex AI] Model ${modelName} attempt failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to analyze chord sheet with all available Gemini models.');
}

app.post(['/api/chordex/analyze', '/chordex/analyze'], upload.single('image'), async (req, res) => {
  try {
    let imageBuffer = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body && req.body.imageBase64) {
      const base64Data = req.body.imageBase64;
      const match = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBuffer = Buffer.from(match[2], 'base64');
      } else {
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please upload a valid chord sheet screenshot (PNG, JPG, WEBP).'
      });
    }

    console.log(`[Chordex AI] Processing image (${mimeType}, ${imageBuffer.length} bytes)...`);
    const parsedSong = await analyzeChordSheetWithGemini(imageBuffer, mimeType);

    if (!parsedSong || !Array.isArray(parsedSong.sections)) {
      return res.status(422).json({
        success: false,
        error: 'Chordex could not structure this image into musical sections. Please ensure the image is clear and contains visible chords.'
      });
    }

    console.log(`[Chordex AI] Success! Analyzed "${parsedSong.title || 'Untitled'}" with ${parsedSong.sections.length} sections.`);
    return res.json({
      success: true,
      data: parsedSong
    });
  } catch (err) {
    console.error('[Chordex AI Error]:', err);
    let userMessage = 'Chordex was unable to analyze this chord sheet. Please check your image clarity or try another screenshot.';
    if (err.message && err.message.includes('API key')) {
      userMessage = 'Gemini API authentication failed. Please verify your GEMINI_API_KEY in the server configuration.';
    } else if (err.message && (err.message.includes('quota') || err.message.includes('rate limit'))) {
      userMessage = 'Gemini API rate limit exceeded. Please wait a moment and try again.';
    }

    return res.status(500).json({
      success: false,
      error: userMessage,
      technicalDetails: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Chordex AI Server',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build static files in production environments (Render, Railway, Heroku)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
