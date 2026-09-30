import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogoMark } from '@/components/brand/logo';
import { TrustNote } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/app-shell';
import { BackButton } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useSaveMe } from '@/features/queries';
import { nextStep, useSession } from '@/lib/session';

function GoogleIcon() {
  return (
    // Google's required multi-colour "G" mark for sign-in buttons.
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="currentColor">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.5-1-2.5-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.4-.6 3.1-1.5z" />
    </svg>
  );
}

export default function SignIn() {
  const [params] = useSearchParams();
  const signup = params.get('mode') === 'signup';
  const { session, update } = useSession();
  const saveMe = useSaveMe();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();

  const finish = async (method: 'google' | 'apple' | 'email', displayName: string) => {
    // Mock: Phase 2 replaces this with Supabase Auth (OAuth + email/password with verification).
    await saveMe.mutateAsync({ name: displayName });
    const next = { ...session, signedIn: true, method };
    update({ signedIn: true, method });
    navigate(nextStep(next));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (signup && !name.trim()) return setError('Tell us your name.');
    setError(undefined);
    finish('email', name.trim() || email.split('@')[0]);
  };

  return (
    <Frame>
      <div className="flex min-h-dvh flex-col px-6 pb-8 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex min-h-11 items-center">
          <BackButton to="/" />
        </div>
        <div className="mt-4 text-center">
          <LogoMark className="mx-auto size-12" />
          <h1 className="mt-4 font-serif text-[32px] leading-tight text-text">{signup ? 'Join the lounge' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-muted">{signup ? 'Create your members-only account' : 'Sign in to your account'}</p>
        </div>

        <div className="mt-8 space-y-3">
          <Button variant="secondary" size="lg" block onClick={() => finish('google', 'Google Member')}>
            <GoogleIcon /> Continue with Google
          </Button>
          <Button variant="secondary" size="lg" block onClick={() => finish('apple', 'Apple Member')}>
            <AppleIcon /> Continue with Apple
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-faint">
          <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {signup && (
            <Field label="Name">
              {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" />}
            </Field>
          )}
          <Field label="Email address">
            {(id) => (
              <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
            )}
          </Field>
          <Field
            label="Password"
            error={error}
            aside={
              !signup && (
                <button type="button" className="text-xs text-gold hover:underline" onClick={() => setError('Password reset arrives in Phase 2.')}>
                  Forgot password?
                </button>
              )
            }
          >
            {(id, d) => (
              <div className="relative">
                <Input
                  id={id}
                  aria-describedby={d}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={signup ? 'new-password' : 'current-password'}
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
            )}
          </Field>
          <Button type="submit" size="lg" block>
            {signup ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {signup ? 'Already a member? ' : "Don't have an account? "}
          <Link to={signup ? '/signin' : '/signin?mode=signup'} className="font-semibold text-gold hover:underline">
            {signup ? 'Log in' : 'Sign up'}
          </Link>
        </p>
        <TrustNote className="mt-auto pt-8" />
      </div>
    </Frame>
  );
}
