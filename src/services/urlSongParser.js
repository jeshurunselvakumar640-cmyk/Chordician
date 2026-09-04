/**
 * Frontend client service for importing song chord sheets from webpage URLs.
 */
import { fetchWithRetry } from '../utils/apiClient.js';

export const SAMPLE_URL_PRESETS = [
  {
    id: 'maravaamal_sample',
    title: 'Maravaamal Ninaiththeeraiyaa (Worship Chart)',
    url: 'https://worshipleader.com/chords/maravaamal-ninaiththeeraiyaa',
    description: 'Chords positioned above Tamil transliterated worship lyrics with two sections',
    mockData: {
      title: 'Maravaamal Ninaiththeeraiyaa',
      artist: 'Gersson Edinbaro',
      originalKey: 'D',
      category: 'Worship',
      style: {
        category: 'Indian',
        name: 'Dandiya',
        churchStyleNumber: '096',
        keyboardStyleNumber: '200'
      },
      tempo: 108,
      timeSignature: '4/4',
      notes: 'Imported from URL: https://worshipleader.com/chords/maravaamal-ninaiththeeraiyaa',
      sections: [
        {
          id: 'sec_1',
          name: 'Verse 1',
          rows: [
            { id: 'r_1_1', type: 'chords', content: 'Dm          Am    A#' },
            { id: 'r_1_2', type: 'lyrics', content: 'Maravaamal Ninaiththeeraiyaa' },
            { id: 'r_1_3', type: 'chords', content: 'C                     Dm' },
            { id: 'r_1_4', type: 'lyrics', content: 'Manathaara Nanri Solvaen' },
            { id: 'r_1_5', type: 'chords', content: 'Dm          A#        Gm' },
            { id: 'r_1_6', type: 'lyrics', content: 'Iravum Pakalum Ennai Ninainthu' },
            { id: 'r_1_7', type: 'chords', content: 'C                     Dm' },
            { id: 'r_1_8', type: 'lyrics', content: 'Ithuvarai Nadaththineerae' }
          ]
        },
        {
          id: 'sec_2',
          name: 'Chorus',
          rows: [
            { id: 'r_2_1', type: 'chords', content: 'F           C' },
            { id: 'r_2_2', type: 'lyrics', content: 'Nanti Nanti Aiyaa' },
            { id: 'r_2_3', type: 'chords', content: 'A#          C      Dm' },
            { id: 'r_2_4', type: 'lyrics', content: 'Koti Koti Nanti Aiyaa' }
          ]
        }
      ]
    }
  },
  {
    id: 'amazing_grace_url',
    title: 'Amazing Grace (Classic Hymn)',
    url: 'https://hymnary.org/text/amazing_grace_how_sweet_the_sound',
    description: 'Traditional standard chord sheet with 4/4 meter and Verse / Chorus structure',
    mockData: {
      title: 'Amazing Grace',
      artist: 'John Newton',
      originalKey: 'C',
      category: 'Hymn',
      style: {
        category: 'Ballad',
        name: 'PianoBallad',
        churchStyleNumber: '022',
        keyboardStyleNumber: '116'
      },
      tempo: 76,
      timeSignature: '3/4',
      notes: 'Imported from URL: https://hymnary.org/text/amazing_grace_how_sweet_the_sound',
      sections: [
        {
          id: 'sec_1',
          name: 'Verse 1',
          rows: [
            { id: 'r_1_1', type: 'chords', content: 'C        F        C        G' },
            { id: 'r_1_2', type: 'lyrics', content: 'Amazing grace, how sweet the sound' },
            { id: 'r_1_3', type: 'chords', content: 'C                 G7' },
            { id: 'r_1_4', type: 'lyrics', content: 'That saved a wretch like me' },
            { id: 'r_1_5', type: 'chords', content: 'C        C7       F        C' },
            { id: 'r_1_6', type: 'lyrics', content: 'I once was lost, but now am found' },
            { id: 'r_1_7', type: 'chords', content: 'Am       G7       C' },
            { id: 'r_1_8', type: 'lyrics', content: 'Was blind, but now I see.' }
          ]
        }
      ]
    }
  }
];

/**
 * Validates a URL on the client-side before submission
 */
export function validateClientUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Please enter a webpage URL.' };
  }

  const trimmed = urlString.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a webpage URL.' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http:// and https:// URLs are supported.' };
    }

    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname.toLowerCase())) {
      return { valid: false, error: 'Cannot import from local machine addresses.' };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: 'Please enter a valid complete URL starting with http:// or https://' };
  }
}

