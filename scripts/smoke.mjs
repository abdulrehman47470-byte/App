// Smoke test of the full sign-up -> match -> message flow against the mock backend.
// Usage: npm run dev (in another terminal), then npm run smoke. Phase 9 turns this into a Playwright test suite.
import { chromium } from 'playwright';
const B = process.env.BASE_URL ?? 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, permissions: ['camera'] });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
const step = async (label, fn) => { await fn(); console.log('ok  ', label, '->', new URL(page.url()).pathname); };

await page.goto(B + '/');
await step('guard: /discover redirects when signed out', async () => { await page.goto(B + '/discover'); await page.waitForURL(B + '/'); });
await step('sign up', async () => { await page.getByRole('button', { name: 'Sign up' }).click(); });
await step('email account', async () => {
  await page.getByLabel('Name').fill('Sam Test');
  await page.getByLabel('Email address').fill('sam@example.com');
  await page.getByLabel('Password', { exact: true }).fill('supersecret');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/verify/age');
});
await step('underage is blocked', async () => {
  await page.getByLabel('Date of birth').fill('01012010');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/restricted');
  await page.getByRole('button', { name: 'Back to start' }).click();
  await page.goto(B + '/signin?mode=signup');
  await page.getByLabel('Name').fill('Sam Test');
  await page.getByLabel('Email address').fill('sam@example.com');
  await page.getByLabel('Password', { exact: true }).fill('supersecret');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/verify/age');
});
await step('adult DOB', async () => { await page.getByLabel('Date of birth').fill('04181989'); await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL('**/verify/face'); });
await step('face check needs consent, then verifies', async () => {
  await page.getByText('Take a quick live selfie').waitFor();
  const start = page.getByRole('button', { name: 'Open camera' });
  if (!(await start.isDisabled())) throw new Error('camera enabled without consent');
  await page.getByRole('checkbox').first().click();
  await start.click();
  await page.getByRole('button', { name: 'Take photo' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Use this selfie' }).click();
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 8000 });
  await page.waitForURL('**/ethics');
});
await step('ethics requires agree', async () => {
  await page.getByText('Code of Ethics: summary').waitFor();
  const c = page.getByRole('button', { name: 'Continue' });
  if (!(await c.isDisabled())) throw new Error('continue enabled without agreeing');
  await page.getByRole('checkbox').click(); await c.click(); await page.waitForURL('**/photo');
});
await step('photo is mandatory', async () => {
  await page.getByText('Photo rules').waitFor();
  const b = page.getByRole('button', { name: 'Upload photo' });
  if (!(await b.isDisabled())) throw new Error('upload enabled without photo');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.locator('input[type=file]').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Use this photo' }).click(); await page.waitForURL('**/subscribe');
});
await step('guard: cannot skip to discover', async () => { await page.goto(B + '/discover'); await page.waitForURL('**/subscribe'); });
await step('choose monthly plan', async () => { await page.getByRole('radio', { name: /Monthly/ }).click(); await page.getByRole('button', { name: 'Continue to payment' }).click(); await page.waitForURL('**/setup/1'); });
await step('step 1 validation then fill', async () => {
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByText('Choose your cigar knowledge level.').waitFor();
  await page.getByRole('radio', { name: 'Beginner' }).click();
  await page.getByLabel('City', { exact: true }).fill('Chicago');
  await page.getByLabel('ZIP code').fill('60614');
  await page.getByRole('button', { name: 'Next' }).click(); await page.waitForURL('**/setup/2');
});
await step('step 2 pick chips', async () => {
  await page.getByPlaceholder('Search lounges, brands, flavors…').fill('cedar');
  await page.getByRole('checkbox', { name: 'Cedar' }).first().click();
  await page.getByRole('button', { name: 'Next' }).click(); await page.waitForURL('**/setup/3');
});
await step('step 3 complete -> home feed', async () => { await page.getByRole('button', { name: 'Complete profile' }).click(); await page.waitForURL('**/feed'); });
await step('post, like and comment on the feed', async () => {
  await page.getByRole('button', { name: 'Start a post' }).click();
  await page.getByLabel('Post text').fill('First night at the lounge!');
  await page.getByRole('button', { name: 'Post', exact: true }).click();
  const mine = page.getByRole('article', { name: /Post by Sam Test/ });
  await mine.getByText('First night at the lounge!').waitFor();
  await mine.getByRole('button', { name: 'Like' }).click();
  await mine.getByRole('button', { name: 'Liked' }).waitFor();
  await mine.getByRole('button', { name: 'Comment' }).click();
  await mine.getByLabel('Add a comment').fill('Cheers everyone');
  await mine.getByRole('button', { name: 'Post comment' }).click();
  await mine.getByText('Cheers everyone').waitFor();
});
await step('member map shows members', async () => {
  await page.getByRole('link', { name: 'Map' }).first().click();
  await page.waitForURL('**/map');
  await page.locator('section').getByRole('button', { name: /Elena/ }).click();
  await page.getByRole('link', { name: 'View profile' }).waitFor();
});
await step('open discover', async () => { await page.goto(B + '/discover'); });
await step('pass via keyboard, then undo', async () => {
  const card = page.getByRole('group', { name: /Tap to view profile/ });
  await card.first().waitFor();
  const first = await card.first().getAttribute('aria-label');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(700);
  if ((await card.first().getAttribute('aria-label')) === first) throw new Error('card did not change after pass');
  await page.getByRole('button', { name: 'Undo last pass' }).click();
  await page.waitForTimeout(500);
  if ((await card.first().getAttribute('aria-label')) !== first) throw new Error('undo did not restore the card');
});
await step('match -> say hello -> send message', async () => {
  await page.goto(B + '/member/m1');
  await page.getByRole('button', { name: /^Like$/ }).click();
  await page.getByRole('button', { name: 'Say hello' }).click(); await page.waitForURL('**/messages/m1');
  await page.getByLabel('Message').fill('Hey Marcus!'); await page.keyboard.press('Enter');
  await page.getByText('Hey Marcus!').waitFor();
});
await step('non-match cannot chat', async () => { await page.goto(B + '/messages/m6'); await page.getByText('Only matched members can message').waitFor(); });
await step('block removes from matches', async () => {
  await page.goto(B + '/messages/m1');
  await page.getByRole('button', { name: 'Report or block' }).click();
  await page.getByRole('button', { name: /Block Marcus/ }).click();
  await page.getByRole('button', { name: 'Block', exact: true }).click(); await page.waitForURL('**/messages');
  await page.goto(B + '/matches'); await page.waitForTimeout(600);
  if (await page.getByText('Marcus, 34').count()) throw new Error('blocked member still in matches');
});
await step('non-admin blocked from /admin', async () => { await page.goto(B + '/admin'); await page.waitForURL('**/discover'); });
await step('sign out', async () => { await page.goto(B + '/profile'); await page.getByRole('button', { name: 'Sign Out' }).click(); await page.waitForURL(B + '/'); });
console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'No page errors.');
await browser.close();
