import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2];
const queries = process.argv.slice(3);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 2000 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36' })).newPage();
const all = [];
for (const q of queries) {
  await p.goto(`https://unsplash.com/s/photos/${encodeURIComponent(q)}?license=free&orientation=portrait`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(6000);
  const items = await p.evaluate(() => [...document.querySelectorAll('figure')].map((f) => {
    const a = f.querySelector('a[href^="/photos/"]'); const img = f.querySelector('img[src*="images.unsplash.com/photo-"]');
    const author = f.querySelector('a[href^="/@"]');
    const plus = /Unsplash\+|plus/i.test(f.innerText) || !!f.querySelector('a[href*="/plus"]');
    return a && img ? { href: a.getAttribute('href'), src: img.getAttribute('src'), alt: img.getAttribute('alt'), author: author?.textContent?.trim(), authorHref: author?.getAttribute('href'), plus } : null;
  }).filter(Boolean));
  console.log(q, '->', items.length, 'items,', items.filter((i) => !i.plus).length, 'free');
  all.push(...items.filter((i) => !i.plus).map((i) => ({ ...i, q })));
}
writeFileSync(OUT, JSON.stringify(all, null, 1));
await b.close();
