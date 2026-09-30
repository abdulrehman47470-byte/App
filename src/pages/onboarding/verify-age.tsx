import { CalendarDays, ScanFace } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrustNote } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/app-shell';
import { OnboardingHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Card } from '@/components/ui/misc';
import { useSaveMe } from '@/features/queries';
import { nextStep, useSession } from '@/lib/session';
import { ageFromDob, isOfAge, MIN_AGE } from '@/lib/utils';

/** Formats typed digits as MM / DD / YYYY. */
function mask(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join(' / ');
}
function toIso(masked: string) {
  const [mm, dd, yyyy] = masked.split(' / ');
  if (!mm || !dd || yyyy?.length !== 4) return null;
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = new Date(iso + 'T00:00:00');
  return !Number.isNaN(d.getTime()) && d.getDate() === Number(dd) && d.getFullYear() > 1900 ? iso : null;
}

export default function VerifyAge() {
  const { session, update } = useSession();
  const saveMe = useSaveMe();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const iso = toIso(value);
    if (!iso || ageFromDob(iso) > 120) return setError('Enter a valid date of birth.');
    if (!isOfAge(iso)) {
      // Phase 2: enforced server-side too; only the minimum data the law requires is kept.
      update({ underage: true });
      return navigate('/restricted', { replace: true });
    }
    await saveMe.mutateAsync({ dob: iso, age: ageFromDob(iso) });
    update({ dob: iso });
    navigate(nextStep({ ...session, dob: iso }));
  };

  return (
    <Frame>
      <OnboardingHeader title="Age Verification" progress={1 / 6} step="1/6" backTo="/" />
      <form onSubmit={onSubmit} className="flex min-h-[calc(100dvh-90px)] flex-col px-5 pb-8 pt-4" noValidate>
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full border border-line-strong bg-gold-fill">
            <CalendarDays className="size-6 text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-[15px] text-text">You must be {MIN_AGE} or older to join Daily Stogie.</p>
        </div>

        <Field label="Date of birth" error={error} hint={!error ? 'We use this to confirm your age. It is never shown to other members.' : undefined}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              aria-invalid={!!error}
              inputMode="numeric"
              autoComplete="bday"
              placeholder="MM / DD / YYYY"
              value={value}
              onChange={(e) => {
                setValue(mask(e.target.value));
                setError(undefined);
              }}
              className="font-serif text-lg tracking-wider"
            />
          )}
        </Field>

        <Card className="mt-6 flex items-start gap-3 p-4">
          <ScanFace className="mt-0.5 size-6 shrink-0 text-gold" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-text">Next: a quick photo check</p>
            <p className="mt-0.5 text-xs text-muted">A live selfie confirms your profile photo is really you.</p>
          </div>
        </Card>

        <div className="mt-auto space-y-4 pt-8">
          <Button type="submit" size="lg" block disabled={value.length < 14 || saveMe.isPending}>
            Continue
          </Button>
          <TrustNote />
        </div>
      </form>
    </Frame>
  );
}
