import { AnimatePresence, m } from 'framer-motion';
import { Camera, Check, CheckCircle2, ChevronRight, IdCard, ImageUp, Info, Loader2, Lock, ScanFace, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Frame } from '@/components/layout/frame';
import { OnboardingHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { CheckboxRow } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/misc';
import { CameraCapture } from '@/features/verification/camera-capture';
import { checkImageFile, compressImage } from '@/lib/media';
import { nextStep, useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

const LIVENESS = ['Center your face in the oval', 'Slowly turn your head left', 'Now blink twice', 'Look straight at the camera'];

const DOC_TYPES = [
  { id: 'license', label: 'Driver’s license', hint: 'Front side' },
  { id: 'id', label: 'State ID card', hint: 'Front side' },
  { id: 'passport', label: 'Passport', hint: 'Photo page' },
] as const;
type DocType = (typeof DOC_TYPES)[number]['id'];

const DOC_CHECKS = ['Document edges detected', 'Text is sharp and readable', 'No glare or blur'];
const CROSS_CHECKS = [
  'Reading your document',
  'Checking security features',
  'Finding the photo on your ID',
  'Confirming the selfie is live',
  'Comparing your face to the ID',
  'Confirming you are 21 or older',
];

type Step = 'intro' | 'doc' | 'doc-camera' | 'doc-review' | 'selfie-intro' | 'selfie' | 'checking' | 'verified' | 'failed';

const STAGE: Record<Step, number> = { intro: 0, doc: 1, 'doc-camera': 1, 'doc-review': 1, 'selfie-intro': 2, selfie: 2, checking: 3, verified: 3, failed: 3 };

/**
 * Identity verification: photo of an ID document → live selfie → cross-check. Phase 0 simulates
 * the check; Phase 2 plugs in VerificationProvider (in-browser FreeFaceCheck, or paid
 * Persona/Veriff). Both images stay in memory only and are discarded right after the check;
 * only pass/fail, timestamp and threshold are ever saved.
 */
export default function VerifyFace() {
  const { session, update } = useSession();
  const navigate = useNavigate();
  const [consent, setConsent] = useState(session.biometricConsent);
  const [step, setStep] = useState<Step>(session.photoCheck === 'verified' ? 'verified' : session.photoCheck === 'failed' ? 'failed' : 'intro');
  const [docType, setDocType] = useState<DocType>('license');
  const [doc, setDoc] = useState<string>();
  const [selfie, setSelfie] = useState<string>();
  const [simulateFail, setSimulateFail] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const upload = useRef<HTMLInputElement>(null);
  const [score] = useState(() => 94 + Math.floor(Math.random() * 5));

  const go = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  const pickFile = async (f?: File) => {
    if (!f) return;
    const problem = checkImageFile(f);
    if (problem) return setUploadError(problem);
    const url = URL.createObjectURL(f);
    setDoc(await compressImage(url, 1000));
    URL.revokeObjectURL(url);
    setUploadError(undefined);
    go('doc-review');
  };

  const finish = (ok: boolean) => {
    // Discard both images immediately after the check.
    setDoc(undefined);
    setSelfie(undefined);
    update({ photoCheck: ok ? 'verified' : 'failed', biometricConsent: true });
    go(ok ? 'verified' : 'failed');
  };

  const proceed = () => navigate(nextStep({ ...session, photoCheck: step === 'verified' ? 'verified' : 'failed' }));
  const docMeta = DOC_TYPES.find((d) => d.id === docType)!;

  return (
    <Frame>
      <OnboardingHeader title="Identity Verification" progress={2 / 6} step="2/6" backTo="/verify/age" />
      <div className="flex min-h-[calc(100dvh-90px)] flex-col px-5 pb-8 pt-2">
        <Stages current={STAGE[step]} done={step === 'verified'} />

        <AnimatePresence mode="wait" initial={false}>
          <m.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col">
            {step === 'intro' && (
              <>
                <Hero icon={<ShieldCheck className="size-10 text-gold" strokeWidth={1.5} />} title="Let’s confirm it’s you" body="Every member is verified so the community stays real, safe and 21+. It takes about a minute." />
                <ol className="mt-6 space-y-2.5">
                  <Need n={1} icon={IdCard} title="Photo of your ID" body="Driver’s license, state ID or passport" />
                  <Need n={2} icon={ScanFace} title="A live selfie" body="We match it to the photo on your ID" />
                  <Need n={3} icon={ShieldCheck} title="Automatic check" body="Usually done in a few seconds" />
                </ol>
                <Card className="mt-5 p-4">
                  <CheckboxRow checked={consent} onCheckedChange={setConsent}>
                    I consent to Daily Stogie using my camera and processing images of my ID and face to verify my identity and age. The images are deleted right after the
                    check and never stored.{' '}
                    <Link to="/legal/privacy" className="text-gold underline-offset-2 hover:underline">
                      Biometric notice
                    </Link>
                  </CheckboxRow>
                </Card>
                <DemoNote />
                <Footer>
                  <Button size="lg" block disabled={!consent} onClick={() => (update({ biometricConsent: true }), go('doc'))}>
                    Start verification <ChevronRight className="size-5" />
                  </Button>
                </Footer>
              </>
            )}

            {step === 'doc' && (
              <>
                <Hero icon={<IdCard className="size-10 text-gold" strokeWidth={1.5} />} title="Add your ID document" body="Choose the document type, then take a photo or upload one." />
                <fieldset className="mt-6">
                  <legend className="micro-label mb-2">Document type</legend>
                  <div className="grid gap-2">
                    {DOC_TYPES.map((d) => (
                      <label
                        key={d.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-[14px] border px-4 py-3 transition-colors',
                          docType === d.id ? 'border-brand-gold bg-gold-fill' : 'border-line bg-surface hover:border-line-strong',
                        )}
                      >
                        <input type="radio" name="doc-type" className="sr-only" checked={docType === d.id} onChange={() => setDocType(d.id)} />
                        <IdCard className={cn('size-5', docType === d.id ? 'text-gold' : 'text-muted')} strokeWidth={1.5} />
                        <span className="flex-1">
                          <span className="block text-[15px] font-medium text-text">{d.label}</span>
                          <span className="block text-xs text-muted">{d.hint}</span>
                        </span>
                        <span className={cn('grid size-5 place-items-center rounded-full border', docType === d.id ? 'border-brand-gold bg-brand-gold text-gold-ink' : 'border-line-strong')}>
                          {docType === d.id && <Check className="size-3" strokeWidth={3} />}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <ul className="mt-4 space-y-1.5 text-xs text-muted">
                  <li>• Place it on a dark, flat surface in good light</li>
                  <li>• Make sure all four corners are visible</li>
                  <li>• Avoid glare from lamps or windows</li>
                </ul>
                {uploadError && (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    {uploadError}
                  </p>
                )}
                <Footer>
                  <Button size="lg" block onClick={() => go('doc-camera')}>
                    <Camera className="size-5" /> Take a photo
                  </Button>
                  <Button size="lg" variant="secondary" block onClick={() => upload.current?.click()}>
                    <ImageUp className="size-5" /> Upload from device
                  </Button>
                </Footer>
                <input ref={upload} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => (pickFile(e.target.files?.[0]), (e.target.value = ''))} />
              </>
            )}

            {step === 'doc-camera' && (
              <div className="pt-4">
                <p className="mb-4 text-center text-sm text-muted">
                  {docMeta.label}: {docMeta.hint.toLowerCase()}
                </p>
                <CameraCapture
                  guide="card"
                  confirmLabel="Use this photo"
                  onCancel={() => go('doc')}
                  onCapture={(img) => {
                    setDoc(img);
                    go('doc-review');
                  }}
                />
              </div>
            )}

            {step === 'doc-review' && doc && <DocReview image={doc} label={docMeta.label} onRetake={() => (setDoc(undefined), go('doc'))} onOk={() => go('selfie-intro')} />}

            {step === 'selfie-intro' && (
              <>
                <Hero icon={<ScanFace className="size-10 text-gold" strokeWidth={1.5} />} title="Now a quick selfie" body="We compare it with the photo on your ID and check that it’s live, not a picture of a picture." />
                {doc && (
                  <div className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-success/40 bg-success/10 py-1.5 pl-1.5 pr-3 text-xs font-medium text-success">
                    <img src={doc} alt="" className="h-7 w-11 rounded-[6px] object-cover" /> ID captured
                  </div>
                )}
                <ul className="mt-6 space-y-1.5 text-xs text-muted">
                  <li>• Remove hats and sunglasses</li>
                  <li>• Hold your phone at eye level in good light</li>
                  <li>• Follow the prompts on screen</li>
                </ul>
                <Footer>
                  <Button size="lg" block onClick={() => go('selfie')}>
                    <Camera className="size-5" /> Open camera
                  </Button>
                </Footer>
              </>
            )}

            {step === 'selfie' && (
              <div className="pt-4">
                <p className="mb-4 text-center text-sm text-muted">Center your face and follow the prompts.</p>
                <CameraCapture
                  prompts={LIVENESS}
                  confirmLabel="Use this selfie"
                  onCancel={() => go('selfie-intro')}
                  onCapture={(img) => {
                    setSelfie(img);
                    go('checking');
                  }}
                />
              </div>
            )}

            {step === 'checking' && <CrossCheck doc={doc} selfie={selfie} onDone={() => finish(!simulateFail)} />}

            {step === 'verified' && (
              <>
                <Result ok title="You’re verified" body="Your ID and selfie match. Both images have been deleted. Your profile now shows the gold verified badge." />
                <dl className="mt-6 divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-surface text-sm">
                  <Row label="Identity" value="Confirmed" />
                  <Row label="Face match" value={`${score}% similarity`} />
                  <Row label="Liveness" value="Passed" />
                  <Row label="Age 21+" value="Confirmed" />
                </dl>
                <Footer>
                  <Button size="lg" block onClick={proceed}>
                    Continue
                  </Button>
                </Footer>
              </>
            )}

            {step === 'failed' && (
              <>
                <Result title="We couldn’t confirm the match" body="This happens with glare, blur or an old ID photo. Our team can review it manually instead (usually within 24 hours), or you can try again now." />
                <Footer>
                  <Button size="lg" block onClick={proceed}>
                    Continue with manual review
                  </Button>
                  <Button size="lg" variant="secondary" block onClick={() => go('doc')}>
                    Try again
                  </Button>
                </Footer>
              </>
            )}
          </m.div>
        </AnimatePresence>

        {import.meta.env.DEV && step === 'intro' && (
          <label className="mt-3 flex items-center justify-center gap-2 text-xs text-faint">
            <input type="checkbox" checked={simulateFail} onChange={(e) => setSimulateFail(e.target.checked)} />
            Dev: simulate a failed check
          </label>
        )}
      </div>
    </Frame>
  );
}

function Stages({ current, done }: { current: number; done: boolean }) {
  const labels = ['Start', 'ID', 'Selfie', 'Check'];
  return (
    <ol className="mx-auto mb-2 mt-1 flex w-full max-w-xs items-center" aria-label="Verification steps">
      {labels.map((l, i) => {
        const complete = i < current || (done && i === current);
        const active = i === current && !done;
        return (
          <li key={l} className={cn('flex items-center', i < labels.length - 1 && 'flex-1')} aria-current={active ? 'step' : undefined}>
            <span className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'grid size-7 place-items-center rounded-full border text-[11px] font-bold transition-colors duration-300',
                  complete ? 'border-success bg-success text-white' : active ? 'border-brand-gold bg-gold-fill text-gold' : 'border-line text-faint',
                )}
              >
                {complete ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn('text-[10px]', active ? 'font-semibold text-text' : 'text-faint')}>{l}</span>
            </span>
            {i < labels.length - 1 && <span className={cn('mx-1 mb-4 h-0.5 flex-1 rounded-full transition-colors duration-500', i < current ? 'bg-success' : 'bg-line')} />}
          </li>
        );
      })}
    </ol>
  );
}

function Hero({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="mt-4 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-[24px] border border-line bg-surface-2">{icon}</span>
      <h2 className="mt-4 font-serif text-[26px] leading-tight text-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Need({ n, icon: Icon, title, body }: { n: number; icon: typeof IdCard; title: string; body: string }) {
  return (
    <li className="flex items-center gap-3 rounded-[14px] border border-line bg-surface px-4 py-3">
      <span className="grid size-10 place-items-center rounded-full bg-gold-fill text-gold">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span className="block text-[15px] font-medium text-text">{title}</span>
        <span className="block text-xs text-muted">{body}</span>
      </span>
      <span className="text-xs font-semibold text-faint">{n}</span>
    </li>
  );
}

function DemoNote() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-[14px] border border-info/30 bg-info/10 px-3.5 py-3 text-xs text-muted">
      <Info className="mt-0.5 size-4 shrink-0 text-info" />
      <span>
        <strong className="font-semibold text-text">Demo verification.</strong> In this preview the check is simulated: your images stay on this device and are discarded
        right after.
      </span>
    </div>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto space-y-3 pt-8">
      {children}
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-faint">
        <Lock className="size-3" /> Encrypted · images deleted after the check
      </p>
    </div>
  );
}

