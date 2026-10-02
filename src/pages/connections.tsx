import { ChevronRight, Clock, Inbox, MessageCircle, Send, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { UserTypeBadge, VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { ConnectButton } from '@/features/connections/connect-button';
import { useConnections } from '@/features/queries';
import { ago, cn } from '@/lib/utils';
import type { Member } from '@/types';

type Tab = 'received' | 'sent' | 'connected';

/** Connection activity: requests received, requests sent (pending) and connections. */
export default function ConnectionsPage() {
  const { data, isLoading } = useConnections();
  const [params, setParams] = useSearchParams();
  const counts = { received: data?.received.length ?? 0, sent: data?.sent.length ?? 0, connected: data?.connected.length ?? 0 };
  const tab = (params.get('tab') as Tab | null) ?? (counts.received ? 'received' : 'connected');
  const tabs: { id: Tab; label: string; icon: typeof Inbox }[] = [
    { id: 'received', label: 'Received', icon: Inbox },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'connected', label: 'Connected', icon: UsersRound },
  ];

  return (
    <>
      <PageHeader title="Connections" back subtitle={data ? `${counts.connected} connections · ${counts.received} waiting on you` : undefined} />
      <div role="tablist" aria-label="Connection activity" className="sticky top-[76px] z-20 grid grid-cols-3 gap-1 border-b border-line bg-bg px-3 py-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setParams({ tab: id }, { replace: true })}
              className={cn(
                'flex h-11 items-center justify-center gap-1.5 rounded-[12px] text-sm font-medium transition-colors',
                active ? 'bg-gold-fill text-gold-light' : 'text-muted hover:bg-surface-2 hover:text-text',
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
              <span className={cn('min-w-5 rounded-full px-1.5 text-[11px] font-bold', active ? 'bg-brand-gold text-gold-ink' : 'bg-surface-2 text-muted')}>{counts[id]}</span>
            </button>
          );
        })}
      </div>

      <PageBody className="space-y-3">
        {isLoading || !data ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[92px]" />)
        ) : tab === 'received' ? (
          data.received.length ? (
            <ul className="space-y-3">
              {data.received.map((r) => (
                <li key={r.member.id}>
                  <PersonRow member={r.member} note={`Wants to connect · ${ago(r.at)}`}>
                    <ConnectButton memberId={r.member.id} name={r.member.name} size="sm" block />
                  </PersonRow>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState illustration="chair" title="No requests right now" body="When someone asks to connect with you, it will show up here." />
          )
        ) : tab === 'sent' ? (
          data.sent.length ? (
            <ul className="space-y-3">
              {data.sent.map((r) => (
                <li key={r.member.id}>
                  <PersonRow member={r.member} note={`Request sent ${ago(r.at)}`} pending>
                    <ConnectButton memberId={r.member.id} name={r.member.name} size="sm" block />
                  </PersonRow>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              illustration="humidor"
              title="No pending requests"
              body="Requests you send from Discover, Mentors or the map appear here until they’re answered."
              action={
                <Button asChild>
                  <Link to="/discover">Discover members</Link>
                </Button>
              }
            />
          )
        ) : data.connected.length ? (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-[20px] border border-line bg-surface">
            {data.connected.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/member/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={m.member.name} src={m.member.photo} size={52} ring={!m.hasMessages} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[15px] font-semibold text-text">
                      <span className="truncate">{m.member.name}</span>
                      {m.member.photoVerified && <VerifiedBadge className="size-4" />}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {m.member.city}, {m.member.state} · connected {ago(m.matchedAt)}
                    </p>
                  </div>
                </Link>
                <Button size="icon" variant="secondary" asChild aria-label={`Message ${m.member.name}`}>
                  <Link to={`/messages/${m.id}`}>
                    <MessageCircle className="size-5" strokeWidth={1.75} />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState illustration="chair" title="No connections yet" body="Connect with members in Discover. When they accept, they appear here." />
        )}
      </PageBody>
    </>
  );
}

function PersonRow({ member: m, note, pending, children }: { member: Member; note: string; pending?: boolean; children: ReactNode }) {
  return (
    <div className="surface rounded-[20px] p-4">
      <Link to={`/member/${m.id}`} className="flex items-center gap-3">
        <Avatar name={m.name} src={m.photo} size={56} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold text-text">
            <span className="truncate">
              {m.name}, {m.age}
            </span>
            {m.photoVerified && <VerifiedBadge className="size-4" />}
          </p>
          <p className="truncate text-xs text-muted">
            {m.city}, {m.state}
          </p>
          <p className={cn('mt-1 flex items-center gap-1 text-xs', pending ? 'text-faint' : 'font-medium text-gold')}>
            {pending && <Clock className="size-3" />} {note}
          </p>
        </div>
        <UserTypeBadge type={m.userType} className="hidden shrink-0 min-[380px]:inline-flex" />
        <ChevronRight className="size-5 shrink-0 text-faint" strokeWidth={1.5} />
      </Link>
      <div className="mt-3">{children}</div>
    </div>
  );
}
