import { m } from 'framer-motion';
import { Search } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn('skeleton rounded-[14px]', className)} />
);

export function Badge({
  children,
  tone = 'gold',
  className,
}: {
  children: ReactNode;
  tone?: 'gold' | 'solid' | 'success' | 'danger' | 'warning' | 'muted';
  className?: string;
}) {
  const tones = {
    gold: 'border-gold/50 bg-gold-fill text-gold-light',
    solid: 'border-transparent gold-gradient text-gold-ink',
    success: 'border-success/40 bg-success/15 text-success',
    danger: 'border-danger/40 bg-danger/15 text-danger',
    warning: 'border-warning/40 bg-warning/15 text-warning',
    muted: 'border-line bg-surface-2 text-muted',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <m.div
        className="gold-gradient h-full rounded-full"
        initial={false}
        animate={{ width: `${Math.max(4, value * 100)}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

export function SearchInput({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
        strokeWidth={1.5}
      />
      <input
        type="search"
        className="h-11 w-full rounded-[14px] border border-line bg-bg-elevated pl-10 pr-4 text-[15px] text-text placeholder:text-faint hover:border-line-strong focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
        {...p}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex rounded-[14px] border border-line bg-bg-elevated p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative h-10 flex-1 rounded-[10px] text-sm font-medium transition-colors',
              active ? 'text-gold-ink' : 'text-muted hover:text-text',
            )}
          >
            {active && (
              <m.span
                layoutId={`seg-${label}`}
                className="gold-gradient absolute inset-0 rounded-[10px]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('surface rounded-[20px]', className)}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="micro-label">{children}</h2>
      {action}
    </div>
  );
}
