import { AnimatePresence, m } from 'framer-motion';
import { ChevronDown, Plus, X } from 'lucide-react';
import { memo, useDeferredValue, useMemo, useState } from 'react';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/field';
import { SearchInput } from '@/components/ui/misc';
import { Slider } from '@/components/ui/slider';
import { PREFERENCE_SECTIONS, groupOptions, type OptionGroup, type PreferenceSection } from '@/data/options';
import { cn } from '@/lib/utils';
import type { Preferences } from '@/types';

const NONE: string[] = [];
const PRICE_MIN = 5;
const PRICE_MAX = 100;

type PrefsUpdate = (fn: (p: Preferences) => Preferences) => void;

export function StepPreferences({ prefs, onChange }: { prefs: Preferences; onChange: PrefsUpdate }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string[]>(['lounge']);
  // The search box updates instantly; filtering hundreds of chips follows at lower priority.
  // One letter matches almost everything, so filtering starts at two.
  const deferredQ = useDeferredValue(q);
  const typed = deferredQ.trim().toLowerCase();
  const needle = typed.length >= 2 ? typed : '';

  const sections = useMemo(() => {
    if (!needle) return PREFERENCE_SECTIONS;
    return PREFERENCE_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) ||
        s.groups.some((g) => g.label.toLowerCase().includes(needle) || groupOptions(g).some((o) => o.toLowerCase().includes(needle))),
    );
  }, [needle]);

  const toggle = (g: OptionGroup, opt: string) =>
    onChange((p) => {
      const cur = (p[g.id] as string[] | undefined) ?? [];
      const next = g.kind === 'single' ? (cur.includes(opt) ? [] : [opt]) : cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
      return { ...p, [g.id]: next };
    });

  const setSectionOpen = (id: string, v: boolean) => setOpen((o) => (v ? [...o, id] : o.filter((x) => x !== id)));

  return (
    <div>
      <SearchInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search lounges, brands, flavors…"
        aria-label="Search preferences"
        className="mb-4"
      />
      <div className="space-y-2.5">
        {sections.map((s) => (
          <SectionItem
            key={s.id}
            section={s}
            prefs={prefs}
            isOpen={!!needle || open.includes(s.id)}
            needle={needle}
            onOpenChange={setSectionOpen}
            onToggle={toggle}
            onChange={onChange}
          />
        ))}
        {!sections.length && <p className="py-10 text-center text-sm text-muted">Nothing matches “{q}”.</p>}
      </div>
    </div>
  );
}

const countFor = (s: PreferenceSection, prefs: Preferences) =>
  s.groups.reduce((n, g) => n + ((prefs[g.id] as string[] | undefined)?.length ?? 0), 0) +
  (s.special === 'price' && prefs.priceMin !== undefined ? 1 : 0) +
  (s.special === 'wishlist' ? (prefs.wishlist?.length ?? 0) : 0);

interface SectionProps {
  section: PreferenceSection;
  prefs: Preferences;
  isOpen: boolean;
  needle: string;
  onOpenChange: (id: string, open: boolean) => void;
  onToggle: (g: OptionGroup, o: string) => void;
  onChange: PrefsUpdate;
}

/**
 * One collapsible section. Re-renders only when its own answers change (a chip tap elsewhere does
 * not touch it). Plain show/hide, no height measuring, so opening is instant.
 */
const SectionItem = memo(
  function SectionItem({ section: s, prefs, isOpen, needle, onOpenChange, onToggle, onChange }: SectionProps) {
    const count = countFor(s, prefs);
    const panelId = `pref-${s.id}`;
    return (
      <div className={cn('rounded-[16px] border bg-surface transition-colors', isOpen ? 'border-line-strong' : 'border-line')}>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => onOpenChange(s.id, !isOpen)}
          className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
        >
          <span className={cn('grid size-6 place-items-center rounded-full border', count ? 'border-gold bg-gold-fill' : 'border-line-strong')}>
            <span className={cn('size-2 rounded-full', count ? 'bg-gold' : 'bg-transparent')} />
          </span>
          <span className="flex-1 text-[15px] text-text">{s.title}</span>
          {count > 0 && <span className="rounded-full bg-gold-fill px-2 py-0.5 text-xs font-semibold text-gold">{count}</span>}
          <ChevronDown className={cn('size-5 text-muted transition-transform', isOpen && 'rotate-180')} strokeWidth={1.5} />
        </button>
        {isOpen && (
          <div id={panelId} className="page-enter space-y-5 border-t border-line/60 px-4 pb-5 pt-4">
            {s.special === 'price' && <PriceRange prefs={prefs} onChange={onChange} />}
            {s.groups.map((g) => (
              <GroupChips key={g.id} group={g} selected={(prefs[g.id] as string[] | undefined) ?? NONE} onToggle={onToggle} needle={needle} />
            ))}
            {s.special === 'strengthScale' && <StrengthScale prefs={prefs} onChange={onChange} />}
            {s.special === 'wishlist' && <Wishlist prefs={prefs} onChange={onChange} />}
          </div>
        )}
      </div>
    );
  },
  (a, b) =>
    a.isOpen === b.isOpen &&
    a.needle === b.needle &&
    a.section === b.section &&
    a.onToggle === b.onToggle &&
    a.onOpenChange === b.onOpenChange &&
    a.onChange === b.onChange &&
    a.section.groups.every((g) => a.prefs[g.id] === b.prefs[g.id]) &&
    (!a.section.special || a.prefs === b.prefs),
);