/**
 * Sends URL to the backend to fetch and parse chords & lyrics
 */
export async function importSongFromUrl(urlString, selectedPresetId = null) {
  // If demo preset selected
  if (selectedPresetId) {
    const preset = SAMPLE_URL_PRESETS.find(p => p.id === selectedPresetId);
    if (preset) {
      await new Promise(r => setTimeout(r, 800)); // Smooth UI feel
      return {
        success: true,
        sourceUrl: preset.url,
        song: preset.mockData,
        warnings: []
      };
    }
  }

  const validation = validateClientUrl(urlString);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      code: 'INVALID_URL'
    };
  }

  try {
    const response = await fetchWithRetry('/api/import-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: validation.url })
    }, 2, 800);

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to extract chords and lyrics from this webpage.',
        code: result.code || 'PARSER_FAILED'
      };
    }

    return {
      success: true,
      sourceUrl: result.sourceUrl,
      song: result.song,
      warnings: result.warnings || []
    };
  } catch (err) {
    console.error('URL import request failed:', err);
    return {
      success: false,
      error: 'Unable to reach the Chordician backend server. Please check your network connection.',
      code: 'NETWORK_ERROR'
    };
  }
}

export const SAMPLE_TEXT_PRESETS = [
  {
    id: 'maravaamal_messy_paste',
    title: 'Maravaamal Ninaiththeeraiyaa (Messy Attached Chords)',
    description: 'Real-world WhatsApp/web format where chords like Dm, Am, A#, C are glued directly to lyric words',
    rawText: `DmMaravaamal NinaiththeeraiyaaAmA#Manathaara NanCRi Solvaen-2DmA#Iravum Pakalum EGNai NinainthuCIthuvarai Nadaththineerae-2F A7

A#Nanti NaCNti Aiyaa GAa...... Aa.......A#Koti Koti NantiC Aiyaa-2- DmMaravaamal

DmEpinaesar NeeGmRthaanaiyaaDmCIthuvarai UthaviNeerae-2FCElroyee Elroyee Ennaiyum Kanteerae-2GmEppati Naan Nanti Solvaen-2-A7DmMaravaamal

DmPelaveena NaeGmRangalilDmCPelan Thantheeraiyaa-2FC Sukamaanaen Sukamaanaen Thalumpukalaal SukamaanaenGmEn Kudumpa Maruththuvar Neerae-2-A7DmMaravaamal`
  },
  {
    id: 'amazing_grace_bracketed',
    title: 'Amazing Grace (Bracketed Chords)',
    description: 'Standard inline chord notation [C], [F], [G7] embedded in lyrics',
    rawText: `[Verse 1]
[C]Amazing grace, how [F]sweet the [C]sound
That saved a wretch like [G]me
I [C]once was [C7]lost, but [F]now am [C]found
Was [Am]blind, but [G7]now I [C]see.

[Chorus]
'Twas [C]grace that taught my [F]heart to fear
And [C]grace my fears [G]relieved
How [Am]precious [F]did that [C/E]grace [G7]appear
The [C]hour I first believed.`
  }
];

/**
 * Sends raw chord/lyric text to Chordex AI backend for intelligent reconstruction
 */
export async function restructureSongTextWithChordexAI(rawText, metadata = {}, selectedPresetId = null) {
  if (selectedPresetId) {
    const preset = SAMPLE_TEXT_PRESETS.find(p => p.id === selectedPresetId);
    if (preset) {
      rawText = preset.rawText;
    }
  }

  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      error: 'Please enter or paste chord sheet text to analyze.'
    };
  }

  try {
    const response = await fetchWithRetry('/api/chordex/analyze-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: rawText.trim(),
        title: metadata.title,
        artist: metadata.artist,
        originalKey: metadata.originalKey
      })
    }, 2, 800);

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to restructure song chords and lyrics.',
        code: result.code || 'PARSER_FAILED'
      };
    }

    return {
      success: true,
      sourceUrl: 'Smart Paste / Direct Input',
      song: result.song,
      warnings: result.warnings || []
    };
  } catch (err) {
    console.error('Chordex AI text restructure error:', err);
    return {
      success: false,
      error: 'Unable to reach the Chordician backend server. Please check your network connection.',
      code: 'NETWORK_ERROR'
    };
  }
}

