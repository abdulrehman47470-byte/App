// Smoothness check: records every animation frame during common interactions and reports FPS
// and "janky" frames (slower than 25 ms, i.e. visible stutter). CPU is slowed 4x to behave like a
// mid-range phone. Usage: npm run build && npm run preview (other terminal), then npm run smooth
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

async function record(label, action) {
  await page.evaluate(() => {
    window.__frames = [];
    let last = performance.now();
    const tick = (t) => {
      window.__frames.push(t - last);
      last = t;
      if (window.__recording) requestAnimationFrame(tick);
    };
    window.__recording = true;
    requestAnimationFrame(tick);
  });
  await action();
  const f = await page.evaluate(() => {
    window.__recording = false;
    return window.__frames.slice(1);
  });
  const total = f.reduce((a, b) => a + b, 0);
  const fps = f.length ? Math.round((f.length / total) * 1000) : 0;
  const janky = f.filter((d) => d > 25).length;
  const worst = Math.round(Math.max(...f, 0));
  console.log(`  ${label.padEnd(28)} ${String(fps).padStart(3)} fps   janky frames ${String(janky).padStart(3)} / ${f.length}   worst ${worst} ms`);
  return { fps, janky, frames: f.length };
}

// Sign in as the demo member (unthrottled), then slow the CPU down.
await page.goto(BASE + '/');
await page.getByRole('button', { name: /explore with a demo member/ }).click();
await page.waitForURL('**/feed');
await page.waitForTimeout(2500);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
console.log('\nSmoothness (CPU slowed 4x, like a mid-range phone). 60 fps and 0 janky frames is perfect.');

await record('Scroll the Home feed', async () => {
  await page.mouse.move(195, 500);
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(35);
  }
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(35);
  }
});

await page.getByRole('navigation', { name: 'Main' }).first().getByRole('link', { name: 'Discover' }).click();
await page.getByRole('group', { name: /Tap to view profile/ }).first().waitFor();
await page.waitForTimeout(800);
await record('Drag a Discover card', async () => {
  const box = await page.getByRole('group', { name: /Tap to view profile/ }).first().boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 25; i++) await page.mouse.move(cx + i * 4, cy + i, { steps: 1 });
  for (let i = 25; i >= -25; i--) await page.mouse.move(cx + i * 4, cy + Math.abs(i), { steps: 1 });
  for (let i = -25; i <= 0; i++) await page.mouse.move(cx + i * 4, cy, { steps: 1 });
  await page.mouse.up();
  await page.waitForTimeout(400);
});

await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await page.goto(BASE + '/discover');
await page.getByRole('button', { name: /^Filters/ }).waitFor();
await page.waitForTimeout(3000); // let start-up background work finish, as a real person would
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await record('Open and close a sheet', async () => {
  await page.getByRole('button', { name: /^Filters/ }).click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
});

await page.getByRole('navigation', { name: 'Main' }).first().getByRole('link', { name: 'Map' }).click();
await page.waitForSelector('.leaflet-tile-loaded');
await page.waitForTimeout(1500);
await record('Pan the member map', async () => {
  const box = await page.locator('.ds-map').first().boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) await page.mouse.move(cx + i * 3, cy + i * 2);
  for (let i = 30; i >= 0; i--) await page.mouse.move(cx + i * 3, cy + i * 2);
  await page.mouse.up();
});

await page.getByRole('navigation', { name: 'Main' }).first().getByRole('link', { name: 'Messages' }).click();
await page.waitForTimeout(600);
await record('Switch between tabs', async () => {
  for (const name of ['Home', 'Discover', 'Map', 'Messages', 'Profile', 'Home']) {
    await page.getByRole('navigation', { name: 'Main' }).first().getByRole('link', { name }).click();
    await page.waitForTimeout(250);
  }
});

// Welcome screen idle animations (rays, smoke, embers)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE + '/');
await page.getByRole('button', { name: 'Sign up' }).waitFor();
await page.waitForTimeout(800);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await record('Welcome screen animations', async () => page.waitForTimeout(2500));

await browser.close();
