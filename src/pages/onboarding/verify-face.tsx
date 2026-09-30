import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CheckCircle2, Clock, IdCard, Info, ScanFace, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Frame } from '@/components/layout/app-shell';
import { OnboardingHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { CheckboxRow } from '@/components/ui/checkbox';
import { Badge, Card } from '@/components/ui/misc';
import { CameraCapture } from '@/features/verification/camera-capture';
import { nextStep, useSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import type { VerificationState } from '@/types';

const LIVENESS = ['Center your face in the oval', 'Slowly turn your head left', 'Now blink twice', 'Look straight at the camera'];

type Step = 'consent' | 'camera' | 'checking' | 'verified' | 'failed';

/**
 * Photo check. Phase 0 simulates the comparison; Phase 2 plugs in VerificationProvider
 * (FreeFaceCheckProvider running in the browser, MockProvider, stubs for paid Persona/Veriff).
 * The selfie is held in memory only and discarded right after the check; only pass/fail,
 * timestamp and threshold are ever saved.
 */
export default function VerifyFace() {
  const { session, update } = useSession();
  const navigate = useNavigate();
  const [consent, setConsent] = useState(session.biometricConsent);
  const [step, setStep] = useState<Step>(
    session.photoCheck === 'verified' ? 'verified' : session.photoCheck === 'failed' ? 'failed' : 'consent',
  );
  const [selfie, setSelfie] = useState<string>();
  const [simulateFail, setSimulateFail] = useState(false);

  useEffect(() => {
    if (step !== 'checking') return;
    const t = window.setTimeout(() => {
      const result: VerificationState = simulateFail ? 'failed' : 'verified';
      setSelfie(undefined); // discard the selfie immediately after the check
      setStep(result === 'verified' ? 'verified' : 'failed');
      update({ photoCheck: result, biometricConsent: true });
    }, 2600);
    return () => window.clearTimeout(t);
  }, [step, simulateFail, update]);

  const proceed = () => navigate(nextStep({ ...session, photoCheck: step === 'verified' ? 'verified' : 'failed' }));
  const status: VerificationState = step === 'checking' ? 'pending' : step === 'verified' ? 'verified' : step === 'failed' ? 'failed' : 'idle';

  return (
    <Frame>
      <OnboardingHeader title="Photo Check" progress={2 / 6} step="2/6" backTo="/verify/age" />
      <div className="flex min-h-[calc(100dvh-90px)] flex-col px-5 pb-8 pt-2">
        {step === 'camera' ? (
          <div className="pt-2">
            <p className="mb-4 text-center text-sm text-muted">Hold your phone at eye level in good light.</p>
            <CameraCapture
              prompts={LIVENESS}
              confirmLabel="Use this selfie"
              onCancel={() => setStep('consent')}
              onCapture={(img) => {
                setSelfie(img);
                setStep('checking');
              }}
            />
          </div>
        ) : (
          <>
            <div className="relative mx-auto my-4 grid size-52 place-items-center">
              <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden>
                <defs>
                  <clipPath id="face-clip">
                    <ellipse cx="100" cy="100" rx="70" ry="88" />
                  </clipPath>
                </defs>
                <ellipse cx="100" cy="100" rx="70" ry="88" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
                {selfie && <image href={selfie} x="30" y="12" width="140" height="176" preserveAspectRatio="xMidYMid slice" clipPath="url(#face-clip)" />}
                {step === 'checking' && (
                  <motion.ellipse
                    cx="100" cy="100" rx="70" ry="88" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, ease: 'linear' }}
                  />
                )}
                {step === 'verified' && <ellipse cx="100" cy="100" rx="70" ry="88" fill="none" stroke="var(--success)" strokeWidth="3" />}
                {step === 'failed' && <ellipse cx="100" cy="100" rx="70" ry="88" fill="none" stroke="var(--danger)" strokeWidth="3" />}
              </svg>
              {step === 'checking' && (
                <motion.div
                  aria-hidden
                  className="absolute inset-x-12 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent"
                  animate={{ top: ['18%', '82%', '18%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {step === 'consent' && <ScanFace className="relative size-16 text-muted" strokeWidth={1} />}
              {step === 'verified' && <CheckCircle2 className="relative size-16 text-success" strokeWidth={1.25} />}
              {step === 'failed' && <XCircle className="relative size-16 text-danger" strokeWidth={1.25} />}
            </div>

            <div aria-live="polite" className="min-h-14 text-center">
              <AnimatePresence mode="wait">
                <motion.p key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-serif text-xl text-text">
                  {step === 'consent' && 'Take a quick live selfie'}
                  {step === 'checking' && 'Comparing with your photo…'}
                  {step === 'verified' && 'Photo verified'}
                  {step === 'failed' && 'We could not confirm the match'}
                </motion.p>
              </AnimatePresence>
              <p className="mt-1 text-sm text-muted">
                {step === 'consent' && 'We compare it with your profile photo to confirm it is really you.'}
                {step === 'checking' && 'This takes a few seconds. Your selfie is deleted right after.'}
                {step === 'verified' && 'Your selfie has been deleted. You will get the gold verified badge.'}
                {step === 'failed' && 'No problem: our team will review your photo manually instead. Continue, or try again.'}
              </p>
            </div>

            <ol className="mx-auto mt-5 flex w-full max-w-xs items-center justify-between" aria-label="Verification status">
              {(['pending', 'verified', 'failed'] as const).map((s) => (
                <li key={s} className="flex flex-col items-center gap-1.5 text-xs">
                  <span className={cn('grid size-9 place-items-center rounded-full border', status === s ? 'border-gold bg-gold-fill' : 'border-line')}>
                    {s === 'pending' && <Clock className={cn('size-4', status === s ? 'text-warning' : 'text-faint')} />}
                    {s === 'verified' && <CheckCircle2 className={cn('size-4', status === s ? 'text-success' : 'text-faint')} />}
                    {s === 'failed' && <XCircle className={cn('size-4', status === s ? 'text-danger' : 'text-faint')} />}
                  </span>
                  <span className={status === s ? 'text-text' : 'text-faint'}>{s[0].toUpperCase() + s.slice(1)}</span>
                </li>
              ))}
            </ol>

            {step === 'consent' && (
              <div className="mt-6 space-y-4">
                <Card className="p-4">
                  <CheckboxRow checked={consent} onCheckedChange={setConsent}>
                    I consent to Daily Stogie using my camera and processing my face image to compare it with my
                    profile photo. The selfie and face data are deleted right after the check and never stored.{' '}
                    <Link to="/legal/privacy" className="text-gold underline-offset-2 hover:underline">
                      Biometric notice
                    </Link>
                  </CheckboxRow>
                </Card>
                <div className="flex items-start gap-2 rounded-[14px] border border-info/30 bg-info/10 px-3.5 py-3 text-xs text-muted">
                  <Info className="mt-0.5 size-4 shrink-0 text-info" />
                  The photo check confirms your photo is of the person taking the selfie. It does not verify your ID or your age.
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
              {step === 'consent' && (
                <Button size="lg" block disabled={!consent} onClick={() => setStep('camera')}>
                  <Camera className="size-5" /> Open camera
                </Button>
              )}
              {step === 'checking' && (
                <Button size="lg" block disabled>
                  Checking…
                </Button>
              )}
              {step === 'verified' && (
                <Button size="lg" block onClick={proceed}>
                  Continue
                </Button>
              )}
              {step === 'failed' && (
                <>
                  <Button size="lg" block onClick={proceed}>
                    Continue with manual review
                  </Button>
                  <Button size="lg" variant="secondary" block onClick={() => setStep('camera')}>
                    Try again
                  </Button>
                </>
              )}
              {import.meta.env.DEV && step === 'consent' && (
                <label className="flex items-center justify-center gap-2 text-xs text-faint">
                  <input type="checkbox" checked={simulateFail} onChange={(e) => setSimulateFail(e.target.checked)} />
                  Dev: simulate a failed check
                </label>
              )}
            </div>
          </>
        )}
      </div>
    </Frame>
  );
}
