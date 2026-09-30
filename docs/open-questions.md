# Open Questions & Conflicts

Status: Phase 0 (UI with mock data) is complete. **The client documents are not in `/docs` yet**, so
`requirements.json` and the document cross-check have not been done. Everything below comes from the
build prompt and the concept board (`design-reference.png`).

## Blocked: files needed

- [ ] 6 Word files: Daily Stogie Profile.docx, Profile Page 2.docx, Privacy Policy, Terms and Conditions,
      Code of Ethics, Indemnification
- [ ] 9 xlsx files: US Cigar Lounges, Professional Industries, Sports, Hobbies, Music Preferences,
      Religions, Languages, Political Affiliations, First Responders
- [ ] Screenshots of the client's latest notes (Profile #1, User Type, Sign-up)

## Open decisions (need an answer before the phase in brackets)

| # | Question | What Phase 0 does for now | Needed by |
|---|----------|---------------------------|-----------|
| 1 | What does the "d" in "Face Recognition / 21+ Age Verification / d…" mean? | Nothing extra | Phase 2 |
| 2 | Confirm: free in-browser photo check now ("Photo verified" badge), paid ID + age check later. The free check does not prove age or identity. | Simulated check; UI says so plainly; "Verify ID: Later" card | Phase 2 |
| 3 | "Gender preference": the member's own gender, or who they want to match with? | Labelled "Gender", placeholder list | Phase 3 |
| 4 | Age scroller: editable, or display-only age from date of birth? | Wheel shown read-only, computed from DOB (matches the board's "read-only from DOB") | Phase 3 |
| 5 | Are User type, Experience level and Cigar knowledge one field? | Yes, one `userType` field with 5 values | Phase 3 |
| 6 | Missing lists: gender, pronoun, ethnicity, countries, states | Clearly marked placeholders in `src/data/options.ts` (US states and Canadian provinces are complete) | Phase 1 |
| 7 | Political affiliation and first responder: short doc list or full xlsx? | 10 mock options each | Phase 1 |
| 8 | Can either member message first? Do matches expire? Daily like limit? Can members hide from Discover? | Either can message; no expiry; no limit; no hide toggle | Phase 4 |
| 9 | Does "Stogie Search (purchase)" mean anything beyond a lounge locator? | Locator only; page says "does not sell tobacco" | Phase 7 |
| 10 | Map provider/key, Vimeo account, Stripe account | Map and Vimeo placeholders | Phases 6–7 |
| 11 | Enforce 21+ everywhere (Terms mention 18 or 21 by local law)? | 21+ everywhere | Phase 2 |

## Conflicts found (concept board vs. client rules)

These are from the concept board. In each case Phase 0 followed the client rules, not the board.

| Board shows | Client rule | Phase 0 choice |
|-------------|-------------|----------------|
| "Skip (not recommended)" on Photo Upload | Photo is mandatory; no photo means no access | No skip button |
| "Message" button on Discover cards | Only matched members can message | Pass / Undo / Like only; Message appears after a match |
| Refer a Friend "Your Rewards: 1 month premium per friend" | No rewards requested | Plain invite link + copy + share; TODO to confirm rewards |

## Other TODOs flagged in code

- Support email address for the Access Restricted screen (`src/pages/onboarding/restricted.tsx`)
- Production domain for invite links (`src/pages/settings.tsx`)
- Legal text: placeholders until the exact document text is inserted (Phase 7, `src/content/legal.ts`)
- Code of Ethics summary wording is from the board; confirm against Code of Ethics.docx
- ~130 favorite brands: only the 16 named in the prompt so far (`src/data/options.ts`)