/** Quick automatic quality check of the ID photo before moving on. */
function DocReview({ image, label, onRetake, onOk }: { image: string; label: string; onRetake: () => void; onOk: () => void }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= DOC_CHECKS.length) return;
    const t = window.setTimeout(() => setDone((d) => d + 1), done === 0 ? 650 : 450);
    return () => window.clearTimeout(t);
  }, [done]);
  const ready = done >= DOC_CHECKS.length;
  return (
    <>
      <div className="mt-4 text-center">
        <h2 className="font-serif text-[24px] text-text">Check your photo</h2>
        <p className="mt-1 text-sm text-muted">{label}</p>
      </div>
      <div className="relative mx-auto mt-4 w-full max-w-[420px] overflow-hidden rounded-[18px] border border-line-strong bg-black">
        <img src={image} alt={`Your ${label}`} className="aspect-[1.586/1] w-full object-cover" />
        {!ready && <div className="id-scan absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-brand-gold/35 to-transparent" aria-hidden />}
      </div>
      <ul className="mt-5 space-y-2" aria-live="polite">
        {DOC_CHECKS.map((c, i) => (
          <CheckRow key={c} label={c} state={i < done ? 'done' : i === done ? 'active' : 'waiting'} />
        ))}
      </ul>
      <Footer>
        <Button size="lg" block disabled={!ready} onClick={onOk}>
          {ready ? 'Looks good, continue' : 'Checking photo quality…'}
        </Button>
        <Button size="lg" variant="secondary" block onClick={onRetake}>
          Retake
        </Button>
      </Footer>
    </>
  );
}

