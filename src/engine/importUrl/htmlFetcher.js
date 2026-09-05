/**
 * Safe HTML Fetcher for Webpage Importer.
 */

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Chordician/1.0';

const FETCH_TIMEOUT_MS = 10000;
const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Safely fetches raw HTML from an external webpage URL.
 * @param {string} targetUrl
 * @returns {Promise<{ html: string, finalUrl: string }>}
 */
export async function fetchHtml(targetUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8,hi;q=0.7',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Webpage returned HTTP status ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !contentType.includes('text/plain')) {
      throw new Error(`The provided URL did not return HTML content (Content-Type: ${contentType}).`);
    }

    const html = await response.text();

    if (html.length > MAX_HTML_BYTES) {
      throw new Error('Webpage HTML is too large to process safely (exceeds 5MB limit).');
    }

    return {
      html,
      finalUrl: response.url || targetUrl
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      const error = new Error('Request to fetch the webpage timed out (10s). The website may be slow or unreachable.');
      error.code = 'FETCH_TIMEOUT';
      throw error;
    }
    throw err;
  }
}
