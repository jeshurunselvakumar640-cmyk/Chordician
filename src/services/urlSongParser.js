/**
 * Frontend client service for importing song chord sheets from webpage URLs and Smart Paste.
 * Powered by Chordician's unified Parsing Engine.
 */
import { fetchWithRetry } from '../utils/apiClient.js';
import { parseSmartPaste } from '../engine/index.js';

export const SAMPLE_URL_PRESETS = [
  {
    id: 'aaraathippaen_sample',
    title: 'Aaraathippaen Naan Aaraathippaen',
    url: 'https://tamilchristiansongs.in/chords/aaraathippaen-naan-aaraathippaen/',
    description: 'Fr. S.J. Berchmans classic with 7 verses and aligned chords from TamilChristianSongs.in'
  },
  {
    id: 'enthan_nambikkai_sample',
    title: 'Enthan Nambikkai Neere',
    url: 'https://tamilchristiansongs.in/chords/enthan-nambikkai-neere/',
    description: 'Popular Tamil Christian worship song from TamilChristianSongs.in'
  },
  {
    id: 'settaigalai_sample',
    title: 'Settaigalai Virikkum Kaalam',
    url: 'https://tamilchristiansongs.in/chords/settaigalai-virikkum-kaalam/',
    description: 'Pastor Gersson Edinbaro worship anthem from TamilChristianSongs.in'
  },
  {
    id: 'ebinesarae_sample',
    title: 'Ebinesarae Aaradhanai',
    url: 'https://tamilchristiansongs.in/chords/ebinesarae-aaradhanai/',
    description: 'Traditional devotion and worship chord chart from TamilChristianSongs.in'
  },
  {
    id: 'maravaamal_sample',
    title: 'Maravaamal Ninaiththeeraiyaa',
    url: 'https://tamilchristiansongs.in/chords/maravaamal-ninaiththeeraiyaa/',
    description: 'Tamil transliterated worship chord chart'
  },
  {
    id: 'amazing_grace_url',
    title: 'Amazing Grace (Classic Hymn)',
    url: 'https://hymnary.org/text/amazing_grace_how_sweet_the_sound',
    description: 'Traditional standard chord sheet with 4/4 meter and Verse / Chorus structure'
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
 * Sends URL to the backend to dynamically fetch and parse chords & lyrics with Chordex AI
 */
export async function importSongFromUrl(urlString) {
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
 * Sends raw chord/lyric text to Chordex AI backend or runs local parsing engine for intelligent reconstruction
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

    if (response.ok && result.success && result.song) {
      return {
        success: true,
        sourceUrl: 'Smart Paste / Direct Input',
        song: result.song,
        warnings: result.warnings || []
      };
    }
  } catch (err) {
    console.warn('Backend text restructure unreachable, running local parsing engine:', err);
  }

  // Fallback to local parsing engine directly in the browser
  const localResult = parseSmartPaste(rawText, metadata);
  if (localResult.success && localResult.song) {
    return {
      success: true,
      sourceUrl: 'Smart Paste / Local Engine',
      song: localResult.song,
      warnings: localResult.warnings || []
    };
  }

  return {
    success: false,
    error: localResult.error || 'Failed to restructure song chords and lyrics.',
    code: 'PARSER_FAILED'
  };
}
