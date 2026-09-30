// Renders public/icon.svg into the PNG app icons (home screen, iOS). Usage: npm run icons
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const svg = readFileSync('public/icon.svg', 'utf8');
const sizes = [
  ['public/pwa-192.png', 192],
  ['public/pwa-512.png', 512],
  ['public/apple-touch-icon.png', 180],
];
const browser = await chromium.launch();
for (const [out, size] of sizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: out, omitBackground: false });
  await page.close();
  console.log('wrote', out);
}
await browser.close();
