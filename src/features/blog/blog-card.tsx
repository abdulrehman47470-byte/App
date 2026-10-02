import { Link } from 'react-router-dom';
import { Avatar } from '@/components/brand/portrait';
import { useAssetUrl } from '@/features/feed/post-media';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/types';

export const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** Cover photo, or a warm gradient when the article has none. */
export function BlogCover({ post, className, sizes = 'sm' }: { post: BlogPost; className?: string; sizes?: 'sm' | 'lg' }) {
  const url = useAssetUrl(post.cover);
  const src = url && sizes === 'sm' && url.startsWith('/media/') ? url.replace(/\.webp$/, '-sm.webp') : url;
  return (
    <div
      className={cn('relative overflow-hidden bg-surface-2', className)}
      style={src ? undefined : { background: `radial-gradient(80% 70% at 30% 30%, hsl(${post.hue} 60% 62%), hsl(${post.hue} 45% 38%) 65%, hsl(25 40% 22%))` }}
    >
      {src && <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-cover" />}
    </div>
  );
}

export function Byline({ post, light }: { post: BlogPost; light?: boolean }) {
  const a = post.author;
  return (
    <p className={cn('flex min-w-0 items-center gap-1.5 text-xs', light ? 'text-on-photo/85' : 'text-faint')}>
      {a ? (
        <>
          <Avatar name={a.name} src={a.photoUrl} size={20} />
          <span className={cn('truncate font-medium', light ? 'text-on-photo' : 'text-muted')}>{a.id === 'me' ? 'You' : a.name}</span>
        </>
      ) : (
        <span className={cn('font-medium', light ? 'text-on-photo' : 'text-muted')}>Daily Stogie</span>
      )}
      <span aria-hidden>·</span>
      <span className="shrink-0">{fmtDate(post.publishedAt)}</span>
      <span aria-hidden>·</span>
      <span className="shrink-0">{post.readMin} min read</span>
    </p>
  );
}

/** Large card with the cover behind the title (first article of a list). */
export function FeaturedBlogCard({ post }: { post: BlogPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group relative block overflow-hidden rounded-[22px] border border-line">
      <BlogCover post={post} sizes="lg" className="aspect-[16/10] transition-transform duration-500 group-hover:scale-[1.02]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
        <span className="inline-block rounded-full bg-brand-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-ink">{post.category}</span>
        <h2 className="font-serif text-[24px] leading-tight text-on-photo">{post.title}</h2>
        <p className="line-clamp-2 text-sm text-on-photo/85">{post.excerpt}</p>
        <Byline post={post} light />
      </div>
    </Link>
  );
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group flex gap-4 rounded-[20px] border border-line bg-surface p-3 transition-colors hover:border-line-strong">
      <BlogCover post={post} className="size-24 shrink-0 rounded-[14px]" />
      <div className="min-w-0 flex-1 space-y-1 py-0.5">
        <p className="micro-label !text-[10px] !text-gold">{post.category}</p>
        <h3 className="line-clamp-2 font-serif text-lg leading-snug text-text group-hover:text-gold-light">{post.title}</h3>
        <Byline post={post} />
      </div>
    </Link>
  );
}
