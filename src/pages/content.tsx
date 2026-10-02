import { Clock, GraduationCap, PenLine, Play, Trash2, TriangleAlert, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { CigarBand } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { Frame } from '@/components/layout/frame';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Card, Skeleton } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { EFFECTIVE_DATE, ETHICS_SUMMARY, LEGAL_DOCS, PHOTO_RULES } from '@/content/legal';
import { BlogCard, BlogCover, Byline, FeaturedBlogCard } from '@/features/blog/blog-card';
import { BlogBlocks } from '@/features/blog/blog-editor';
import { useBlogActions, usePost, usePosts, useSessions, useSessionVideo } from '@/features/queries';
import { cn } from '@/lib/utils';
import type { BlogPost, SessionVideo } from '@/types';

export { BlogEditorPage } from '@/features/blog/blog-editor';

const sm = (src: string) => src.replace(/\.webp$/, '-sm.webp');
const SESSION_CATEGORIES = ['All', 'Basics', 'Tasting', 'Pairing', 'Care', 'Culture'] as const;

function SessionThumb({ s, large }: { s: SessionVideo; large?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden bg-surface-2', large ? 'aspect-[16/9]' : 'aspect-video')}>
      <img src={large ? s.thumb : sm(s.thumb)} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" aria-hidden />
      <span className="absolute inset-0 grid place-items-center">
        <span className={cn('grid place-items-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110', large ? 'size-16' : 'size-11')}>
          <Play className={cn('ml-0.5 fill-gold text-gold', large ? 'size-7' : 'size-5')} />
        </span>
      </span>
      <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">{s.durationMin}:00</span>
      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">{s.category}</span>
    </div>
  );
}

