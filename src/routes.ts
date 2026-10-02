// Every screen is loaded on demand (code splitting) and preloaded in the background, so the first
// download stays small and tapping a tab is instant. `prefetchRoute` is safe to call repeatedly.

import { cachedLoader } from '@/lib/lazy-page';

export const pages = {
  shell: cachedLoader(() => import('@/components/layout/app-shell')),
  signIn: cachedLoader(() => import('@/pages/onboarding/sign-in')),
  verifyAge: cachedLoader(() => import('@/pages/onboarding/verify-age')),
  verifyFace: cachedLoader(() => import('@/pages/onboarding/verify-face')),
  restricted: cachedLoader(() => import('@/pages/onboarding/restricted')),
  ethics: cachedLoader(() => import('@/pages/onboarding/ethics')),
  photo: cachedLoader(() => import('@/pages/onboarding/photo-upload')),
  paywall: cachedLoader(() => import('@/pages/onboarding/paywall')),
  setup: cachedLoader(() => import('@/pages/profile-setup')),
  feed: cachedLoader(() => import('@/pages/feed')),
  discover: cachedLoader(() => import('@/pages/discover')),
  map: cachedLoader(() => import('@/pages/member-map')),
  memberProfile: cachedLoader(() => import('@/pages/member-profile')),
  mentors: cachedLoader(() => import('@/pages/mentors')),
  connections: cachedLoader(() => import('@/pages/connections')),
  messages: cachedLoader(() => import('@/pages/messages')),
  chat: cachedLoader(() => import('@/pages/chat')),
  myProfile: cachedLoader(() => import('@/pages/my-profile')),
  search: cachedLoader(() => import('@/pages/stogie-search')),
  admin: cachedLoader(() => import('@/pages/admin')),
  settings: cachedLoader(() => import('@/pages/settings')),
  content: cachedLoader(() => import('@/pages/content')),
};

type PageKey = keyof typeof pages;

/** Which bundle each URL needs. */
const ROUTE_PAGES: [RegExp, PageKey[]][] = [
  [/^\/signin/, ['signIn']],
  [/^\/verify\/age/, ['verifyAge']],
  [/^\/verify\/face/, ['verifyFace']],
  [/^\/ethics/, ['ethics']],
  [/^\/photo/, ['photo']],
  [/^\/subscribe/, ['paywall']],
  [/^\/(setup|profile\/edit)/, ['setup']],
  [/^\/(feed|post)/, ['shell', 'feed']],
  [/^\/discover/, ['shell', 'discover']],
  [/^\/map/, ['shell', 'map']],
  [/^\/member\//, ['shell', 'memberProfile']],
  [/^\/mentors/, ['shell', 'mentors']],
  [/^\/(connections|matches)/, ['shell', 'connections']],
  [/^\/messages\/.+/, ['shell', 'chat']],
  [/^\/messages/, ['shell', 'messages']],
  [/^\/profile$/, ['shell', 'myProfile']],
  [/^\/search/, ['shell', 'search']],
  [/^\/admin/, ['admin']],
  [/^\/(settings|refer)/, ['shell', 'settings']],
  [/^\/(sessions|blog|legal)/, ['content']],
];

const started = new Set<PageKey>();

export function prefetchRoute(path: string) {
  for (const [re, keys] of ROUTE_PAGES) {
    if (!re.test(path)) continue;
    for (const k of keys) {
      if (started.has(k)) continue;
      started.add(k);
      pages[k]().catch(() => started.delete(k)); // retry on next hover if the network failed
    }
    return;
  }
}

/** Run work when the browser is idle (falls back to a short timeout on Safari). */
export function whenIdle(fn: () => void, timeout = 4000) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout });
  else setTimeout(fn, 300);
}

/**
 * Preload routes one at a time, each in its own idle period, so background loading never
 * competes with scrolling, swiping or typing.
 */
export function prefetchWhenIdle(paths: string[]) {
  const queue = [...paths];
  const next = () => {
    // Never load in the middle of a swipe, scroll or typing: wait until the member pauses.
    if (performance.now() - lastInteraction < 1200) return whenIdle(next, 8000);
    const path = queue.shift();
    if (!path) return;
    prefetchRoute(path);
    whenIdle(next, 8000);
  };
  whenIdle(next);
}

let lastInteraction = 0;
if (typeof window !== 'undefined') {
  const mark = () => (lastInteraction = performance.now());
  for (const type of ['pointerdown', 'pointermove', 'wheel', 'touchmove', 'keydown', 'scroll']) {
    window.addEventListener(type, mark, { passive: true, capture: true });
  }
}
