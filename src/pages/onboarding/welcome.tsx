import { LogIn, UserPlus } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoMark, Wordmark } from '@/components/brand/logo';
import { CigarBand, TrustNote } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/frame';
import { Button } from '@/components/ui/button';
import { DEMO_ENABLED, HOME } from '@/config/features';
import { nextStep, useSession } from '@/lib/session';

// Fixed positions so the embers look natural but render identically every time.
const EMBERS = [
  [8, 0, 11], [18, 3.5, 14], [27, 7, 9], [36, 1.5, 13], [46, 5, 10], [55, 9, 12],
  [63, 2.5, 15], [72, 6, 11], [81, 0.8, 13], [90, 4.2, 10], [14, 10, 16], [68, 11, 12],
];

export default function Welcome() {
  const { session, loadDemo } = useSession();
  const navigate = useNavigate();
  if (session.signedIn) return <Navigate to={nextStep(session)} replace />;

  return (
    <Frame>
      <div className="welcome-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-[max(32px,env(safe-area-inset-top))]">
        {/* Background layers (CSS only, decorative) */}
        <div aria-hidden className="welcome-rays" />
        <div aria-hidden className="smoke" />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {EMBERS.map(([left, delay, dur], i) => (
            <span key={i} className="ember" style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s` }} />
          ))}
        </div>
        <div aria-hidden className="welcome-vignette" />

        {/* Everything centered in the middle of the page */}
        <main className="rise relative z-10 flex w-full max-w-[340px] flex-col items-center text-center">
          <LogoMark className="size-40" priority />
          <Wordmark className="mt-6 text-[40px]" />
          <p className="mt-4 font-serif text-lg italic text-text/90">Find your circle. Share the smoke.</p>
          <CigarBand label="Members only" className="mt-6 w-56" />

          <div className="mt-8 w-full space-y-3">
            <Button size="lg" block onClick={() => navigate('/signin?mode=signup')}>
              <UserPlus className="size-5" /> Sign up
            </Button>
            <Button size="lg" variant="outline" block onClick={() => navigate('/signin')} className="bg-bg/80">
              <LogIn className="size-5" /> Log in
            </Button>
          </div>

          <TrustNote className="mt-6">Adults 21+ only</TrustNote>
          <p className="mt-2 font-serif text-sm italic text-faint">Good Cigars. Better Company.</p>
          {DEMO_ENABLED && (
            <p className="mt-4 text-xs text-faint">
              Try it:{' '}
              <button
                type="button"
                className="underline decoration-dotted underline-offset-4 hover:text-gold"
                onClick={async () => {
                  await loadDemo();
                  navigate(HOME);
                }}
              >
                explore with a demo member
              </button>
              {' · '}
              <Link to="/legal/terms" className="underline decoration-dotted underline-offset-4 hover:text-gold">
                Terms
              </Link>
            </p>
          )}
        </main>
      </div>
    </Frame>
  );
}
