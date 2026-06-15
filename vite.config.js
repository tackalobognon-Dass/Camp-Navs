import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const SUPABASE = 'https://zkyzcemlndruwgirmfgy.supabase.co'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: false, // manifest.json géré manuellement dans /public
      workbox: {
        // Mise en cache de tous les fichiers statiques du build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Données Supabase (tables) — NetworkFirst : réseau en priorité, cache en fallback
            urlPattern: new RegExp(`^${SUPABASE}/rest/.*`),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fichiers audio et storage Supabase — CacheFirst : une fois chargé, toujours dispo
            urlPattern: new RegExp(`^${SUPABASE}/storage/.*`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-audio',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Auth Supabase — NetworkOnly : toujours en live
            urlPattern: new RegExp(`^${SUPABASE}/auth/.*`),
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts si utilisées
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
