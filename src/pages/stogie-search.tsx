import { Info, MapPin, Navigation, Phone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/brand/empty-state';
import { PageBody, PageHeader } from '@/components/layout/page';
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
  const [active, setActive] = useState<string>();
  const { data, isLoading } = useLounges({ q, state: state || undefined, venueType: venueType || undefined });

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
        <MapPreview lounges={data ?? []} active={active} onSelect={setActive} />
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

/** Stylised map placeholder (Phase 7: Mapbox GL). Pins are projected from lat/lng. */
function MapPreview({ lounges, active, onSelect }: { lounges: Lounge[]; active?: string; onSelect: (id: string) => void }) {
  const pins = useMemo(() => {
    if (!lounges.length) return [];
    const lats = lounges.map((l) => l.lat);
    const lngs = lounges.map((l) => l.lng);
    const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    const spanLat = Math.max(maxLat - minLat, 0.05);
    const spanLng = Math.max(maxLng - minLng, 0.05);
    return lounges.map((l) => ({ l, x: 8 + ((l.lng - minLng) / spanLng) * 84, y: 24 + (1 - (l.lat - minLat) / spanLat) * 62 }));
  }, [lounges]);

  return (
    <div className="relative h-52 overflow-hidden rounded-[20px] border border-line bg-[#171310]">
      <svg className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="none" viewBox="0 0 100 100">
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i} stroke="rgba(217,164,65,0.07)" strokeWidth="0.3">
            <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
            <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
          </g>
        ))}
        <path d="M-5 70 C 20 60, 30 80, 55 65 S 90 50, 105 58" stroke="rgba(108,142,191,0.25)" strokeWidth="4" fill="none" />
        <path d="M10 -5 L 35 105 M -5 30 L 105 42 M 70 -5 L 62 105" stroke="rgba(243,233,214,0.06)" strokeWidth="1.2" />
      </svg>
      {pins.map(({ l, x, y }) => (
        <button
          key={l.id}
          type="button"
          onClick={() => {
            onSelect(l.id);
            document.getElementById(`lounge-${l.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          aria-label={`${l.name}, ${l.city}`}
          className="absolute -translate-x-1/2 -translate-y-full p-1.5"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <MapPin className={cn('size-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] transition-transform', active === l.id ? 'scale-125 fill-gold text-gold-light' : 'fill-danger/90 text-bg')} strokeWidth={1.5} />
        </button>
      ))}
      <span className="absolute bottom-2 right-3 rounded-full bg-bg/70 px-2 py-0.5 text-[10px] text-faint">Map preview · Mapbox in Phase 7</span>
    </div>
  );
}
