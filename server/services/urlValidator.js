import dns from 'dns/promises';
import { URL } from 'url';

/**
 * Checks if an IPv4 or IPv6 address belongs to a private, loopback, or reserved range.
 */
export function isPrivateIp(ip) {
  if (!ip || typeof ip !== 'string') return true;

  const cleanIp = ip.trim();

  // IPv4 Loopback (127.0.0.0/8)
  if (/^127\./.test(cleanIp)) return true;

  // IPv4 Private Class A (10.0.0.0/8)
  if (/^10\./.test(cleanIp)) return true;

  // IPv4 Private Class B (172.16.0.0/12 -> 172.16.x.x to 172.31.x.x)
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)) return true;

  // IPv4 Private Class C (192.168.0.0/16)
  if (/^192\.168\./.test(cleanIp)) return true;

  // IPv4 Link-local / APIPA (169.254.0.0/16)
  if (/^169\.254\./.test(cleanIp)) return true;

  // IPv4 Unspecified / Current network (0.0.0.0/8)
  if (/^0\./.test(cleanIp) || cleanIp === '0.0.0.0') return true;

  // IPv4 Carrier-grade NAT (100.64.0.0/10)
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(cleanIp)) return true;

  // IPv4 Multicast & Reserved (224.0.0.0/4 and 240.0.0.0/4)
  if (/^(22[4-9]|23[0-9]|24[0-9]|25[0-5])\./.test(cleanIp)) return true;

  // IPv6 Loopback (::1 or 0:0:0:0:0:0:0:1)
  if (cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1' || cleanIp === '::') return true;

  // IPv6 Unique Local (fc00::/7 -> fc.. or fd..)
  if (/^f[cd][0-9a-f]{2}:/i.test(cleanIp)) return true;

  // IPv6 Link-Local (fe80::/10)
  if (/^fe[89ab][0-9a-f]:/i.test(cleanIp)) return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 etc.)
  if (/^::ffff:([0-9.]+)$/i.test(cleanIp)) {
    const v4 = cleanIp.replace(/^::ffff:/i, '');
    return isPrivateIp(v4);
  }

  return false;
}

/**
 * Validates that a URL is safe to fetch (HTTP/HTTPS only, no SSRF, no private IP ranges).
 */
export async function validateUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Please enter a valid webpage URL.', code: 'INVALID_URL' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString.trim());
  } catch {
    return { valid: false, error: 'Please enter a valid webpage URL (including https://).', code: 'INVALID_URL' };
  }

  // 1. Protocol check
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      valid: false,
      error: 'Only HTTP and HTTPS URLs are supported.',
      code: 'BLOCKED_URL'
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 2. Block direct localhost / loopback names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return {
      valid: false,
      error: 'Cannot import from local or internal network addresses.',
      code: 'BLOCKED_URL'
    };
  }

  // 3. If hostname is a raw IP, check immediately
  if (isPrivateIp(hostname)) {
    return {
      valid: false,
      error: 'Cannot import from private or local network IP addresses.',
      code: 'BLOCKED_URL'
    };
  }

  // 4. DNS resolution check to prevent DNS rebinding attacks to private IPs
  try {
    const dnsPromise = dns.lookup(hostname, { all: true });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), 3000)
    );

    const addresses = await Promise.race([dnsPromise, timeoutPromise]);
    if (!addresses || addresses.length === 0) {
      return {
        valid: false,
        error: 'Unable to resolve the specified website hostname.',
        code: 'FETCH_FAILED'
      };
    }

    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        return {
          valid: false,
          error: 'This domain resolves to a private or restricted network address.',
          code: 'BLOCKED_URL'
        };
      }
    }
  } catch (err) {
    if (err.message === 'DNS_TIMEOUT') {
      return {
        valid: false,
        error: `DNS resolution timed out for "${hostname}".`,
        code: 'FETCH_TIMEOUT'
      };
    }
    return {
      valid: false,
      error: `DNS lookup failed for "${hostname}". Please check the URL.`,
      code: 'FETCH_FAILED'
    };
  }

  return {
    valid: true,
    url: parsedUrl.toString(),
    hostname: parsedUrl.hostname
  };
}
