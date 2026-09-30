import { AnimatePresence, motion } from 'framer-motion';
import { EyeOff, Heart, LocateFixed, MapPin, MessageCircle, Navigation, Phone, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MatchRing, UserTypeBadge, VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { PageBody, PageHeader } from '@/components/layout/page';
import { MapView, type MapMarker } from '@/components/map/map-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Card, SectionTitle, Skeleton } from '@/components/ui/misc';
import { Switch } from '@/components/ui/picker';
import { MOCK_LOUNGES } from '@/data/mock/content';
import { cityCoords } from '@/data/mock/geo';
import { USER_TYPES } from '@/data/options';
import { useLikeFlow } from '@/features/discover/use-like';
import { useMapMembers, useMatches, useMe, useSaveMe } from '@/features/queries';
import type { UserType } from '@/types';

export default function MemberMap() {
  const { data: cards, isLoading } = useMapMembers();
  const { data: me } = useMe();
  const { data: matches } = useMatches();
  const saveMe = useSaveMe();
  const { like, overlay } = useLikeFlow();
  const [showMembers, setShowMembers] = useState(true);
  const [showLounges, setShowLounges] = useState(true);
  const [types, setTypes] = useState<UserType[]>([]);
  const [selected, setSelected] = useState<string>();
  const [flyTo, setFlyTo] = useState<[number, number]>();
  const [liked, setLiked] = useState<string[]>([]);

  const myPos = cityCoords(me?.city);
  const visibleOnMap = !!me?.visibility.map;

  const members = useMemo(
    () => (cards ?? []).filter((c) => !types.length || types.includes(c.member.userType)).sort((a, b) => a.member.distanceMi - b.member.distanceMi),
    [cards, types],
  );

  const markers = useMemo<MapMarker[]>(() => {
    const out: MapMarker[] = [];
    if (showMembers) for (const c of members) out.push({ id: c.member.id, lat: c.member.lat, lng: c.member.lng, kind: 'member', label: c.member.name, hue: c.member.photoHue });
    if (showLounges) for (const l of MOCK_LOUNGES) out.push({ id: l.id, lat: l.lat, lng: l.lng, kind: 'lounge', label: l.name });
    if (myPos && visibleOnMap) out.push({ id: 'me', lat: myPos[0], lng: myPos[1], kind: 'me', label: 'You (approximate)' });
    return out;
  }, [members, showMembers, showLounges, myPos, visibleOnMap]);

  const selMember = members.find((c) => c.member.id === selected);
  const selLounge = MOCK_LOUNGES.find((l) => l.id === selected);

  const focus = (id: string, lat: number, lng: number) => {
    setSelected(id);
    setFlyTo([lat, lng]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setVisibility = (v: boolean) => me && saveMe.mutate({ visibility: { ...me.visibility, map: v } });

  return (
    <>
      <PageHeader title="Member Map" large subtitle="See where the community smokes" />
      <PageBody className="space-y-4">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Map layers and filters">
          <Chip size="sm" label="Members" selected={showMembers} onToggle={() => setShowMembers((v) => !v)} />
          <Chip size="sm" label="Lounges" selected={showLounges} onToggle={() => setShowLounges((v) => !v)} />
          <span className="mx-1 w-px shrink-0 bg-line" aria-hidden />
          {USER_TYPES.map((t) => (
            <Chip key={t.id} size="sm" label={t.label} selected={types.includes(t.id)} onToggle={() => setTypes((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))} />
          ))}
        </div>

        <div className="relative">
          {isLoading ? (
            <Skeleton className="h-[52dvh] min-h-[340px] rounded-[20px]" />
          ) : (
            <MapView
              label="Member and lounge map"
              markers={markers}
              activeId={selected}
              onSelect={setSelected}
              flyTo={flyTo}
              className="h-[52dvh] min-h-[340px]"
            />
          )}
          {myPos && (
            <button
              type="button"
              onClick={() => setFlyTo([myPos[0] + Math.random() * 1e-6, myPos[1]])}
              aria-label="Center on my city"
              className="absolute bottom-7 right-3 z-[500] grid size-11 place-items-center rounded-full border border-line-strong bg-surface text-gold shadow-lg hover:bg-surface-2"
            >
              <LocateFixed className="size-5" />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {selMember && (
            <motion.div key={selMember.member.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <Card className="relative p-4">
                <CloseButton onClick={() => setSelected(undefined)} />
                <div className="flex items-center gap-4 pr-8">
                  <Avatar name={selMember.member.name} hue={selMember.member.photoHue} size={64} ring />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-serif text-xl text-text">
                      {selMember.member.name}, {selMember.member.age}
                      {selMember.member.photoVerified && <VerifiedBadge className="size-4" />}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <MapPin className="size-3.5" /> {selMember.member.city}, {selMember.member.state} · {selMember.member.distanceMi} mi
                    </p>
                    <UserTypeBadge type={selMember.member.userType} className="mt-1.5" />
                  </div>
                  <MatchRing pct={selMember.matchPct} size={56} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={`/member/${selMember.member.id}`}>View profile</Link>
                  </Button>
                  {matches?.some((m) => m.id === selMember.member.id) ? (
                    <Button size="sm" asChild>
                      <Link to={`/messages/${selMember.member.id}`}>
                        <MessageCircle className="size-4" /> Message
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={liked.includes(selMember.member.id)}
                      onClick={async () => {
                        setLiked((l) => [...l, selMember.member.id]);
                        await like(selMember.member.id);
                      }}
                    >
                      <Heart className="size-4 fill-current" /> {liked.includes(selMember.member.id) ? 'Liked' : 'Like'}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
          {selLounge && (
            <motion.div key={selLounge.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <Card className="relative p-4">
                <CloseButton onClick={() => setSelected(undefined)} />
                <p className="micro-label !text-ember">Cigar lounge</p>
                <h3 className="mt-1 font-serif text-xl text-text">{selLounge.name}</h3>
                <p className="text-xs text-gold">{selLounge.venueType}</p>
                <p className="mt-2 text-sm text-muted">
                  {selLounge.street}, {selLounge.city}, {selLounge.state}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <a href={`tel:${selLounge.phone.replace(/[^\d+]/g, '')}`}>
                      <Phone className="size-4" /> Call
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selLounge.name}, ${selLounge.street}, ${selLounge.city}, ${selLounge.state}`)}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <Navigation className="size-4" /> Directions
                    </a>
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="flex items-center gap-3 p-4">
          {visibleOnMap ? <ShieldCheck className="size-5 shrink-0 text-success" /> : <EyeOff className="size-5 shrink-0 text-muted" />}
          <div className="flex-1">
            <p className="text-sm font-medium text-text">{visibleOnMap ? 'You are on the map' : 'You are hidden from the map'}</p>
            <p className="text-xs text-muted">Only your city is shown, never your address. Change this anytime.</p>
          </div>
          <Switch label="Show me on the member map" checked={visibleOnMap} onCheckedChange={setVisibility} />
        </Card>

        {showMembers && (
          <section>
            <SectionTitle>Members by distance</SectionTitle>
            <ul className="divide-y divide-line/60 overflow-hidden rounded-[20px] border border-line bg-surface">
              {members.map(({ member: m }) => (
                <li key={m.id}>
                  <button type="button" onClick={() => focus(m.id, m.lat, m.lng)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2">
                    <Avatar name={m.name} hue={m.photoHue} size={44} ring={selected === m.id} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[15px] font-medium text-text">
                        {m.name} {m.photoVerified && <VerifiedBadge className="size-4" />}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {m.city}, {m.state}
                      </p>
                    </div>
                    <span className="text-xs text-faint">{m.distanceMi < 1000 ? `${m.distanceMi} mi` : `${(m.distanceMi / 1000).toFixed(1)}k mi`}</span>
                  </button>
                </li>
              ))}
              {!members.length && !isLoading && <li className="px-4 py-8 text-center text-sm text-muted">No members match these filters.</li>}
            </ul>
          </section>
        )}
        <p className="text-center text-xs text-faint">Member locations are approximate (city level). Meet in public places like licensed cigar lounges.</p>
      </PageBody>
      {overlay}
    </>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Close" className="absolute right-2 top-2 grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
      <X className="size-4" />
    </button>
  );
}
