import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CheckCircle2, Clock, IdCard, Info, ScanFace, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Frame } from '@/components/layout/app-shell';
import { OnboardingHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { CheckboxRow } from '@/components/ui/checkbox';
import { Badge, Card } from '@/components/ui/misc';
import { nextStep, useSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import type { VerificationState } from '@/types';

const PROMPTS = ['Center your face in the oval', 'Slowly turn your head left', 'Now blink twice', 'Hold still…'];

/**
 * Phase 0: simulated flow. Phase 2 plugs in VerificationProvider (FreeFaceCheckProvider with an
 * in-browser library, MockProvider, and stubs for paid Persona/Veriff). The selfie and face data
 * are never stored; only pass/fail, timestamp and threshold are saved.
 */
export default function VerifyFace() {
  const { session, update } = useSession();
  const navigate = useNavigate();
  const [consent, setConsent] = useState(session.biometricConsent);
  const [state, setState] = useState<VerificationState>(
    session.photoCheck === 'pending' ? 'idle' : session.photoCheck,
  );
  const [prompt, setPrompt] = useState(0);
  const [simulateFail, setSimulateFail] = useState(false);

  useEffect(() => {
    if (state !== 'pending') return;
    setPrompt(0);
    const iv = window.setInterval(() => setPrompt((p) => Math.min(p + 1, PROMPTS.length - 1)), 900);
    const done = window.setTimeout(() => {
      const result: VerificationState = simulateFail ? 'failed' : 'verified';
      setState(result);
      update({ photoCheck: result, biometricConsent: true });
    }, 3800);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(done);
    };
  }, [state, simulateFail, update]);

  const proceed = () => navigate(nextStep({ ...session, photoCheck: state }));

  return (
    <Frame>
      <OnboardingHeader title="Photo Check" progress={2 / 6} step="2/6" backTo="/verify/age" />
      <div className="flex min-h-[calc(100dvh-90px)] flex-col px-5 pb-8 pt-2">
        <div className="relative mx-auto my-4 grid size-52 place-items-center">
          <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden>
            <ellipse cx="100" cy="100" rx="70" ry="88" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray={state === 'pending' ? '6 6' : undefined} />
            {state === 'pending' && (
              <motion.ellipse
                cx="100" cy="100" rx="70" ry="88" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3.6, ease: 'linear' }}
              />
            )}
            {state === 'verified' && <ellipse cx="100" cy="100" rx="70" ry="88" fill="none" stroke="var(--success)" strokeWidth="3" />}
            {state === 'failed' && <ellipse cx="100" cy="100" rx="70" ry="88" fill="none" stroke="var(--danger)" strokeWidth="3" />}
          </svg>
          {state === 'pending' && (
            <motion.div
              aria-hidden
              className="absolute inset-x-12 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent"
              animate={{ top: ['22%', '78%', '22%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <StateIcon state={state} />
        </div>

        <div aria-live="polite" className="min-h-14 text-center">
          <AnimatePresence mode="wait">
            <motion.p key={state + prompt} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-serif text-xl text-text">
              {state === 'idle' && 'Take a quick live selfie'}
              {state === 'pending' && PROMPTS[prompt]}
              {state === 'verified' && 'Photo verified'}
              {state === 'failed' && 'We could not confirm the match'}
            </motion.p>
          </AnimatePresence>
          <p className="mt-1 text-sm text-muted">
            {state === 'idle' && 'We compare it with your profile photo to confirm it is really you.'}
            {state === 'pending' && 'Keep your face inside the oval.'}
            {state === 'verified' && 'You will get the gold verified badge on your profile.'}
            {state === 'failed' && 'No problem: our team will review your photo manually instead. You can continue or try again.'}
          </p>
        </div>

        <ol className="mx-auto mt-5 flex w-full max-w-xs items-center justify-between" aria-label="Verification status">
          {(['pending', 'verified', 'failed'] as const).map((s) => (
            <li key={s} className="flex flex-col items-center gap-1.5 text-xs">
              <span className={cn('grid size-9 place-items-center rounded-full border', state === s ? 'border-gold bg-gold-fill' : 'border-line')}>
                {s === 'pending' && <Clock className={cn('size-4', state === s ? 'text-warning' : 'text-faint')} />}
                {s === 'verified' && <CheckCircle2 className={cn('size-4', state === s ? 'text-success' : 'text-faint')} />}
                {s === 'failed' && <XCircle className={cn('size-4', state === s ? 'text-danger' : 'text-faint')} />}
              </span>
              <span className={state === s ? 'text-text' : 'text-faint'}>{s[0].toUpperCase() + s.slice(1)}</span>
            </li>
          ))}
        </ol>

        {state === 'idle' && (
          <div className="mt-6 space-y-4">
            <Card className="p-4">
              <CheckboxRow checked={consent} onCheckedChange={setConsent}>
                I consent to Daily Stogie processing my face image to compare it with my profile photo. The selfie
                and face data are deleted right after the check and are never stored.{' '}
                <Link to="/legal/privacy" className="text-gold underline-offset-2 hover:underline">
                  Biometric notice
                </Link>
              </CheckboxRow>
            </Card>
            <div className="flex items-start gap-2 rounded-[14px] border border-info/30 bg-info/10 px-3.5 py-3 text-xs text-muted">
              <Info className="mt-0.5 size-4 shrink-0 text-info" />
              The photo check confirms your photo is of the person taking the selfie. It does not verify your ID or
              your age.
            </div>
          </div>
        )}

        <Card className="mt-4 flex items-center gap-3 p-4 opacity-80">
          <IdCard className="size-6 shrink-0 text-muted" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-sm font-medium text-text">Verify ID</p>
            <p className="text-xs text-muted">Government ID and age check</p>
          </div>
          <Badge tone="muted">Later</Badge>
        </Card>

        <div className="mt-auto space-y-3 pt-8">
          {state === 'idle' && (
            <Button size="lg" block disabled={!consent} onClick={() => setState('pending')}>
              <Camera className="size-5" /> Start camera
            </Button>
          )}
          {state === 'pending' && (
            <Button size="lg" block disabled>
              Checking…
            </Button>
          )}
          {state === 'verified' && (
            <Button size="lg" block onClick={proceed}>
              Continue
            </Button>
          )}
          {state === 'failed' && (
            <>
              <Button size="lg" block onClick={proceed}>
                Continue with manual review
              </Button>
              <Button size="lg" variant="secondary" block onClick={() => setState('idle')}>
                Try again
              </Button>
            </>
          )}
          {import.meta.env.DEV && state === 'idle' && (
            <label className="flex items-center justify-center gap-2 text-xs text-faint">
              <input type="checkbox" checked={simulateFail} onChange={(e) => setSimulateFail(e.target.checked)} />
              Dev: simulate a failed check
            </label>
          )}
        </div>
      </div>
    </Frame>
  );
}

function StateIcon({ state }: { state: VerificationState }) {
  if (state === 'verified') return <CheckCircle2 className="relative size-16 text-success" strokeWidth={1.25} />;
  if (state === 'failed') return <XCircle className="relative size-16 text-danger" strokeWidth={1.25} />;
  return <ScanFace className={cn('relative size-16', state === 'pending' ? 'text-gold' : 'text-muted')} strokeWidth={1} />;
}
