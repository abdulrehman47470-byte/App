import { Compass, GraduationCap, Heart, MessageCircle, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogoMark, Wordmark } from '@/components/brand/logo';
import { useConversations } from '@/features/queries';
import { cn } from '@/lib/utils';

export const TABS = [
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/mentors', label: 'Mentors', icon: GraduationCap },
  { to: '/matches', label: 'Matches', icon: Heart },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

/** Centered 430px column over the textured background; bottom tabs on mobile, side rail on desktop. */
export function Frame({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="texture min-h-dvh">
      <div
        className={cn(
          'relative mx-auto min-h-dvh w-full bg-bg lg:border-x lg:border-line lg:shadow-[0_0_80px_rgba(0,0,0,0.6)]',
          wide ? 'max-w-[1100px]' : 'max-w-[430px]',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AppShell() {
  const { data: convos } = useConversations();
  const unread = convos?.reduce((n, c) => n + c.unread, 0) ?? 0;
  return (
    <Frame>
      <SideRail unread={unread} />
      <main className="pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-6">
        <Outlet />
      </main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] border-t border-line bg-bg-elevated/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
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
              <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-ember px-1 text-[10px] font-bold text-text">
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
      className="fixed top-0 z-40 hidden h-dvh w-[200px] flex-col gap-1 border-r border-line bg-bg-elevated/80 p-4 backdrop-blur lg:flex"
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
            <span className="ml-auto rounded-full bg-ember px-1.5 text-[10px] font-bold text-text">{unread}</span>
          )}
        </NavLink>
      ))}
      <p className="mt-auto px-2 font-serif text-sm italic text-faint">Good Cigars. Better Company.</p>
    </nav>
  );
}
