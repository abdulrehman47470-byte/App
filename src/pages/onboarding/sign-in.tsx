import { ArrowRight, ChevronLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LogoMark } from '@/components/brand/logo';
import { TrustNote } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/frame';
import { BackButton } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { DEMO_ENABLED } from '@/config/features';
import { AppleLogo } from '@/features/auth/apple-signin-mock';
import { GoogleG } from '@/features/auth/google-signin-mock';
import { useSignIn } from '@/features/auth/use-social-sign-in';
import { DEMO_EMAIL, findAccount, isEmail, nameFromEmail, normalizeEmail } from '@/lib/accounts';
import { cn } from '@/lib/utils';

type Step = 'email' | 'create';

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const STRENGTH = ['Too short', 'Fair', 'Good', 'Strong', 'Very strong'];

/**
 * Continue with Email. Email first: a returning member goes straight in; a new email creates an
 * account (name + password). Mock auth: Phase 2 swaps in Supabase Auth with email verification.
 */
export default function SignIn() {
  const auth = useSignIn();
  const signup = useSearchParams()[0].get('mode') === 'signup';
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError('Enter a valid email address.');
    setError(undefined);
    setChecking(true);
    await new Promise((r) => setTimeout(r, 450)); // feels like a real account lookup
    const account = findAccount(email);
    setChecking(false);
    if (account) return auth.finish({ name: account.name, email: account.email }, account.method);
    setName(nameFromEmail(email));
    setStep('create');
  };

  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Tell us your name.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    setError(undefined);
    auth.finish({ name: name.trim(), email: normalizeEmail(email) }, 'email');
  };

  const level = strength(password);

  return (
    <Frame>
      <div className="welcome-bg flex min-h-dvh flex-col px-6 pb-8 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex min-h-11 items-center">
          {step === 'create' ? (
            <button type="button" onClick={() => (setStep('email'), setError(undefined))} aria-label="Back" className="-ml-2 grid size-11 place-items-center rounded-full text-text transition-colors hover:bg-surface-2">
              <ChevronLeft className="size-6" strokeWidth={1.5} />
            </button>
          ) : (
            <BackButton to="/" />
          )}
        </div>
        <div className="mx-auto w-full max-w-[380px] flex-1">
          <div className="mt-4 text-center">
            <LogoMark className="mx-auto size-14" />
            <h1 className="mt-4 font-serif text-[30px] leading-tight text-text">{step === 'email' ? (signup ? 'Sign up with email' : 'Sign in with email') : 'Create your account'}</h1>
            <p className="mt-1 text-sm text-muted">
              {step === 'email' ? (signup ? 'Enter your email to create your account.' : 'Welcome back. Enter your email to continue.') : (
                <>
                  for <strong className="font-semibold text-text">{normalizeEmail(email)}</strong>{' '}
                  <button type="button" className="font-medium text-gold hover:underline" onClick={() => (setStep('email'), setError(undefined))}>
                    Change
                  </button>
                </>
              )}
            </p>
          </div>

          {step === 'email' ? (
            <form key="email" onSubmit={submitEmail} className="page-enter mt-8 space-y-4" noValidate>
              <Field label="Email address" error={error}>
                {(id, d) => (
                  <Input
                    id={id}
                    aria-describedby={d}
                    type="email"
                    inputMode="email"
                    autoFocus
                    value={email}
                    onChange={(e) => (setEmail(e.target.value), setError(undefined))}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                )}
              </Field>
              <Button type="submit" size="lg" block disabled={checking || auth.busy}>
                {checking ? <Loader2 className="size-5 animate-spin" /> : <ArrowRight className="size-5" />} {checking ? 'Checking…' : 'Continue'}
              </Button>
              {DEMO_ENABLED && (
                <p className="text-center text-xs text-faint">
                  Returning member demo:{' '}
                  <button type="button" onClick={() => (setEmail(DEMO_EMAIL), setError(undefined))} className="font-medium text-gold underline decoration-dotted underline-offset-4">
                    {DEMO_EMAIL}
                  </button>
                </p>
              )}
            </form>
          ) : (
            <form key="create" onSubmit={submitCreate} className="page-enter mt-8 space-y-4" noValidate>
              <Field label="Your name">
                {(id) => <Input id={id} value={name} onChange={(e) => (setName(e.target.value), setError(undefined))} autoComplete="name" autoFocus maxLength={60} />}
              </Field>
              <Field label="Create a password" error={error}>
                {(id, d) => (
                  <div>
                    <div className="relative">
                      <Input
                        id={id}
                        aria-describedby={d}
                        type={show ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => (setPassword(e.target.value), setError(undefined))}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        aria-label={show ? 'Hide password' : 'Show password'}
                        className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-muted hover:text-text"
                      >
                        {show ? <EyeOff className="size-5" strokeWidth={1.5} /> : <Eye className="size-5" strokeWidth={1.5} />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2 flex items-center gap-2" aria-live="polite">
                        <div className="grid flex-1 grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <span key={i} className={cn('h-1 rounded-full transition-colors', i <= level ? (level < 2 ? 'bg-danger' : level < 3 ? 'bg-warning' : 'bg-success') : 'bg-line')} />
                          ))}
                        </div>
                        <span className="w-20 text-right text-[11px] text-muted">{STRENGTH[level]}</span>
                      </div>
                    )}
                  </div>
                )}
              </Field>
              <Button type="submit" size="lg" block disabled={auth.busy}>
                Create account
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-faint">Next you’ll confirm your age and verify your identity. Daily Stogie is for adults 21+.</p>
            </form>
          )}

          {step === 'email' && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-faint">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={auth.openGoogle}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-line-strong bg-white text-[15px] font-semibold text-text transition-colors hover:bg-surface-2"
                >
                  <GoogleG /> Continue with Google
                </button>
                <button type="button" onClick={auth.openApple} className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] bg-black text-[15px] font-semibold text-white transition-opacity hover:opacity-90">
                  <AppleLogo /> Continue with Apple
                </button>
              </div>
            </>
          )}
        </div>
        <TrustNote className="pt-8" />
      </div>
      {auth.ui}
    </Frame>
  );
}
