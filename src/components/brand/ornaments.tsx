import { BadgeCheck, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { userTypeLabel } from '@/data/options';
import { cn } from '@/lib/utils';
import type { UserType } from '@/types';
import { Avatar } from './portrait';

/** Circular gold ring showing match %. */
export function MatchRing({ pct, size = 56, className }: { pct: number; size?: number; className?: string }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn('relative grid place-items-center rounded-full bg-bg/70 backdrop-blur-sm', className)}
      style={{ width: size, height: size }}
      aria-label={`${pct}% match`}
      role="img"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth="3" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--gold)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <div className="text-center leading-none">
        <div className="font-serif font-semibold text-gold-light" style={{ fontSize: Math.round(size * 0.28) }}>
          {pct}%
        </div>
        {size >= 58 && <div className="mt-0.5 text-[8px] uppercase tracking-[0.14em] text-muted">match</div>}
      </div>
    </div>
  );
}

/** Avatar with a profile-completeness ring around it. */
export function CompletenessAvatar({ name, hue, pct, size = 96, src }: { name: string; hue: number; pct: number; size?: number; src?: string }) {
  const outer = size + 16;
  const r = outer / 2 - 3;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: outer, height: outer }}>
      <svg width={outer} height={outer} className="absolute -rotate-90" aria-hidden>
        <circle cx={outer / 2} cy={outer / 2} r={r} stroke="var(--surface-2)" strokeWidth="4" fill="none" />
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={r}
          stroke="var(--gold)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <Avatar name={name} hue={hue} size={size} src={src} />
      <span className="gold-gradient absolute -bottom-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-gold-ink">{pct}%</span>
    </div>
  );
}

export function VerifiedBadge({ className, label = 'Photo verified' }: { className?: string; label?: string }) {
  return (
    <BadgeCheck
      className={cn('size-5 shrink-0 fill-gold text-bg', className)}
      strokeWidth={2}
      aria-label={label}
      role="img"
    />
  );
}

export function UserTypeBadge({ type, className }: { type?: UserType; className?: string }) {
  if (!type) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-gold/50 bg-bg/60 px-2.5 py-0.5 text-xs font-semibold text-gold-light backdrop-blur-sm',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
        <rect x="1" y="6" width="14" height="4" rx="2" fill="currentColor" opacity=".35" />
        <rect x="5" y="5" width="4" height="6" rx="1" fill="currentColor" />
      </svg>
      {userTypeLabel(type)}
    </span>
  );
}

/** Section divider styled like a cigar band. */
export function CigarBand({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-2', className)} role="separator">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line-strong" />
      <span className="flex items-center gap-2 rounded-[4px] border border-gold/50 bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
        <span className="size-1 rotate-45 bg-gold" />
        {label ?? 'Daily Stogie'}
        <span className="size-1 rotate-45 bg-gold" />
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line-strong" />
    </div>
  );
}

export function TrustNote({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center justify-center gap-1.5 text-xs text-faint', className)}>
      <span className="rounded-full border border-danger/50 px-1.5 text-[10px] font-bold text-danger">21+</span>
      {children ?? 'Members only. Adults 21 and over.'}
    </p>
  );
}

export function SafetyBanner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 rounded-[14px] border border-line bg-surface-2/60 px-3.5 py-2.5 text-xs text-muted', className)}>
      <ShieldAlert className="size-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
      Meet in public places like licensed cigar lounges.
    </div>
  );
}
