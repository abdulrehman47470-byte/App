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
import App from './App';
import { ToastProvider } from './components/ui/toast';
import { SessionProvider } from './lib/session';

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
