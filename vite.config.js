import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces for reliable mobile access
    port: 5173,
    open: false,
    cors: true,
    hmr: {
      overlay: false // Prevent full-screen red error modals on mobile when reconnecting after sleep
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
});

