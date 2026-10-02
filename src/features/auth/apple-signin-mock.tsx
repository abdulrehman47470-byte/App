import * as Dialog from '@radix-ui/react-dialog';
import { Check, ScanFace, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { findAccount, isEmail, nameFromEmail } from '@/lib/accounts';
import { storage } from '@/lib/storage';

/**
 * MOCK "Sign in with Apple" for Phase 0. Mirrors Apple's sheet (Apple ID → share or hide email →
 * Face ID) but never asks for a password and contacts no Apple server. Phase 2 swaps in real
 * Apple OAuth through Supabase Auth.
 */

export interface MockAppleAccount {
  name: string;
  email: string;
}

const APPLE_IDS_KEY = 'ds.mockAppleIds';
const FONT = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' };

export function AppleLogo({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.5-1-2.5-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.4-.6 3.1-1.5z" />
    </svg>
  );
}

/** Stable "Hide My Email" relay address for an Apple ID, so returning sign-ins match. */
function relayFor(appleId: string) {
  let h = 2166136261;
  for (const c of appleId.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return `${(h >>> 0).toString(36)}${appleId.length.toString(36)}x@privaterelay.appleid.com`;
}

type Step = 'id' | 'share' | 'returning' | 'faceid' | 'done';

export function AppleSignInMock({ open, onOpenChange, onSignedIn }: { open: boolean; onOpenChange: (v: boolean) => void; onSignedIn: (a: MockAppleAccount) => void }) {
  const [step, setStep] = useState<Step>('id');
  const [appleId, setAppleId] = useState('');
  const [name, setName] = useState('');
  const [hide, setHide] = useState(false);
  const [error, setError] = useState('');
  const [known, setKnown] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const saved = storage.get<string[]>(APPLE_IDS_KEY) ?? [];
    setKnown(saved);
    setAppleId(saved[0] ?? '');
    setStep('id');
    setError('');
    setHide(false);
  }, [open]);

  const email = hide ? relayFor(appleId) : appleId.trim().toLowerCase();

  const submitId = (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(appleId)) return setError('Enter the email address of your Apple ID.');
    setError('');
    // Already signed up with this Apple ID (either email choice)? Apple only asks to confirm.
    const existing = findAccount(appleId) ?? findAccount(relayFor(appleId));
    if (existing) {
      setHide(existing.email !== appleId.trim().toLowerCase());
      setName(existing.name);
      setStep('returning');
    } else {
      setName(nameFromEmail(appleId));
      setStep('share');
    }
  };

  const authorize = () => {
    setStep('faceid');
    storage.set(APPLE_IDS_KEY, [appleId.trim().toLowerCase(), ...known.filter((k) => k !== appleId.trim().toLowerCase())].slice(0, 3));
    window.setTimeout(() => setStep('done'), 1100);
    window.setTimeout(() => {
      onSignedIn({ name: name.trim() || 'Member', email });
      onOpenChange(false);
    }, 1700);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => step !== 'faceid' && step !== 'done' && onOpenChange(v)}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-[80] bg-black/50" />
        <Dialog.Content
          style={FONT}
          className="sheet-content fixed inset-x-0 bottom-0 z-[80] mx-auto max-w-[420px] overflow-hidden rounded-t-[14px] bg-white pb-[max(20px,env(safe-area-inset-bottom))] text-black focus:outline-none sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[14px]"
        >
          <div className="flex items-center justify-between px-4 pt-3">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
              <AppleLogo className="size-[18px]" /> Sign in with Apple
            </span>
            {step !== 'faceid' && step !== 'done' && (
              <Dialog.Close className="grid size-8 place-items-center rounded-full bg-black/[0.06] text-black/60 hover:bg-black/10" aria-label="Close">
                <X className="size-4" strokeWidth={2.5} />
              </Dialog.Close>
            )}
          </div>

          <div className="px-6 pb-2 pt-6">
            {step === 'id' && (
              <form onSubmit={submitId} noValidate>
                <div className="mx-auto grid size-16 place-items-center rounded-[16px] bg-black text-white">
                  <AppleLogo className="size-9" />
                </div>
                <Dialog.Title className="mt-4 text-center text-[22px] font-semibold tracking-tight">Use your Apple ID</Dialog.Title>
                <Dialog.Description className="mt-1 text-center text-[15px] text-black/60">to sign in to Daily Stogie</Dialog.Description>
                <label htmlFor="apple-id" className="sr-only">
                  Apple ID
                </label>
                <input
                  ref={input}
                  id="apple-id"
                  type="email"
                  autoFocus
                  autoComplete="username"
                  value={appleId}
                  onChange={(e) => (setAppleId(e.target.value), setError(''))}
                  placeholder="Apple ID (email)"
                  aria-invalid={!!error}
                  className="mt-6 h-12 w-full rounded-[10px] border border-black/15 px-4 text-[17px] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15"
                />
                {error && (
                  <p role="alert" className="mt-2 text-[13px] text-[#e30000]">
                    {error}
                  </p>
                )}
                <button type="submit" className="mt-5 h-12 w-full rounded-[10px] bg-black text-[17px] font-semibold text-white active:opacity-80">
                  Continue
                </button>
                <p className="mt-4 text-center text-[12px] text-black/45">Demo sign-in: no password is asked and nothing is sent to Apple.</p>
              </form>
            )}

            {step === 'share' && (
              <div>
                <Dialog.Title className="text-center text-[22px] font-semibold leading-tight tracking-tight">Create an account for Daily Stogie using your Apple ID</Dialog.Title>
                <Dialog.Description className="mt-1 text-center text-[13px] text-black/50">{appleId}</Dialog.Description>
                <div className="mt-5 overflow-hidden rounded-[12px] bg-black/[0.04]">
                  <label className="flex items-center gap-3 border-b border-black/10 px-4 py-3">
                    <span className="w-14 text-[13px] text-black/50">Name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-label="Name" className="min-w-0 flex-1 bg-transparent text-[17px] outline-none" />
                  </label>
                  <fieldset>
                    <legend className="sr-only">Email</legend>
                    {[
                      { value: false, label: 'Share My Email', sub: appleId },
                      { value: true, label: 'Hide My Email', sub: `Forward to: ${appleId}` },
                    ].map((o) => (
                      <label key={o.label} className="flex cursor-pointer items-center gap-3 border-b border-black/10 px-4 py-3 last:border-0">
                        <input type="radio" name="apple-email" checked={hide === o.value} onChange={() => setHide(o.value)} className="sr-only" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px]">{o.label}</span>
                          <span className="block truncate text-[13px] text-black/50">{o.sub}</span>
                        </span>
                        <span className={`grid size-6 place-items-center rounded-full ${hide === o.value ? 'bg-[#0071e3] text-white' : 'border border-black/20'}`}>{hide === o.value && <Check className="size-4" strokeWidth={3} />}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
                <button type="button" onClick={authorize} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-black text-[17px] font-semibold text-white active:opacity-80">
                  <ScanFace className="size-5" /> Continue with Face ID
                </button>
                <button type="button" onClick={() => setStep('id')} className="mt-3 h-10 w-full text-[15px] text-[#0071e3]">
                  Use a different Apple ID
                </button>
              </div>
            )}

            {step === 'returning' && (
              <div className="text-center">
                <Dialog.Title className="text-[22px] font-semibold tracking-tight">Continue as {name}?</Dialog.Title>
                <Dialog.Description className="mt-1 text-[15px] text-black/60">You signed up for Daily Stogie with this Apple ID ({appleId}).</Dialog.Description>
                <button type="button" onClick={authorize} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-black text-[17px] font-semibold text-white active:opacity-80">
                  <ScanFace className="size-5" /> Continue with Face ID
                </button>
                <button type="button" onClick={() => setStep('id')} className="mt-3 h-10 w-full text-[15px] text-[#0071e3]">
                  Use a different Apple ID
                </button>
              </div>
            )}

            {(step === 'faceid' || step === 'done') && (
              <div className="flex flex-col items-center py-6" role="status" aria-live="polite">
                <Dialog.Title className="sr-only">Signing in with Apple</Dialog.Title>
                <span className={`grid size-20 place-items-center rounded-[22px] transition-colors duration-300 ${step === 'done' ? 'bg-[#34c759] text-white' : 'bg-black/[0.05] text-[#0071e3]'}`}>
                  {step === 'done' ? <Check className="size-10" strokeWidth={3} /> : <ScanFace className="size-11 animate-pulse" strokeWidth={1.5} />}
                </span>
                <p className="mt-4 text-[17px] font-semibold">{step === 'done' ? 'Done' : 'Face ID'}</p>
                <p className="mt-1 text-[13px] text-black/50">{step === 'done' ? 'Signing in to Daily Stogie…' : 'Look at your device'}</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
