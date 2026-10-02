import { Mail } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoMark, Wordmark } from '@/components/brand/logo';
import { TrustNote } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/frame';
import { Button } from '@/components/ui/button';
import { DEMO_ENABLED, HOME } from '@/config/features';
import { AppleLogo } from '@/features/auth/apple-signin-mock';
import { GoogleG } from '@/features/auth/google-signin-mock';
import { useSignIn } from '@/features/auth/use-social-sign-in';
import { nextStep, useSession } from '@/lib/session';

export default function Welcome() {
  const { session, loadDemo } = useSession();
  const navigate = useNavigate();
  const auth = useSignIn();
  if (session.signedIn && !auth.busy) return <Navigate to={nextStep(session)} replace />;

  return (
    <Frame>
      <div className="welcome-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-[max(32px,env(safe-area-inset-top))]">
        <main className="rise relative z-10 flex w-full max-w-[360px] flex-col items-center text-center">
          <LogoMark className="size-32" priority />
          <Wordmark className="mt-5 text-[38px]" />
          <p className="mt-3 font-serif text-lg italic text-text/85">Good cigars. Better company.</p>

          <div className="mt-10 w-full space-y-3">
            <button
              type="button"
              onClick={auth.openGoogle}
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-line-strong bg-white text-[15px] font-semibold text-text shadow-[0_1px_2px_rgba(59,36,18,0.06)] transition-colors hover:bg-surface-2 active:scale-[0.99]"
            >
              <GoogleG /> Continue with Google
            </button>
            <button
              type="button"
              onClick={auth.openApple}
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] bg-black text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
            >
              <AppleLogo /> Continue with Apple
            </button>
            <Button size="lg" block className="h-[52px] rounded-[14px] text-[15px]" onClick={() => navigate('/signin')}>
              <Mail className="size-5" /> Continue with Email
            </Button>
          </div>

          <p className="mt-6 max-w-[300px] text-xs leading-relaxed text-faint">
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
          <TrustNote className="mt-5">Members only · Adults 21+</TrustNote>
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
      {auth.ui}
    </Frame>
  );
}
