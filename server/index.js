import app from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chordician Express Server listening on http://0.0.0.0:${PORT}`);
});

// Configure keep-alive timeout longer than standard mobile client socket timeouts (prevents ECONNRESET / disconnection on mobile)
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
