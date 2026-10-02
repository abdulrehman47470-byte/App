// Mock auth + sign-up gate state. Phase 2 replaces this with Supabase Auth, and every gate
// below is re-enforced in the database (RLS / checks), not only in these route guards.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { HOME } from '@/config/features';
import { findAccount, forgetAccount, restoreAccount, saveAccount, snapshotAccount, type AuthMethod } from '@/lib/accounts';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import type { MockPayment } from '@/features/billing/checkout-sheet';
import type { VerificationState } from '@/types';

export type Plan = 'monthly' | 'yearly';

export interface Onboarding {
  signedIn: boolean;
  method?: AuthMethod;
  /** Account email (mock auth): used to restore the member's data on their next sign-in. */
  email?: string;
  dob?: string;
  underage?: boolean;
  photoCheck: VerificationState;
  biometricConsent: boolean;
  ethicsAgreed: boolean;
  photoUploaded: boolean;
  plan?: Plan;
  /** Mock receipt from the Phase 0 checkout. Phase 6: subscription state from Stripe webhooks. */
  payment?: MockPayment;
  /** Number of completed profile steps (0-3). */
  profileStep: number;
  role: 'member' | 'admin';
}

const KEY = STORAGE_KEYS.session;
const INITIAL: Onboarding = {
  signedIn: false,
  photoCheck: 'idle',
  biometricConsent: false,
  ethicsAgreed: false,
  photoUploaded: false,
  profileStep: 0,
  role: 'member',
};

/** The next route a member must visit, in the client's required sign-up order. */
export function nextStep(o: Onboarding): string {
  if (!o.signedIn) return '/';
  if (o.underage) return '/restricted';
  if (!o.dob) return '/verify/age';
  // A failed or unsure face check falls back to admin photo review, so any attempt continues.
  if (o.photoCheck === 'idle' || o.photoCheck === 'pending') return '/verify/face';
  if (!o.ethicsAgreed) return '/ethics';
  if (!o.photoUploaded) return '/photo';
  if (!o.plan) return '/subscribe';
  if (o.profileStep < 3) return `/setup/${o.profileStep + 1}`;
  return HOME;
}

interface SessionCtx {
  session: Onboarding;
  update: (patch: Partial<Onboarding>) => void;
  /** `forget` deletes the account from this device (Delete account); otherwise it is kept for next time. */
  signOut: (opts?: { forget?: boolean }) => void;
  loadDemo: () => Promise<void>;
  /** Mock sign-in/sign-up. Resolves to the route to open, or null when the page reloads into a restored account. */
  enter: (a: { email: string; name: string; method: AuthMethod }) => Promise<string | null>;
  isComplete: boolean;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Onboarding>(() => ({ ...INITIAL, ...storage.get<Onboarding>(KEY) }));

  const update = useCallback((patch: Partial<Onboarding>) => {
    setSession((s) => {
      const next = { ...s, ...patch };
      storage.set(KEY, next);
      return next;
    });
  }, []);

  const signOut = useCallback((opts?: { forget?: boolean }) => {
    const email = storage.get<Onboarding>(KEY)?.email;
    // Keep the account's data on this device so signing back in restores it.
    const kept = !opts?.forget && !!email && snapshotAccount(email);
    if (opts?.forget && email) forgetAccount(email);
    storage.remove(KEY);
    storage.remove(STORAGE_KEYS.me);
    storage.remove(STORAGE_KEYS.mock);
    // Deleting the account also removes its uploaded photos/videos from the device.
    if (!kept) import('@/lib/media-store').then((m) => m.clearMedia()).catch(() => {});
    // Reload so the in-memory mock backend starts fresh too.
    window.location.assign('/');
  }, []);

  // Dev shortcut: a fully onboarded demo member, so every screen can be explored quickly.
  const loadDemo = useCallback(async () => {
    const [{ api }, { DEMO_PROFILE }] = await Promise.all([import('@/lib/api'), import('@/lib/api/mock')]);
    await api.saveMe(DEMO_PROFILE);
    update({
      signedIn: true, method: 'email', dob: DEMO_PROFILE.dob, photoCheck: 'verified', biometricConsent: true,
      ethicsAgreed: true, photoUploaded: true, plan: 'yearly', profileStep: 3, role: 'admin',
    });
  }, [update]);

  const enter = useCallback(
    async ({ email, name, method }: { email: string; name: string; method: AuthMethod }) => {
      const account = findAccount(email);
      if (account?.snapshot && restoreAccount(account)) {
        // A full reload so the in-memory mock backend picks up the restored data.
        window.location.assign(nextStep({ ...INITIAL, ...(account.snapshot.session as Onboarding) }));
        return null;
      }
      if (account?.demo) {
        await loadDemo();
        update({ email: account.email });
        return HOME;
      }
      if (!account) saveAccount({ email, name, method, createdAt: new Date().toISOString() });
      const { api } = await import('@/lib/api');
      await api.saveMe({ name: account?.name ?? name });
      const patch = { signedIn: true, method, email: email.trim().toLowerCase() };
      update(patch);
      return nextStep({ ...session, ...patch });
    },
    [session, update, loadDemo],
  );

  const value = useMemo(
    () => ({ session, update, signOut, loadDemo, enter, isComplete: nextStep(session) === HOME }),
    [session, update, signOut, loadDemo, enter],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

