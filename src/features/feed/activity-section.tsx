import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionTitle, Skeleton } from '@/components/ui/misc';
import { useMemberPosts } from '@/features/queries';
import { PostCard } from './post-card';

/** LinkedIn-style "Activity": a member's recent posts on their profile. */
export function ActivitySection({ memberId, name }: { memberId: string; name: string }) {
  const { data, isLoading } = useMemberPosts(memberId);
  const [all, setAll] = useState(false);
  if (isLoading) return <Skeleton className="h-40" />;
  const posts = data ?? [];
  return (
    <section aria-label="Activity">
      <SectionTitle>Activity · {posts.length} {posts.length === 1 ? 'post' : 'posts'}</SectionTitle>
      {!posts.length ? (
        <p className="rounded-[20px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
          {memberId === 'me' ? 'You have not posted yet. Share what you are smoking on the Home feed.' : `${name} has not posted yet.`}
        </p>
      ) : (
        <div className="space-y-3">
          {(all ? posts : posts.slice(0, 2)).map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
          {posts.length > 2 && !all && (
            <Button variant="secondary" block onClick={() => setAll(true)}>
              Show all {posts.length} posts
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
