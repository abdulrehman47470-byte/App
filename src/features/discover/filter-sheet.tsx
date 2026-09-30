import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { MEETUP, MENTORSHIP_LABEL, USER_TYPES } from '@/data/options';
import type { DiscoverFilters, Mentorship } from '@/types';

export const DEFAULT_FILTERS: DiscoverFilters = { maxDistance: 100, ageMin: 21, ageMax: 80, userTypes: [], meetup: [], mentorship: [] };

export const activeFilterCount = (f: DiscoverFilters) =>
  (f.maxDistance < DEFAULT_FILTERS.maxDistance ? 1 : 0) +
  (f.ageMin !== DEFAULT_FILTERS.ageMin || f.ageMax !== DEFAULT_FILTERS.ageMax ? 1 : 0) +
  f.userTypes.length + f.meetup.length + f.mentorship.length;

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function FilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: DiscoverFilters;
  onApply: (f: DiscoverFilters) => void;
}) {
  const [f, setF] = useState(value);
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (v) setF(value);
        onOpenChange(v);
      }}
      title="Filters"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setF(DEFAULT_FILTERS)}>
            Reset
          </Button>
          <Button block onClick={() => (onApply(f), onOpenChange(false))}>
            Show members
          </Button>
        </div>
      }
    >
      <div className="space-y-7 pb-2">
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium text-text">Distance</h3>
            <span className="font-serif text-gold-light">{f.maxDistance >= 100 ? 'Any distance' : `Within ${f.maxDistance} mi`}</span>
          </div>
          <Slider min={5} max={100} step={5} value={[f.maxDistance]} onValueChange={([v]) => setF({ ...f, maxDistance: v })} labels={['Maximum distance']} />
        </section>
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium text-text">Age</h3>
            <span className="font-serif text-gold-light">
              {f.ageMin} – {f.ageMax}
              {f.ageMax >= 80 ? '+' : ''}
            </span>
          </div>
          <Slider min={21} max={80} value={[f.ageMin, f.ageMax]} onValueChange={([a, b]) => setF({ ...f, ageMin: a, ageMax: b })} labels={['Minimum age', 'Maximum age']} />
        </section>
        <section>
          <h3 className="mb-3 text-sm font-medium text-text">Cigar knowledge</h3>
          <div className="flex flex-wrap gap-2">
            {USER_TYPES.map((t) => (
              <Chip key={t.id} size="sm" label={t.label} selected={f.userTypes.includes(t.id)} onToggle={() => setF({ ...f, userTypes: toggle(f.userTypes, t.id) })} />
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-3 text-sm font-medium text-text">Meetup willingness</h3>
          <div className="flex flex-wrap gap-2">
            {MEETUP.map((m) => (
              <Chip key={m} size="sm" label={m} selected={f.meetup.includes(m)} onToggle={() => setF({ ...f, meetup: toggle(f.meetup, m) })} />
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-3 text-sm font-medium text-text">Mentorship</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MENTORSHIP_LABEL) as Mentorship[]).map((m) => (
              <Chip key={m} size="sm" label={MENTORSHIP_LABEL[m]} selected={f.mentorship.includes(m)} onToggle={() => setF({ ...f, mentorship: toggle(f.mentorship, m) })} />
            ))}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
