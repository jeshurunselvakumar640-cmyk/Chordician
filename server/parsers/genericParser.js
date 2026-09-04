import { extractSongFromHtml } from '../services/htmlExtractor.js';
import { normalizeSongData } from '../services/songNormalizer.js';
import { analyzeSongTextWithChordexAI } from '../services/chordexTextAnalyzer.js';

/**
 * HTML Song Parser powered by Chordex AI Intelligence.
 * Extracts webpage content and uses Gemini to reconstruct clean chord-above-lyrics formatting.
 */
export async function parseHtmlToSong(html, sourceUrl = '') {
  const extracted = extractSongFromHtml(html, sourceUrl);

  let song = null;
  const warnings = [];

  // 1. Try Chordex AI reconstruction if API key is available
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('[Chordex AI] Running intelligent chord sheet reconstruction...');
      song = await analyzeSongTextWithChordexAI(extracted.rawText, {
        title: extracted.title,
        artist: extracted.artist,
        originalKey: extracted.originalKey,
        sourceUrl
      });
    } catch (aiErr) {
      console.warn('[Chordex AI] AI text reconstruction error, falling back to rule engine:', aiErr.message);
      warnings.push('AI parsing encountered an issue; used rule-based fallback.');
    }
  }

  // 2. Fallback to deterministic rule-based normalizer if AI was unavailable or failed
  if (!song) {
    song = normalizeSongData(extracted, sourceUrl);
  }

  const totalChords = (song.sections || []).reduce((acc, sec) => {
    return acc + (sec.rows || []).filter(r => r.type === 'chords' && r.content.trim().length > 0).length;
  }, 0);

  if (totalChords === 0) {
    warnings.push('No chords could be confidently detected on this page. Only lyrics were extracted.');
  }

  return {
    song,
    warnings
  };
}
