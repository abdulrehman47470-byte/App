import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { MatchRing, UserTypeBadge, VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Chip, Tag } from '@/components/ui/chip';
import { Card, Segmented, Skeleton } from '@/components/ui/misc';
import { MENTOR_TOPICS } from '@/data/options';
import { useLikeFlow } from '@/features/discover/use-like';
import { useMatches, useMentors } from '@/features/queries';
import type { MentorSegment } from '@/lib/api';
import { DiscoverTabs } from '@/features/discover/discover-tabs';
import { FEATURES } from '@/config/features';

export default function Mentors() {
  const [segment, setSegment] = useState<MentorSegment>('find');
  const [topic, setTopic] = useState<string>();
  const { data, isLoading } = useMentors(segment, topic);
  const { data: matches } = useMatches();
  const { like, overlay } = useLikeFlow();
  const [liked, setLiked] = useState<string[]>([]);

  return (
    <>
      <PageHeader title={FEATURES.feed ? 'Discover' : 'Mentors'} large subtitle="Learn the leaf, or pass it on" />
      <DiscoverTabs />
      <PageBody className="space-y-4">
        <Segmented
          label="Mentor mode"
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'find', label: 'Find a mentor' },
            { value: 'guide', label: 'Guide beginners' },
          ]}
        />
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Topic">
          <Chip size="sm" label="All topics" selected={!topic} onToggle={() => setTopic(undefined)} role="radio" />
          {MENTOR_TOPICS.map((t) => (
            <Chip key={t} size="sm" role="radio" label={t} selected={topic === t} onToggle={() => setTopic(topic === t ? undefined : t)} />
          ))}
        </div>
        <p className="text-sm text-muted">
          {segment === 'find' ? 'Experienced members happy to guide newcomers.' : 'Newer members looking for a guide.'} Like
          someone to match, then chat.
        </p>

        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36" />)
        ) : !data?.length ? (
          <EmptyState illustration="chair" title="No one here yet" body="Try another topic, or check back soon as new members join." />
        ) : (
          <ul className="space-y-3">
            {data.map(({ member: m, matchPct }) => {
              const matched = matches?.some((x) => x.id === m.id);
              const isLiked = liked.includes(m.id);
              return (
                <li key={m.id}>
                  <Card className="p-4">
                    <div className="flex gap-4">
                      <Link to={`/member/${m.id}`} className="shrink-0" aria-label={`View ${m.name}'s profile`}>
                        <Avatar name={m.name} hue={m.photoHue} size={72} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Link to={`/member/${m.id}`} className="truncate font-serif text-xl text-text hover:text-gold-light">
                            {m.name}, {m.age}
                          </Link>
                          {m.photoVerified && <VerifiedBadge className="size-4" />}
                        </div>
                        <p className="text-xs text-muted">
                          {m.city}, {m.state}
                        </p>
                        <UserTypeBadge type={m.userType} className="mt-1.5" />
                      </div>
                      <MatchRing pct={matchPct} size={52} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.mentorTopics.map((t) => (
                        <Tag key={t} label={t} highlight={t === topic} />
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" asChild>
                        <Link to={`/member/${m.id}`}>View profile</Link>
                      </Button>
                      {matched ? (
                        <Button size="sm" className="flex-1" asChild>
                          <Link to={`/messages/${m.id}`}>Message</Link>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={isLiked}
                          onClick={async () => {
                            setLiked((l) => [...l, m.id]);
                            await like(m.id);
                          }}
                        >
                          <Heart className="size-4 fill-current" /> {isLiked ? 'Liked' : 'Like'}
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
      {overlay}
    </>
  );
}
