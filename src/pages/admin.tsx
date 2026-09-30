import { Ban, Check, ImageOff, Plus, ShieldAlert, TriangleAlert, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoMark } from '@/components/brand/logo';
import { UserTypeBadge, VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar, PortraitArt } from '@/components/brand/portrait';
import { Frame } from '@/components/layout/frame';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Badge, Card, SearchInput, Segmented, Skeleton } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { MOCK_POSTS, MOCK_SESSIONS } from '@/data/mock/content';
import { useAdminActions, useAdminUsers, usePendingPhotos, useReports } from '@/features/queries';
import { useSession } from '@/lib/session';
import { timeAgo } from '@/lib/utils';

type Tab = 'photos' | 'reports' | 'users' | 'sessions' | 'blog';

/** Admin panel. Phase 8 enforces role = admin in the database (RLS), not only here. */
export default function Admin() {
  const { session } = useSession();
  const [tab, setTab] = useState<Tab>('photos');
  if (session.role !== 'admin') return <Navigate to="/discover" replace />;

  return (
    <Frame wide>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bg/95 px-5 py-3">
        <LogoMark className="size-8" />
        <div className="flex-1">
          <h1 className="font-serif text-xl text-text">Admin Panel</h1>
          <p className="text-xs text-muted">Moderation and content</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/profile">Exit</Link>
        </Button>
      </header>
      <div className="px-5 py-5">
        <div className="scrollbar-none -mx-5 overflow-x-auto px-5">
          <div className="min-w-[520px]">
            <Segmented
              label="Admin section"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'photos', label: 'Photo Review' },
                { value: 'reports', label: 'Reports' },
                { value: 'users', label: 'Users' },
                { value: 'sessions', label: 'Sessions' },
                { value: 'blog', label: 'Blog' },
              ]}
            />
          </div>
        </div>
        <div className="mt-6">
          {tab === 'photos' && <PhotoReview />}
          {tab === 'reports' && <Reports />}
          {tab === 'users' && <Users />}
          {tab === 'sessions' && <ContentList kind="sessions" />}
          {tab === 'blog' && <ContentList kind="blog" />}
        </div>
      </div>
    </Frame>
  );
}

