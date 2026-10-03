import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
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
    // React Compiler: automatically skips re-rendering parts of the screen that did not change,
    // which keeps typing and tapping in long forms (e.g. hundreds of preference chips) instant.
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    preloadFonts([/inter-latin-400-normal/, /inter-latin-600-normal/, /playfair-display-latin-600-normal/]),
    // Service worker: after the first visit the app shell loads straight from the device,
    // so repeat visits open instantly and work offline. The page itself is always fetched from the
    // network first (cache only when offline), so a new deploy shows on the very next open.
    VitePWA({
      // New versions install at once (skipWaiting) and sw-reload.js moves open windows onto them.
      registerType: 'prompt',
      injectRegister: false, // registered in main.tsx, which also checks for updates on return to the tab
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo-mark.webp', 'logo-mark@2x.webp'],
      manifest: {
        name: 'Daily Stogie',
        short_name: 'Daily Stogie',
        description: 'A members-only network for adult (21+) cigar enthusiasts.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,svg,png,webp,woff2}'],
        globIgnores: ['members/**'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['/sw-reload.js'],
        runtimeCaching: [
          {
            // App pages: newest version from the network; the saved copy only when offline.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages', networkTimeoutSeconds: 4, expiration: { maxEntries: 20 } },
          },
          {
            // Member photos: cached on first view, then instant.
            urlPattern: ({ url }) => url.pathname.startsWith('/members/'),
            handler: 'CacheFirst',
            options: { cacheName: 'member-photos', expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 } },
          },
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
