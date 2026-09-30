import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { SafetyBanner } from '@/components/brand/ornaments';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/misc';
import { Composer } from '@/features/feed/composer';
import { PostCard } from '@/features/feed/post-card';
import { useFeed, useFeedPost } from '@/features/queries';
import type { FeedFilter } from '@/types';

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'near', label: 'Near me' },
  { id: 'checkin', label: 'Check-ins' },
  { id: 'question', label: 'Questions' },
  { id: 'saved', label: 'Saved' },
];

export const PostSkeleton = () => (
  <div className="surface space-y-3 rounded-[20px] p-4">
    <div className="flex gap-3">
      <Skeleton className="size-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-16" />
    <Skeleton className="h-40" />
  </div>
);

export default function Feed() {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const { data, isLoading } = useFeed(filter);

  return (
    <>
      <PageHeader title="The Lounge" large subtitle="What members are smoking and sharing" />
      <PageBody className="space-y-4">
        <Composer />
        <div role="radiogroup" aria-label="Filter posts" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <Chip key={f.id} size="sm" role="radio" label={f.label} selected={filter === f.id} onToggle={() => setFilter(f.id)} />
          ))}
        </div>
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : !data?.length ? (
          <EmptyState
            illustration="ashtray"
            title="Quiet in here"
            body={
              filter === 'saved'
                ? 'Tap Save on any post to keep it here for later.'
                : filter === 'near'
                  ? 'No posts from members near you yet. Be the first to share.'
                  : 'No posts yet. Start the conversation.'
            }
          />
        ) : (
          <ul className="space-y-4">
            {data.map((p) => (
              <li key={p.id} className="cv-auto">
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        )}
        <SafetyBanner />
      </PageBody>
    </>
  );
}

export function PostPage() {
  const { id = '' } = useParams();
  const { data: post, isLoading } = useFeedPost(id);
  return (
    <>
      <PageHeader title="Post" back />
      <PageBody>
        {isLoading ? (
          <PostSkeleton />
        ) : !post ? (
          <EmptyState
            illustration="ashtray"
            title="Post unavailable"
            body="It may have been deleted, or you have blocked its author."
            action={
              <Button variant="outline" asChild>
                <Link to="/feed">Back to the feed</Link>
              </Button>
            }
          />
        ) : (
          <PostCard post={post} defaultOpen />
        )}
      </PageBody>
    </>
  );
}
