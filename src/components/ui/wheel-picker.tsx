import { useEffect, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

const ITEM = 44;

/** iOS-style scroll wheel for numbers (used for Age). Scroll, swipe or use arrow keys. */
export function WheelPicker({
  value,
  onChange,
  min,
  max,
  label,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: (value - min) * ITEM, behavior: 'smooth' });
  }, [value, min]);

  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const v = Math.min(max, Math.max(min, min + Math.round(el.scrollTop / ITEM)));
      if (v !== value) onChange(v);
    }, 90);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') onChange(Math.max(min, value - 1));
    else if (e.key === 'ArrowDown') onChange(Math.min(max, value + 1));
    else return;
    e.preventDefault();
  };

  return (
    <div className={cn('relative h-[132px] overflow-hidden rounded-[14px] border border-line bg-bg-elevated', disabled && 'opacity-70')}>
      <div aria-hidden className="pointer-events-none absolute inset-x-3 top-1/2 h-11 -translate-y-1/2 rounded-[10px] border border-gold/60 bg-gold-fill" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-bg-elevated to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-bg-elevated to-transparent" />
      <div
        ref={ref}
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-readonly={disabled}
        onKeyDown={disabled ? undefined : onKey}
        onScroll={disabled ? undefined : onScroll}
        className={cn('scrollbar-none h-full snap-y snap-mandatory py-[44px]', disabled ? 'overflow-hidden' : 'overflow-y-auto')}
      >
        {items.map((n) => (
          <div
            key={n}
            className={cn(
              'flex h-11 snap-center items-center justify-center font-serif transition-all',
              n === value ? 'text-2xl text-gold-light' : 'text-lg text-faint',
            )}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}
