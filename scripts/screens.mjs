// Visual QA: screenshots every screen at mobile (390x844) and desktop (1280x800) sizes.
// Usage: start the dev server (npm run dev), then `npm run screens`. Output: docs/screens/
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = 'docs/screens';
const ONLY = process.argv[2]; // optional name filter
mkdirSync(OUT, { recursive: true });

const base = { signedIn: true, method: 'email', photoCheck: 'idle', biometricConsent: false, ethicsAgreed: false, photoUploaded: false, profileStep: 0, role: 'member' };
const done = { ...base, dob: '1989-04-18', photoCheck: 'verified', biometricConsent: true, ethicsAgreed: true, photoUploaded: true, plan: 'yearly', profileStep: 3, role: 'admin' };

/** [name, path, session state or 'demo', optional action] */
const SCREENS = [
  ['01-welcome', '/', null],
  ['02-sign-in', '/signin', null],
  ['02b-sign-up', '/signin?mode=signup', null],
  ['03a-age', '/verify/age', base],
  ['03b-face', '/verify/face', { ...base, dob: '1989-04-18' }],
  ['03c-restricted', '/restricted', { ...base, underage: true }],
  ['04-ethics', '/ethics', { ...base, dob: '1989-04-18', photoCheck: 'verified' }],
  ['05-photo', '/photo', { ...base, dob: '1989-04-18', photoCheck: 'verified', ethicsAgreed: true }],
  ['06-paywall', '/subscribe', { ...base, dob: '1989-04-18', photoCheck: 'verified', ethicsAgreed: true, photoUploaded: true }],
  ['07-setup-1', '/setup/1', 'demo'],
  ['08-setup-2', '/setup/2', 'demo'],
  ['09-setup-3', '/setup/3', 'demo'],
  ['10-discover', '/discover', 'demo'],
  ['10b-discover-filters', '/discover', 'demo', async (p) => p.getByRole('button', { name: /^Filters/ }).click()],
  ['10c-its-a-match', '/member/m1', 'demo', async (p) => { await p.getByRole('button', { name: /^Like$/ }).click(); await p.waitForTimeout(1600); }],
  ['11-member-profile', '/member/m2', 'demo'],
  ['12-mentors', '/mentors', 'demo'],
  ['13-matches', '/matches', 'demo'],
  ['14-messages', '/messages', 'demo'],
  ['15-chat', '/messages/m2', 'demo'],
  ['16-my-profile', '/profile', 'demo'],
  ['17-settings', '/settings', 'demo'],
  ['18-subscription', '/settings/subscription', 'demo'],
  ['19-stogie-search', '/search', 'demo'],
  ['20-sessions', '/sessions', 'demo'],
  ['20b-session-detail', '/sessions/s1', 'demo'],
  ['21-blog', '/blog', 'demo'],
  ['21b-blog-post', '/blog/how-to-store-cigars', 'demo'],
  ['22-legal-ethics', '/legal/ethics', 'demo'],
  ['22b-legal-terms', '/legal/terms', 'demo'],
  ['23-refer', '/refer', 'demo'],
  ['24-delete-account', '/settings/delete', 'demo'],
  ['25-admin', '/admin', 'demo'],
  ['25b-admin-reports', '/admin', 'demo', async (p) => p.getByRole('tab', { name: 'Reports' }).click()],
  ['26-safety-sheet', '/member/m5', 'demo', async (p) => p.getByRole('button', { name: /Report or block/ }).click()],
];

const sizes = [
  { tag: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { tag: 'desktop', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
];

const browser = await chromium.launch();
const errors = [];
for (const size of sizes) {
  for (const [name, path, state, action] of SCREENS) {
    if (ONLY && !name.includes(ONLY)) continue;
    const ctx = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.deviceScaleFactor, reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
    if (state === 'demo') {
      await page.goto(BASE + '/');
      await page.getByRole('button', { name: /explore with a demo member/ }).click();
      await page.waitForURL('**/discover');
      await page.evaluate((s) => localStorage.setItem('ds.session', JSON.stringify(s)), done);
    } else if (state) {
      await page.addInitScript((s) => localStorage.setItem('ds.session', JSON.stringify(s)), state);
    }
    await page.goto(BASE + path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(900);
    if (action) {
      await action(page);
      await page.waitForTimeout(700);
    }
    await page.screenshot({ path: `${OUT}/${name}-${size.tag}.png` });
    await ctx.close();
  }
}
await browser.close();
console.log(errors.length ? `Console errors:\n${[...new Set(errors)].join('\n')}` : 'No console errors.');
