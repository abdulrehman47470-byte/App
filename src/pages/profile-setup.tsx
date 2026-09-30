import { AnimatePresence, m } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Frame } from '@/components/layout/frame';
import { OnboardingHeader, StickyFooter } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { StepAbout } from '@/features/profile/step-about';
import { demographicsErrors, StepDemographics } from '@/features/profile/step-demographics';
import { StepPreferences } from '@/features/profile/step-preferences';
import { useProfileDraft } from '@/features/profile/use-draft';
import { HOME } from '@/config/features';
import { useSession } from '@/lib/session';

const STEPS = [
  { title: 'Demographics', sub: 'Profile #1 of 3' },
  { title: 'Stogie Preferences', sub: 'Profile #2 of 3' },
  { title: 'About You', sub: 'Profile #3 of 3' },
];

/** The 3-step profile wizard. `mode="edit"` reuses it from My Profile. */
export default function ProfileSetup({ mode = 'onboarding' }: { mode?: 'onboarding' | 'edit' }) {
  const { step: raw } = useParams();
  const step = Number(raw);
  const navigate = useNavigate();
  const { session, update } = useSession();
  const { draft, patch, update: updateDraft, flush, saving } = useProfileDraft();
  const [showErrors, setShowErrors] = useState(false);
  const base = mode === 'edit' ? '/profile/edit' : '/setup';

  if (![1, 2, 3].includes(step)) return <Navigate to={`${base}/1`} replace />;

  const next = async () => {
    if (!draft) return;
    if (step === 1 && Object.keys(demographicsErrors(draft)).length) {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await flush();
    if (mode === 'onboarding') update({ profileStep: Math.max(session.profileStep, step) });
    if (step < 3) navigate(`${base}/${step + 1}`);
    else navigate(mode === 'edit' ? '/profile' : HOME);
  };

  const meta = STEPS[step - 1];
  return (
    <Frame>
      <OnboardingHeader
        title={mode === 'edit' ? `Edit · ${meta.title}` : 'Profile Setup'}
        step={`${step}/3`}
        progress={step / 3}
        backTo={step > 1 ? `${base}/${step - 1}` : mode === 'edit' ? '/profile' : '/subscribe'}
      />
      <div className="px-5 pt-3">
        <p className="micro-label">{meta.sub}</p>
        <h2 className="mt-1 font-serif text-[28px] text-text">{meta.title}</h2>
      </div>
      <div className="px-5 pb-2 pt-5">
        {!draft ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <m.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              {step === 1 && <StepDemographics d={draft} patch={patch} showErrors={showErrors} />}
              {step === 2 && <StepPreferences prefs={draft.preferences} onChange={(fn) => updateDraft((d) => ({ preferences: fn(d.preferences) }))} />}
              {step === 3 && (
                <StepAbout
                  about={draft.about}
                  visibility={draft.visibility}
                  onChange={(about) => patch({ about })}
                  onVisibility={(visibility) => patch({ visibility })}
                />
              )}
            </m.div>
          </AnimatePresence>
        )}
        <StickyFooter>
          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="secondary" size="lg" onClick={() => navigate(`${base}/${step - 1}`)} aria-label="Back">
                <ArrowLeft className="size-5" /> Back
              </Button>
            )}
            <Button size="lg" block onClick={next} disabled={!draft || saving}>
              {step < 3 ? 'Next' : mode === 'edit' ? 'Save profile' : 'Complete profile'}
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-faint">{saving ? 'Saving…' : 'Changes are saved automatically.'}</p>
        </StickyFooter>
      </div>
    </Frame>
  );
}
