# Requirements Checklist

Maps each client requirement to the file that implements it. Status: **done (mock)** means the UI
works with mock data and still needs its backend phase; **placeholder** means waiting for client
content; **todo** means a later phase.

> The document-by-document check (`requirements.json`, `npm run verify:requirements`) starts once the
> client's Word/xlsx files are in `/docs`. See `open-questions.md`.

## Product rules

| Requirement | Status | Where |
|---|---|---|
| Sign in with Google, Apple or email (no Facebook) | done (mock) | `src/pages/onboarding/sign-in.tsx` |
| Members must be 21+; friendly blocked screen | done (mock) | `src/pages/onboarding/verify-age.tsx`, `restricted.tsx`, `src/lib/utils.ts` (`isOfAge`) |
| Face/photo check with consent, pending/verified/failed states; honest "does not prove ID or age" copy | done (simulated) | `src/pages/onboarding/verify-face.tsx` |
| Stogie Ethics agreement at sign-up + links to Terms and Privacy | done (mock) | `src/pages/onboarding/ethics.tsx` |
| Photo upload mandatory; photo rules shown; pending review | done (mock) | `src/pages/onboarding/photo-upload.tsx` |
| $1.99/month, $19.99/year (yearly "Best value, Save 16%"); auto-renew notice | done (placeholder payment) | `src/pages/onboarding/paywall.tsx` |
| Sign-up gates in the exact order, cannot be skipped | done (UI guards; DB in Phase 2) | `src/lib/session.tsx` (`nextStep`), `src/App.tsx` |
| IM text only, only matched members | done (mock) | `src/pages/chat.tsx`, `src/lib/api/mock.ts` (`sendMessage`) |
| Matching based on profile (weighted overlap, sensitive fields excluded) | done (client-side stand-in) | `src/lib/matching.ts` |
| No marketplace / purchase features | done | Stogie Search is a locator only |
| Report and Block on cards, profiles and chats | done (mock) | `src/features/safety/safety-sheet.tsx` |
| Safety banner "Meet in public places…" | done | `src/components/brand/ornaments.tsx` (`SafetyBanner`) |
| 21+ trust note where relevant | done | `TrustNote` in `ornaments.tsx` |

## Screens

| Screen | Status | Where |
|---|---|---|
| Welcome | done | `src/pages/onboarding/welcome.tsx` |
| Sign in / Sign up | done (mock) | `src/pages/onboarding/sign-in.tsx` |
| Age verification + Access Restricted | done (mock) | `verify-age.tsx`, `restricted.tsx` |
| Photo check | done (simulated) | `verify-face.tsx` |
| Stogie Ethics | done | `ethics.tsx` |
| Photo upload | done (mock) | `photo-upload.tsx` |
| Subscription paywall | done (placeholder) | `paywall.tsx` |
| Profile #1 Demographics | done (mock) | `src/features/profile/step-demographics.tsx` |
| Profile #2 Stogie Preferences (all groups) | done (mock) | `src/features/profile/step-preferences.tsx`, `src/data/options.ts` |
| Profile #3 About You (sensitive-field toggles + privacy note) | done (10 mock options each) | `src/features/profile/step-about.tsx` |
| Discover swipe deck, filters, undo, keyboard, It's a match | done (mock) | `src/pages/discover.tsx`, `src/features/discover/*` |
| Full member profile (LinkedIn-style, shared items in gold) | done (mock) | `src/pages/member-profile.tsx`, `src/features/profile/profile-sections.tsx` |
| Mentors (Find a mentor / Guide beginners, by topic) | done (mock) | `src/pages/mentors.tsx` |
| Matches (new row + list) | done (mock) | `src/pages/matches.tsx` |
| Messages + Chat | done (mock) | `src/pages/messages.tsx`, `src/pages/chat.tsx` |
| My Profile (completeness ring, Edit) | done (mock) | `src/pages/my-profile.tsx`, `src/lib/completeness.ts` |
| Settings menu (all 11 items) | done | `src/features/settings/settings-menu.tsx` |
| Subscription management | done (placeholder) | `src/pages/settings.tsx` |
| Stogie Search (map placeholder + filterable list, Call, Directions) | done (10 mock lounges) | `src/pages/stogie-search.tsx` |
| Stogie Sessions + video page | done (Vimeo placeholder) | `src/pages/content.tsx` |
| Stogie Blog + article | done (mock articles) | `src/pages/content.tsx` |
| Legal pages (Privacy, Terms, Ethics, Indemnification) | placeholder | `src/pages/content.tsx`, `src/content/legal.ts` |
| Refer a Friend (link, copy, share; no rewards) | done (mock) | `src/pages/settings.tsx` |
| Delete my account + data export | done (mock) | `src/pages/settings.tsx` |
| Sign Out | done | `settings-menu.tsx` |
| Admin: photo review, reports (warn/suspend/ban), users, Sessions & Blog management | done (mock) | `src/pages/admin.tsx` |

## Profile field rules

| Rule | Status | Where |
|---|---|---|
| Name prefilled from sign-up, editable | done | `step-demographics.tsx` |
| Age wheel, minimum 21 (read-only from DOB, pending decision #4) | done | `src/components/ui/wheel-picker.tsx` |
| Pronouns list | done | `src/data/options.ts` (`PRONOUNS`) |
| Gender / ethnicity / countries | placeholder | `src/data/options.ts` |
| State depends on country | done (US, Canada) | `STATES_BY_COUNTRY` |
| ZIP validated per country | done (US, Canada) | `ZIP_PATTERNS` |
| One `userType` field (Beginner…Collector) shown as badge, used in filters and matching | done | `USER_TYPES` |
| Bio limit 500 with counter (config value) | done | `BIO_MAX` |
| Social: Instagram, Facebook, LinkedIn only | done | `step-demographics.tsx` |
| Ethnicity, religion, political: optional, visibility toggle, not used for matching | done | `step-demographics.tsx`, `step-about.tsx`, `matching.ts` |
| Flavor duplicates merged (Earth, Citrus, Coffee) | done | `options.ts` (flavors) |
| Favorite brands (~130) | placeholder (16 so far) | `options.ts` |

## Design spec

| Item | Status | Where |
|---|---|---|
| Color tokens as CSS variables + Tailwind tokens, dark only | done | `src/styles/index.css` |
| Playfair Display + Inter, self-hosted | done | `src/main.tsx` |
| Wood/leather noise texture, drifting smoke on Welcome | done | `.texture`, `.smoke` |
| Original logo mark + wordmark | done | `src/components/brand/logo.tsx` |
| No real people's photos (generated portraits) | done | `src/components/brand/portrait.tsx` |
| Drag physics + LIKE/PASS stamps, next card scales up | done | `src/pages/discover.tsx` |
| It's a match overlay with particles | done | `src/features/discover/match-overlay.tsx` |
| Animated onboarding progress bar, chip press-scale, gold shimmer | done | `page.tsx`, `chip.tsx`, `button.tsx` |
| Skeleton loaders, optimistic messages | done | throughout, `features/queries.ts` |
| Completeness ring, match ring, cigar-band divider, verified badge, empty-state illustrations | done | `src/components/brand/*` |
| Reduced motion respected | done | `MotionConfig reducedMotion="user"`, CSS media query |
| 44px targets, labels, focus rings, keyboard swipe, aria-live | done | throughout |
| Bottom tabs on mobile, side rail on desktop, 430px column | done | `src/components/layout/app-shell.tsx` |
| Visual QA screenshots (390×844, 1280×800) | done | `npm run screens` → `docs/screens/` |
