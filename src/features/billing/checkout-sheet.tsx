import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, CreditCard, Loader2, Lock, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * MOCK checkout (Phase 0). Looks and behaves like a real card checkout, but nothing is charged and
 * no card data leaves the page: members can pay with any details, or none at all. Phase 6 replaces
 * this with Stripe Checkout (card data then never touches our app).
 */

export interface CheckoutPlan {
  id: 'monthly' | 'yearly';
  name: string;
  price: string;
  per: string;
  amount: number;
}

export interface MockPayment {
  brand: string;
  last4: string;
  paidAt: string;
  amount: number;
  plan: 'monthly' | 'yearly';
}

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Mexico', 'Other'];

function cardBrand(num: string) {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^6(011|5)/.test(n)) return 'Discover';
  return '';
}
const formatCard = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
};

type Step = 'form' | 'processing' | 'done';

export function CheckoutSheet({
  open,
  onOpenChange,
  plan,
  onPaid,
  defaultEmail = '',
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: CheckoutPlan;
  onPaid: (p: MockPayment) => void;
  defaultEmail?: string;
}) {
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState(defaultEmail);
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('United States');
  const [zip, setZip] = useState('');
  const [payment, setPayment] = useState<MockPayment>();

  useEffect(() => {
    if (open) setStep('form');
  }, [open]);

  const brand = cardBrand(card);
  const digits = card.replace(/\D/g, '');

  const pay = (e?: FormEvent) => {
    e?.preventDefault();
    setStep('processing');
    const p: MockPayment = {
      brand: brand || (digits ? 'Card' : 'Demo'),
      last4: digits.length >= 4 ? digits.slice(-4) : '0000',
      paidAt: new Date().toISOString(),
      amount: plan.amount,
      plan: plan.id,
    };
    // Short, realistic processing moment; nothing is sent anywhere.
    setTimeout(() => {
      setPayment(p);
      setStep('done');
    }, 900);
  };

  const renewal = new Date(Date.now() + (plan.id === 'yearly' ? 365 : 30) * 86_400_000).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Dialog.Root open={open} onOpenChange={(v) => step !== 'processing' && onOpenChange(v)}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-[80] bg-scrim" />
        <Dialog.Content className="sheet-content surface fixed inset-x-0 bottom-0 z-[80] mx-auto flex max-h-[94dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-[24px] focus:outline-none sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[24px]">
          {/* Order summary header */}
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <LogoMark className="size-10" />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate font-serif text-lg leading-tight text-text">Daily Stogie</Dialog.Title>
              <Dialog.Description className="text-xs text-muted">
                {plan.name} membership · renews automatically
              </Dialog.Description>
            </div>
            <div className="text-right">
              <p className="font-serif text-xl text-gold-light">{plan.price}</p>
              <p className="text-[11px] text-faint">{plan.per}</p>
            </div>
            {step !== 'processing' && (
              <Dialog.Close className="-mr-2 grid size-10 place-items-center rounded-full text-muted hover:text-text" aria-label="Close checkout">
                <X className="size-5" />
              </Dialog.Close>
            )}
          </div>

          {step === 'done' && payment ? (
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-success/15">
                <CheckCircle2 className="size-9 text-success" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-serif text-2xl text-text">Payment successful</h3>
              <p className="mt-1 text-sm text-muted">Welcome to the lounge.</p>
              <dl className="mt-6 w-full space-y-2 rounded-[16px] border border-line bg-bg-elevated p-4 text-left text-sm">
                <Row label="Plan" value={`${plan.name} · ${plan.price} ${plan.per}`} />
                <Row label="Paid with" value={payment.brand === 'Demo' ? 'Demo payment' : `${payment.brand} •••• ${payment.last4}`} />
                <Row label="Date" value={new Date(payment.paidAt).toLocaleDateString()} />
                <Row label="Renews on" value={renewal} />
              </dl>
              <Button
                size="lg"
                block
                className="mt-6"
                onClick={() => {
                  onPaid(payment);
                  onOpenChange(false);
                }}
                autoFocus
              >
                Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={pay} className="flex-1 overflow-y-auto px-5 pb-5 pt-4" noValidate>
              <div className="mb-4 flex items-center justify-between">
                <p className="micro-label">Pay with card</p>
                <span className="rounded-full border border-warning/50 bg-warning/10 px-2.5 py-0.5 text-[11px] font-semibold text-warning">TEST MODE</span>
              </div>

              <Label text="Email">
                <input className="co-input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Label>

              <Label text="Card information">
                <div className="co-group">
                  <div className="relative">
                    <input
                      className="co-input rounded-b-none pr-24"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 1234 1234 1234"
                      aria-label="Card number"
                      value={card}
                      onChange={(e) => setCard(formatCard(e.target.value))}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-bold">
                      {brand ? <span className="rounded bg-surface-2 px-1.5 py-0.5 text-gold-light">{brand.toUpperCase()}</span> : <CreditCard className="size-5 text-faint" />}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <input className="co-input rounded-none rounded-bl-[12px] border-t-0" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" aria-label="Expiry date" value={exp} onChange={(e) => setExp(formatExpiry(e.target.value))} />
                    <input className="co-input rounded-none rounded-br-[12px] border-l-0 border-t-0" inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" aria-label="CVC" maxLength={4} value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                  </div>
                </div>
              </Label>

              <Label text="Name on card">
                <input className="co-input" autoComplete="cc-name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              </Label>

              <Label text="Country or region">
                <div className="co-group">
                  <select className="co-input rounded-b-none" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <input className="co-input rounded-t-none border-t-0" autoComplete="postal-code" placeholder="ZIP" aria-label="ZIP or postal code" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
              </Label>

              <button
                type="button"
                onClick={() => {
                  setCard('4242 4242 4242 4242');
                  setExp('12 / 34');
                  setCvc('123');
                  if (!name) setName('Demo Member');
                }}
                className="mb-4 text-xs text-gold underline-offset-2 hover:underline"
              >
                Fill in a test card
              </button>

              <Button type="submit" size="lg" block disabled={step === 'processing'}>
                {step === 'processing' ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Lock className="size-4" /> Pay {plan.price}
                  </>
                )}
              </Button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-faint">
                Test mode: no real charge is made and card details are not checked or stored. You can pay with the
                fields empty. Your plan renews automatically until you cancel.
              </p>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{text}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('flex justify-between gap-4')}>
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-text">{value}</dd>
    </div>
  );
}
