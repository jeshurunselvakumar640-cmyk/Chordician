/**
 * URL Security & SSRF Protection for Webpage Importer.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254'
]);

/**
 * Validates a target URL against SSRF vulnerabilities and invalid protocols.
 * @param {string} rawUrl
 * @returns {{ valid: boolean, url?: string, error?: string, code?: string }}
 */
export function validateUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Please enter a webpage URL.', code: 'INVALID_URL' };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a webpage URL.', code: 'INVALID_URL' };
  }

  try {
    const parsed = new URL(trimmed);

    // 1. Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Only http:// and https:// URLs are supported.',
        code: 'INVALID_PROTOCOL'
      };
    }

    // 2. Blocked hostnames
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
      return {
        valid: false,
        error: 'Access to internal or local network addresses is prohibited.',
        code: 'BLOCKED_URL'
      };
    }

    // 3. Private IP ranges (IPv4)
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const octet1 = parseInt(ipv4Match[1], 10);
      const octet2 = parseInt(ipv4Match[2], 10);

      if (
        octet1 === 10 ||
        octet1 === 127 ||
        octet1 === 0 ||
        (octet1 === 172 && octet2 >= 16 && octet2 <= 31) ||
        (octet1 === 192 && octet2 === 168) ||
        (octet1 === 169 && octet2 === 254)
      ) {
        return {
          valid: false,
          error: 'Access to private or link-local IP addresses is prohibited.',
          code: 'BLOCKED_URL'
        };
      }
    }

    return {
      valid: true,
      url: parsed.toString()
    };
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid complete URL starting with http:// or https://',
      code: 'INVALID_URL'
    };
  }
}
