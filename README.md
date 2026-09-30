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
