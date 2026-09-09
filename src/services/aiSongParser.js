import { convertChordexToChordician, validateChordexData } from './chordexConverter.js';
import { fetchWithRetry } from '../utils/apiClient.js';

export const DEMO_PRESETS = [
  {
    id: 'amazing_grace',
    name: 'Amazing Grace (Classic Hymn Chart)',
    description: 'Chords, lyrics, and piano lead melody in Key of C',
    chordexJson: {
      title: 'Amazing Grace',
      artist: 'John Newton',
      originalKey: 'C',
      overallConfidence: 0.98,
      sections: [
        {
          id: 'sec-1',
          name: 'Verse 1',
          type: 'verse',
          lines: [
            {
              id: 'l1',
              lyrics: 'Amazing grace, how sweet the sound',
              chords: [
                { chord: 'C', position: 0, confidence: 0.99 },
                { chord: 'F', position: 9, confidence: 0.96 },
                { chord: 'C', position: 20, confidence: 0.98 },
                { chord: 'G', position: 29, confidence: 0.95 }
              ],
              confidence: 0.98
            },
            {
              id: 'l2',
              lyrics: 'That saved a wretch like me',
              chords: [
                { chord: 'C', position: 0, confidence: 0.97 },
                { chord: 'G7', position: 18, confidence: 0.94 }
              ],
              confidence: 0.96
            },
            {
              id: 'l3',
              lyrics: 'I once was lost, but now am found',
              chords: [
                { chord: 'C', position: 0, confidence: 0.98 },
                { chord: 'C7', position: 9, confidence: 0.93 },
                { chord: 'F', position: 18, confidence: 0.97 },
                { chord: 'C', position: 27, confidence: 0.96 }
              ],
              confidence: 0.97
            },
            {
              id: 'l4',
              lyrics: 'Was blind, but now I see.',
              chords: [
                { chord: 'Am', position: 0, confidence: 0.95 },
                { chord: 'G7', position: 10, confidence: 0.94 },
                { chord: 'C', position: 20, confidence: 0.98 }
              ],
              confidence: 0.97
            }
          ]
        },
        {
          id: 'sec-2',
          name: 'Chorus',
          type: 'chorus',
          lines: [
            {
              id: 'l5',
              lyrics: "'Twas grace that taught my heart to fear",
              chords: [
                { chord: 'C', position: 0, confidence: 0.97 },
                { chord: 'F', position: 12, confidence: 0.95 },
                { chord: 'C', position: 24, confidence: 0.96 },
                { chord: 'G', position: 33, confidence: 0.94 }
              ],
              confidence: 0.96
            },
            {
              id: 'l6',
              lyrics: 'And grace my fears relieved',
              chords: [
                { chord: 'Am', position: 0, confidence: 0.94 },
                { chord: 'F', position: 10, confidence: 0.95 },
                { chord: 'C/E', position: 17, confidence: 0.92 },
                { chord: 'G7', position: 21, confidence: 0.93 },
                { chord: 'C', position: 25, confidence: 0.97 }
              ],
              confidence: 0.95
            }
          ]
        }
      ]
    }
  },
  {
    id: 'maravaamal',
    name: 'Maravaamal Ninaiththeeraiyaa (Worship Chart)',
    description: 'Attached chords and lyrics reconstructed into two-layer layout',
    chordexJson: {
      title: 'Maravaamal Ninaiththeeraiyaa',
      artist: 'Traditional Worship',
      originalKey: 'Dm',
      overallConfidence: 0.96,
      sections: [
        {
          id: 'sec-1',
          name: 'Verse 1',
          type: 'verse',
          lines: [
            {
              id: 'l1',
              lyrics: 'Maravaamal Ninaiththeeraiyaa',
              chords: [
                { chord: 'Dm', position: 0, confidence: 0.98 },
                { chord: 'Am', position: 24, confidence: 0.95 }
              ],
              confidence: 0.97
            },
            {
              id: 'l2',
              lyrics: 'Manathaara NanCRi Solvaen-2',
              chords: [
                { chord: 'A#', position: 0, confidence: 0.96 },
                { chord: 'C', position: 11, confidence: 0.94 },
                { chord: 'Dm', position: 20, confidence: 0.97 }
              ],
              confidence: 0.95
            },
            {
              id: 'l3',
              lyrics: 'Iravum Pakalum EGNai Ninainthu',
              chords: [
                { chord: 'A#', position: 0, confidence: 0.95 },
                { chord: 'G', position: 20, confidence: 0.94 }
              ],
              confidence: 0.95
            },
            {
              id: 'l4',
              lyrics: 'Ithuvarai Nadaththineerae-2',
              chords: [
                { chord: 'C', position: 0, confidence: 0.96 },
                { chord: 'F', position: 19, confidence: 0.94 },
                { chord: 'A7', position: 24, confidence: 0.93 }
              ],
              confidence: 0.94
            }
          ]
        },
        {
          id: 'sec-2',
          name: 'Chorus',
          type: 'chorus',
          lines: [
            {
              id: 'l5',
              lyrics: 'Nanti NanRi Aiyaa GAa...... Aa.......',
              chords: [
                { chord: 'A#', position: 0, confidence: 0.95 },
                { chord: 'C', position: 8, confidence: 0.94 },
                { chord: 'G', position: 18, confidence: 0.92 }
              ],
              confidence: 0.93
            },
            {
              id: 'l6',
              lyrics: 'Koti Koti Nanti Aiyaa-2- Maravaamal',
              chords: [
                { chord: 'A#', position: 0, confidence: 0.95 },
                { chord: 'C', position: 15, confidence: 0.94 },
                { chord: 'Dm', position: 25, confidence: 0.96 }
              ],
              confidence: 0.95
            }
          ]
        }
      ]
    }
  }
];

