import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import dotenv from 'dotenv';

dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      Buffer.from('QVEuQWI4Uk42Skc0VkltMmlmNEpIaEtMWjdtMTZral9XOEJnSnhUZUU5cTJaQl9TU3NvdlE=', 'base64').toString('utf8')
    )
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png'],
      manifest: {
        name: 'Chordician',
        short_name: 'Chordician',
        description: 'Every Chord, For Him',
        theme_color: '#0b0f19',
        background_color: '#0b0f19',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // CRITICAL: NEVER cache API or backend endpoints - NetworkOnly
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            // CRITICAL: NEVER cache Firebase Auth, Firestore, Google APIs - NetworkOnly
            urlPattern: /^https:\/\/(?:firestore|identitytoolkit|securetoken|firebaseinstallations)\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            // Cache Google Fonts webfonts
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
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
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
            if (id.includes('@google/generative-ai')) return 'vendor-gemini';
            return 'vendor-libs';
          }
        }
      }
    }
  }
});

