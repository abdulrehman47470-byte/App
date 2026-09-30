import { animate, AnimatePresence, motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from 'framer-motion';
import { Heart, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiscoverTabs } from '@/features/discover/discover-tabs';
import { EmptyState } from '@/components/brand/empty-state';
import { PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { activeFilterCount, DEFAULT_FILTERS, FilterSheet } from '@/features/discover/filter-sheet';
import { MemberCardFace } from '@/features/discover/member-card';
import { useLikeFlow } from '@/features/discover/use-like';
import { useDiscover, useMe } from '@/features/queries';
import { SafetySheet } from '@/features/safety/safety-sheet';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import type { DiscoverCard, DiscoverFilters } from '@/types';

const THRESHOLD = 110;

export default function Discover() {
  const [filters, setFilters] = useState<DiscoverFilters>(() => storage.get('ds.filters') ?? DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data, isLoading } = useDiscover(filters);
  const { data: me } = useMe();
  const { like, overlay } = useLikeFlow();
  const navigate = useNavigate();

  const [stack, setStack] = useState<DiscoverCard[]>([]);
  const [lastPassed, setLastPassed] = useState<DiscoverCard | null>(null);
  const [safetyFor, setSafetyFor] = useState<DiscoverCard | null>(null);
  const [announce, setAnnounce] = useState('');
  const x = useMotionValue(0);

  useEffect(() => {
    if (data) setStack(data);
  }, [data]);

  const top = stack[0];

  const commit = useCallback(
    async (dir: 'like' | 'pass') => {
      if (!top) return;
      setStack((s) => s.slice(1));
      x.set(0);
      if (dir === 'pass') {
        setLastPassed(top);
        setAnnounce(`Passed on ${top.member.name}.`);
        await api.pass(top.member.id);
      } else {
        setLastPassed(null);
        setAnnounce(`Liked ${top.member.name}.`);
        await like(top.member.id);
      }
    },
    [top, like, x],
  );

  const fling = useCallback(
    async (dir: 'like' | 'pass') => {
      if (!top) return;
      await animate(x, dir === 'like' ? 520 : -520, { duration: 0.28, ease: 'easeIn' });
      commit(dir);
    },
    [top, x, commit],
  );

  const undo = async () => {
    if (!lastPassed) return;
    await api.undoPass(lastPassed.member.id);
    setStack((s) => [lastPassed, ...s]);
    setAnnounce(`Brought back ${lastPassed.member.name}.`);
    setLastPassed(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [role="dialog"], [role="alertdialog"]')) return;
      if (e.key === 'ArrowRight') fling('like');
      else if (e.key === 'ArrowLeft') fling('pass');
      else if (e.key.toLowerCase() === 'u') undo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const applyFilters = (f: DiscoverFilters) => {
    setFilters(f);
    storage.set('ds.filters', f);
  };
  const nFilters = activeFilterCount(filters);

  return (
    <>
      <PageHeader
        title="Discover"
        large
        subtitle={me?.city ? `Near ${me.city}` : undefined}
        action={
          <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(true)} aria-label={`Filters${nFilters ? `, ${nFilters} active` : ''}`}>
            <SlidersHorizontal className="size-4" strokeWidth={1.5} /> Filters
            {nFilters > 0 && <span className="gold-gradient grid size-5 place-items-center rounded-full text-[11px] font-bold text-gold-ink">{nFilters}</span>}
          </Button>
        }
      />
      <DiscoverTabs />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <section aria-label="Member cards. Use the left and right arrow keys to pass or like, U to undo." className="px-4 pt-4">
        <div className="relative mx-auto h-[min(64dvh,560px)] min-h-[420px]">
          {isLoading || !data ? (
            <Skeleton className="absolute inset-0 rounded-[24px]" />
          ) : !top ? (
            <div className="surface absolute inset-0 grid place-items-center rounded-[24px]">
              <EmptyState
                illustration="humidor"
                title="You're all caught up"
                body="No more members match your filters right now. Widen your filters or check back soon."
                action={
                  <Button variant="outline" onClick={() => setFiltersOpen(true)}>
                    Adjust filters
                  </Button>
                }
              />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {stack.slice(0, 3).map((c, i) => (i === 0 ? (
                <TopCard key={c.member.id} card={c} x={x} onCommit={commit} onOpen={() => navigate(`/member/${c.member.id}`)} onMore={() => setSafetyFor(c)} />
              ) : (
                <BackCard key={c.member.id} card={c} depth={i} x={x} />
              ))).reverse()}
            </AnimatePresence>
          )}
        </div>

        <div className="mt-5 flex items-end justify-center gap-5">
          <ActionButton label="Pass" onClick={() => fling('pass')} disabled={!top} tone="danger">
            <X className="size-7" strokeWidth={2} />
          </ActionButton>
          <ActionButton label="Undo last pass" onClick={undo} disabled={!lastPassed} small>
            <RotateCcw className="size-5" strokeWidth={1.75} />
          </ActionButton>
          <ActionButton label="Like" onClick={() => fling('like')} disabled={!top} tone="gold">
            <Heart className="size-7 fill-current" strokeWidth={1.5} />
          </ActionButton>
        </div>
        <p className="mt-3 hidden text-center text-xs text-faint sm:block">Tip: use ← and → to pass or like</p>
      </section>

      <FilterSheet open={filtersOpen} onOpenChange={setFiltersOpen} value={filters} onApply={applyFilters} />
      {safetyFor && (
        <SafetySheet
          memberId={safetyFor.member.id}
          name={safetyFor.member.name}
          open={!!safetyFor}
          onOpenChange={(v) => !v && setSafetyFor(null)}
          onBlocked={() => setStack((s) => s.filter((c) => c.member.id !== safetyFor.member.id))}
        />
      )}
      {overlay}
    </>
  );
}

function TopCard({
  card,
  x,
  onCommit,
  onOpen,
  onMore,
}: {
  card: DiscoverCard;
  x: MotionValue<number>;
  onCommit: (d: 'like' | 'pass') => void;
  onOpen: () => void;
  onMore: () => void;
}) {
  const rotate = useTransform(x, [-300, 300], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -30], [1, 0]);

  const onDragEnd = async (_: unknown, info: PanInfo) => {
    const dx = info.offset.x;
    const v = info.velocity.x;
    if (dx > THRESHOLD || v > 600) {
      await animate(x, 520, { duration: 0.22 });
      onCommit('like');
    } else if (dx < -THRESHOLD || v < -600) {
      await animate(x, -520, { duration: 0.22 });
      onCommit('pass');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ x, rotate, zIndex: 3 }}
      drag="x"
      dragMomentum={false}
      onDragEnd={onDragEnd}
      onTap={onOpen}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      role="group"
      aria-roledescription="member card"
      aria-label={`${card.member.name}, ${card.member.age}, ${card.matchPct}% match. Tap to view profile.`}
    >
      <MemberCardFace card={card} onMore={onMore} />
      <motion.div style={{ opacity: likeOpacity }} className="pointer-events-none absolute left-6 top-24 -rotate-12 rounded-[10px] border-4 border-success px-3 py-1 font-serif text-3xl font-bold tracking-widest text-success" aria-hidden>
        LIKE
      </motion.div>
      <motion.div style={{ opacity: passOpacity }} className="pointer-events-none absolute right-6 top-24 rotate-12 rounded-[10px] border-4 border-danger px-3 py-1 font-serif text-3xl font-bold tracking-widest text-danger" aria-hidden>
        PASS
      </motion.div>
    </motion.div>
  );
}

function BackCard({ card, depth, x }: { card: DiscoverCard; depth: number; x: MotionValue<number> }) {
  const base = 1 - depth * 0.05;
  const scale = useTransform(x, [-250, 0, 250], depth === 1 ? [1, base, 1] : [base + 0.05, base, base + 0.05]);
  const y = useTransform(x, [-250, 0, 250], depth === 1 ? [0, depth * 14, 0] : [14, depth * 14, 14]);
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ scale, y, zIndex: 3 - depth }} aria-hidden>
      <div className={cn('size-full transition-[filter]', depth === 2 && 'brightness-50', depth === 1 && 'brightness-75')}>
        <MemberCardFace card={card} />
      </div>
    </motion.div>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  disabled,
  tone,
  small,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'gold' | 'danger';
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.05 }}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          'grid place-items-center rounded-full border transition-opacity disabled:opacity-35',
          small ? 'size-12 border-line-strong bg-surface text-muted' : 'size-16',
          tone === 'danger' && 'border-danger/60 bg-surface text-danger shadow-[0_6px_24px_-8px_rgba(229,72,77,0.5)]',
          tone === 'gold' && 'gold-gradient border-transparent text-gold-ink shadow-[var(--shadow-glow)]',
        )}
      >
        {children}
      </motion.button>
      <span className="text-xs text-muted">{label === 'Undo last pass' ? 'Undo' : label}</span>
    </div>
  );
}
