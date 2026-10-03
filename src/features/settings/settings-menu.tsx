import {
  BookOpen,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  LogOut,
  MapPin,
  PlayCircle,
  Scale,
  ScrollText,
  ShieldCheck,
  ShieldUser,
  Trash2,
  UserPen,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

type Item = { to: string; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; danger?: boolean };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Account',
    items: [
      { to: '/profile/edit/1', label: 'Edit Profile', icon: UserPen },
      { to: '/settings/subscription', label: 'Subscription', icon: CreditCard },
    ],
  },
  {
    title: 'Explore',
    items: [
      { to: '/search', label: 'Stogie Search', icon: MapPin },
      { to: '/sessions', label: 'Stogie Sessions', icon: PlayCircle },
      { to: '/blog', label: 'Stogie Blog', icon: BookOpen },
      { to: '/refer', label: 'Refer A Friend', icon: Gift },
    ],
  },
  {
    title: 'Legal',
    items: [
      { to: '/legal/privacy', label: 'Privacy Policy', icon: ShieldCheck },
      { to: '/legal/terms', label: 'Terms & Conditions', icon: FileText },
      { to: '/legal/ethics', label: 'Stogie Ethics', icon: ScrollText },
      { to: '/legal/indemnification', label: 'Indemnification Clause', icon: Scale },
    ],
  },
];

export function SettingsMenu() {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const groups = session.role === 'admin' ? [...GROUPS, { title: 'Team', items: [{ to: '/admin', label: 'Admin Panel', icon: ShieldUser }] }] : GROUPS;

  return (
    <nav aria-label="Settings" className="space-y-6">
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="micro-label mb-2 px-1">{g.title}</h2>
          <ul className="divide-y divide-line/60 overflow-hidden rounded-[20px] border border-line bg-surface">
            {g.items.map((it) => (
              <li key={it.to}>
                <MenuRow {...it} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section>
        <ul className="divide-y divide-line/60 overflow-hidden rounded-[20px] border border-line bg-surface">
          <li>
            <MenuRow to="/settings/delete" label="Delete my account" icon={Trash2} danger />
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                signOut();
                qc.clear();
                navigate('/', { replace: true });
              }}
              className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-[15px] text-text transition-colors hover:bg-surface-2"
            >
              <LogOut className="size-5 text-gold" strokeWidth={1.5} /> Sign Out
            </button>
          </li>
        </ul>
      </section>
    </nav>
  );
}

function MenuRow({ to, label, icon: Icon, danger }: Item) {
  return (
    <Link to={to} className={cn('flex min-h-14 items-center gap-3 px-4 text-[15px] transition-colors hover:bg-surface-2', danger ? 'text-danger' : 'text-text')}>
      <Icon className={cn('size-5', danger ? 'text-danger' : 'text-gold')} strokeWidth={1.5} />
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-5 text-faint" strokeWidth={1.5} />
    </Link>
  );
}
