// Loaded by the service worker (see vite.config.ts). When a NEW version replaces an older one,
// open windows of the app reload onto it, so nobody keeps looking at the previous version.
// A first-time visitor (no older version installed) is never reloaded.
let isUpdate = false;
self.addEventListener('install', () => {
  isUpdate = !!self.registration.active;
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  if (!isUpdate) return;
  // Each open page reloads itself when it gets 'reload' (listener in main.tsx).
  setTimeout(() => {
    self.clients.matchAll({ type: 'window' }).then((windows) => {
      for (const w of windows) w.postMessage({ type: 'reload' });
    });
  }, 0);
});
