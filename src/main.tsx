import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import './styles/index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, MotionConfig } from 'framer-motion';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ToastProvider } from './components/ui/toast';
import { SessionProvider } from './lib/session';

// Always show the newest version, on computers and phones. The service worker installs new versions
// straight away; on top of that, whenever the app opens or comes back to the screen (phones resume
// apps rather than reopening them) it compares its build id with /version.json and reloads if a
// newer version is live.
navigator.serviceWorker?.addEventListener('message', (e) => {
  if (e.data?.type === 'reload') window.location.reload();
});
let swReg: ServiceWorkerRegistration | undefined;
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    swReg = reg;
  },
});
let lastCheck = 0;
async function checkForNewVersion() {
  if (import.meta.env.DEV || Date.now() - lastCheck < 5_000) return;
  lastCheck = Date.now();
  swReg?.update().catch(() => {});
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    const { id } = (await res.json()) as { id?: string };
    // Reload once per new version (guards against a loop if the network hands back an old page).
    if (id && id !== __BUILD_ID__ && sessionStorage.getItem('ds.reloaded-for') !== id) {
      sessionStorage.setItem('ds.reloaded-for', id);
      window.location.reload();
    }
  } catch {
    // offline: keep the version we have
  }
}
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && checkForNewVersion());
window.addEventListener('pageshow', (e) => e.persisted && checkForNewVersion());
window.addEventListener('focus', checkForNewVersion);
window.addEventListener('online', checkForNewVersion);
setInterval(checkForNewVersion, 30 * 60_000);
checkForNewVersion();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data instantly when returning to a screen; refresh quietly in the background.
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const loadMotionFeatures = () => import('./lib/motion-features').then((m) => m.default);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionProvider>
          <LazyMotion features={loadMotionFeatures} strict>
            <MotionConfig reducedMotion="user">
              <ToastProvider>
                <App />
              </ToastProvider>
            </MotionConfig>
          </LazyMotion>
        </SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
