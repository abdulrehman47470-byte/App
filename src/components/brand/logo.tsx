import { cn } from '@/lib/utils';

/** Original mark: a tobacco leaf wrapped by a cigar band. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient id="ds-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold-light)" />
          <stop offset="1" stopColor="var(--gold-deep)" />
        </linearGradient>
      </defs>
      <path
        d="M32 4c11 9 16 21 13 35-1.6 7.5-6.6 13-13 17-6.4-4-11.4-9.5-13-17C16 25 21 13 32 4Z"
        stroke="url(#ds-gold)"
        strokeWidth="2.4"
      />
      <path d="M32 11v42" stroke="url(#ds-gold)" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M32 21l-7-5M32 21l7-5M32 30l-9-6M32 30l9-6M32 40l-7-5M32 40l7-5"
        stroke="url(#ds-gold)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".8"
      />
      <rect x="15" y="44" width="34" height="9" rx="2" fill="var(--bg)" stroke="url(#ds-gold)" strokeWidth="2" />
      <path d="M32 46.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3 1-2Z" fill="url(#ds-gold)" />
    </svg>
  );
}

export function Wordmark({ className, stacked = true }: { className?: string; stacked?: boolean }) {
  return (
    <span className={cn('gold-text font-serif font-semibold uppercase leading-[0.9] tracking-[0.06em]', className)}>
      Daily{stacked ? <br /> : ' '}Stogie
    </span>
  );
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: ['size-8', 'text-lg'], md: ['size-12', 'text-2xl'], lg: ['size-20', 'text-[44px]'] }[size];
  return (
    <div className="flex flex-col items-center gap-3" aria-label="Daily Stogie">
      <LogoMark className={cn(s[0], 'drop-shadow-[0_4px_18px_rgba(217,164,65,0.35)]')} />
      <Wordmark className={cn(s[1], 'text-center')} />
    </div>
  );
}
