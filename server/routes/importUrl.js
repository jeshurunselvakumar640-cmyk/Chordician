import { Router } from 'express';
import { validateUrl } from '../services/urlValidator.js';
import { safeFetchHtml } from '../services/urlFetcher.js';
import { parseHtmlToSong } from '../parsers/genericParser.js';
import { analyzeSongTextWithChordexAI } from '../services/chordexTextAnalyzer.js';

const router = Router();

// Rate limiter helper (in-memory sliding counter per IP)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count++;
  }

  requestCounts.set(ip, record);
  return record.count <= MAX_REQUESTS_PER_WINDOW;
}

/**
 * Endpoint for URL extraction + Chordex AI reconstruction
 */
router.post('/import-url', async (req, res) => {
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many import requests. Please wait a moment and try again.',
      code: 'RATE_LIMITED'
    });
  }

  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid webpage URL.',
      code: 'INVALID_URL'
    });
  }

  const trimmedUrl = url.trim();
  console.log(`[Import URL] Request received for: ${trimmedUrl}`);

  try {
    // 1. Validate URL & SSRF
    console.log('[Import URL] Validating URL & SSRF security...');
    const validation = await validateUrl(trimmedUrl);
    if (!validation.valid) {
      console.warn(`[Import URL] URL validation rejected: ${validation.error}`);
      return res.status(400).json({
        success: false,
        error: validation.error,
        code: validation.code || 'INVALID_URL'
      });
    }

    // 2. Safely Fetch Webpage HTML
    console.log('[Import URL] Fetching webpage HTML...');
    const fetchResult = await safeFetchHtml(validation.url);
    console.log(`[Import URL] HTML received (${fetchResult.html.length} bytes).`);

    // 3. Parse HTML and structure song with Chordex AI
    console.log('[Import URL] Extracting song structure and chords with Chordex AI...');
    const { song, warnings } = await parseHtmlToSong(fetchResult.html, fetchResult.finalUrl);

    console.log(`[Import URL] Import successful: "${song.title}" by "${song.artist || 'Unknown'}" (${song.sections.length} sections).`);

    return res.json({
      success: true,
      sourceUrl: fetchResult.finalUrl,
      song,
      warnings: warnings || []
    });
  } catch (err) {
    console.error('[Import URL Error]:', err.message || err);

    const errorMessage = err.message || 'Something went wrong while importing this URL. Please try again.';
    const errorCode = err.code || 'PARSER_FAILED';

    const statusCode = ['INVALID_URL', 'BLOCKED_URL'].includes(errorCode)
      ? 400
      : errorCode === 'FETCH_TIMEOUT'
      ? 504
      : 500;

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: errorCode
    });
  }
});

/**
 * Endpoint for direct raw text / smart paste chord restructuring
 */
router.post('/chordex/analyze-text', async (req, res) => {
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many import requests. Please wait a moment and try again.',
      code: 'RATE_LIMITED'
    });
  }

  const { text, title, artist, originalKey } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please paste chord sheet text to analyze.',
      code: 'EMPTY_TEXT'
    });
  }

  try {
    console.log(`[Chordex AI Text] Restructuring raw text input (${text.length} chars)...`);
    const song = await analyzeSongTextWithChordexAI(text, {
      title,
      artist,
      originalKey,
      sourceUrl: 'Smart Paste / Clipboard'
    });

    console.log(`[Chordex AI Text] Successfully reconstructed "${song.title}" (${song.sections.length} sections)!`);

    return res.json({
      success: true,
      song,
      warnings: []
    });
  } catch (err) {
    console.error('[Chordex AI Text Error]:', err.message || err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to restructure song text with Chordex AI.',
      code: 'PARSER_FAILED'
    });
  }
});

export default router;
