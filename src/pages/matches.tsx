import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/brand/empty-state';
import { UserTypeBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Badge, SectionTitle, Skeleton } from '@/components/ui/misc';
import { useMatches } from '@/features/queries';
import { timeAgo } from '@/lib/utils';

export default function Matches() {
  const { data, isLoading } = useMatches();
  const fresh = data?.filter((m) => !m.hasMessages) ?? [];

  return (
    <>
      <PageHeader title="Connections" large subtitle={data ? `${data.length} mutual connections` : undefined} />
      <PageBody className="space-y-7">
        {isLoading ? (
          <>
            <div className="flex gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="size-20 rounded-full" />
              ))}
            </div>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </>
        ) : !data?.length ? (
          <EmptyState
            illustration="chair"
            title="No connections yet"
            body="When someone you asked to connect connects back, they will show up here."
            action={
              <Button asChild>
                <Link to="/discover">Start discovering</Link>
              </Button>
            }
          />
        ) : (
          <>
            <section>
              <SectionTitle>New connections</SectionTitle>
              {fresh.length ? (
                <ul className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
                  {fresh.map((m) => (
                    <li key={m.id}>
                      <Link to={`/messages/${m.id}`} className="flex w-20 flex-col items-center gap-2 text-center">
                        <span className="relative rounded-full p-[3px] gold-gradient shadow-[var(--shadow-glow)]">
                          <Avatar name={m.member.name} hue={m.member.photoHue} src={m.member.photo} size={70} className="border-2 border-bg" />
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">NEW</span>
                        </span>
                        <span className="truncate text-sm text-text">{m.member.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">You have said hello to all your connections.</p>
              )}
            </section>

            <section>
              <SectionTitle>All connections</SectionTitle>
              <ul className="divide-y divide-line/60 overflow-hidden rounded-[20px] border border-line bg-surface">
                {data.map((m) => (
                  <li key={m.id}>
                    <Link to={`/member/${m.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                      <Avatar name={m.member.name} hue={m.member.photoHue} src={m.member.photo} size={52} ring={!m.hasMessages} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[15px] font-medium text-text">
                          {m.member.name}, {m.member.age}
                          {!m.hasMessages && <Badge tone="gold">Say hello</Badge>}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                          <UserTypeBadge type={m.member.userType} className="!py-0 text-[10px]" />
                          Connected {timeAgo(m.matchedAt)} ago
                        </p>
                      </div>
                      <ChevronRight className="size-5 text-faint" strokeWidth={1.5} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </PageBody>
    </>
  );
}