function CheckRow({ label, state }: { label: string; state: 'waiting' | 'active' | 'done' }) {
  return (
    <li className={cn('flex items-center gap-3 text-sm transition-colors', state === 'waiting' ? 'text-faint' : 'text-text')}>
      <span className={cn('grid size-6 shrink-0 place-items-center rounded-full', state === 'done' ? 'bg-success text-white' : state === 'active' ? 'text-gold' : 'border border-line')}>
        {state === 'done' ? <Check className="size-3.5" strokeWidth={3} /> : state === 'active' ? <Loader2 className="size-4 animate-spin" /> : null}
      </span>
      {label}
    </li>
  );
}

/** The cross-verification moment: ID photo vs selfie, with each check ticking off in turn. */
function CrossCheck({ doc, selfie, onDone }: { doc?: string; selfie?: string; onDone: () => void }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= CROSS_CHECKS.length) {
      const t = window.setTimeout(onDone, 600);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), 520 + (done === 4 ? 700 : 0));
    return () => window.clearTimeout(t);
  }, [done, onDone]);
  const pct = Math.round((done / CROSS_CHECKS.length) * 100);
  return (
    <>
      <div className="mt-4 text-center" aria-live="polite">
        <h2 className="font-serif text-[24px] text-text">Verifying your identity</h2>
        <p className="mt-1 text-sm text-muted">Please keep this screen open.</p>
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Thumb src={doc} label="ID photo" className="aspect-[1.586/1] w-36 rounded-[12px]" scanning={done < 3} />
        <div className="flex flex-col items-center gap-1">
          <span className={cn('grid size-10 place-items-center rounded-full border-2 transition-colors duration-300', done > 4 ? 'border-success bg-success text-white' : 'border-brand-gold text-gold')}>
            {done > 4 ? <Check className="size-5" strokeWidth={3} /> : <Loader2 className="size-5 animate-spin" />}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Match</span>
        </div>
        <Thumb src={selfie} label="Selfie" className="size-[92px] rounded-full" scanning={done >= 3 && done < 5} />
      </div>
      <div className="mx-auto mt-6 w-full max-w-sm">
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div className="gold-gradient h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-right text-[11px] tabular-nums text-faint">{pct}%</p>
      </div>
      <ul className="mx-auto mt-2 w-full max-w-sm space-y-2.5">
        {CROSS_CHECKS.map((c, i) => (
          <CheckRow key={c} label={c} state={i < done ? 'done' : i === done ? 'active' : 'waiting'} />
        ))}
      </ul>
      <div className="mt-auto pt-8">
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-faint">
          <Lock className="size-3" /> Encrypted · images deleted after the check
        </p>
      </div>
    </>
  );
}

