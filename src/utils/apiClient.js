/**
 * Network Resilient API Client with Auto-Retry and Mobile Keep-Alive Support
 */

export async function fetchWithRetry(url, options = {}, retries = 2, delayMs = 1000) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 60000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      lastError = err;
      const isAbort = err.name === 'AbortError';
      const isNetworkError = err.message?.includes('Failed to fetch') || 
                             err.message?.includes('NetworkError') || 
                             err.message?.includes('Load failed') ||
                             err.message?.includes('ECONNRESET');

      if (attempt < retries && (isNetworkError || isAbort)) {
        console.warn(`[Network] Connection retry ${attempt + 1}/${retries} for "${url}" after ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 1.5; // Exponential backoff
        continue;
      }
      break;
    }
  }

  throw lastError;
}
