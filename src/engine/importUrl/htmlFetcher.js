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
  // 1. Direct browser fetch attempt
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    clearTimeout(timer);

    if (response.ok) {
      const html = await response.text();
      if (html && html.length > 50) {
        return {
          html,
          finalUrl: response.url || targetUrl
        };
      }
    }
  } catch {
    // Direct browser fetch blocked by CORS; proceed to reliable proxies below
  }

  // 2. Fallback via reliable CORS proxies
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(proxyUrl, {
        signal: controller.signal
      });

      clearTimeout(timer);

      if (response.ok) {
        const html = await response.text();
        if (html && html.length > 50) {
          return {
            html,
            finalUrl: targetUrl
          };
        }
      }
    } catch {
      // Continue to next proxy
    }
  }

  throw new Error('Unable to connect to this webpage or fetch its content. Please paste the song text into Smart Paste.');
}
