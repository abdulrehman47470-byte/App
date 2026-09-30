// Plain-English check of which keys and settings are missing. Usage: npm run setup:check
import { existsSync, readFileSync } from 'node:fs';

const env = {};
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const checks = [
  ['VITE_SUPABASE_URL', 'Supabase project URL (Phase 1). Supabase > Project Settings > API > Project URL.'],
  ['VITE_SUPABASE_ANON_KEY', 'Supabase anon public key (Phase 1). Same page, "anon public".'],
  ['VITE_STRIPE_PUBLISHABLE_KEY', 'Stripe publishable key, test mode (Phase 6). Stripe > Developers > API keys.'],
  ['VITE_MAPBOX_TOKEN', 'Mapbox public token (Phase 7). account.mapbox.com > Tokens.'],
];

console.log('\nDaily Stogie setup check\n');
if (!existsSync('.env')) console.log('• No .env file yet. That is fine: the app runs on mock data. Copy .env.example to .env when you are ready.\n');
const mode = env.VITE_DATA_PROVIDER || 'mock';
console.log(`Data provider: ${mode}${mode === 'mock' ? ' (no keys needed)' : ''}\n`);

let missing = 0;
for (const [key, help] of checks) {
  const ok = !!env[key];
  if (!ok) missing++;
  console.log(`${ok ? '✔' : '✘'} ${key}${ok ? '' : `\n    missing: ${help}`}`);
}
console.log(
  missing
    ? `\n${missing} key(s) missing. You only need them when you reach the phase in brackets. See docs/SETUP.md.\n`
    : '\nAll keys present.\n',
);
