import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Preload the fonts used on the first screen so text renders in the right typeface immediately
 * (no flash of fallback fonts). Only the Latin files for the weights shown on Welcome.
 */
function preloadFonts(patterns: RegExp[]): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) => f.endsWith('.woff2') && patterns.some((p) => p.test(f)));
        const tags = files.map((f) => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin>`).join('\n    ');
        return html.replace('</title>', `</title>\n    ${tags}`);
      },
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadFonts([/inter-latin-400-normal/, /inter-latin-600-normal/, /playfair-display-latin-600-normal/]),
    // Service worker: after the first visit the app shell loads straight from the device,
    // so repeat visits open instantly and work offline. New versions update automatically.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Daily Stogie',
        short_name: 'Daily Stogie',
        description: 'A members-only network for adult (21+) cigar enthusiasts.',
        theme_color: '#0d0a08',
        background_color: '#0d0a08',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Map tiles: cache what members have already seen.
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'map-tiles', expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 3600 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // Modern browsers only (the app already requires them for camera + PWA): smaller output.
    target: 'es2022',
  },
});
