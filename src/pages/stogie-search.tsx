import { Info, MapPin, Navigation, Phone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { PageBody, PageHeader } from '@/components/layout/page';
import { MapView, type MapMarker } from '@/components/map/map-view';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Badge, Card, SearchInput, Skeleton } from '@/components/ui/misc';
import { MOCK_LOUNGES } from '@/data/mock/content';
import { useLounges } from '@/features/queries';
import { cn } from '@/lib/utils';
import type { Lounge } from '@/types';

const STATES = [...new Set(MOCK_LOUNGES.map((l) => l.state))].sort();
const TYPES = [...new Set(MOCK_LOUNGES.map((l) => l.venueType))].sort();

export default function StogieSearch() {
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [venueType, setVenueType] = useState('');
  const [params] = useSearchParams();
  const [active, setActive] = useState<string | undefined>(params.get('focus') ?? undefined);
  const { data, isLoading } = useLounges({ q, state: state || undefined, venueType: venueType || undefined });
  const markers = useMemo<MapMarker[]>(
    () => (data ?? []).map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, kind: 'lounge', label: l.name })),
    [data],
  );
  const focused = data?.find((l) => l.id === active);
  const flyTo = useMemo<[number, number] | undefined>(() => (focused ? [focused.lat, focused.lng] : undefined), [focused]);

  // Arriving from a check-in post (?focus=l1): scroll that lounge into view.
  useEffect(() => {
    const id = params.get('focus');
    if (id && data) setTimeout(() => document.getElementById(`lounge-${id}`)?.scrollIntoView({ block: 'center' }), 300);
  }, [params, data]);

  return (
    <>
      <PageHeader title="Stogie Search" back subtitle="Find a cigar lounge near you" />
      <div className="space-y-2 px-4 pt-4">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lounges, cities…" aria-label="Search lounges" />
        <div className="grid grid-cols-2 gap-2">
          <Select aria-label="State" value={state} onChange={(e) => setState(e.target.value)} className="h-10 text-sm">
            <option value="">All states</option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select aria-label="Venue type" value={venueType} onChange={(e) => setVenueType(e.target.value)} className="h-10 text-sm">
            <option value="">All venue types</option>
            {TYPES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
      </div>
      <PageBody className="space-y-4 pt-1">
        <MapView
          label="Lounge map"
          className="h-64"
          markers={markers}
          activeId={active}
          flyTo={flyTo}
          onSelect={(id) => {
            setActive(id);
            document.getElementById(`lounge-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />
        <p className="flex items-start gap-2 text-xs text-faint">
          <Info className="mt-0.5 size-3.5 shrink-0" /> Hours and phone numbers may change. Call ahead before you visit.
          Daily Stogie is a locator only and does not sell tobacco.
        </p>
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40" />)
        ) : !data?.length ? (
          <EmptyState illustration="chair" title="No lounges found" body="Try a different search or clear the filters." />
        ) : (
          <ul className="space-y-3">
            <li className="micro-label">{data.length} lounges</li>
            {data.map((l) => (
              <li key={l.id} id={`lounge-${l.id}`}>
                <LoungeCard lounge={l} active={active === l.id} onFocus={() => setActive(l.id)} />
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

function LoungeCard({ lounge: l, active, onFocus }: { lounge: Lounge; active: boolean; onFocus: () => void }) {
  const address = `${l.street}, ${l.city}, ${l.state}`;
  return (
    <Card className={cn('p-4 transition-colors', active && 'border-gold')}>
      <button type="button" onClick={onFocus} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg text-text">{l.name}</h3>
            <p className="text-xs font-medium text-gold">{l.venueType}</p>
          </div>
          <Badge tone="muted">{l.metroArea}</Badge>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
          <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} /> {address}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Phone className="size-4 shrink-0" strokeWidth={1.5} /> {l.phone}
        </p>
        {l.verificationNote && <p className="mt-2 text-xs text-warning">Note: {l.verificationNote}</p>}
      </button>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" asChild>
          <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}>
            <Phone className="size-4" /> Call
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${l.name}, ${address}`)}`} target="_blank" rel="noreferrer noopener">
            <Navigation className="size-4" /> Directions
          </a>
        </Button>
      </div>
    </Card>
  );
}
