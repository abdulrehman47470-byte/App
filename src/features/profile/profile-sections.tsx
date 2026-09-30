import type { ReactNode } from 'react';
import { Tag } from '@/components/ui/chip';
import { Card } from '@/components/ui/misc';
import type { AboutYou, Preferences } from '@/types';

interface Row {
  label: string;
  values: string[];
}

function Section({ title, rows, shared }: { title: string; rows: Row[]; shared: Set<string> }) {
  const visible = rows.filter((r) => r.values.length);
  if (!visible.length) return null;
  return (
    <Card className="p-5">
      <h3 className="micro-label mb-4">{title}</h3>
      <dl className="space-y-4">
        {visible.map((r) => (
          <div key={r.label}>
            <dt className="mb-2 text-xs text-faint">{r.label}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {r.values.map((v) => (
                <Tag key={v} label={v} highlight={shared.has(v)} />
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const NO_SHARED = new Set<string>();

const p = (prefs: Preferences, k: string) => (prefs[k] as string[] | undefined) ?? [];

/** LinkedIn-style profile sections. Items shared with the viewer are highlighted in gold. */
export function ProfileSections({
  prefs,
  about,
  mentorship,
  shared = NO_SHARED,
  extra,
}: {
  prefs: Preferences;
  about: AboutYou;
  mentorship?: { label: string; topics: string[] };
  shared?: Set<string>;
  extra?: ReactNode;
}) {
  const price = prefs.priceMin !== undefined ? [`$${prefs.priceMin} – $${prefs.priceMax}${(prefs.priceMax ?? 0) >= 100 ? '+' : ''}`] : [];
  return (
    <div className="space-y-3">
      <Section
        title="Cigar Preferences"
        shared={shared}
        rows={[
          { label: 'Strength', values: p(prefs, 'strength') },
          { label: 'Flavors', values: p(prefs, 'flavors') },
          { label: 'Wrapper', values: p(prefs, 'wrapper') },
          { label: 'Origin', values: p(prefs, 'origin') },
          { label: 'Vitola', values: p(prefs, 'vitola') },
          { label: 'Favorite brands', values: p(prefs, 'brands') },
          { label: 'Price comfort zone', values: price },
          { label: 'Lounge atmosphere', values: p(prefs, 'atmosphere') },
          { label: 'Where they smoke', values: p(prefs, 'venue') },
        ]}
      />
      <Section
        title="Collection & Aging"
        shared={shared}
        rows={[
          { label: 'Collection size', values: p(prefs, 'collectionSize') },
          { label: 'Collection style', values: p(prefs, 'collectionStyle') },
          { label: 'Aging', values: p(prefs, 'aging') },
          { label: 'Storage', values: p(prefs, 'storage') },
          { label: 'Wishlist', values: prefs.wishlist ?? [] },
        ]}
      />
      <Section
        title="Pairings"
        shared={shared}
        rows={[
          { label: 'Drinks', values: p(prefs, 'pairing') },
          { label: 'Pairing style', values: p(prefs, 'pairingStyle') },
        ]}
      />
      <Section
        title="Interests"
        shared={shared}
        rows={[
          { label: 'Hobbies', values: about.hobbies ?? [] },
          { label: 'Sports', values: about.sports ?? [] },
          { label: 'Music', values: about.music ?? [] },
          { label: 'Social style', values: p(prefs, 'socialStyle') },
        ]}
      />
      <Section title="Professional Industry" shared={shared} rows={[{ label: 'Industry', values: about.industry ?? [] }, { label: 'Military / First Responder', values: about.firstResponder ?? [] }]} />
      <Section title="Languages" shared={shared} rows={[{ label: 'Speaks', values: about.languages ?? [] }]} />
      {mentorship && mentorship.label !== 'Neither' && (
        <Section title="Mentorship" shared={shared} rows={[{ label: mentorship.label, values: mentorship.topics }]} />
      )}
      {extra}
    </div>
  );
}
