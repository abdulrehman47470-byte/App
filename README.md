# Daily Stogie

A members-only social matching network for adult (21+) cigar enthusiasts: Bumble-style matching with
LinkedIn-style profiles, and text-only messaging between matches.

**Current status: Phase 0.** The full UI runs on mock data. No keys and no backend are needed yet.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. On the Welcome screen, click **"explore with a demo member"** to skip
sign-up and land in the app as a fully set-up member (with admin access). Or click **Sign up** to go
through the whole sign-up flow.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally |
| `npm run build` | Typecheck and build for production |
| `npm run typecheck` / `npm run lint` | Code checks |
| `npm run screens` | Screenshot every screen into `docs/screens/` (needs `npm run dev` running) |
| `npm run smoke` | Click through sign-up → match → message automatically (needs `npm run dev` running) |
| `npm run setup:check` | Show which keys are missing, in plain English |
| `npm run preview` then `npm run perf` | Measure load and tab-switch speed on the production build (simulated phone on 4G) |
| `npm run preview` then `npm run smooth` | Measure smoothness (frames per second, stutters) while scrolling, swiping, opening sheets, panning the map |
| `npm run icons` | Regenerate the app icons from `public/icon.svg` |

## Where things live

- `src/pages/`: one file per screen
- `src/features/`: bigger pieces used by screens (profile wizard, swipe deck, safety sheet, queries)
- `src/components/`: shared UI (`ui/`), brand pieces (`brand/`) and layout (`layout/`)
- `src/data/options.ts`: every profile option list from the client
- `src/data/mock/`: fictional mock members, lounges, sessions, blog posts
- `src/lib/api/`: the data layer. Screens only talk to it through `src/features/queries.ts`, so Phase 1
  can swap the mock for Supabase without touching the screens.
- `docs/`: design reference, requirements checklist, open questions, screenshots

## Mock sign-in and payment (Phase 0)

- **Continue with Google** opens a mock Google sign-in (email, then consent, then back to the app; returning
  users get an account chooser). It never asks for a password and sends nothing to Google. Phase 2 swaps it for
  real Google sign-in via Supabase Auth.
- **Continue to payment** opens a mock card checkout. Any details, or none, are accepted; "Fill in a test card"
  fills 4242 4242 4242 4242. A receipt is shown and the plan/payment method appear under Settings → Subscription.
  Phase 6 swaps it for Stripe Checkout.
- Posts can include photos and videos. They appear instantly and are kept on the device (IndexedDB) until
  Phase 1 moves uploads to Supabase Storage. Posts can be saved (Saved filter), edited and deleted.

## Mock data notes

Mock state (likes, matches, messages, blocks) is kept in your browser's localStorage so reloads keep it.
**Sign Out** resets everything. Marcus, Hannah and Darnell have already "liked" you, so liking them back
shows the "It's a match" screen.

## Performance

Measured with `npm run perf` (production build, simulated mid-range phone on 4G, CPU slowed 2x):

| | Before optimising | Now |
|---|---|---|
| JavaScript downloaded to show the Welcome screen | 215 KB | 126 KB |
| Welcome screen visible | ~0.6 s | ~0.57 s, now including the logo image (mostly network round trips) |
| Opening a tab for the first time (incl. ~70 ms test-tool overhead) | 0.2–0.7 s | 0.1–0.2 s |
| Opening a tab for the first time (measured inside the page) | not measured | 20–115 ms |
| Returning to a tab (measured inside the page) | not measured | 10–70 ms |
| Reopening the app (service worker cache) | full download | ~90 ms once the browser has cached compiled code |

How:
- Every screen is its own small file, loaded on demand (`src/routes.ts`).
- While you are idle, the app quietly preloads the other tabs' code and data, and it starts loading a
  tab the moment your finger touches it, so tabs open with no loading skeleton.
- Data is cached for a minute and reused when you come back to a screen.
- Animation code is loaded after the first paint; page entrances use plain CSS.
- Only Latin font files are loaded, and the three used on the first screen are preloaded.
- A service worker (PWA) keeps the app on the device, so repeat visits skip the network and it can be
  installed to the home screen. Hosting on Vercel adds long-lived caching for the hashed files (`vercel.json`).

The mock data no longer adds a fake delay. Set `VITE_MOCK_LATENCY=true` in `.env` to bring it back when
checking loading states.

## Smoothness

Measured with `npm run smooth` (production build, CPU slowed 4x like a mid-range phone; 60 fps is perfect):

| Action | Before | Now |
|---|---|---|
| Drag a Discover card | 37 fps, 76 stutters | 59–60 fps, 1 stutter |
| Open a sheet (worst frame) | 333 ms freeze | ~130–150 ms, once, on first open |
| Switch tabs (worst frame) | 200 ms | ~80 ms |
| Pan the map | 59 fps | 59–60 fps |
| Scroll the Home feed | 57 fps, 10 stutters | 55–58 fps, short stutters only (33–67 ms) |
| Welcome animations | 60 fps | 60 fps |

How:
- No background-blur effects (`backdrop-filter`) anywhere: they are recomputed on every scroll frame on phones.
- Portraits and post art are cached images instead of complex inline graphics, and use gradients
  instead of blur filters, so the browser draws them once.
- Swipe cards run on their own GPU layer; the cards behind are dimmed with an overlay instead of a filter.
- The main tabs stay alive after the first visit (React `<Activity>`) and are pre-built while you are idle,
  so switching tabs rebuilds nothing and each tab keeps its scroll position.
- Preloaded screens render straight away (no ~300 ms Suspense reveal delay), and background preloading
  pauses while you are touching, scrolling or typing.
- Sheets slide in with GPU-only animations and fill in their contents one frame later.
- Taps respond immediately (no double-tap-zoom delay); off-screen posts are skipped by the browser.

Also fixed: releasing a card without completing the swipe no longer opens that member's profile.