export function SessionsPage() {
  const { data, isLoading } = useSessions();
  const [cat, setCat] = useState<(typeof SESSION_CATEGORIES)[number]>('All');
  const list = data?.filter((s) => cat === 'All' || s.category === cat) ?? [];
  const [featured, ...rest] = list;
  return (
    <>
      <PageHeader title="Stogie Sessions" back subtitle="Short lessons from members who know the leaf" />
      <PageBody className="space-y-4">
        <div role="radiogroup" aria-label="Category" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {SESSION_CATEGORIES.map((c) => (
            <Chip key={c} size="sm" role="radio" label={c} selected={cat === c} onToggle={() => setCat(c)} />
          ))}
        </div>
        {isLoading ? (
          <>
            <Skeleton className="aspect-video" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/5]" />
              ))}
            </div>
          </>
        ) : !featured ? (
          <EmptyState illustration="chair" title="No sessions yet" body="New videos in this category are on the way." />
        ) : (
          <>
            <Link to={`/sessions/${featured.id}`} className="group block overflow-hidden rounded-[22px] border border-line bg-surface transition-colors hover:border-line-strong">
              <SessionThumb s={featured} large />
              <div className="space-y-1 p-4">
                <p className="micro-label !text-[10px] !text-gold">Featured · {featured.level}</p>
                <h2 className="font-serif text-[22px] leading-tight text-text group-hover:text-gold-light">{featured.title}</h2>
                <p className="line-clamp-2 text-sm text-muted">{featured.description}</p>
                <p className="flex items-center gap-1.5 pt-1 text-xs text-faint">
                  <UserRound className="size-3.5" /> {featured.host}
                </p>
              </div>
            </Link>
            {rest.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {rest.map((s) => (
                  <li key={s.id}>
                    <SessionCard s={s} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </PageBody>
    </>
  );
}

function SessionCard({ s }: { s: SessionVideo }) {
  return (
    <Link to={`/sessions/${s.id}`} className="group block h-full overflow-hidden rounded-[18px] border border-line bg-surface transition-colors hover:border-line-strong">
      <SessionThumb s={s} />
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-text group-hover:text-gold-light">{s.title}</p>
        <p className="truncate text-[11px] text-faint">
          {s.host} · {s.level}
        </p>
      </div>
    </Link>
  );
}

export function SessionDetailPage() {
  const { id = '' } = useParams();
  const { data: s, isLoading } = useSessionVideo(id);
  const { data: all } = useSessions();
  const more = (all ?? []).filter((x) => x.id !== id).sort((a, b) => Number(b.category === s?.category) - Number(a.category === s?.category)).slice(0, 4);
  return (
    <>
      <PageHeader title="Stogie Sessions" back />
      {isLoading ? (
        <Skeleton className="aspect-video rounded-none" />
      ) : !s ? (
        <EmptyState illustration="ashtray" title="Video not found" body="This session may have been removed." />
      ) : (
        <>
          {/* Phase 7: <iframe src="https://player.vimeo.com/video/{vimeoId}?dnt=1" …>. Until then a demo clip plays. */}
          <div className="bg-black">
            {s.src ? (
              <video key={s.id} src={s.src} poster={s.thumb} controls playsInline preload="metadata" className="mx-auto aspect-video w-full max-w-3xl bg-black object-contain" aria-label={s.title} />
            ) : (
              <img src={s.thumb} alt="" className="aspect-video w-full object-cover" />
            )}
          </div>
          <PageBody className="space-y-5">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-gold-fill px-2.5 py-1 text-[11px] font-semibold text-gold-light">{s.category}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">
                  <GraduationCap className="size-3.5" /> {s.level}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">
                  <Clock className="size-3.5" /> {s.durationMin} min
                </span>
              </div>
              <h2 className="mt-3 font-serif text-[26px] leading-tight text-text">{s.title}</h2>
              <div className="mt-3 flex items-center gap-2.5">
                <Avatar name={s.host} size={36} />
                <div>
                  <p className="text-sm font-semibold text-text">{s.host}</p>
                  <p className="text-xs text-faint">Session host</p>
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-text/90">{s.description}</p>
              <p className="mt-3 text-[11px] text-faint">Demo clip shown for preview. The full lesson streams here at launch.</p>
            </div>
            {more.length > 0 && (
              <section aria-labelledby="more-sessions" className="space-y-3 border-t border-line pt-5">
                <h3 id="more-sessions" className="micro-label">
                  More sessions
                </h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {more.map((x) => (
                    <li key={x.id}>
                      <SessionCard s={x} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </PageBody>
        </>
      )}
    </>
  );
}

type BlogTab = 'All' | BlogPost['category'] | 'Mine';
const BLOG_TABS: BlogTab[] = ['All', 'Guides', 'Reviews', 'Culture', 'Mine'];

export function BlogPage() {
  const { data, isLoading } = usePosts();
  const [tab, setTab] = useState<BlogTab>('All');
  const list = data?.filter((p) => (tab === 'All' ? true : tab === 'Mine' ? p.author?.id === 'me' : p.category === tab)) ?? [];
  const [first, ...rest] = list;
  return (
    <>
      <PageHeader
        title="Stogie Blog"
        back
        action={
          <Button size="sm" asChild>
            <Link to="/blog/new">
              <PenLine className="size-4" /> Write
            </Link>
          </Button>
        }
      />
      <PageBody className="space-y-4">
        <div role="radiogroup" aria-label="Show" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {BLOG_TABS.map((t) => (
            <Chip key={t} size="sm" role="radio" label={t === 'Mine' ? 'My blogs' : t} selected={tab === t} onToggle={() => setTab(t)} />
          ))}
        </div>
        {isLoading ? (
          <>
            <Skeleton className="aspect-[16/10]" />
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </>
        ) : !first ? (
          tab === 'Mine' ? (
            <EmptyState
              illustration="humidor"
              title="You haven’t written a blog yet"
              body="Share a review, a guide or a story from the lounge. It will appear here and on your profile."
              action={
                <Button asChild>
                  <Link to="/blog/new">
                    <PenLine className="size-4" /> Write your first blog
                  </Link>
                </Button>
              }
            />
          ) : (
            <EmptyState illustration="humidor" title="Nothing here yet" body="No articles in this category yet." />
          )
        ) : (
          <>
            <FeaturedBlogCard post={first} />
            <ul className="space-y-3">
              {rest.map((p) => (
                <li key={p.id}>
                  <BlogCard post={p} />
                </li>
              ))}
            </ul>
          </>
        )}
      </PageBody>
    </>
  );
}

export function BlogPostPage() {
  const { slug = '' } = useParams();
  const { data: p, isLoading } = usePost(slug);
  const { remove } = useBlogActions();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const mine = p?.author?.id === 'me';
  return (
    <>
      <PageHeader title="Stogie Blog" back />
      {isLoading ? (
        <PageBody className="space-y-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-8" />
          <Skeleton className="h-32" />
        </PageBody>
      ) : !p ? (
        <EmptyState illustration="ashtray" title="Article not found" body="It may have been unpublished." />
      ) : (
        <article className="mx-auto max-w-2xl">
          <BlogCover post={p} sizes="lg" className="aspect-[16/9] sm:mt-4 sm:rounded-[20px]" />
          <PageBody>
            <p className="micro-label !text-gold">{p.category}</p>
            <h1 className="mt-2 font-serif text-[32px] leading-[1.15] text-text">{p.title}</h1>
            <div className="mt-3 flex items-center justify-between gap-3">
              {p.author ? (
                <Link to={mine ? '/profile' : `/member/${p.author.id}`} className="min-w-0">
                  <Byline post={p} />
                </Link>
              ) : (
                <Byline post={p} />
              )}
              {mine && (
                <button type="button" onClick={() => setConfirm(true)} aria-label="Delete this blog" className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <CigarBand className="my-5" />
            {p.blocks?.length ? (
              <BlogBlocks blocks={p.blocks} />
            ) : (
              <BlogBlocks blocks={p.body.map((text) => ({ type: 'p' as const, text }))} />
            )}
            {p.author && !mine && (
              <Card className="mt-8 flex items-center gap-3 p-4">
                <Avatar name={p.author.name} src={p.author.photoUrl} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-faint">Written by</p>
                  <p className="truncate font-semibold text-text">{p.author.name}</p>
                </div>
                <Button size="sm" variant="secondary" asChild>
                  <Link to={`/member/${p.author.id}`}>View profile</Link>
                </Button>
              </Card>
            )}
          </PageBody>
          <Sheet
            open={confirm}
            onOpenChange={setConfirm}
            title="Delete this blog?"
            description="It will be removed from the blog and your profile."
            footer={
              <div className="flex gap-3">
                <Button variant="secondary" block onClick={() => setConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="dangerSolid"
                  block
                  onClick={async () => {
                    await remove.mutateAsync(p.id);
                    toast('Blog deleted');
                    navigate('/blog', { replace: true });
                  }}
                >
                  Delete
                </Button>
              </div>
            }
          >
            <span />
          </Sheet>
        </article>
      )}
    </>
  );
}

/** Legal pages. Public route, reachable during sign-up and from Settings. */
export function LegalPage() {
  const { doc } = useParams();
  const meta = LEGAL_DOCS.find((d) => d.slug === doc);

  const body = !meta ? (
    <EmptyState illustration="ashtray" title="Page not found" body="This document does not exist." />
  ) : (
    <PageBody className="space-y-5">
      <p className="text-xs text-faint">Effective date: {EFFECTIVE_DATE}</p>
      <div className="flex items-start gap-2.5 rounded-[14px] border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <p>
          Placeholder. The exact text from <strong>{meta.source}</strong> will be inserted here unchanged in Phase 7.
        </p>
      </div>
      {meta.slug === 'ethics' ? (
        <>
          <Card className="p-5">
            <h2 className="micro-label mb-3">Summary</h2>
            <ul className="space-y-3">
              {ETHICS_SUMMARY.map((r) => (
                <li key={r.title}>
                  <p className="font-medium text-text">{r.title}</p>
                  <p className="text-sm text-muted">{r.body}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="micro-label mb-3">Photo rules</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-text/90">
              {PHOTO_RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-4 !animate-none opacity-60" />
          ))}
        </div>
      )}
    </PageBody>
  );

  return (
    <Frame>
      <PageHeader title={meta?.title ?? 'Legal'} back />
      {body}
    </Frame>
  );
}
