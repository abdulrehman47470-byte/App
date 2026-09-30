// Mock auth + sign-up gate state. Phase 2 replaces this with Supabase Auth, and every gate
// below is re-enforced in the database (RLS / checks), not only in these route guards.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { HOME } from '@/config/features';
import { api } from '@/lib/api';
import { DEMO_PROFILE, MOCK_STATE_KEY } from '@/lib/api/mock';
import { storage } from '@/lib/storage';
import type { VerificationState } from '@/types';

export type Plan = 'monthly' | 'yearly';

export interface Onboarding {
  signedIn: boolean;
  method?: 'google' | 'apple' | 'email';
  dob?: string;
  underage?: boolean;
  photoCheck: VerificationState;
  biometricConsent: boolean;
  ethicsAgreed: boolean;
  photoUploaded: boolean;
  plan?: Plan;
  /** Number of completed profile steps (0-3). */
  profileStep: number;
  role: 'member' | 'admin';
}

const KEY = 'ds.session';
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
  signOut: () => void;
  loadDemo: () => Promise<void>;
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

  const signOut = useCallback(() => {
    storage.remove(KEY);
    storage.remove('ds.me');
    storage.remove(MOCK_STATE_KEY);
    // Reload so the in-memory mock backend starts fresh too.
    window.location.assign('/');
  }, []);

  // Dev shortcut: a fully onboarded demo member, so every screen can be explored quickly.
  const loadDemo = useCallback(async () => {
    await api.saveMe(DEMO_PROFILE);
    update({
      signedIn: true, method: 'email', dob: DEMO_PROFILE.dob, photoCheck: 'verified', biometricConsent: true,
      ethicsAgreed: true, photoUploaded: true, plan: 'yearly', profileStep: 3, role: 'admin',
    });
  }, [update]);

  const value = useMemo(
    () => ({ session, update, signOut, loadDemo, isComplete: nextStep(session) === HOME }),
    [session, update, signOut, loadDemo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

