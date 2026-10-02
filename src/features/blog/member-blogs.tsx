import { PenLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SectionTitle, Skeleton } from '@/components/ui/misc';
import { useMemberBlogs } from '@/features/queries';
import { BlogCard } from './blog-card';

/** A member's published blogs, shown on profiles. */
export function MemberBlogs({ memberId, name, hideTitle }: { memberId: string; name: string; hideTitle?: boolean }) {
  const { data, isLoading } = useMemberBlogs(memberId);
  const mine = memberId === 'me';
  if (isLoading) return <Skeleton className="h-28" />;
  const blogs = data ?? [];
  if (!blogs.length && !mine) return null;
  return (
    <section aria-label="Blogs">
      {!hideTitle && (
        <SectionTitle>
          Blogs · {blogs.length}
        </SectionTitle>
      )}
      {!blogs.length ? (
        <div className="rounded-[20px] border border-dashed border-line px-4 py-6 text-center">
          <p className="text-sm text-muted">You haven’t published a blog yet. Share a review, a guide or a story.</p>
          <Button size="sm" className="mt-3" asChild>
            <Link to="/blog/new">
              <PenLine className="size-4" /> Write a blog
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {blogs.map((b) => (
            <li key={b.id}>
              <BlogCard post={b} />
            </li>
          ))}
        </ul>
      )}
      {mine && blogs.length > 0 && (
        <Button variant="secondary" block className="mt-3" asChild>
          <Link to="/blog/new">
            <PenLine className="size-4 text-gold" /> Write another blog
          </Link>
        </Button>
      )}
      <span className="sr-only">{mine ? 'Your blogs' : `${name}'s blogs`}</span>
    </section>
  );
}
