import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useTabActive } from '@/components/layout/keep-alive';
import { cn, initials } from '@/lib/utils';

// Free OpenStreetMap tiles (no API key), turned dark and warm with a CSS filter (see .ds-map in
// index.css). OSM's tile policy only allows light use, so Phase 7 switches to Mapbox by changing
// this URL + attribution before launch.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: 'member' | 'lounge' | 'me';
  label: string;
  hue?: number;
  photoUrl?: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function icon(m: MapMarker, active: boolean) {
  if (m.kind === 'lounge') {
    return L.divIcon({
      className: '',
      iconSize: [30, 38],
      iconAnchor: [15, 36],
      html: `<div class="ds-pin-lounge${active ? ' is-active' : ''}"><svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 29s10-9.3 10-17A10 10 0 0 0 2 12c0 7.7 10 17 10 17z"/><rect x="6" y="10.5" width="12" height="3" rx="1.5"/></svg></div>`,
    });
  }
  if (m.kind === 'me') {
    return L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div class="ds-pin-me"></div>' });
  }
  const face = m.photoUrl
    ? `<img src="${esc(m.photoUrl)}" alt="" />`
    : `<span style="background:radial-gradient(circle at 35% 30%, hsl(${m.hue ?? 30} 55% 40%), hsl(${m.hue ?? 30} 45% 14%))">${esc(initials(m.label))}</span>`;
  return L.divIcon({
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<div class="ds-pin-member${active ? ' is-active' : ''}">${face}</div>`,
  });
}

function FitBounds({ markers, fit }: { markers: MapMarker[]; fit: boolean }) {
  const map = useMap();
  const key = markers.map((m) => m.id).join(',');
  useEffect(() => {
    if (!fit || !markers.length) return;
    if (markers.length === 1) map.setView([markers[0].lat, markers[0].lng], 11);
    else map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), { padding: [40, 40], maxZoom: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fit, map]);
  return null;
}

/** When a kept-alive map tab becomes visible again, Leaflet must re-measure its container. */
function ResizeOnShow() {
  const map = useMap();
  const active = useTabActive();
  useEffect(() => {
    if (active) requestAnimationFrame(() => map.invalidateSize());
  }, [active, map]);
  return null;
}

function FlyTo({ target }: { target?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 11), { duration: 0.8 });
  }, [target, map]);
  return null;
}

export function MapView({
  markers,
  activeId,
  onSelect,
  center = [39.5, -95],
  zoom = 4,
  fit = true,
  flyTo,
  area,
  interactive = true,
  className,
  label = 'Map',
}: {
  markers: MapMarker[];
  activeId?: string;
  onSelect?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  fit?: boolean;
  flyTo?: [number, number];
  /** Approximate area circle (e.g. a member's city) instead of an exact pin. */
  area?: { lat: number; lng: number; radiusM: number };
  interactive?: boolean;
  className?: string;
  label?: string;
}) {
  const icons = useMemo(() => new Map(markers.map((m) => [m.id, icon(m, m.id === activeId)])), [markers, activeId]);
  return (
    <div className={cn('ds-map relative overflow-hidden rounded-[20px] border border-line', className)} role="region" aria-label={label}>
      <MapContainer
        center={area ? [area.lat, area.lng] : center}
        zoom={area ? 10 : zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        keyboard={interactive}
        attributionControl
        className="size-full"
        worldCopyJump
      >
        <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
        {area && (
          <Circle
            center={[area.lat, area.lng]}
            radius={area.radiusM}
            pathOptions={{ color: '#d9a441', weight: 1.5, fillColor: '#d9a441', fillOpacity: 0.15, dashArray: '4 4' }}
          />
        )}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={icons.get(m.id)!}
            title={m.label}
            alt={m.label}
            keyboard
            zIndexOffset={m.id === activeId ? 1000 : m.kind === 'me' ? 500 : 0}
            eventHandlers={onSelect ? { click: () => onSelect(m.id) } : undefined}
          />
        ))}
        <FitBounds markers={markers} fit={fit && !area} />
        <FlyTo target={flyTo} />
        <ResizeOnShow />
      </MapContainer>
    </div>
  );
}
