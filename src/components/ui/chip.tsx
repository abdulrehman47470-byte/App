import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Chip({
  label,
  selected,
  onToggle,
  role = 'checkbox',
  size = 'md',
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  role?: 'checkbox' | 'radio';
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.94]',
        size === 'sm' && 'min-h-9 px-3 text-[13px]',
        selected
          ? 'border-brand-gold bg-gold-fill text-text shadow-[var(--shadow-chip)]'
          : 'border-line bg-surface-2 text-muted hover:border-line-strong hover:text-text',
      )}
    >
      {selected && <Check className="size-3.5 text-gold" strokeWidth={2.5} aria-hidden />}
      {label}
    </button>
  );
}

/** Read-only tag used on cards and profiles. `highlight` means shared with you. */
/** Read-only tag. `onPhoto` = solid style for tags drawn on top of a photo. */
export function Tag({ label, highlight, onPhoto }: { label: string; highlight?: boolean; onPhoto?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[13px]',
        onPhoto
          ? 'border-brand-gold/60 bg-on-photo/95 font-medium text-gold-light'
          : highlight
            ? 'border-brand-gold/60 bg-gold-fill text-gold-light'
            : 'border-line bg-surface-2/80 text-muted',
      )}
    >
      {label}
    </span>
  );
}
