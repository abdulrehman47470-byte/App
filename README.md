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

## Mock data notes

Mock state (likes, matches, messages, blocks) is kept in your browser's localStorage so reloads keep it.
**Sign Out** resets everything. Marcus, Hannah and Darnell have already "liked" you, so liking them back
shows the "It's a match" screen.

## Performance

Measured with `npm run perf` (production build, simulated mid-range phone on 4G, CPU slowed 2x):

| | Before optimising | Now |
|---|---|---|
| JavaScript downloaded to show the Welcome screen | 215 KB | 126 KB |
| Welcome screen visible | ~0.6 s | ~0.5 s (mostly network round trips) |
| Opening a tab for the first time (incl. ~70 ms test-tool overhead) | 0.2–0.7 s | 0.1–0.2 s |
| Opening a tab for the first time (measured inside the page) | not measured | 20–80 ms |
| Returning to a tab (measured inside the page) | not measured | 10–45 ms |
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
