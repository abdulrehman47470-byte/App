import { NavLink } from 'react-router-dom';
import { FEATURES } from '@/config/features';
import { cn } from '@/lib/utils';

/** Members | Mentors switch shown under the Discover header when Mentors is not its own tab. */
export function DiscoverTabs() {
  if (!FEATURES.feed) return null;
  const tabs = [
    { to: '/discover', label: 'Members' },
    { to: '/mentors', label: 'Mentors' },
  ];
  return (
    <nav aria-label="Discover sections" className="flex gap-6 border-b border-line/60 px-4">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            cn(
              'relative -mb-px flex h-11 items-center border-b-2 text-sm font-medium transition-colors',
              isActive ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-text',
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
