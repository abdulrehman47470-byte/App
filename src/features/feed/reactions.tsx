import { ThumbsUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { ReactionType } from '@/types';

export const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-info' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'text-danger' },
  { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-warning' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-warning' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-warning' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-ember' },
  { type: 'fire', emoji: '🔥', label: 'Lit', color: 'text-ember' },
];
const byType = Object.fromEntries(REACTIONS.map((r) => [r.type, r])) as Record<ReactionType, (typeof REACTIONS)[number]>;

/**
 * Like button with a reaction picker. Tapping it opens the full set of reactions; pick one to react,
 * or tap your current reaction again to remove it. Escape or tapping outside closes the picker.
 */
export function ReactionButton({ value, onReact }: { value?: ReactionType; onReact: (r: ReactionType | null) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = value ? byType[value] : undefined;

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const pick = (r: ReactionType) => {
    onReact(value === r ? null : r);
    setOpen(false);
    navigator.vibrate?.(10);
  };

  return (
    <div ref={wrap} className="relative">
      {open && (
        <div role="menu" aria-label="Choose a reaction" className="reaction-picker absolute bottom-[calc(100%+6px)] left-1 z-30 flex gap-0.5 rounded-full border border-line bg-surface px-2 py-1.5 shadow-[0_10px_30px_-8px_rgba(59,36,18,0.35)]">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              role="menuitem"
              aria-label={value === r.type ? `Remove ${r.label}` : r.label}
              title={r.label}
              onClick={() => pick(r.type)}
              className={cn('reaction-emoji grid size-10 place-items-center rounded-full text-[26px] leading-none', value === r.type && 'bg-gold-fill')}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-pressed={!!value}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={current ? `Reacted ${current.label}. Change reaction` : 'React to this post'}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-12 w-full select-none items-center justify-center gap-1.5 text-[13px] font-medium transition-colors hover:bg-surface-2',
          current ? `${current.color} font-semibold` : 'text-muted hover:text-text',
        )}
      >
        {current ? <span className="text-lg leading-none">{current.emoji}</span> : <ThumbsUp className="size-5" strokeWidth={1.75} />}
        {current ? current.label : 'Like'}
      </button>
    </div>
  );
}

/** Top reactions + total. Tap to see the breakdown. */
export function ReactionSummary({ reactions }: { reactions: Partial<Record<ReactionType, number>> }) {
  const [open, setOpen] = useState(false);
  const entries = (Object.entries(reactions) as [ReactionType, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((n, [, c]) => n + c, 0);
  if (!total) return <span />;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 hover:underline" aria-label={`${total} reactions. Show details`}>
        <span className="flex -space-x-1">
          {entries.slice(0, 3).map(([t]) => (
            <span key={t} className="grid size-5 place-items-center rounded-full border-2 border-surface bg-surface-2 text-[11px] leading-none">
              {byType[t].emoji}
            </span>
          ))}
        </span>
        {total}
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Reactions" description={`${total} people reacted to this post`}>
        <ul className="grid grid-cols-2 gap-2 pb-2">
          {entries.map(([t, n]) => (
            <li key={t} className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-2 px-3 py-2.5">
              <span className="text-2xl leading-none">{byType[t].emoji}</span>
              <span className="flex-1 text-sm text-text">{byType[t].label}</span>
              <span className="font-semibold tabular-nums text-text">{n}</span>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
