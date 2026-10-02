// MOCK account registry for Phase 0. It remembers who has signed up on this device, so a returning
// member can sign in with just their email and land back in their own account (profile, posts,
// connections). Phase 2 replaces all of this with Supabase Auth; nothing here is real security.
import { STORAGE_KEYS, storage } from './storage';

export type AuthMethod = 'google' | 'apple' | 'email';

export interface Account {
  email: string;
  name: string;
  method: AuthMethod;
  createdAt: string;
  /** The built-in demo member: fully set up, no snapshot needed. */
  demo?: boolean;
  /** Saved app state from the last sign-out, restored on the next sign-in. */
  snapshot?: { session: unknown; me: unknown; mock: unknown };
}

const KEY = 'ds.accounts';
export const DEMO_EMAIL = 'alex.morgan@example.com';
const DEMO: Account = { email: DEMO_EMAIL, name: 'Alex Morgan', method: 'email', createdAt: '2026-01-04T12:00:00Z', demo: true };

export const normalizeEmail = (e: string) => e.trim().toLowerCase();
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

function all(): Record<string, Account> {
  return { [DEMO_EMAIL]: DEMO, ...(storage.get<Record<string, Account>>(KEY) ?? {}) };
}

export function findAccount(email: string): Account | undefined {
  return all()[normalizeEmail(email)];
}

export function saveAccount(a: Account) {
  const list = storage.get<Record<string, Account>>(KEY) ?? {};
  list[normalizeEmail(a.email)] = { ...a, email: normalizeEmail(a.email) };
  storage.set(KEY, list);
}

export function forgetAccount(email: string) {
  const list = storage.get<Record<string, Account>>(KEY) ?? {};
  delete list[normalizeEmail(email)];
  storage.set(KEY, list);
}

/** Store the signed-in member's app state under their account before signing out. */
export function snapshotAccount(email: string) {
  const a = findAccount(email);
  if (!a) return false;
  saveAccount({ ...a, snapshot: { session: storage.get(STORAGE_KEYS.session), me: storage.get(STORAGE_KEYS.me), mock: storage.get(STORAGE_KEYS.mock) } });
  return true;
}

/** Put an account's saved state back. Returns false when there is nothing to restore. */
export function restoreAccount(a: Account) {
  if (!a.snapshot?.session) return false;
  storage.set(STORAGE_KEYS.session, a.snapshot.session);
  if (a.snapshot.me) storage.set(STORAGE_KEYS.me, a.snapshot.me);
  else storage.remove(STORAGE_KEYS.me);
  if (a.snapshot.mock) storage.set(STORAGE_KEYS.mock, a.snapshot.mock);
  else storage.remove(STORAGE_KEYS.mock);
  return true;
}

/** Friendly display name from an email: "jane.doe@x.com" → "Jane Doe". */
export const nameFromEmail = (email: string) =>
  email
    .split('@')[0]
    .split(/[._\-+\d]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ') || 'Member';
