import { motion } from 'framer-motion';
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
    <motion.button
      type="button"
      role={role}
      aria-checked={selected}
      whileTap={{ scale: 0.94 }}
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors',
        size === 'sm' && 'min-h-9 px-3 text-[13px]',
        selected
          ? 'border-gold bg-gold-fill text-text shadow-[0_0_14px_-4px_rgba(217,164,65,0.55)]'
          : 'border-line bg-surface-2 text-muted hover:border-line-strong hover:text-text',
      )}
    >
      {selected && <Check className="size-3.5 text-gold" strokeWidth={2.5} aria-hidden />}
      {label}
    </motion.button>
  );
}

/** Read-only tag used on cards and profiles. `highlight` means shared with you. */
export function Tag({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[13px]',
        highlight
          ? 'border-gold/70 bg-gold-fill text-gold-light'
          : 'border-line bg-surface-2/80 text-muted',
      )}
    >
      {label}
    </span>
  );
}
