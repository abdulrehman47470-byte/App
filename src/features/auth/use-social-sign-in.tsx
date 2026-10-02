import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/brand/logo';
import type { AuthMethod } from '@/lib/accounts';
import { useSession } from '@/lib/session';
import { AppleSignInMock } from './apple-signin-mock';
import { GoogleSignInMock } from './google-signin-mock';

/**
 * Shared sign-in plumbing for Welcome and the email screen: the Google and Apple sheets, plus the
 * "Signing you in…" moment that follows any method.
 */
export function useSignIn() {
  const { enter } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [google, setGoogle] = useState(false);
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const finish = async (a: { name: string; email: string }, method: AuthMethod) => {
    setBusy(a.name);
    try {
      const to = await enter({ ...a, method });
      if (to) {
        qc.clear();
        navigate(to, { replace: true });
      }
    } catch {
      setBusy(null);
    }
  };

  const ui = (
    <>
      <GoogleSignInMock open={google} onOpenChange={setGoogle} onSignedIn={(a) => finish(a, 'google')} />
      <AppleSignInMock open={apple} onOpenChange={setApple} onSignedIn={(a) => finish(a, 'apple')} />
      {busy && (
        <div role="status" aria-live="polite" className="page-enter fixed inset-0 z-[100] grid place-items-center bg-bg">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="size-20 animate-pulse" />
            <p className="mt-5 font-serif text-xl text-text">Signing you in…</p>
            <p className="mt-1 text-sm text-muted">Welcome, {busy.split(' ')[0]}</p>
          </div>
        </div>
      )}
    </>
  );

  return { openGoogle: () => setGoogle(true), openApple: () => setApple(true), finish, busy: !!busy, ui };
}
