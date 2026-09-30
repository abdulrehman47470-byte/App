import { ScrollText } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CigarBand } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/app-shell';
import { OnboardingHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { CheckboxRow } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/misc';
import { ETHICS_SUMMARY } from '@/content/legal';
import { nextStep, useSession } from '@/lib/session';

export default function Ethics() {
  const { session, update } = useSession();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(session.ethicsAgreed);

  return (
    <Frame>
      <OnboardingHeader title="Stogie Ethics" progress={3 / 6} step="3/6" backTo="/verify/face" />
      <div className="flex min-h-[calc(100dvh-90px)] flex-col px-5 pb-8 pt-2">
        <p className="text-[15px] leading-relaxed text-muted">
          We are a community of responsible adults who enjoy cigars. By joining, you agree to our Code of Ethics,
          which includes:
        </p>

        <Card className="mt-5 max-h-[46dvh] overflow-y-auto p-5" >
          <div className="mb-3 flex items-center gap-2">
            <ScrollText className="size-5 text-gold" strokeWidth={1.5} />
            <h2 className="micro-label">Code of Ethics: summary</h2>
          </div>
          <ul className="space-y-4">
            {ETHICS_SUMMARY.map((r, i) => (
              <li key={r.title} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-gold/50 font-serif text-xs text-gold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[15px] font-medium text-text">{r.title}</p>
                  <p className="text-sm text-muted">{r.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <CigarBand label="Full text" className="mt-5" />
          <Link to="/legal/ethics" className="mt-1 block text-center text-sm text-gold hover:underline">
            Read the full Code of Ethics
          </Link>
        </Card>

        <div className="mt-6">
          <CheckboxRow checked={agreed} onCheckedChange={setAgreed}>
            I agree to the <span className="text-text">Stogie Code of Ethics</span>.
          </CheckboxRow>
          <p className="mt-3 pl-9 text-xs text-faint">
            By continuing you also accept our{' '}
            <Link to="/legal/terms" className="text-gold hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/legal/privacy" className="text-gold hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="mt-auto pt-8">
          <Button
            size="lg"
            block
            disabled={!agreed}
            onClick={() => {
              // Phase 2 stores consent timestamp + document version (ethics, terms, privacy).
              update({ ethicsAgreed: true });
              navigate(nextStep({ ...session, ethicsAgreed: true }));
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </Frame>
  );
}
