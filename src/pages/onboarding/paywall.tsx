import { m } from 'framer-motion';
import { Check, Lock, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/brand/logo';
import { Frame } from '@/components/layout/frame';
import { OnboardingHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { CheckoutSheet } from '@/features/billing/checkout-sheet';
import { nextStep, useSession, type Plan } from '@/lib/session';
import { cn } from '@/lib/utils';

export const PLANS: { id: Plan; name: string; price: string; per: string; amount: number; note?: string }[] = [
  { id: 'monthly', name: 'Monthly', price: '$1.99', per: 'per month', amount: 1.99 },
  { id: 'yearly', name: 'Yearly', price: '$19.99', per: 'per year', amount: 19.99, note: 'Save 16%' },
];

const PERKS = ['Profile-based matching', 'Instant messaging with your connections', 'Stogie Search lounge locator', 'Stogie Sessions videos and the Blog'];

export function PlanPicker({ value, onChange }: { value: Plan; onChange: (p: Plan) => void }) {
  return (
    <div role="radiogroup" aria-label="Plan" className="grid grid-cols-2 gap-3">
      {PLANS.map((p) => {
        const sel = value === p.id;
        return (
          <m.button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={sel}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(p.id)}
            className={cn(
              'relative rounded-[20px] border p-4 pt-6 text-center transition-colors',
              sel ? 'border-gold bg-gold-fill shadow-[var(--shadow-glow)]' : 'border-line bg-surface hover:border-line-strong',
            )}
          >
            {p.note && (
              <Badge tone="solid" className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                Best value
              </Badge>
            )}
            <p className="text-sm text-muted">{p.name}</p>
            <p className="mt-1 font-serif text-[32px] leading-none text-text">{p.price}</p>
            <p className="mt-1 text-xs text-muted">{p.per}</p>
            {p.note ? <p className="mt-2 text-xs font-semibold text-ember">{p.note}</p> : <p className="mt-2 text-xs">&nbsp;</p>}
            <span className={cn('mx-auto mt-3 grid size-6 place-items-center rounded-full border', sel ? 'border-gold bg-gold text-gold-ink' : 'border-line-strong')}>
              {sel && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          </m.button>
        );
      })}
    </div>
  );
}

export default function Paywall() {
  const { session, update } = useSession();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [checkout, setCheckout] = useState(false);

  return (
    <Frame>
      <OnboardingHeader title="Membership" progress={5 / 6} step="5/6" backTo="/photo" />
      <div className="flex min-h-[calc(100dvh-90px)] flex-col px-5 pb-8 pt-2">
        <div className="text-center">
          <LogoMark className="mx-auto size-10" />
          <h2 className="mt-3 font-serif text-[28px] text-text">Join the lounge</h2>
          <p className="mt-1 text-sm text-muted">Members-only access to your cigar circle.</p>
        </div>
        <ul className="mx-auto mt-6 space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-sm text-text">
              <Check className="size-4 text-gold" strokeWidth={2.5} /> {p}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <PlanPicker value={plan} onChange={setPlan} />
        </div>

        <div className="mt-auto space-y-3 pt-8">
          <Button
            size="lg"
            block
            // Phase 6: Stripe Checkout; the webhook writes subscription state to the database.
            onClick={() => setCheckout(true)}
          >
            Continue to payment
          </Button>
          <p className="text-center text-xs leading-relaxed text-faint">
            Your subscription renews automatically at {PLANS.find((p) => p.id === plan)!.price}{' '}
            {PLANS.find((p) => p.id === plan)!.per} until you cancel. See the{' '}
            <Link to="/legal/terms" className="text-gold hover:underline">
              Terms
            </Link>{' '}
            for billing and refunds.
          </p>
          <div className="flex items-center justify-center gap-5 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <RotateCcw className="size-3.5" /> Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5" /> Secure payment (Stripe)
            </span>
          </div>
        </div>
      </div>
      <CheckoutSheet
        open={checkout}
        onOpenChange={setCheckout}
        plan={PLANS.find((p) => p.id === plan)!}
        onPaid={(payment) => {
          update({ plan, payment });
          navigate(nextStep({ ...session, plan, payment }));
        }}
      />
    </Frame>
  );
}
