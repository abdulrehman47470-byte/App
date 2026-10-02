import { CalendarClock, Download, ExternalLink, Gift, Share2, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogoMark } from '@/components/brand/logo';
import { CigarBand } from '@/components/brand/ornaments';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Badge, Card } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { useMe } from '@/features/queries';
import { SettingsMenu } from '@/features/settings/settings-menu';
import { useSession, type Plan } from '@/lib/session';
import { PlanPicker, PLANS } from './onboarding/paywall';
import { CheckoutSheet } from '@/features/billing/checkout-sheet';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" backTo="/profile" />
      <PageBody>
        <SettingsMenu />
        <p className="mt-8 text-center font-serif text-sm italic text-faint">Good Cigars. Better Company.</p>
      </PageBody>
    </>
  );
}

export function SubscriptionPage() {
  const { session, update } = useSession();
  const toast = useToast();
  const [plan, setPlan] = useState<Plan>(session.plan ?? 'yearly');
  const current = PLANS.find((p) => p.id === session.plan);
  const [checkout, setCheckout] = useState(false);
  const pay = session.payment;
  const renews = pay
    ? new Date(new Date(pay.paidAt).getTime() + (pay.plan === 'yearly' ? 365 : 30) * 86_400_000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <>
      <PageHeader title="Subscription" back />
      <PageBody className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="micro-label">Current plan</p>
            <Badge tone="success">Active</Badge>
          </div>
          <p className="mt-3 font-serif text-[32px] leading-none text-text">
            {current?.price ?? '—'} <span className="font-sans text-sm text-muted">{current?.per}</span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <CalendarClock className="size-4 text-gold" /> {renews ? `Renews on ${renews}` : 'Renews automatically.'}
          </p>
          {pay && (
            <p className="mt-2 text-sm text-muted">
              Payment method: <span className="text-text">{pay.brand === 'Demo' ? 'Demo payment' : `${pay.brand} •••• ${pay.last4}`}</span>
            </p>
          )}
        </Card>

        <div>
          <h2 className="micro-label mb-3">Change plan</h2>
          <PlanPicker value={plan} onChange={setPlan} />
          <Button
            block
            className="mt-4"
            disabled={plan === session.plan}
            onClick={() => setCheckout(true)}
          >
            Switch to {PLANS.find((p) => p.id === plan)!.name.toLowerCase()}
          </Button>
        </div>

        <Button variant="secondary" block onClick={() => toast('Stripe customer portal arrives in Phase 6.')}>
          <ExternalLink className="size-4" /> Manage payment or cancel
        </Button>
        <p className="text-center text-xs text-faint">Payments are handled securely by Stripe. We never store card details.</p>
      </PageBody>
      <CheckoutSheet
        open={checkout}
        onOpenChange={setCheckout}
        plan={PLANS.find((p) => p.id === plan)!}
        onPaid={(payment) => {
          update({ plan, payment });
          toast('Plan updated');
        }}
      />
    </>
  );
}

export function ReferPage() {
  const toast = useToast();
  const { data: me } = useMe();
  // Phase 7: unique referral code per member, tracked in the referrals table.
  const code = (me?.name || 'member').toLowerCase().replace(/[^a-z]/g, '').slice(0, 8) + '21';
  const link = `${window.location.origin}/invite/${code}`; // TODO(needs-client): production domain

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast('Link copied');
    } catch {
      toast('Could not copy. Select the link and copy it manually.', 'danger');
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join me on Daily Stogie', text: 'Find your circle. Share the smoke.', url: link });
      } catch {
        /* cancelled */
      }
    } else copy();
  };

  return (
    <>
      <PageHeader title="Refer a Friend" back />
      <PageBody className="space-y-6">
        <div className="pt-4 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full border border-line-strong bg-gold-fill">
            <Gift className="size-9 text-gold" strokeWidth={1.25} />
          </div>
          <h2 className="mt-5 font-serif text-[28px] text-text">Share Daily Stogie</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted">Invite fellow cigar lovers (21+) to join your circle.</p>
        </div>
        <Field label="Your invite link">
          {(id) => (
            <div className="flex gap-2">
              <Input id={id} readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="text-sm" />
              <Button variant="outline" onClick={copy} aria-label="Copy link">
                <Copy className="size-4" /> Copy
              </Button>
            </div>
          )}
        </Field>
        <Button size="lg" block onClick={share}>
          <Share2 className="size-5" /> Share invite
        </Button>
        {/* TODO(needs-client): referral rewards were not requested; confirm before building any. */}
        <CigarBand label="21+ only" />
        <p className="text-center text-xs text-faint">Friends must be 21 or older and agree to the Stogie Ethics to join.</p>
      </PageBody>
    </>
  );
}

export function DeleteAccountPage() {
  const { data: me } = useMe();
  const { signOut } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');

  const exportData = () => {
    const blob = new Blob([JSON.stringify(me, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'daily-stogie-my-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader title="Delete Account" back />
      <PageBody className="space-y-5">
        <Card className="p-5">
          <h2 className="font-serif text-xl text-text">Download your data</h2>
          <p className="mt-1 text-sm text-muted">Get a copy of your profile information before you go.</p>
          <Button variant="secondary" block className="mt-4" onClick={exportData}>
            <Download className="size-4" /> Export my data
          </Button>
        </Card>

        <Card className="border-danger/30 p-5">
          <h2 className="font-serif text-xl text-danger">Delete my account</h2>
          <p className="mt-2 text-sm text-muted">This permanently removes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Your profile and preferences</li>
            <li>Your photos</li>
            <li>Your matches and messages</li>
          </ul>
          <p className="mt-3 text-xs text-faint">
            Some records may be kept as required by law, as described in the Privacy Policy. Cancel your subscription
            separately if it is billed through an app store.
          </p>
          <Field label='Type "DELETE" to confirm'>
            {(id) => <Input id={id} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className="mt-1" />}
          </Field>
          <Button
            variant="dangerSolid"
            block
            className="mt-4"
            disabled={confirm !== 'DELETE'}
            onClick={() => {
              // Phase 2: edge function deletes profile, storage objects, messages and match data.
              signOut({ forget: true });
              qc.clear();
              navigate('/', { replace: true });
            }}
          >
            <Trash2 className="size-4" /> Permanently delete
          </Button>
        </Card>
        <LogoMark className="mx-auto size-8 opacity-40" />
      </PageBody>
    </>
  );
}
