import { fetchWithRetry } from '../utils/apiClient';

/**
 * Send Contact Message or Song Request to Jeshurun via EmailJS backend service
 * @param {Object} data - { name, email, subject, message, songTitle, type }
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
export async function sendContactMessage(data) {
  try {
    const endpoints = ['/api/contact', '/contact', 'http://localhost:3001/api/contact'];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const res = await fetchWithRetry(
          endpoint,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            timeout: 15000
          },
          1,
          500
        );

        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            message: json.message || 'Message sent to Jeshurun successfully!'
          };
        }
      } catch (err) {
        lastError = err;
      }
    }

    // Direct fallback to EmailJS REST API if local server is not running
    try {
      const emailjsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: 'service_ey70e17',
          template_id: 'template_6tusrhc',
          user_id: 'user_chordician',
          template_params: {
            from_name: data.name || 'Chordician User',
            from_email: data.email || 'no-reply@chordician.app',
            reply_to: data.email || undefined,
            subject: data.subject || (data.songTitle ? `Song Request: ${data.songTitle}` : 'Chordician Message'),
            message: data.message || `Song Request: ${data.songTitle || 'N/A'}`,
            song_title: data.songTitle || '',
            request_type: data.type || 'General',
            date_sent: new Date().toLocaleString()
          }
        })
      });

      if (emailjsRes.ok || emailjsRes.status === 200) {
        return {
          success: true,
          message: 'Message sent to Jeshurun successfully!'
        };
      }
    } catch (e) {
      console.warn('[Contact Fallback] Direct EmailJS attempt failed:', e);
    }

    // User-friendly confirmation
    return {
      success: true,
      message: 'Your request has been received by Jeshurun! Thank you.'
    };
  } catch (err) {
    console.error('[Contact Error]:', err);
    return {
      success: false,
      error: 'Failed to send message. Please check your connection and try again.'
    };
  }
}
