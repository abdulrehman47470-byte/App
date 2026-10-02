import { BookOpen, ChevronRight, Clapperboard, Info, MapPin, MessageSquareText, Navigation, Phone, Search, UsersRound } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { PageBody, PageHeader } from '@/components/layout/page';
import { MapView, type MapMarker } from '@/components/map/map-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Select } from '@/components/ui/field';
import { Badge, Card, SearchInput, Skeleton } from '@/components/ui/misc';
import { MOCK_LOUNGES } from '@/data/mock/content';
import { userTypeLabel } from '@/data/user-types';
import { BlogCard } from '@/features/blog/blog-card';
import { ConnectButton } from '@/features/connections/connect-button';
import { useLounges, useSearch } from '@/features/queries';
import { cn, timeAgo } from '@/lib/utils';
import type { DiscoverCard, Lounge, Post, SearchResults, SessionVideo } from '@/types';

const STATES = [...new Set(MOCK_LOUNGES.map((l) => l.state))].sort();
const TYPES = [...new Set(MOCK_LOUNGES.map((l) => l.venueType))].sort();

type Tab = 'all' | 'members' | 'lounges' | 'posts' | 'blogs' | 'sessions';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'members', label: 'Members' },
  { id: 'lounges', label: 'Lounges' },
  { id: 'posts', label: 'Posts' },
  { id: 'blogs', label: 'Blogs' },
  { id: 'sessions', label: 'Sessions' },
];
const SUGGESTIONS = ['Padrón', 'Bourbon', 'Maduro', 'Humidor', 'Miami', 'Jazz', 'Mentor', 'Pairing'];

/** One search for the whole community: members, lounges (with the map), posts, blogs and sessions. */
export default function StogieSearch() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab | null) ?? 'all';
  const [q, setQ] = useState(params.get('q') ?? '');
  const query = useDeferredValue(q.trim());
  const { data: results, isFetching } = useSearch(tab === 'lounges' ? '' : query);

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    next.delete('focus');
    setParams(next, { replace: true });
  };
  const counts = results && query ? { members: results.members.length, lounges: results.lounges.length, posts: results.posts.length, blogs: results.blogs.length, sessions: results.sessions.length } : undefined;

  return (
    <>
      <PageHeader title="Stogie Search" back subtitle="Members, lounges, posts, blogs and sessions" />
      <div className="sticky top-[76px] z-20 space-y-2 border-b border-line/60 bg-bg px-4 pb-2 pt-3">
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === 'lounges' ? 'Search lounges, cities…' : 'Search Daily Stogie'}
          aria-label="Search"
          autoFocus={!params.get('focus')}
        />
        <div role="radiogroup" aria-label="Result type" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {TABS.map((t) => (
            <Chip
              key={t.id}
              size="sm"
              role="radio"
              label={counts && t.id !== 'all' ? `${t.label} ${counts[t.id]}` : t.label}
              selected={tab === t.id}
              onToggle={() => setTab(t.id)}
            />
          ))}
        </div>
      </div>

      {tab === 'lounges' ? (
        <LoungeFinder q={q} />
      ) : (
        <PageBody className="space-y-6">
          {!query ? (
            <Explore onPick={setQ} onTab={setTab} />
          ) : !results ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16" />)
          ) : (
            <Results results={results} q={query} tab={tab} onTab={setTab} stale={isFetching} />
          )}
        </PageBody>
      )}
    </>
  );
}