function Thumb({ src, label, className, scanning }: { src?: string; label: string; className: string; scanning: boolean }) {
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <div className={cn('relative overflow-hidden border-2 bg-surface-2', scanning ? 'border-brand-gold' : 'border-line', className)}>
        {src ? <img src={src} alt="" className="size-full object-cover" /> : <ScanFace className="m-auto size-8 text-faint" />}
        {scanning && <div className="id-scan absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-brand-gold/45 to-transparent" aria-hidden />}
      </div>
      <figcaption className="text-[11px] text-muted">{label}</figcaption>
    </figure>
  );
}

function Result({ ok, title, body }: { ok?: boolean; title: string; body: string }) {
  return (
    <div className="mt-8 text-center" role="status">
      <m.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className={cn('mx-auto grid size-24 place-items-center rounded-full', ok ? 'bg-success/12 text-success' : 'bg-danger/10 text-danger')}
      >
        {ok ? <CheckCircle2 className="size-14" strokeWidth={1.25} /> : <XCircle className="size-14" strokeWidth={1.25} />}
      </m.span>
      <h2 className="mt-5 font-serif text-[28px] leading-tight text-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="flex items-center gap-1.5 font-medium text-text">
        <CheckCircle2 className="size-4 text-success" /> {value}
      </dd>
    </div>
  );
}
