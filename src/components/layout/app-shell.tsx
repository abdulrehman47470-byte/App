import { Compass, GraduationCap, House, Map as MapIcon, MessageCircle, UserRound, UsersRound } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { KeepAliveOutlet } from './keep-alive';
import { TAB_ELEMENTS } from '@/pages/tab-pages';
import { useQueryClient } from '@tanstack/react-query';
import { LogoMark, Wordmark } from '@/components/brand/logo';
import { FEATURES } from '@/config/features';
import { useConversations } from '@/features/queries';
import { Skeleton } from '@/components/ui/misc';
import { api } from '@/lib/api';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { prefetchRoute, whenIdle } from '@/routes';
import { DEFAULT_FILTERS } from '@/features/discover/filter-sheet';
import type { DiscoverFilters } from '@/types';
import { cn } from '@/lib/utils';
import { Frame } from './frame';

// Five destinations. With the feed on, Mentors lives inside Discover; with the map on,
// Matches lives at the top of Messages.
export const TABS = [
  FEATURES.feed ? { to: '/feed', label: 'Home', icon: House } : { to: '/mentors', label: 'Mentors', icon: GraduationCap },
  { to: '/discover', label: 'Discover', icon: Compass },
  FEATURES.memberMap ? { to: '/map', label: 'Map', icon: MapIcon } : { to: '/matches', label: 'Connections', icon: UsersRound },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export function AppShell() {
  const { data: convos } = useConversations();
  const unread = convos?.reduce((n, c) => n + c.unread, 0) ?? 0;
  useWarmCache();
  return (
    <Frame>
      <SideRail unread={unread} />
      <main className="pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-6">
        <KeepAliveOutlet
          tabs={TABS.map((t) => t.to)}
          elements={TAB_ELEMENTS}
          cssOnly={['/map']}
          prebuild={['/feed', '/discover', '/messages', '/profile', '/mentors', '/matches']}
          fallback={<PageSkeleton />}
        />
      </main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] border-t border-line bg-bg-elevated/[0.98] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {TABS.map((t) => (
            <li key={t.to}>
              <TabLink {...t} badge={t.to === '/messages' ? unread : 0} />
            </li>
          ))}
        </ul>
      </nav>
    </Frame>
  );
}

function TabLink({ to, label, icon: Icon, badge }: (typeof TABS)[number] & { badge: number }) {
  return (
    <NavLink
      to={to}
      {...prefetchProps(to)}
      className={({ isActive }) =>
        cn(
          'relative flex h-[64px] flex-col items-center justify-center gap-1 text-[11px] transition-colors',
          isActive ? 'text-gold' : 'text-faint hover:text-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="gold-gradient absolute top-0 h-0.5 w-8 rounded-full" aria-hidden />}
          <span className="relative">
            <Icon className="size-[22px]" strokeWidth={1.5} aria-hidden />
            {badge > 0 && (
              <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

function SideRail({ unread }: { unread: number }) {
  return (
    <nav
      aria-label="Main"
      className="fixed top-0 z-40 hidden h-dvh w-[200px] flex-col gap-1 border-r border-line bg-bg-elevated p-4 lg:flex"
      style={{ right: 'calc(50% + 215px)' }}
    >
      <div className="mb-6 flex items-center gap-2 px-2 pt-2">
        <LogoMark className="size-8" />
        <Wordmark stacked={false} className="text-sm" />
      </div>
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          {...prefetchProps(to)}
          className={({ isActive }) =>
            cn(
              'flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm transition-colors',
              isActive ? 'bg-gold-fill text-gold' : 'text-muted hover:bg-surface-2 hover:text-text',
            )
          }
        >
          <Icon className="size-5" strokeWidth={1.5} aria-hidden />
          {label}
          {to === '/messages' && unread > 0 && (
            <span className="ml-auto rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">{unread}</span>
          )}
        </NavLink>
      ))}
      <p className="mt-auto px-2 font-serif text-sm italic text-faint">Good Cigars. Better Company.</p>
    </nav>
  );
}

/** Start loading a screen as soon as the finger or pointer is on its tab. */
const prefetchProps = (to: string) => ({
  onPointerEnter: () => prefetchRoute(to),
  onTouchStart: () => prefetchRoute(to),
  onFocus: () => prefetchRoute(to),
});

/** Fetch the data every tab needs while the member is idle, so each tab opens with no spinner. */
function useWarmCache() {
  const qc = useQueryClient();
  useEffect(() => {
    whenIdle(() => {
      const filters = storage.get<DiscoverFilters>(STORAGE_KEYS.filters) ?? DEFAULT_FILTERS;
      qc.prefetchQuery({ queryKey: ['me'], queryFn: api.getMe });
      qc.prefetchQuery({ queryKey: ['feed', 'all'], queryFn: () => api.getFeed('all') });
      qc.prefetchQuery({ queryKey: ['discover', filters], queryFn: () => api.getDiscover(filters), staleTime: Infinity });
      qc.prefetchQuery({ queryKey: ['matches'], queryFn: api.getMatches });
      qc.prefetchQuery({ queryKey: ['conversations'], queryFn: api.getConversations });
      qc.prefetchQuery({ queryKey: ['map-members'], queryFn: api.getMapMembers });
      qc.prefetchQuery({ queryKey: ['feed', 'member', 'me'], queryFn: () => api.getMemberPosts('me') });
    });
  }, [qc]);
}

function PageSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-40" />
      <Skeleton className="h-24" />
    </div>
  );
}