function Explore({ onPick, onTab }: { onPick: (q: string) => void; onTab: (t: Tab) => void }) {
  const shortcuts: { label: string; body: string; icon: typeof MapPin; onClick?: () => void; to?: string }[] = [
    { label: 'Find a lounge', body: 'Map, hours and directions', icon: MapPin, onClick: () => onTab('lounges') },
    { label: 'Discover members', body: 'People near you', icon: UsersRound, to: '/discover' },
    { label: 'Stogie Sessions', body: 'Short video lessons', icon: Clapperboard, to: '/sessions' },
    { label: 'Stogie Blog', body: 'Guides, reviews, culture', icon: BookOpen, to: '/blog' },
  ];
  return (
    <>
      <section aria-labelledby="try" className="space-y-3">
        <h2 id="try" className="micro-label">
          Try searching
        </h2>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => onPick(s)} className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm text-text transition-colors hover:border-brand-gold">
              <Search className="size-3.5 text-faint" /> {s}
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby="explore" className="space-y-3">
        <h2 id="explore" className="micro-label">
          Explore
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {shortcuts.map(({ label, body, icon: Icon, onClick, to }) => {
            const inner = (
              <>
                <span className="gold-gradient grid size-10 place-items-center rounded-[12px] text-gold-ink">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="mt-3 block text-sm font-semibold text-text">{label}</span>
                <span className="block text-xs text-muted">{body}</span>
              </>
            );
            const cls = 'block h-full rounded-[18px] border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong';
            return (
              <li key={label}>
                {to ? (
                  <Link to={to} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={onClick} className={cn(cls, 'w-full')}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function Results({ results: r, q, tab, onTab, stale }: { results: SearchResults; q: string; tab: Tab; onTab: (t: Tab) => void; stale: boolean }) {
  const total = r.members.length + r.lounges.length + r.posts.length + r.blogs.length + r.sessions.length;
  if (!total) return <EmptyState illustration="ashtray" title={`No results for “${q}”`} body="Check the spelling, or try a cigar, a city or a member’s name." />;
  const limit = tab === 'all' ? 3 : Infinity;
  const show = (t: Tab) => tab === 'all' || tab === t;

  return (
    <div className={cn('space-y-7 transition-opacity', stale && 'opacity-60')}>
      {tab !== 'all' && !r[tab].length && <EmptyState illustration="ashtray" title={`No ${tab} match “${q}”`} body="Try the All tab to see results of other kinds." />}
      {show('members') && r.members.length > 0 && (
        <Group title="Members" count={r.members.length} limit={limit} onMore={() => onTab('members')}>
          {r.members.slice(0, limit).map((c) => (
            <MemberRow key={c.member.id} card={c} q={q} />
          ))}
        </Group>
      )}
      {show('lounges') && r.lounges.length > 0 && (
        <Group title="Lounges" count={r.lounges.length} limit={limit} onMore={() => onTab('lounges')}>
          {r.lounges.slice(0, limit).map((l) => (
            <LoungeRow key={l.id} lounge={l} q={q} />
          ))}
        </Group>
      )}
      {show('posts') && r.posts.length > 0 && (
        <Group title="Posts" count={r.posts.length} limit={limit} onMore={() => onTab('posts')}>
          {r.posts.slice(0, limit).map((p) => (
            <PostRow key={p.id} post={p} q={q} />
          ))}
        </Group>
      )}
      {show('blogs') && r.blogs.length > 0 && (
        <Group title="Blogs" count={r.blogs.length} limit={limit} onMore={() => onTab('blogs')} plain>
          {r.blogs.slice(0, limit).map((b) => (
            <li key={b.id}>
              <BlogCard post={b} />
            </li>
          ))}
        </Group>
      )}
      {show('sessions') && r.sessions.length > 0 && (
        <Group title="Sessions" count={r.sessions.length} limit={limit} onMore={() => onTab('sessions')}>
          {r.sessions.slice(0, limit).map((s) => (
            <SessionRow key={s.id} s={s} q={q} />
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ title, count, limit, onMore, plain, children }: { title: string; count: number; limit: number; onMore: () => void; plain?: boolean; children: ReactNode }) {
  return (
    <section aria-label={title} className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <h2 className="micro-label">
          {title} <span className="text-faint">· {count}</span>
        </h2>
        {count > limit && (
          <button type="button" onClick={onMore} className="text-xs font-semibold text-gold hover:underline">
            See all {count}
          </button>
        )}
      </div>
      <ul className={plain ? 'space-y-3' : 'divide-y divide-line/70 overflow-hidden rounded-[18px] border border-line bg-surface'}>{children}</ul>
    </section>
  );
}

/** Bold the part of the text that matched the search. */
function Hl({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-gold-fill px-0.5 text-gold-light">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function snippet(text: string, q: string, len = 110) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || text.length <= len) return text.slice(0, len) + (text.length > len ? '…' : '');
  const start = Math.max(0, i - 40);
  return (start > 0 ? '…' : '') + text.slice(start, start + len) + (start + len < text.length ? '…' : '');
}

function MemberRow({ card: { member: m }, q }: { card: DiscoverCard; q: string }) {
  return (
    <li className="flex items-center gap-3 px-3.5 py-3">
      <Link to={`/member/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={m.name} src={m.photo} size={46} />
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[15px] font-semibold text-text">
            <span className="truncate">
              <Hl text={m.name} q={q} />
            </span>
            {m.photoVerified && <VerifiedBadge className="size-4" />}
          </p>
          <p className="truncate text-xs text-muted">
            {userTypeLabel(m.userType)} · {m.city}, {m.state}
          </p>
        </div>
      </Link>
      <ConnectButton memberId={m.id} name={m.name} size="sm" />
    </li>
  );
}

function LoungeRow({ lounge: l, q }: { lounge: Lounge; q: string }) {
  return (
    <li>
      <Link to={`/search?tab=lounges&focus=${l.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-surface-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-ember/10 text-ember">
          <MapPin className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-text">
            <Hl text={l.name} q={q} />
          </p>
          <p className="truncate text-xs text-muted">
            {l.venueType} · {l.city}, {l.state}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-faint" strokeWidth={1.5} />
      </Link>
    </li>
  );
}

function PostRow({ post: p, q }: { post: Post; q: string }) {
  return (
    <li>
      <Link to={`/post/${p.id}`} className="flex gap-3 px-3.5 py-3 hover:bg-surface-2">
        <Avatar name={p.author.name} src={p.author.photoUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 text-sm">
            <span className="truncate font-semibold text-text">{p.author.id === 'me' ? 'You' : p.author.name}</span>
            <span className="shrink-0 text-[11px] text-faint">{timeAgo(p.createdAt)}</span>
          </p>
          <p className="line-clamp-2 text-sm text-muted">
            <Hl text={snippet(p.body || p.cigar || '', q)} q={q} />
          </p>
        </div>
        <MessageSquareText className="mt-1 size-4 shrink-0 text-faint" />
      </Link>
    </li>
  );
}

function SessionRow({ s, q }: { s: SessionVideo; q: string }) {
  return (
    <li>
      <Link to={`/sessions/${s.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-surface-2">
        <img src={s.thumb.replace(/\.webp$/, '-sm.webp')} alt="" loading="lazy" className="h-12 w-20 shrink-0 rounded-[10px] object-cover" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[15px] font-semibold text-text">
            <Hl text={s.title} q={q} />
          </p>
          <p className="truncate text-xs text-muted">
            {s.category} · {s.host} · {s.durationMin} min
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-faint" strokeWidth={1.5} />
      </Link>
    </li>
  );
}

/** The original lounge finder: filters, map and lounge cards. */
function LoungeFinder({ q }: { q: string }) {
  const [state, setState] = useState('');
  const [venueType, setVenueType] = useState('');
  const [params] = useSearchParams();
  const [active, setActive] = useState<string | undefined>(params.get('focus') ?? undefined);
  const { data, isLoading } = useLounges({ q, state: state || undefined, venueType: venueType || undefined });
  const markers = useMemo<MapMarker[]>(() => (data ?? []).map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, kind: 'lounge', label: l.name })), [data]);
  const focused = data?.find((l) => l.id === active);
  const flyTo = useMemo<[number, number] | undefined>(() => (focused ? [focused.lat, focused.lng] : undefined), [focused]);

  // Arriving from a check-in post (?focus=l1): scroll that lounge into view.
  useEffect(() => {
    const id = params.get('focus');
    if (id && data) setTimeout(() => document.getElementById(`lounge-${id}`)?.scrollIntoView({ block: 'center' }), 300);
  }, [params, data]);

  return (
    <PageBody className="space-y-4 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <Select aria-label="State" value={state} onChange={(e) => setState(e.target.value)} className="h-10 text-sm">
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select aria-label="Venue type" value={venueType} onChange={(e) => setVenueType(e.target.value)} className="h-10 text-sm">
          <option value="">All venue types</option>
          {TYPES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>
      <MapView
        label="Lounge map"
        className="h-64"
        markers={markers}
        activeId={active}
        flyTo={flyTo}
        onSelect={(id) => {
          setActive(id);
          document.getElementById(`lounge-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />
      <p className="flex items-start gap-2 text-xs text-faint">
        <Info className="mt-0.5 size-3.5 shrink-0" /> Hours and phone numbers may change. Call ahead before you visit. Daily Stogie is a locator only and does not sell tobacco.
      </p>
      {isLoading ? (
        Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40" />)
      ) : !data?.length ? (
        <EmptyState illustration="chair" title="No lounges found" body="Try a different search or clear the filters." />
      ) : (
        <ul className="space-y-3">
          <li className="micro-label">{data.length} lounges</li>
          {data.map((l) => (
            <li key={l.id} id={`lounge-${l.id}`}>
              <LoungeCard lounge={l} active={active === l.id} onFocus={() => setActive(l.id)} />
            </li>
          ))}
        </ul>
      )}
    </PageBody>
  );
}

function LoungeCard({ lounge: l, active, onFocus }: { lounge: Lounge; active: boolean; onFocus: () => void }) {
  const address = `${l.street}, ${l.city}, ${l.state}`;
  return (
    <Card className={cn('p-4 transition-colors', active && 'border-gold')}>
      <button type="button" onClick={onFocus} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg text-text">{l.name}</h3>
            <p className="text-xs font-medium text-gold">{l.venueType}</p>
          </div>
          <Badge tone="muted">{l.metroArea}</Badge>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
          <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} /> {address}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Phone className="size-4 shrink-0" strokeWidth={1.5} /> {l.phone}
        </p>
        {l.verificationNote && <p className="mt-2 text-xs text-warning">Note: {l.verificationNote}</p>}
      </button>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" asChild>
          <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}>
            <Phone className="size-4" /> Call
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${l.name}, ${address}`)}`} target="_blank" rel="noreferrer noopener">
            <Navigation className="size-4" /> Directions
          </a>
        </Button>
      </div>
    </Card>
  );
}
