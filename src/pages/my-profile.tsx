import { Camera, ChevronRight, Clock, Inbox, PenLine, Pencil, Settings, SquarePen } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CigarBand, CompletenessAvatar, VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Badge, Card, Segmented, Skeleton } from '@/components/ui/misc';
import { userTypeLabel } from '@/data/options';
import { MemberBlogs } from '@/features/blog/member-blogs';
import { ComposerSheet } from '@/features/feed/composer';
import { PostCard } from '@/features/feed/post-card';
import { ProfileSections } from '@/features/profile/profile-sections';
import { useConnections, useMe, useMemberBlogs, useMemberPosts } from '@/features/queries';
import { SettingsMenu } from '@/features/settings/settings-menu';
import { FEATURES } from '@/config/features';
import { profileCompleteness } from '@/lib/completeness';
import { ago, cn } from '@/lib/utils';

type Tab = 'posts' | 'blogs' | 'connections' | 'about';

export default function MyProfile() {
  const { data: me } = useMe();
  const { data: posts } = useMemberPosts('me');
  const { data: blogs } = useMemberBlogs('me');
  const { data: connections } = useConnections();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab | null) ?? (FEATURES.feed ? 'posts' : 'about');
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });
  const [composing, setComposing] = useState(false);

  if (!me) {
    return (
      <PageBody className="space-y-4">
        <Skeleton className="mx-auto size-28 rounded-full" />
        <Skeleton className="h-8" />
        <Skeleton className="h-40" />
      </PageBody>
    );
  }

  const pct = profileCompleteness(me);
  const headline = [userTypeLabel(me.userType), [me.city, me.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  const mentorship = (me.preferences.mentorship as string[] | undefined)?.[0];
  const stats: { label: string; value?: number; tab: Tab }[] = [
    { label: 'Connections', value: connections?.connected.length, tab: 'connections' },
    ...(FEATURES.feed ? [{ label: 'Posts', value: posts?.length, tab: 'posts' as Tab }] : []),
    { label: 'Blogs', value: blogs?.length, tab: 'blogs' },
  ];

  return (
    <>
      <PageHeader
        title="Profile"
        large
        action={
          <Button variant="ghost" size="icon" asChild aria-label="Settings">
            <Link to="/settings">
              <Settings className="size-5" strokeWidth={1.5} />
            </Link>
          </Button>
        }
      />
      <PageBody className="space-y-5">
        <div className="flex flex-col items-center text-center">
          <Link to="/profile/edit/1" aria-label="Change profile photo" className="relative rounded-full">
            <CompletenessAvatar name={me.name || 'You'} hue={me.photoHue} src={me.photoUrl} pct={pct} size={104} />
            <span className="gold-gradient absolute bottom-3 right-1 grid size-9 place-items-center rounded-full border-2 border-bg text-gold-ink shadow-[var(--shadow-glow)]">
              <Camera className="size-4" />
            </span>
          </Link>
          <div className="mt-4 flex items-center gap-2">
            <h2 className="font-serif text-[28px] text-text">{me.name || 'Your name'}</h2>
            {me.age > 0 && <span className="text-xl font-light text-muted">{me.age}</span>}
            {me.photoVerified && <VerifiedBadge />}
          </div>
          {me.pronouns && <p className="text-sm text-muted">{me.pronouns}</p>}
          {headline && <p className="mt-1 text-[15px] text-text/85">{headline}</p>}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {me.photoStatus === 'pending' && (
              <Badge tone="warning">
                <Clock className="size-3" /> Photo in review
              </Badge>
            )}
          </div>
        </div>

        <dl className={cn('grid divide-x divide-line overflow-hidden rounded-[18px] border border-line bg-surface', stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
          {stats.map((s) => (
            <button key={s.label} type="button" onClick={() => setTab(s.tab)} className="flex flex-col items-center py-3 transition-colors hover:bg-surface-2">
              <dd className="font-serif text-[22px] leading-none tabular-nums text-text">{s.value ?? '–'}</dd>
              <dt className="mt-1 text-xs text-muted">{s.label}</dt>
            </button>
          ))}
        </dl>

        <div className={cn('grid gap-2', FEATURES.feed ? 'grid-cols-3' : 'grid-cols-2')}>
          <Button variant="outline" size="sm" asChild>
            <Link to="/profile/edit/1">
              <Pencil className="size-4" /> Edit profile
            </Link>
          </Button>
          {FEATURES.feed && (
            <Button variant="secondary" size="sm" onClick={() => setComposing(true)}>
              <SquarePen className="size-4 text-gold" /> New post
            </Button>
          )}
          <Button variant="secondary" size="sm" asChild>
            <Link to="/blog/new">
              <PenLine className="size-4 text-gold" /> Write blog
            </Link>
          </Button>
        </div>

        {pct < 100 && (
          <Card className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Your profile is {pct}% complete</p>
              <p className="text-xs text-muted">Complete profiles get better matches.</p>
            </div>
            <Button size="sm" asChild>
              <Link to="/profile/edit/2">Finish</Link>
            </Button>
          </Card>
        )}

        <Segmented
          label="Profile section"
          value={tab}
          onChange={setTab}
          options={[
            ...(FEATURES.feed ? [{ value: 'posts' as Tab, label: 'Posts' }] : []),
            { value: 'blogs', label: 'Blogs' },
            { value: 'connections', label: 'People' },
            { value: 'about', label: 'About' },
          ]}
        />

        <div key={tab} className="page-enter">
          {tab === 'posts' && FEATURES.feed ? (
            !posts ? (
              <Skeleton className="h-40" />
            ) : !posts.length ? (
              <div className="rounded-[20px] border border-dashed border-line px-4 py-8 text-center">
                <p className="text-sm text-muted">You haven’t posted yet. Share what you’re smoking, a check-in, a photo, a video or a song.</p>
                <Button size="sm" className="mt-3" onClick={() => setComposing(true)}>
                  <SquarePen className="size-4" /> Create a post
                </Button>
              </div>
            ) : (
              <ul className="space-y-4">
                {posts.map((p) => (
                  <li key={p.id} className="cv-auto">
                    <PostCard post={p} />
                  </li>
                ))}
              </ul>
            )
          ) : tab === 'blogs' ? (
            <MemberBlogs memberId="me" name="You" hideTitle />
          ) : tab === 'connections' ? (
            <ConnectionsPreview />
          ) : (
            <div className="space-y-4">
              {me.bio && (
                <Card className="p-5">
                  <h3 className="micro-label mb-2">About me</h3>
                  <p className="text-[15px] leading-relaxed text-text/90">{me.bio}</p>
                </Card>
              )}
              <ProfileSections
                prefs={me.preferences}
                about={me.about}
                mentorship={mentorship ? { label: mentorship, topics: (me.preferences.mentorTopics as string[]) ?? [] } : undefined}
              />
            </div>
          )}
        </div>

        <CigarBand label="Settings" className="pt-2" />
        <SettingsMenu />
      </PageBody>
      {composing && <ComposerSheet open={composing} onOpenChange={setComposing} initialKind="update" />}
    </>
  );
}

function ConnectionsPreview() {
  const { data } = useConnections();
  if (!data) return <Skeleton className="h-40" />;
  const pending = data.received.length;
  return (
    <div className="space-y-3">
      <Link to="/connections?tab=received" className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4 transition-colors hover:border-line-strong">
        <span className="relative grid size-11 place-items-center rounded-full bg-gold-fill text-gold">
          <Inbox className="size-5" strokeWidth={1.75} />
          {pending > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-bg bg-ember px-1 text-[10px] font-bold leading-4 text-white">{pending}</span>}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">Manage requests</p>
          <p className="text-xs text-muted">
            {pending} received · {data.sent.length} sent and pending
          </p>
        </div>
        <ChevronRight className="size-5 text-faint" strokeWidth={1.5} />
      </Link>
      {!data.connected.length ? (
        <p className="rounded-[20px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No connections yet. Connect with members in Discover.</p>
      ) : (
        <ul className="divide-y divide-line/70 overflow-hidden rounded-[18px] border border-line bg-surface">
          {data.connected.map((c) => (
            <li key={c.id}>
              <Link to={`/member/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                <Avatar name={c.member.name} src={c.member.photo} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-text">
                    {c.member.name}
                    {c.member.photoVerified && <VerifiedBadge className="size-4" />}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {c.member.city}, {c.member.state} · connected {ago(c.matchedAt)}
                  </p>
                </div>
                <ChevronRight className="size-5 text-faint" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
