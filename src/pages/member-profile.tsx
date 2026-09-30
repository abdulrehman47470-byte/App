import { Ban, ChevronLeft, Flag, Heart, MessageCircle, MoreHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { CigarBand, MatchRing, SafetyBanner, VerifiedBadge } from '@/components/brand/ornaments';
import { PortraitArt } from '@/components/brand/portrait';
import { Button } from '@/components/ui/button';
import { Card, Skeleton } from '@/components/ui/misc';
import { MENTORSHIP_LABEL, userTypeLabel } from '@/data/options';
import { useLikeFlow } from '@/features/discover/use-like';
import { ProfileSections } from '@/features/profile/profile-sections';
import { useMatches, useMemberCard } from '@/features/queries';
import { ActivitySection } from '@/features/feed/activity-section';
import { MapView } from '@/components/map/map-view';
import { FEATURES } from '@/config/features';
import { MapPin } from 'lucide-react';
import { SafetySheet } from '@/features/safety/safety-sheet';
import { api } from '@/lib/api';

export default function MemberProfile() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: card, isLoading } = useMemberCard(id);
  const { data: matches } = useMatches();
  const { like, overlay } = useLikeFlow();
  const [safety, setSafety] = useState(false);
  const [liked, setLiked] = useState(false);
  const shared = useMemo(() => new Set(card?.shared ?? []), [card]);
  const isMatch = matches?.some((m) => m.id === id);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="aspect-[4/5] w-full rounded-none" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }
  if (!card) {
    return (
      <EmptyState
        illustration="ashtray"
        title="Profile unavailable"
        body="This member is no longer available."
        action={<Button variant="outline" onClick={() => navigate('/discover')}>Back to Discover</Button>}
      />
    );
  }

  const m = card.member;
  const headline = `${userTypeLabel(m.userType)} · ${m.city}, ${m.state}`;

  return (
    <article>
      <div className="relative aspect-[4/5] max-h-[62dvh] w-full overflow-hidden">
        <PortraitArt name={m.name} hue={m.photoHue} />
        <div className="photo-fade absolute inset-0" aria-hidden />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 pt-[max(12px,env(safe-area-inset-top))]">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="grid size-11 place-items-center rounded-full bg-bg/60 backdrop-blur-sm">
            <ChevronLeft className="size-6" strokeWidth={1.5} />
          </button>
          <button type="button" onClick={() => setSafety(true)} aria-label={`Report or block ${m.name}`} className="grid size-11 place-items-center rounded-full bg-bg/60 backdrop-blur-sm">
            <MoreHorizontal className="size-5" />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-[36px] leading-none text-text">{m.name}</h1>
              <span className="text-2xl font-light text-text/85">{m.age}</span>
              {m.photoVerified && <VerifiedBadge className="size-6" />}
            </div>
            {m.pronouns && <p className="mt-1 text-sm text-muted">{m.pronouns}</p>}
            <p className="mt-2 text-[15px] text-text/90">{headline}</p>
          </div>
          <MatchRing pct={card.matchPct} size={64} />
        </div>
      </div>

      <div className="space-y-4 px-4 pb-6 pt-4">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {m.distanceMi} mi away
          {card.shared.length > 0 && <span className="text-gold">· {card.shared.length} things in common</span>}
        </p>

        {isMatch ? (
          <Button size="lg" block onClick={() => navigate(`/messages/${m.id}`)}>
            <MessageCircle className="size-5" /> Message
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="danger"
              onClick={async () => {
                await api.pass(m.id);
                navigate('/discover');
              }}
            >
              <X className="size-5" /> Pass
            </Button>
            <Button
              size="lg"
              disabled={liked}
              onClick={async () => {
                setLiked(true);
                await like(m.id);
              }}
            >
              <Heart className="size-5 fill-current" /> {liked ? 'Liked' : 'Like'}
            </Button>
          </div>
        )}

        <Card className="p-5">
          <h2 className="micro-label mb-2">About me</h2>
          <p className="text-[15px] leading-relaxed text-text/90">{m.bio}</p>
        </Card>

        <ProfileSections
          prefs={m.preferences}
          about={m.about}
          shared={shared}
          mentorship={{ label: MENTORSHIP_LABEL[m.mentorship], topics: m.mentorTopics }}
        />

        {FEATURES.memberMap && (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 p-5 pb-3">
              <MapPin className="size-4 text-gold" />
              <h2 className="micro-label">Location</h2>
              <span className="ml-auto text-xs text-muted">
                {m.city}, {m.state} · {m.distanceMi} mi away
              </span>
            </div>
            <MapView
              label={`Approximate area around ${m.city}`}
              markers={[]}
              area={{ lat: m.lat, lng: m.lng, radiusM: 6000 }}
              interactive={false}
              className="h-40 rounded-none border-x-0 border-b-0"
            />
            <p className="px-5 py-2 text-[11px] text-faint">Approximate area only. Exact locations are never shared.</p>
          </Card>
        )}

        {FEATURES.feed && <ActivitySection memberId={m.id} name={m.name} />}

        <CigarBand label="Stay safe" />
        <SafetyBanner />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger" onClick={() => setSafety(true)}>
            <Flag className="size-4" /> Report
          </Button>
          <Button variant="danger" onClick={() => setSafety(true)}>
            <Ban className="size-4" /> Block
          </Button>
        </div>
      </div>

      <SafetySheet memberId={m.id} name={m.name} open={safety} onOpenChange={setSafety} onBlocked={() => navigate('/discover')} />
      {overlay}
    </article>
  );
}
