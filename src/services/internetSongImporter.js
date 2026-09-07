/**
 * Frontend client service for "Import from Internet" (Chordex non-destructive extension).
 *
 * Calls backend `/api/import-internet/search` which checks allowlisted sources:
 * 1. chordsver.com
 * 2. thegodsmusic.com
 * 3. tamilchristiansongs.in
 * 4. churchspot.com
 * 5. songsofpraise.in
 * 6. yeshukegeet.com
 */

const API_BASE_URL = typeof window !== 'undefined' && window.location.origin ? '' : 'http://localhost:5000';

export async function searchAndImportFromInternet(query, onProgress = null) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      success: false,
      error: 'Please enter a song title to search.',
      code: 'EMPTY_QUERY'
    };
  }

  const cleanQuery = query.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/api/import-internet/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: cleanQuery })
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[Internet Song Importer Error]:', err);
    return {
      success: false,
      error: err.message || 'Unable to connect to the search server. Please check your connection.',
      code: 'NETWORK_ERROR'
    };
  }
}
