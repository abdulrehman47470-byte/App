import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { SafetyBanner } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { SearchInput, Skeleton } from '@/components/ui/misc';
import { useConversations, useMatches } from '@/features/queries';
import { cn, timeAgo } from '@/lib/utils';

export default function Messages() {
  const { data, isLoading } = useConversations();
  const [q, setQ] = useState('');
  const { data: matches } = useMatches();
  const fresh = matches?.filter((m) => !m.hasMessages) ?? [];
  const list = data?.filter((c) => c.member.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHeader title="Messages" large />
      <PageBody className="space-y-4">
        <SafetyBanner />
        {fresh.length > 0 && (
          <section aria-label="New connections">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="micro-label">New connections</h2>
              <Link to="/matches" className="text-xs font-medium text-gold hover:underline">
                See all connections
              </Link>
            </div>
            <ul className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
              {fresh.map((m) => (
                <li key={m.id}>
                  <Link to={`/messages/${m.id}`} className="flex w-[68px] flex-col items-center gap-1.5 text-center">
                    <span className="gold-gradient rounded-full p-[2.5px] shadow-[var(--shadow-glow)]">
                      <Avatar name={m.member.name} hue={m.member.photoHue} src={m.member.photo} size={60} className="border-2 border-bg" />
                    </span>
                    <span className="w-full truncate text-xs text-text">{m.member.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {!!data?.length && <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" aria-label="Search conversations" />}
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[72px]" />)
        ) : !data?.length ? (
          <EmptyState
            illustration="ashtray"
            title="No conversations yet"
            body="Connect with a member, then say hello. Only connected members can message each other."
            action={
              <Button variant="outline" asChild>
                <Link to="/matches">See your connections</Link>
              </Button>
            }
          />
        ) : (
          <ul className="-mx-4">
            {list!.map((c) => (
              <li key={c.id}>
                <Link to={`/messages/${c.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface">
                  <Avatar name={c.member.name} hue={c.member.photoHue} src={c.member.photo} size={56} ring={c.unread > 0} />
                  <div className="min-w-0 flex-1 border-b border-line/50 pb-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('text-[15px] text-text', c.unread > 0 && 'font-semibold')}>{c.member.name}</p>
                      <time dateTime={c.lastAt} className={cn('text-xs', c.unread ? 'text-gold' : 'text-faint')}>
                        {timeAgo(c.lastAt)}
                      </time>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className={cn('flex-1 truncate text-sm', c.unread ? 'text-text' : 'text-muted')}>{c.lastMessage}</p>
                      {c.unread > 0 && (
                        <span className="gold-gradient grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold text-gold-ink" aria-label={`${c.unread} unread`}>
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {!list!.length && <li className="py-10 text-center text-sm text-muted">No conversations match “{q}”.</li>}
          </ul>
        )}
      </PageBody>
    </>
  );
}
