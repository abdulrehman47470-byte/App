// Fast runtime check: opens every main screen as the demo member and reports page errors.
// Usage: BASE_URL=http://localhost:4173 node scripts/quick-check.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|tile/i.test(m.text()) && errors.push(`${page.url()}: ${m.text()}`));

const step = async (name, fn) => {
  try {
    await fn();
    console.log('ok  ', name);
  } catch (e) {
    console.log('FAIL', name, '-', e.message.split('\n')[0]);
    errors.push(name);
  }
};

await page.goto(BASE + '/');
await step('welcome has 3 sign-in options', async () => {
  for (const n of [/Continue with Google/, /Continue with Apple/, /Continue with Email/]) await page.getByRole('button', { name: n }).waitFor({ timeout: 8000 });
});
await step('apple sheet opens', async () => {
  await page.getByRole('button', { name: /Continue with Apple/ }).click();
  await page.getByPlaceholder('Apple ID (email)').waitFor();
  await page.keyboard.press('Escape');
});
await step('email sign-in with demo account goes straight in', async () => {
  await page.getByRole('button', { name: /Continue with Email/ }).click();
  await page.getByLabel('Email address').fill('alex.morgan@example.com');
  await page.getByRole('button', { name: /^Continue$/ }).click();
  await page.waitForURL(/\/feed/, { timeout: 10000 });
});
await step('feed: stories, media, reactions', async () => {
  await page.getByRole('region', { name: 'Stories' }).waitFor();
  await page.getByRole('button', { name: /Like\. Hold/ }).first().click();
  await page.getByRole('button', { name: /story, new/ }).first().click();
  await page.getByRole('button', { name: 'Close stories' }).waitFor();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Close stories' }).click();
});
await step('comment with reply', async () => {
  await page.getByRole("button", { name: /^[0-9]+ comments?$/ }).first().click();
  await page.getByRole('button', { name: 'Reply' }).first().click();
  await page.getByPlaceholder('Write a reply…').first().fill('@Elena Agreed!');
  await page.getByRole('button', { name: 'Post reply' }).click();
  await page.getByText('Agreed!').first().waitFor();
});
for (const path of ['/connections', '/discover', '/search?q=x', '/blog', '/blog/new', '/sessions', '/sessions/s1', '/profile', '/profile?tab=blogs', '/profile?tab=connections', '/mentors', '/messages', '/member/m1']) {
  await step(`open ${path}`, async () => {
    await page.goto(BASE + path);
    await page.waitForTimeout(900);
    await page.locator('h1:visible, h2:visible').first().waitFor({ timeout: 8000 });
  });
}
await step('search finds results', async () => {
  await page.goto(BASE + '/search');
  await page.locator('input[aria-label="Search"]').fill('cigar');
  await page.getByRole('region', { name: /Members|Posts|Blogs|Sessions|Lounges/ }).first().waitFor();
});
await step('accept a connection request', async () => {
  await page.goto(BASE + '/connections?tab=received');
  await page.getByRole('button', { name: /Accept/ }).first().click();
  await page.getByText(/connected/i).first().waitFor();
});
await step('publish a blog', async () => {
  await page.goto(BASE + '/blog/new');
  await page.getByPlaceholder('Your title').fill('Quick test blog');
  await page.getByLabel('Paragraph 1').fill('A short paragraph for the test.');
  await page.getByRole('button', { name: 'Publish blog' }).click();
  await page.waitForURL(/\/blog\/quick-test-blog/);
});
await step('identity verification flow starts', async () => {
  await page.goto(BASE + '/verify/face');
  await page.waitForTimeout(500);
});

await browser.close();
console.log(errors.length ? `\n${errors.length} problem(s):\n` + errors.join('\n') : '\nAll good');
process.exit(errors.length ? 1 : 0);
