import { LogIn, Mail, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoMark, Wordmark } from '@/components/brand/logo';
import { TrustNote } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/frame';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { DEMO_ENABLED, HOME } from '@/config/features';
import { AppleLogo } from '@/features/auth/apple-signin-mock';
import { GoogleG } from '@/features/auth/google-signin-mock';
import { useSignIn } from '@/features/auth/use-social-sign-in';
import { nextStep, useSession } from '@/lib/session';

type Mode = 'signup' | 'login';

export default function Welcome() {
  const { session, loadDemo } = useSession();
  const navigate = useNavigate();
  const auth = useSignIn();
  const [mode, setMode] = useState<Mode | null>(null);
  const [lastMode, setLastMode] = useState<Mode>('signup');
  if (session.signedIn && !auth.busy) return <Navigate to={nextStep(session)} replace />;

  const openSheet = (m: Mode) => {
    setLastMode(m);
    setMode(m);
  };
  // Close our sheet first so the Google/Apple sheet opens cleanly on top of the page.
  const via = (open: () => void) => {
    setMode(null);
    window.setTimeout(open, 180);
  };
  const signup = lastMode === 'signup';

  return (
    <Frame>
      <div className="welcome-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-[max(32px,env(safe-area-inset-top))]">
        <main className="rise relative z-10 flex w-full max-w-[360px] flex-col items-center text-center">
          {/* Logo: 156px on phones (≈40% of a 390px screen), 176px on larger screens; soft glow behind it */}
          <div className="relative">
            <span aria-hidden className="absolute inset-[-14%] rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.22),transparent_68%)]" />
            <LogoMark className="relative size-[156px] sm:size-[176px]" priority />
          </div>
          <Wordmark className="mt-6 text-[44px] sm:text-[48px]" />
          <div aria-hidden className="mt-3 flex items-center gap-2 text-gold">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-current opacity-60" />
            <span className="size-1 rotate-45 bg-current opacity-80" />
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-current opacity-60" />
          </div>
          <p className="mt-3 font-serif text-lg italic text-text/85">Good cigars. Better company.</p>

          <div className="mt-10 w-full space-y-3">
            <Button size="lg" block className="h-[52px] rounded-[14px] text-[15px]" onClick={() => openSheet('signup')}>
              <UserPlus className="size-5" /> Sign up
            </Button>
            <Button size="lg" variant="outline" block className="h-[52px] rounded-[14px] bg-bg/80 text-[15px]" onClick={() => openSheet('login')}>
              <LogIn className="size-5" /> Log in
            </Button>
          </div>

          <TrustNote className="mt-6">Members only · Adults 21+</TrustNote>
          {DEMO_ENABLED && (
            <button
              type="button"
              className="mt-4 text-xs text-faint underline decoration-dotted underline-offset-4 hover:text-gold"
              onClick={async () => {
                await loadDemo();
                navigate(HOME);
              }}
            >
              Just looking? Explore with a demo member
            </button>
          )}
        </main>
      </div>

      <Sheet
        open={mode !== null}
        onOpenChange={(v) => !v && setMode(null)}
        title={signup ? 'Create your account' : 'Welcome back'}
        description={signup ? 'Choose how you’d like to join Daily Stogie.' : 'Sign in to your account.'}
      >
        <div className="space-y-3 pb-2">
          <button
            type="button"
            onClick={() => via(auth.openGoogle)}
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-line-strong bg-white text-[15px] font-semibold text-text transition-colors hover:bg-surface-2 active:scale-[0.99]"
          >
            <GoogleG /> Sign {signup ? 'up' : 'in'} with Google
          </button>
          <button
            type="button"
            onClick={() => via(auth.openApple)}
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] bg-black text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
          >
            <AppleLogo /> Sign {signup ? 'up' : 'in'} with Apple
          </button>
          <Button size="lg" block className="h-[52px] rounded-[14px] text-[15px]" onClick={() => navigate(signup ? '/signin?mode=signup' : '/signin')}>
            <Mail className="size-5" /> {signup ? 'Sign up' : 'Sign in'} with Email
          </Button>
          <p className="pt-2 text-center text-xs leading-relaxed text-faint">
            By continuing you agree to our{' '}
            <Link to="/legal/terms" className="underline underline-offset-2 hover:text-gold">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/legal/privacy" className="underline underline-offset-2 hover:text-gold">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </Sheet>
      {auth.ui}
    </Frame>
  );
}
