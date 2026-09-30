// Performance check against the production build.
// Usage: npm run build && npm run preview (in another terminal), then npm run perf
// Simulates a mid-range phone on 4G (Chrome DevTools throttling) and reports:
//  - cold load of the Welcome screen (first paint, JS downloaded)
//  - time to open each main tab after sign-in (until real content, no skeletons)
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const NETWORK = { offline: false, latency: 70, downloadThroughput: (12 * 1024 * 1024) / 8, uploadThroughput: (4 * 1024 * 1024) / 8 };
const CPU_SLOWDOWN = 2;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', NETWORK);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });

// ---- cold load ----
const t0 = Date.now();
await page.goto(BASE + '/', { waitUntil: 'commit' });
await page.getByRole('button', { name: 'Sign up' }).waitFor();
const visible = Date.now() - t0;
const cold = await page.evaluate(() => {
  const fcp = performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint')?.startTime ?? 0;
  const res = performance.getEntriesByType('resource');
  const js = res.filter((r) => r.name.endsWith('.js')).reduce((n, r) => n + r.transferSize, 0);
  const css = res.filter((r) => r.name.endsWith('.css')).reduce((n, r) => n + r.transferSize, 0);
  return { fcp: Math.round(fcp), jsKB: Math.round(js / 1024), cssKB: Math.round(css / 1024), requests: res.length };
});
console.log('\nCold load (Welcome screen, simulated 4G + 2x slower CPU)');
console.log(`  First paint:          ${cold.fcp} ms`);
console.log(`  Buttons visible:      ${visible} ms`);
console.log(`  JavaScript download:  ${cold.jsKB} KB   CSS: ${cold.cssKB} KB   Requests: ${cold.requests}`);

// ---- tab switching ----
await page.getByRole('button', { name: /explore with a demo member/ }).click();
await page.waitForURL('**/feed');
await page.waitForFunction(() => !document.querySelector('.skeleton'));
await page.waitForTimeout(1500); // let idle prefetching (if any) finish, like a real user reading

const tabs = ['Discover', 'Map', 'Messages', 'Profile', 'Home'];
const HEADINGS = { Discover: 'Discover', Map: 'Member Map', Messages: 'Messages', Profile: 'Profile', Home: 'The Lounge' };
console.log('\nOpening each tab after sign-in (until real content, no loading skeletons)');
const results = [];
for (let round = 0; round < 2; round++) {
  for (const name of tabs) {
    // Measured inside the page: from the tap to the frame where the new screen's content is ready.
    const ms = await page.evaluate(
      ({ name, heading }) =>
        new Promise((resolve) => {
          const link = [...document.querySelectorAll('nav[aria-label="Main"] a')].find((a) => a.textContent?.trim().endsWith(name));
          const start = performance.now();
          link.click();
          const check = () => {
            const ready = document.querySelector('main h1')?.textContent === heading && !document.querySelector('main .skeleton');
            if (ready) resolve(Math.round(performance.now() - start));
            else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        }),
      { name, heading: HEADINGS[name] },
    );
    results.push({ round, name, ms });
    await page.waitForTimeout(300);
  }
}
for (const name of tabs) {
  const [first, second] = results.filter((r) => r.name === name);
  console.log(`  ${name.padEnd(9)} first visit ${String(first.ms).padStart(5)} ms   revisit ${String(second.ms).padStart(5)} ms`);
}

// ---- repeat visit (service worker cache) ----
// Files come from the on-device cache, so the network speed no longer matters here.
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await page.waitForTimeout(1500);
const t1 = Date.now();
await page.goto(BASE + '/feed', { waitUntil: 'commit' });
await page.waitForFunction(() => document.querySelector('main h1')?.textContent === 'The Lounge' && !document.querySelector('main .skeleton'));
const sw = await page.evaluate(() => !!navigator.serviceWorker?.controller);
console.log(`
Repeat visit (reload the app): ${Date.now() - t1} ms to full Home feed${sw ? ' (served by the service worker cache)' : ' (no service worker)'}`);
await browser.close();
