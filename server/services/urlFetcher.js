import { validateUrl } from './urlValidator.js';

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Safely fetches an HTML webpage with SSRF re-validation on redirects,
 * size constraints, and strict timeout.
 */
export async function safeFetchHtml(initialUrl, maxRedirects = MAX_REDIRECTS) {
  let currentUrl = initialUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    // 1. Re-validate URL for every hop
    const validation = await validateUrl(currentUrl);
    if (!validation.valid) {
      throw {
        message: validation.error,
        code: validation.code || 'BLOCKED_URL'
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8,hi;q=0.7',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache'
        },
        redirect: 'manual', // We handle redirects manually for SSRF safety
        signal: controller.signal
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw {
          message: 'The webpage took too long to respond (timeout after 10s).',
          code: 'FETCH_TIMEOUT'
        };
      }
      throw {
        message: `Unable to connect to ${new URL(currentUrl).hostname}.`,
        code: 'FETCH_FAILED'
      };
    } finally {
      clearTimeout(timeoutId);
    }

    // 2. Handle Redirects (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw {
          message: 'Webpage returned a redirect without a destination location.',
          code: 'FETCH_FAILED'
        };
      }

      // Resolve relative redirect paths against current URL
      const nextUrl = new URL(location, currentUrl).toString();
      redirectsCount++;
      if (redirectsCount > maxRedirects) {
        throw {
          message: 'Too many redirects encountered while accessing this webpage.',
          code: 'FETCH_FAILED'
        };
      }

      console.log(`[Import URL] Following safe redirect (${redirectsCount}/${maxRedirects}) -> ${nextUrl}`);
      currentUrl = nextUrl;
      continue;
    }

    // 3. Handle non-2xx HTTP responses
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw {
          message: 'This website does not allow automated access to its content.',
          code: 'BLOCKED_URL'
        };
      }
      if (response.status === 404) {
        throw {
          message: 'The requested song webpage was not found (HTTP 404).',
          code: 'FETCH_FAILED'
        };
      }
      throw {
        message: `Webpage returned an error status (HTTP ${response.status}).`,
        code: 'FETCH_FAILED'
      };
    }

    // 4. Content-Type check
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw {
        message: 'The provided URL does not contain an HTML webpage.',
        code: 'NON_HTML'
      };
    }

    // 5. Response length / size safety
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      throw {
        message: 'Webpage content is too large to import (maximum 5MB).',
        code: 'CONTENT_TOO_LARGE'
      };
    }

    const htmlText = await response.text();
    if (htmlText.length > MAX_RESPONSE_SIZE) {
      throw {
        message: 'Webpage content is too large to import (maximum 5MB).',
        code: 'CONTENT_TOO_LARGE'
      };
    }

    if (!htmlText.trim()) {
      throw {
        message: 'The webpage returned empty content.',
        code: 'NO_SONG_CONTENT'
      };
    }

    return {
      html: htmlText,
      finalUrl: currentUrl,
      status: response.status
    };
  }

  throw {
    message: 'Exceeded maximum redirect limit.',
    code: 'FETCH_FAILED'
  };
}