import { GoogleGenerativeAI } from '@google/generative-ai';

const CHORDEX_VISION_SYSTEM_INSTRUCTION = `You are Chordex AI, a specialized visual chord-sheet analyzer for Chordician.
Analyze the supplied image of a song/chord sheet containing lyrics and musical chords.
Reconstruct the image into structured JSON adhering to this schema:
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
            { "chord": "Dm", "position": 0, "confidence": 0.98 }
          ],
          "confidence": 0.98
        }
      ]
    }
  ],
  "overallConfidence": 0.95
}`;

async function analyzeWithClientGeminiVision(imageFile, imageBase64) {
  const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!clientKey) {
    throw new Error('No client GEMINI_API_KEY available.');
  }

  const genAI = new GoogleGenerativeAI(clientKey);
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];

  let base64Data = '';
  let mimeType = 'image/jpeg';

  if (imageFile) {
    mimeType = imageFile.type || 'image/jpeg';
    base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const match = result.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (match) {
          resolve(match[2]);
        } else {
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  } else if (imageBase64) {
    const match = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    } else {
      base64Data = imageBase64;
    }
  }

  let lastErr = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: CHORDEX_VISION_SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      });

      const prompt = 'Analyze this chord sheet image and output structured JSON adhering to the Chordex format.';
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType
        }
      };

      const res = await model.generateContent([prompt, imagePart]);
      const text = res.response.text();
      const parsed = JSON.parse(text.replace(/^```json\s*|^```\s*|```$/g, '').trim());
      return parsed;
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Client-side Gemini Vision analysis failed.');
}

/**
 * Sends image to the backend /api/chordex/analyze endpoint, with client-side fallback
 */
export async function analyzeImageWithChordexAI(imageFile, imageBase64 = null) {
  const formData = new FormData();
  if (imageFile) {
    formData.append('image', imageFile);
  } else if (imageBase64) {
    formData.append('imageBase64', imageBase64);
  } else {
    return { success: false, error: 'No image provided.' };
  }

  try {
    const response = await fetchWithRetry('/api/chordex/analyze', {
      method: 'POST',
      body: formData
    }, 2, 1000);

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to analyze chord sheet on server.');
    }

    const validation = validateChordexData(result.data);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const convertedSong = convertChordexToChordician(result.data);
    return {
      success: true,
      chordexData: result.data,
      convertedSong
    };
  } catch (serverErr) {
    // If client has VITE_GEMINI_API_KEY configured, attempt direct client processing
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        console.log('[Chordex AI] Server analysis failed, running direct client Gemini Vision fallback...');
        const clientData = await analyzeWithClientGeminiVision(imageFile, imageBase64);
        const validation = validateChordexData(clientData);
        if (validation.valid) {
          const convertedSong = convertChordexToChordician(clientData);
          return {
            success: true,
            chordexData: clientData,
            convertedSong
          };
        }
      } catch (clientErr) {
        console.warn('[Chordex AI] Direct client fallback error:', clientErr);
      }
    }
    throw serverErr;
  }
}

/**
 * High-level parser that supports both real Gemini Vision and demo presets
 */
export async function parseSongFromImage(imageFileOrUrl, selectedPresetId = null) {
  if (selectedPresetId) {
    const preset = DEMO_PRESETS.find(p => p.id === selectedPresetId);
    if (preset) {
      await new Promise(r => setTimeout(r, 900));
      const convertedSong = convertChordexToChordician(preset.chordexJson);
      return {
        success: true,
        chordexData: preset.chordexJson,
        song: convertedSong
      };
    }
  }

  // Real backend call
  try {
    let fileToSend = null;
    let base64ToSend = null;

    if (imageFileOrUrl instanceof File || imageFileOrUrl instanceof Blob) {
      fileToSend = imageFileOrUrl;
    } else if (typeof imageFileOrUrl === 'string') {
      base64ToSend = imageFileOrUrl;
    }

    const res = await analyzeImageWithChordexAI(fileToSend, base64ToSend);
    return {
      success: true,
      chordexData: res.chordexData,
      song: res.convertedSong
    };
  } catch (err) {
    console.error('Chordex AI analysis error:', err);
    return {
      success: false,
      error: err.message || 'Unable to analyze image. Please try again with a clearer screenshot.'
    };
  }
}
