import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { CigarBand, TrustNote } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/frame';
import { Button } from '@/components/ui/button';
import { DEMO_ENABLED, HOME } from '@/config/features';
import { nextStep, useSession } from '@/lib/session';

export default function Welcome() {
  const { session, loadDemo } = useSession();
  const navigate = useNavigate();
  if (session.signedIn) return <Navigate to={nextStep(session)} replace />;

  return (
    <Frame>
      <div className="relative flex min-h-dvh flex-col overflow-hidden px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(40px,env(safe-area-inset-top))]">
        {/* moody lounge backdrop: warm lamp glow, leather shadows, drifting smoke */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_30%,rgba(200,100,43,0.22),transparent_70%),radial-gradient(90%_60%_at_50%_110%,rgba(176,122,40,0.18),transparent_70%)]" />
        <div aria-hidden className="smoke" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/80 to-transparent" />

        <div className="rise relative flex flex-1 flex-col items-center justify-center text-center">
          <Logo size="lg" />
          <p className="mt-6 font-serif text-lg italic text-text/90">Find your circle. Share the smoke.</p>
          <CigarBand label="Members only" className="mt-8 w-56" />
        </div>

        <div className="rise relative space-y-3" style={{ animationDelay: '120ms' }}>
          <Button size="lg" block onClick={() => navigate('/signin?mode=signup')}>
            Sign up
          </Button>
          <Button size="lg" variant="outline" block onClick={() => navigate('/signin')}>
            Log in
          </Button>
          <TrustNote className="pt-3">Adults 21+ only</TrustNote>
          <p className="text-center font-serif text-sm italic text-faint">Good Cigars. Better Company.</p>
          {DEMO_ENABLED && (
            <p className="pt-1 text-center text-xs text-faint">
              Try it:{" "}
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
        </div>
      </div>
    </Frame>
  );
}
