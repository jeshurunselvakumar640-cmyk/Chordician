import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import dotenv from 'dotenv';

dotenv.config();

function devHtmlProxyPlugin() {
  return {
    name: 'dev-html-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy-html', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Chordician/1.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            signal: controller.signal
          });
          clearTimeout(timer);

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Failed with HTTP ${response.status}`);
            return;
          }

          const html = await response.text();
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (err) {
          res.statusCode = 502;
          res.end(err.message || 'Fetch failed');
        }
      });
    }
  };
}

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
    devHtmlProxyPlugin(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png'],
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
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      },
      devOptions: {
        enabled: true,
        type: 'module'
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
            if (id.includes('@google/generative-ai')) return 'vendor-gemini';
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/@remix-run/') ||
              id.includes('node_modules/use-sync-external-store/')
            ) {
              return 'vendor-react';
            }
            return 'vendor-libs';
          }
        }
      }
    }
  }
});

