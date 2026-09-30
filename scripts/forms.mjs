// Form responsiveness check: how long each keystroke / tap takes to show on screen
// (Event Timing API, the same measure as Google's "Interaction to Next Paint").
// CPU slowed 4x like a mid-range phone. Under 50 ms feels instant; over 100 ms feels laggy.
// Usage: npm run build && npm run preview (other terminal), then npm run forms
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['camera'] });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const slow = (on) => cdp.send('Emulation.setCPUThrottlingRate', { rate: on ? 4 : 1 });

await page.addInitScript(() => {
  window.__events = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (e.interactionId) window.__events.push(Math.round(e.duration));
  }).observe({ type: 'event', durationThreshold: 16, buffered: true });
});

const results = [];
async function measure(label, action) {
  await page.evaluate(() => (window.__events = []));
  await slow(true);
  await action();
  await page.waitForTimeout(300);
  await slow(false);
  const d = (await page.evaluate(() => window.__events)).sort((a, b) => a - b);
  const p = (q) => (d.length ? d[Math.min(d.length - 1, Math.floor(d.length * q))] : 0);
  results.push({ label, n: d.length, p50: p(0.5), p90: p(0.9), max: d.at(-1) ?? 0 });
}
const type = (locator, text) => locator.pressSequentially(text, { delay: 30 });

await page.goto(BASE + '/signin?mode=signup');
await measure('Sign-up form: typing', async () => {
  await type(page.getByLabel('Name'), 'Sam Tester');
  await type(page.getByLabel('Email address'), 'sam@example.com');
  await type(page.getByLabel('Password', { exact: true }), 'supersecret1');
});
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForURL('**/verify/age');

await measure('Date of birth: typing', async () => type(page.getByLabel('Date of birth'), '04181989'));
await page.getByRole('button', { name: 'Continue' }).click();

// jump past the photo check/ethics/photo/payment with a pre-filled session
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('ds.session'));
  Object.assign(s, { photoCheck: 'verified', biometricConsent: true, ethicsAgreed: true, photoUploaded: true, plan: 'yearly' });
  localStorage.setItem('ds.session', JSON.stringify(s));
});
await page.goto(BASE + '/setup/1');
await page.getByLabel('City', { exact: true }).waitFor();
await page.waitForTimeout(800);

await measure('Profile 1: typing in fields', async () => {
  await type(page.getByLabel('City', { exact: true }), 'Chicago');
  await type(page.getByLabel('ZIP code'), '60614');
  await type(page.getByLabel('Biography'), 'Weekend lounge regular who loves a good maduro and bourbon.');
});
await measure('Profile 1: tapping choices', async () => {
  for (const t of ['Beginner', 'Intermediate', 'Advanced', 'Aficionado']) await page.getByRole('radio', { name: t }).click();
});
await page.getByRole('button', { name: 'Next' }).click();
await page.waitForURL('**/setup/2');
await page.waitForTimeout(600);

await measure('Profile 2: tapping chips', async () => {
  for (const t of ['Cigar Bar', 'Members-Only Club', 'Quiet', 'Relaxed', 'Social', 'Upscale']) await page.getByRole('checkbox', { name: t, exact: true }).click();
});
await measure('Profile 2: opening sections', async () => {
  for (const t of ['Frequency', 'Favorite Brands', 'Vitola', 'Flavors']) await page.getByRole('button', { name: t, exact: true }).click();
});
await measure('Profile 2: search box', async () => type(page.getByPlaceholder('Search lounges, brands, flavors…'), 'cedar'));
await page.getByRole('button', { name: 'Next' }).click();
await page.waitForURL('**/setup/3');
await page.waitForTimeout(600);

await measure('Profile 3: picker sheet', async () => {
  await page.getByRole('button', { name: /Hobbies/ }).click();
  for (const t of ['Cooking', 'Travel', 'Watches']) await page.getByRole('option', { name: t }).click();
  await page.getByRole('button', { name: /^Done/ }).click();
});
await page.getByRole('button', { name: 'Complete profile' }).click();
await page.waitForURL('**/feed');
await page.waitForTimeout(1500);

await measure('Post composer: typing', async () => {
  await page.getByRole('button', { name: 'Start a post' }).click();
  await type(page.getByLabel('Post text'), 'Great night at the lounge with friends.');
});
await page.keyboard.press('Escape');

await page.goto(BASE + '/settings/subscription');
await page.getByRole('button', { name: /^Switch to/ }).waitFor();
await page.getByRole('radio', { name: /Monthly/ }).click();
await page.getByRole('button', { name: /^Switch to/ }).click();
await measure('Checkout: typing card', async () => {
  await type(page.getByLabel('Card number'), '4242424242424242');
  await type(page.getByLabel('Expiry date'), '1234');
  await type(page.getByLabel('CVC'), '123');
});

console.log('\nForm responsiveness (CPU slowed 4x). Time from key/tap to screen update:');
console.log('  under 50 ms = instant, 50-100 ms = fine, over 100 ms = laggy\n');
for (const r of results) console.log(`  ${r.label.padEnd(30)} typical ${String(r.p50).padStart(4)} ms   slowest 10% ${String(r.p90).padStart(4)} ms   worst ${String(r.max).padStart(4)} ms   (${r.n} inputs)`);
await browser.close();