/** One group of chips. Memoised: tapping a chip re-renders only its own group. */
const GroupChips = memo(function GroupChips({
  group,
  selected,
  onToggle,
  needle,
}: {
  group: OptionGroup;
  selected: string[];
  onToggle: (g: OptionGroup, o: string) => void;
  needle: string;
}) {
  const [local, setLocal] = useState('');
  const n = (local || needle).trim().toLowerCase();
  const match = (o: string) => !n || o.toLowerCase().includes(n) || group.label.toLowerCase().includes(n);
  const role = group.kind === 'single' ? 'radio' : 'checkbox';
  const chips = (opts: string[]) => (
    <div role={group.kind === 'single' ? 'radiogroup' : 'group'} aria-label={group.label} className="flex flex-wrap gap-2">
      {opts.filter(match).map((o) => (
        <Chip key={o} size="sm" role={role} label={o} selected={selected.includes(o)} onToggle={() => onToggle(group, o)} />
      ))}
    </div>
  );
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-text">{group.label}</h3>
        <span className="text-[11px] uppercase tracking-wider text-faint">{group.kind === 'single' ? 'Choose one' : 'Choose any'}</span>
      </div>
      {group.searchable && !needle && (
        <SearchInput value={local} onChange={(e) => setLocal(e.target.value)} placeholder={`Search ${group.label.toLowerCase()}`} aria-label={`Search ${group.label}`} className="mb-3" />
      )}
      {group.grouped ? (
        <div className="space-y-3">
          {group.grouped
            .filter((sub) => sub.options.some(match))
            .map((sub) => (
              <div key={sub.label}>
                <p className="micro-label mb-2 !text-[10px]">{sub.label}</p>
                {chips(sub.options)}
              </div>
            ))}
        </div>
      ) : (
        chips(group.options ?? [])
      )}
    </div>
  );
});

function PriceRange({ prefs, onChange }: { prefs: Preferences; onChange: PrefsUpdate }) {
  const lo = prefs.priceMin ?? 10;
  const hi = prefs.priceMax ?? 30;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-text">Price per cigar</h3>
        <p className="font-serif text-lg text-gold-light">
          ${lo} – ${hi}
          {hi >= PRICE_MAX ? '+' : ''}
        </p>
      </div>
      <Slider
        min={PRICE_MIN}
        max={PRICE_MAX}
        value={[lo, hi]}
        onValueChange={([a, b]) => onChange((p) => ({ ...p, priceMin: a, priceMax: b }))}
        labels={['Minimum price', 'Maximum price']}
      />
      <div className="flex justify-between text-xs text-faint">
        <span>${PRICE_MIN}</span>
        <span>${PRICE_MAX}+</span>
      </div>
    </div>
  );
}

function StrengthScale({ prefs, onChange }: { prefs: Preferences; onChange: PrefsUpdate }) {
  const v = prefs.strengthScale ?? 3;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-text">Strength scale</h3>
        <p className="font-serif text-lg text-gold-light">{v} / 5</p>
      </div>
      <Slider min={1} max={5} value={[v]} onValueChange={([x]) => onChange((p) => ({ ...p, strengthScale: x }))} labels={['Strength scale']} />
      <div className="flex justify-between text-xs text-faint">
        <span>Mild</span>
        <span>Full</span>
      </div>
    </div>
  );
}

function Wishlist({ prefs, onChange }: { prefs: Preferences; onChange: PrefsUpdate }) {
  const [text, setText] = useState('');
  const list = prefs.wishlist ?? [];
  const add = () => {
    const t = text.trim();
    if (!t || list.includes(t)) return;
    onChange((p) => ({ ...p, wishlist: [...(p.wishlist ?? []), t] }));
    setText('');
  };
  return (
    <div>
      <h3 className="mb-2.5 text-sm font-medium text-text">Cigars on your wishlist</h3>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="e.g. Opus X Lost City"
          aria-label="Add a wishlist cigar"
          maxLength={80}
        />
        <button type="button" onClick={add} aria-label="Add to wishlist" className="gold-gradient grid size-12 shrink-0 place-items-center rounded-[14px] text-gold-ink">
          <Plus className="size-5" />
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {list.map((w) => (
            <m.li
              key={w}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between rounded-[12px] border border-line bg-surface-2 pl-4 text-sm text-text"
            >
              {w}
              <button type="button" aria-label={`Remove ${w}`} onClick={() => onChange((p) => ({ ...p, wishlist: (p.wishlist ?? []).filter((x) => x !== w) }))} className="grid size-11 place-items-center text-muted hover:text-danger">
                <X className="size-4" />
              </button>
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
