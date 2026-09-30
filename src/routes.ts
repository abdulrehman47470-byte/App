// Every screen is loaded on demand (code splitting) and preloaded in the background, so the first
// download stays small and tapping a tab is instant. `prefetchRoute` is safe to call repeatedly.

export const pages = {
  shell: () => import('@/components/layout/app-shell'),
  signIn: () => import('@/pages/onboarding/sign-in'),
  verifyAge: () => import('@/pages/onboarding/verify-age'),
  verifyFace: () => import('@/pages/onboarding/verify-face'),
  restricted: () => import('@/pages/onboarding/restricted'),
  ethics: () => import('@/pages/onboarding/ethics'),
  photo: () => import('@/pages/onboarding/photo-upload'),
  paywall: () => import('@/pages/onboarding/paywall'),
  setup: () => import('@/pages/profile-setup'),
  feed: () => import('@/pages/feed'),
  discover: () => import('@/pages/discover'),
  map: () => import('@/pages/member-map'),
  memberProfile: () => import('@/pages/member-profile'),
  mentors: () => import('@/pages/mentors'),
  matches: () => import('@/pages/matches'),
  messages: () => import('@/pages/messages'),
  chat: () => import('@/pages/chat'),
  myProfile: () => import('@/pages/my-profile'),
  search: () => import('@/pages/stogie-search'),
  admin: () => import('@/pages/admin'),
  settings: () => import('@/pages/settings'),
  content: () => import('@/pages/content'),
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
  [/^\/matches/, ['shell', 'matches']],
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
export function whenIdle(fn: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2000 });
  else setTimeout(fn, 300);
}

/** Preload a list of routes one after another during idle time. */
export function prefetchWhenIdle(paths: string[]) {
  whenIdle(() => paths.forEach(prefetchRoute));
}