function PhotoReview() {
  const { data, isLoading } = usePendingPhotos();
  const { reviewPhoto } = useAdminActions();
  const toast = useToast();
  if (isLoading) return <Grid>{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-72" />)}</Grid>;
  if (!data?.length) return <Empty icon={<ImageOff className="size-8" />} text="No photos waiting for review." />;
  return (
    <Grid>
      {data.map((p) => (
        <Card key={p.id} className="overflow-hidden">
          <div className="aspect-[4/3]">
            <PortraitArt name={p.member.name} hue={p.member.photoHue} />
          </div>
          <div className="p-4">
            <p className="font-medium text-text">
              {p.member.name}, {p.member.age}
            </p>
            <p className="text-xs text-muted">
              {p.member.city}, {p.member.state} · submitted {timeAgo(p.submittedAt)} ago
            </p>
            <p className="mt-2 text-xs">{p.member.photoVerified ? <span className="text-success">Selfie check passed</span> : <span className="text-warning">Selfie check failed or skipped: review carefully</span>}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" variant="success" onClick={() => (reviewPhoto.mutate({ id: p.id, decision: 'approve' }), toast(`Approved ${p.member.name}'s photo`))}>
                <Check className="size-4" /> Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => (reviewPhoto.mutate({ id: p.id, decision: 'reject' }), toast(`Rejected ${p.member.name}'s photo`))}>
                <X className="size-4" /> Reject
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </Grid>
  );
}

function Reports() {
  const { data, isLoading } = useReports();
  const { actOnReport } = useAdminActions();
  if (isLoading) return <Skeleton className="h-40" />;
  if (!data?.length) return <Empty icon={<ShieldAlert className="size-8" />} text="No reports. The lounge is calm." />;
  const tone = { open: 'warning', warned: 'gold', suspended: 'danger', banned: 'danger', dismissed: 'muted' } as const;
  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li key={r.id}>
          <Card className="flex flex-wrap items-center gap-4 p-4">
            <Avatar name={r.reported.name} hue={r.reported.photoHue} size={48} />
            <div className="min-w-40 flex-1">
              <p className="font-medium text-text">{r.reported.name}</p>
              <p className="text-sm text-muted">
                {r.reason} · {timeAgo(r.createdAt)} ago
              </p>
            </div>
            <Badge tone={tone[r.status]}>{r.status}</Badge>
            {r.status === 'open' && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => actOnReport.mutate({ id: r.id, action: 'warn' })}>
                  <TriangleAlert className="size-4 text-warning" /> Warn
                </Button>
                <Button size="sm" variant="danger" onClick={() => actOnReport.mutate({ id: r.id, action: 'suspend' })}>
                  Suspend
                </Button>
                <Button size="sm" variant="dangerSolid" onClick={() => actOnReport.mutate({ id: r.id, action: 'ban' })}>
                  <Ban className="size-4" /> Ban
                </Button>
                <Button size="sm" variant="ghost" onClick={() => actOnReport.mutate({ id: r.id, action: 'dismiss' })}>
                  Dismiss
                </Button>
              </div>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}

function Users() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useAdminUsers(q);
  return (
    <div className="space-y-4">
      <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or city" aria-label="Search users" className="max-w-sm" />
      {isLoading ? (
        <Skeleton className="h-60" />
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Photo check</th>
                <th className="px-4 py-3 font-semibold">Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 bg-surface">
              {data?.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} hue={m.photoHue} size={36} />
                      <span className="text-text">
                        {m.name}, {m.age}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {m.city}, {m.state}
                  </td>
                  <td className="px-4 py-3">
                    <UserTypeBadge type={m.userType} />
                  </td>
                  <td className="px-4 py-3">{m.photoVerified ? <VerifiedBadge /> : <Badge tone="warning">Manual</Badge>}</td>
                  <td className="px-4 py-3">
                    <Badge tone="success">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ContentList({ kind }: { kind: 'sessions' | 'blog' }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const items = kind === 'sessions' ? MOCK_SESSIONS.map((s) => ({ id: s.id, title: s.title, meta: `Vimeo ID: ${s.vimeoId} · ${s.durationMin} min` })) : MOCK_POSTS.map((p) => ({ id: p.id, title: p.title, meta: `${p.category} · published ${p.publishedAt}` }));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{items.length} items</p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New {kind === 'sessions' ? 'session' : 'article'}
        </Button>
      </div>
      <ul className="divide-y divide-line/60 overflow-hidden rounded-[20px] border border-line bg-surface">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <p className="text-text">{it.title}</p>
              <p className="text-xs text-muted">{it.meta}</p>
            </div>
            <Badge tone="success">Published</Badge>
            <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
              Edit
            </Button>
          </li>
        ))}
      </ul>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={kind === 'sessions' ? 'Session video' : 'Blog article'}
        footer={
          <Button block onClick={() => (setOpen(false), toast('Saved (demo). Content management goes live in Phase 8.'))}>
            Save
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Title">{(id) => <Input id={id} />}</Field>
          {kind === 'sessions' ? (
            <>
              <Field label="Vimeo video ID">{(id) => <Input id={id} inputMode="numeric" placeholder="e.g. 76979871" />}</Field>
              <Field label="Description">{(id) => <Textarea id={id} />}</Field>
            </>
          ) : (
            <Field label="Body (Markdown)">{(id) => <Textarea id={id} className="min-h-48 font-mono text-sm" />}</Field>
          )}
        </div>
      </Sheet>
    </div>
  );
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
const Empty = ({ icon, text }: { icon: ReactNode; text: string }) => (
  <div className="flex flex-col items-center gap-3 py-16 text-muted">
    <span className="text-gold">{icon}</span>
    {text}
  </div>
);
