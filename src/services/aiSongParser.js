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

/**
 * Sends image to the backend /api/chordex/analyze endpoint
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

  const response = await fetchWithRetry('/api/chordex/analyze', {
    method: 'POST',
    body: formData
  }, 2, 1000);

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to analyze chord sheet.');
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
