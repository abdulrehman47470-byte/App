import { Clock, Play, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { CigarBand } from '@/components/brand/ornaments';
import { Frame } from '@/components/layout/frame';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Card, Segmented, Skeleton } from '@/components/ui/misc';
import { EFFECTIVE_DATE, ETHICS_SUMMARY, LEGAL_DOCS, PHOTO_RULES } from '@/content/legal';
import { usePost, usePosts, useSessions, useSessionVideo } from '@/features/queries';
import type { BlogPost } from '@/types';

function Thumb({ hue, className, children }: { hue: number; className?: string; children?: ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{
        background: `radial-gradient(80% 70% at 30% 30%, hsl(${hue} 55% 32%), hsl(${hue} 40% 12%) 60%, hsl(25 30% 5%))`,
      }}
    >
      <svg viewBox="0 0 100 60" className="absolute inset-0 size-full opacity-40" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect x="18" y="36" width="64" height="7" rx="3.5" fill={`hsl(${hue} 45% 22%)`} />
        <rect x="60" y="35.5" width="8" height="8" fill={`hsl(${hue + 10} 70% 55%)`} opacity=".7" />
        <path d="M82 38c6-4 0-9 5-13s-1-9 3-12" stroke="hsl(35 30% 85%)" strokeOpacity=".4" strokeWidth="1.2" fill="none" />
      </svg>
      {children}
    </div>
  );
}

export function SessionsPage() {
  const { data, isLoading } = useSessions();
  return (
    <>
      <PageHeader title="Stogie Sessions" back subtitle="Short videos from the lounge" />
      <PageBody>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
            ))}
          </div>
        ) : !data?.length ? (
          <EmptyState illustration="chair" title="No sessions yet" body="New videos are on the way." />
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {data.map((s) => (
              <li key={s.id}>
                <Link to={`/sessions/${s.id}`} className="group block overflow-hidden rounded-[20px] border border-line bg-surface transition-colors hover:border-line-strong">
                  <Thumb hue={s.hue} className="aspect-video">
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-11 place-items-center rounded-full bg-bg/80 transition-transform group-hover:scale-110">
                        <Play className="ml-0.5 size-5 fill-gold text-gold" />
                      </span>
                    </span>
                    <span className="absolute bottom-1.5 right-2 rounded bg-bg/80 px-1.5 text-[10px] text-text">{s.durationMin} min</span>
                  </Thumb>
                  <p className="line-clamp-2 p-3 text-sm font-medium leading-snug text-text">{s.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

export function SessionDetailPage() {
  const { id = '' } = useParams();
  const { data: s, isLoading } = useSessionVideo(id);
  return (
    <>
      <PageHeader title="Stogie Sessions" back />
      {isLoading ? (
        <Skeleton className="aspect-video rounded-none" />
      ) : !s ? (
        <EmptyState illustration="ashtray" title="Video not found" body="This session may have been removed." />
      ) : (
        <>
          {/* Phase 7: <iframe src="https://player.vimeo.com/video/{vimeoId}?dnt=1" …> */}
          <Thumb hue={s.hue} className="aspect-video">
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-bg/80">
                  <Play className="ml-1 size-7 fill-gold text-gold" />
                </span>
                <p className="mt-3 text-xs text-muted">Vimeo player placeholder</p>
              </div>
            </div>
          </Thumb>
          <PageBody>
            <h2 className="font-serif text-[26px] leading-tight text-text">{s.title}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Clock className="size-3.5" /> {s.durationMin} minutes
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-text/90">{s.description}</p>
          </PageBody>
        </>
      )}
    </>
  );
}

const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

export function BlogPage() {
  const { data, isLoading } = usePosts();
  const [cat, setCat] = useState<'All' | BlogPost['category']>('All');
  const list = data?.filter((p) => cat === 'All' || p.category === cat);
  return (
    <>
      <PageHeader title="Stogie Blog" back />
      <PageBody className="space-y-4">
        <Segmented
          label="Category"
          value={cat}
          onChange={setCat}
          options={[
            { value: 'All', label: 'All' },
            { value: 'Reviews', label: 'Reviews' },
            { value: 'Guides', label: 'Guides' },
            { value: 'Culture', label: 'Culture' },
          ]}
        />
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28" />)
        ) : !list?.length ? (
          <EmptyState illustration="humidor" title="Nothing here yet" body="No articles in this category yet." />
        ) : (
          <ul className="space-y-3">
            {list.map((p, i) => (
              <li key={p.id}>
                <Link to={`/blog/${p.slug}`} className="group flex gap-4 rounded-[20px] border border-line bg-surface p-3 transition-colors hover:border-line-strong">
                  <Thumb hue={p.hue} className={i === 0 ? 'size-28 shrink-0 rounded-[14px]' : 'size-24 shrink-0 rounded-[14px]'} />
                  <div className="min-w-0 py-1">
                    <p className="micro-label !text-[10px] !text-gold">{p.category}</p>
                    <h2 className="mt-1 line-clamp-2 font-serif text-lg leading-snug text-text group-hover:text-gold-light">{p.title}</h2>
                    <p className="mt-1 text-xs text-faint">
                      {fmtDate(p.publishedAt)} · {p.readMin} min read
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

export function BlogPostPage() {
  const { slug = '' } = useParams();
  const { data: p, isLoading } = usePost(slug);
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
        <article>
          <Thumb hue={p.hue} className="h-48" />
          <PageBody>
            <p className="micro-label !text-gold">{p.category}</p>
            <h1 className="mt-2 font-serif text-[30px] leading-tight text-text">{p.title}</h1>
            <p className="mt-2 text-xs text-faint">
              {fmtDate(p.publishedAt)} · {p.readMin} min read
            </p>
            <CigarBand className="my-5" />
            <div className="space-y-4 text-[16px] leading-[1.7] text-text/90">
              {p.body.map((para, i) => (
                <p key={i} className={i === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-5xl first-letter:leading-none first-letter:text-gold' : undefined}>
                  {para}
                </p>
              ))}
            </div>
          </PageBody>
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
