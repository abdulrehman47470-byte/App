import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, CircleUserRound, UserPlus, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { storage } from '@/lib/storage';

/**
 * MOCK "Sign in with Google" for Phase 0. It mirrors the real flow (email -> consent -> back to
 * the app, with an account chooser for returning users) but never asks for a password and sends
 * nothing to Google. Phase 2 replaces it with Supabase Auth's real Google OAuth.
 */

export interface MockGoogleAccount {
  name: string;
  email: string;
}

const ACCOUNTS_KEY = 'ds.mockGoogleAccounts';

export function GoogleG({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

const nameFromEmail = (email: string) =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ') || 'Member';

const AVATAR_COLORS = ['#1a73e8', '#188038', '#d93025', '#e37400', '#8430ce', '#007b83'];
function Initial({ account, size = 32 }: { account: MockGoogleAccount; size?: number }) {
  const color = AVATAR_COLORS[account.email.length % AVATAR_COLORS.length];
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-medium text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.45 }}>
      {account.name[0]?.toUpperCase()}
    </span>
  );
}

type Step = 'choose' | 'email' | 'consent' | 'working';

export function GoogleSignInMock({
  open,
  onOpenChange,
  onSignedIn,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSignedIn: (account: MockGoogleAccount) => void;
}) {
  const [accounts, setAccounts] = useState<MockGoogleAccount[]>([]);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [account, setAccount] = useState<MockGoogleAccount | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const saved = storage.get<MockGoogleAccount[]>(ACCOUNTS_KEY) ?? [];
    setAccounts(saved);
    setStep(saved.length ? 'choose' : 'email');
    setEmail('');
    setError('');
    setAccount(null);
  }, [open]);

  useEffect(() => {
    if (step === 'email') setTimeout(() => input.current?.focus(), 50);
  }, [step]);

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return setError('Enter an email or phone number');
    if (!/^\S+@\S+\.\S+$/.test(v) && !/^\+?[\d\s-]{7,}$/.test(v)) return setError('Couldn’t find your Google Account');
    const existing = accounts.find((a) => a.email.toLowerCase() === v.toLowerCase());
    setAccount(existing ?? { email: v, name: v.includes('@') ? nameFromEmail(v) : 'Member' });
    setStep('consent');
  };

  const confirm = () => {
    if (!account) return;
    setStep('working');
    const next = [account, ...accounts.filter((a) => a.email !== account.email)].slice(0, 4);
    storage.set(ACCOUNTS_KEY, next);
    setTimeout(() => {
      onSignedIn(account);
      onOpenChange(false);
    }, 700);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60" />
        <Dialog.Content className="gmock fixed inset-x-3 top-1/2 z-[80] mx-auto max-w-[448px] -translate-y-1/2 overflow-hidden rounded-[8px] focus:outline-none sm:inset-x-0">
          {/* thin progress bar like Google's */}
          <div className="h-1 overflow-hidden">{step === 'working' && <div className="gmock-progress h-full w-1/3" />}</div>

          <div className="flex items-center gap-2 border-b px-6 py-3 text-sm" style={{ borderColor: 'var(--g-line)' }}>
            <GoogleG className="size-[18px]" />
            <span style={{ color: 'var(--g-text-2)' }}>Sign in with Google</span>
            <Dialog.Close className="ml-auto grid size-8 place-items-center rounded-full hover:bg-black/5" aria-label="Close">
              <X className="size-4" style={{ color: 'var(--g-text-2)' }} />
            </Dialog.Close>
          </div>

          <div className="px-6 pb-6 pt-8 sm:px-10">
            {step === 'choose' && (
              <>
                <Dialog.Title className="text-[24px] font-normal" style={{ color: 'var(--g-text)' }}>
                  Choose an account
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-base" style={{ color: 'var(--g-text)' }}>
                  to continue to <span style={{ color: 'var(--g-blue)' }}>Daily Stogie</span>
                </Dialog.Description>
                <ul className="-mx-6 mt-6 border-t sm:-mx-10" style={{ borderColor: 'var(--g-line)' }}>
                  {accounts.map((a) => (
                    <li key={a.email} className="border-b" style={{ borderColor: 'var(--g-line)' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAccount(a);
                          setStep('consent');
                        }}
                        className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-black/[0.04] sm:px-10"
                      >
                        <Initial account={a} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium" style={{ color: 'var(--g-text)' }}>{a.name}</span>
                          <span className="block truncate text-sm" style={{ color: 'var(--g-text-2)' }}>{a.email}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                  <li className="border-b" style={{ borderColor: 'var(--g-line)' }}>
                    <button type="button" onClick={() => setStep('email')} className="flex w-full items-center gap-3 px-6 py-3 text-left text-sm font-medium hover:bg-black/[0.04] sm:px-10" style={{ color: 'var(--g-text)' }}>
                      <CircleUserRound className="size-8 p-1" style={{ color: 'var(--g-text-2)' }} strokeWidth={1.5} /> Use another account
                    </button>
                  </li>
                </ul>
              </>
            )}

            {step === 'email' && (
              <form onSubmit={submitEmail} noValidate>
                <Dialog.Title className="text-[24px] font-normal" style={{ color: 'var(--g-text)' }}>
                  Sign in
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-base" style={{ color: 'var(--g-text)' }}>
                  to continue to <span style={{ color: 'var(--g-blue)' }}>Daily Stogie</span>
                </Dialog.Description>
                <div className="mt-7">
                  <div className={`gmock-field ${error ? 'is-error' : ''}`}>
                    <input
                      ref={input}
                      id="gmock-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder=" "
                      aria-invalid={!!error}
                      aria-describedby={error ? 'gmock-err' : undefined}
                    />
                    <label htmlFor="gmock-email">Email or phone</label>
                  </div>
                  {error && (
                    <p id="gmock-err" role="alert" className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--g-red)' }}>
                      <span className="grid size-4 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--g-red)' }}>!</span>
                      {error}
                    </p>
                  )}
                  <button type="button" className="mt-2 text-sm font-medium" style={{ color: 'var(--g-blue)' }} onClick={() => setError('Demo: account recovery is not available')}>
                    Forgot email?
                  </button>
                </div>
                <p className="mt-8 text-sm" style={{ color: 'var(--g-text-2)' }}>
                  Not your computer? Use a private browsing window to sign in.
                </p>
                <div className="mt-8 flex items-center justify-between">
                  <button type="button" onClick={() => setStep('email')} className="flex items-center gap-1 rounded px-2 py-2 text-sm font-medium hover:bg-[var(--g-blue-soft)]" style={{ color: 'var(--g-blue)' }}>
                    <UserPlus className="size-4" /> Create account
                  </button>
                  <button type="submit" className="rounded-full px-6 py-2 text-sm font-medium text-white shadow-sm" style={{ background: 'var(--g-blue)' }}>
                    Next
                  </button>
                </div>
              </form>
            )}

            {(step === 'consent' || step === 'working') && account && (
              <>
                <div className="flex flex-col items-center text-center">
                  <Dialog.Title className="text-[24px] font-normal" style={{ color: 'var(--g-text)' }}>
                    Sign in to Daily Stogie
                  </Dialog.Title>
                  <button type="button" onClick={() => setStep(accounts.length ? 'choose' : 'email')} className="mt-4 flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm" style={{ borderColor: 'var(--g-line-strong)', color: 'var(--g-text)' }}>
                    <Initial account={account} size={24} /> {account.email} <ChevronDown className="size-4" />
                  </button>
                </div>
                <Dialog.Description className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--g-text)' }}>
                  Google will allow Daily Stogie to access this info about you:
                </Dialog.Description>
                <ul className="mt-3 space-y-3 text-sm" style={{ color: 'var(--g-text)' }}>
                  <li className="flex items-center gap-3">
                    <Initial account={account} size={28} />
                    <span>
                      {account.name}
                      <span className="block text-xs" style={{ color: 'var(--g-text-2)' }}>Name and profile picture</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full" style={{ background: 'var(--g-blue-soft)', color: 'var(--g-blue)' }}>@</span>
                    <span>
                      {account.email}
                      <span className="block text-xs" style={{ color: 'var(--g-text-2)' }}>Email address</span>
                    </span>
                  </li>
                </ul>
                <p className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--g-text-2)' }}>
                  Review Daily Stogie’s Privacy Policy and Terms of Service to understand how it will use your data.
                </p>
                <div className="mt-8 flex justify-end gap-2">
                  <Dialog.Close className="rounded-full px-5 py-2 text-sm font-medium hover:bg-[var(--g-blue-soft)]" style={{ color: 'var(--g-blue)' }} disabled={step === 'working'}>
                    Cancel
                  </Dialog.Close>
                  <button type="button" onClick={confirm} disabled={step === 'working'} className="rounded-full px-6 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-70" style={{ background: 'var(--g-blue)' }}>
                    {step === 'working' ? 'Signing in…' : 'Continue'}
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="border-t px-6 py-3 text-center text-[11px]" style={{ borderColor: 'var(--g-line)', color: 'var(--g-text-2)' }}>
            Demo sign-in: no password needed and nothing is sent to Google.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
