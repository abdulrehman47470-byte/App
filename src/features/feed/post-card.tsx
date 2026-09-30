import { AnimatePresence, m } from 'framer-motion';
import { Bookmark, Flame, Heart, HelpCircle, ImageOff, MapPin, MessageCircle, MoreHorizontal, Pencil, Send, Share2, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { SceneArt } from '@/components/brand/scene-art';
import { Button } from '@/components/ui/button';
import { Card, Skeleton } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { MOCK_LOUNGES } from '@/data/mock/content';
import { userTypeLabel } from '@/data/options';
import { useComments, useFeedActions, useMe } from '@/features/queries';
import { SafetySheet } from '@/features/safety/safety-sheet';
import { COMMENT_MAX, POST_MAX } from '@/lib/api/mock';
import { useMediaUrl } from '@/lib/media-store';
import { Textarea } from '@/components/ui/field';
import { cn, timeAgo } from '@/lib/utils';
import type { Post, PostAuthor } from '@/types';

const profileLink = (a: PostAuthor) => (a.id === 'me' ? '/profile' : `/member/${a.id}`);
const headline = (a: PostAuthor) => [userTypeLabel(a.userType), [a.city, a.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');

export function PostCard({ post, defaultOpen = false }: { post: Post; defaultOpen?: boolean }) {
  const [showComments, setShowComments] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ownMenu, setOwnMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const { like, remove, save } = useFeedActions();
  const toast = useToast();
  const a = post.author;
  const mine = a.id === 'me';
  const lounge = post.loungeId ? MOCK_LOUNGES.find((l) => l.id === post.loungeId) : undefined;
  const long = post.body.length > 260;

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${a.name} on Daily Stogie`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied. Only members can open it.');
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <Card className="overflow-hidden">
      <article aria-label={`Post by ${a.name}`}>
        <header className="flex items-start gap-3 p-4 pb-3">
          <Link to={profileLink(a)} aria-label={`${a.name}'s profile`}>
            <Avatar name={a.name} hue={a.hue} src={a.photoUrl} size={46} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={profileLink(a)} className="flex items-center gap-1 text-[15px] font-semibold text-text hover:text-gold-light">
              <span className="truncate">{mine ? `${a.name} (you)` : a.name}</span>
              {a.verified && <VerifiedBadge className="size-4" />}
            </Link>
            <p className="truncate text-xs text-muted">{headline(a)}</p>
            <p className="text-[11px] text-faint">
              <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
              {post.editedAt && <span> · Edited</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (mine ? setOwnMenu(true) : setMenu(true))}
            aria-label={mine ? 'Manage post' : `Report or block ${a.name}`}
            className="-mr-2 -mt-1 grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </header>

        {(lounge || post.cigar || post.kind === 'question') && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {lounge && (
              <Link to={`/search?focus=${lounge.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-ember/50 bg-ember/10 px-3 py-1 text-xs text-text hover:border-ember">
                <MapPin className="size-3.5 text-ember" /> Checked in at <strong className="font-semibold">{lounge.name}</strong>
              </Link>
            )}
            {post.cigar && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-fill px-3 py-1 text-xs text-gold-light">
                <Flame className="size-3.5" /> Smoking {post.cigar}
              </span>
            )}
            {post.kind === 'question' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-info/40 bg-info/10 px-3 py-1 text-xs text-info">
                <HelpCircle className="size-3.5" /> Question
              </span>
            )}
          </div>
        )}

        {post.body && (
          <p className="whitespace-pre-wrap break-words px-4 pb-3 text-[15px] leading-relaxed text-text/90">
            {long && !expanded ? `${post.body.slice(0, 240).trimEnd()}… ` : post.body}
            {long && !expanded && (
              <button type="button" onClick={() => setExpanded(true)} className="font-medium text-gold hover:underline">
                see more
              </button>
            )}
          </p>
        )}

        {post.media?.type === 'video' && <FeedVideo id={post.media.id} author={a.name} />}
        {post.media?.type === 'image' && <FeedImage id={post.media.id} author={a.name} />}

        {!post.media && (post.imageUrl || post.imageHue !== undefined) && (
          <div className="aspect-[16/10] border-y border-line/60 bg-bg-elevated">
            {post.imageUrl ? (
              <img src={post.imageUrl} alt={`Photo shared by ${a.name}`} className="size-full object-cover" loading="lazy" />
            ) : (
              <SceneArt hue={post.imageHue!} />
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            {post.likes > 0 && (
              <>
                <span className="gold-gradient grid size-4 place-items-center rounded-full">
                  <Heart className="size-2.5 fill-gold-ink text-gold-ink" />
                </span>
                {post.likes}
              </>
            )}
          </span>
          {post.commentCount > 0 && (
            <button type="button" onClick={() => setShowComments((v) => !v)} className="hover:text-text hover:underline">
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 border-t border-line/60">
          <ActionButton active={post.likedByMe} onClick={() => like.mutate(post.id)} label={post.likedByMe ? 'Liked' : 'Like'} pressed={post.likedByMe}>
            <m.span key={String(post.likedByMe)} initial={{ scale: post.likedByMe ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
              <Heart className={cn('size-5', post.likedByMe && 'fill-gold text-gold')} strokeWidth={1.75} />
            </m.span>
          </ActionButton>
          <ActionButton onClick={() => setShowComments((v) => !v)} label="Comment" expanded={showComments}>
            <MessageCircle className="size-5" strokeWidth={1.75} />
          </ActionButton>
          <ActionButton onClick={share} label="Share">
            <Share2 className="size-5" strokeWidth={1.75} />
          </ActionButton>
          <ActionButton
            active={post.savedByMe}
            pressed={!!post.savedByMe}
            onClick={() => {
              save.mutate(post.id);
              toast(post.savedByMe ? 'Removed from Saved' : 'Saved. Find it under the Saved filter.');
            }}
            label={post.savedByMe ? 'Saved' : 'Save'}
          >
            <Bookmark className={cn('size-5', post.savedByMe && 'fill-gold text-gold')} strokeWidth={1.75} />
          </ActionButton>
        </div>

        <AnimatePresence initial={false}>
          {showComments && (
            <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-line/60 bg-bg-elevated/60">
              <Comments postId={post.id} />
            </m.div>
          )}
        </AnimatePresence>
      </article>

      {!mine && <SafetySheet memberId={a.id} name={a.name} open={menu} onOpenChange={setMenu} />}
      {mine && (
        <Sheet open={ownMenu} onOpenChange={setOwnMenu} title="Your post">
          <div className="space-y-2 pb-2">
            <Button variant="secondary" block size="lg" className="justify-start" onClick={() => (setOwnMenu(false), setEditing(true))}>
              <Pencil className="size-5 text-gold" strokeWidth={1.5} /> Edit post
            </Button>
            <Button variant="secondary" block size="lg" className="justify-start" onClick={() => (setOwnMenu(false), setConfirmDelete(true))}>
              <Trash2 className="size-5 text-danger" strokeWidth={1.5} /> Delete post
            </Button>
          </div>
        </Sheet>
      )}
      {mine && editing && <EditPostSheet post={post} onClose={() => setEditing(false)} />}
      <Sheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this post?"
        description="It will be removed for everyone, along with its comments."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" block onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="dangerSolid"
              block
              onClick={async () => {
                await remove.mutateAsync(post.id);
                setConfirmDelete(false);
                toast('Post deleted');
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <span />
      </Sheet>
    </Card>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  active,
  pressed,
  expanded,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  pressed?: boolean;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-expanded={expanded}
      className={cn('flex h-12 items-center justify-center gap-1.5 text-[13px] font-medium transition-colors hover:bg-surface-2', active ? 'text-gold' : 'text-muted hover:text-text')}
    >
      {children}
      {label}
    </button>
  );
}

function Comments({ postId }: { postId: string }) {
  const { data, isLoading } = useComments(postId);
  const { data: me } = useMe();
  const { comment } = useFeedActions();
  const toast = useToast();
  const [text, setText] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    comment.mutate({ postId, body }, { onError: (err) => toast((err as Error).message, 'danger') });
  };

  return (
    <div className="space-y-3 p-4">
      {isLoading ? (
        <Skeleton className="h-14" />
      ) : (
        data?.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Link to={profileLink(c.author)} aria-label={`${c.author.name}'s profile`}>
              <Avatar name={c.author.name} hue={c.author.hue} src={c.author.photoUrl} size={34} />
            </Link>
            <div className="min-w-0 flex-1 rounded-[14px] rounded-tl-[4px] bg-surface-2 px-3.5 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <Link to={profileLink(c.author)} className="truncate text-sm font-semibold text-text hover:text-gold-light">
                  {c.author.id === 'me' ? 'You' : c.author.name}
                </Link>
                <time dateTime={c.createdAt} className="shrink-0 text-[11px] text-faint">
                  {timeAgo(c.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-text/90">{c.body}</p>
            </div>
          </div>
        ))
      )}
      {!isLoading && !data?.length && <p className="text-center text-xs text-faint">No comments yet. Start the conversation.</p>}
      <form onSubmit={submit} className="flex items-center gap-2 pt-1">
        {me && <Avatar name={me.name || 'You'} hue={me.photoHue} src={me.photoUrl} size={34} />}
        <label htmlFor={`c-${postId}`} className="sr-only">
          Add a comment
        </label>
        <input
          id={`c-${postId}`}
          value={text}
          maxLength={COMMENT_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm text-text placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Post comment" className="gold-gradient grid size-11 shrink-0 place-items-center rounded-full text-gold-ink disabled:opacity-40">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

/** Photo from the on-device media store. */
function FeedImage({ id, author }: { id: string; author: string }) {
  const url = useMediaUrl(id);
  if (url === null) return <MediaMissing />;
  return (
    <div className="border-y border-line/60 bg-bg-elevated">
      {url ? (
        <img src={url} alt={`Photo shared by ${author}`} className="max-h-[70dvh] w-full object-cover" decoding="async" />
      ) : (
        <Skeleton className="aspect-[4/3] rounded-none" />
      )}
    </div>
  );
}

/**
 * Video like Instagram/LinkedIn: plays muted automatically while mostly on screen, pauses when
 * scrolled away. Tap the speaker to hear it; full controls are available too.
 */
function FeedVideo({ id, author }: { id: string; author: string }) {
  const url = useMediaUrl(id);
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v || !url) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [url]);

  if (url === null) return <MediaMissing />;
  return (
    <div className="relative border-y border-line/60 bg-black">
      {url ? (
        <>
          <video
            ref={ref}
            src={url}
            muted={muted}
            loop
            playsInline
            controls
            preload="metadata"
            className="max-h-[75dvh] w-full object-contain"
            aria-label={`Video shared by ${author}`}
          />
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Turn sound on' : 'Mute'}
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-bg/80 text-text"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </>
      ) : (
        <Skeleton className="aspect-video rounded-none" />
      )}
    </div>
  );
}

function MediaMissing() {
  return (
    <div className="flex items-center justify-center gap-2 border-y border-line/60 bg-bg-elevated py-10 text-sm text-muted">
      <ImageOff className="size-4" /> This file is no longer available on this device.
    </div>
  );
}

function EditPostSheet({ post, onClose }: { post: Post; onClose: () => void }) {
  const { update } = useFeedActions();
  const toast = useToast();
  const [text, setText] = useState(post.body);
  const [error, setError] = useState<string>();
  return (
    <Sheet
      open
      onOpenChange={(v) => !v && onClose()}
      title="Edit post"
      footer={
        <div className="flex items-center gap-3">
          <span className="text-xs text-faint">
            {text.length}/{POST_MAX}
          </span>
          <Button variant="secondary" className="ml-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={update.isPending || text === post.body}
            onClick={async () => {
              try {
                await update.mutateAsync({ id: post.id, body: text });
                toast('Post updated');
                onClose();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      <Textarea value={text} onChange={(e) => (setText(e.target.value), setError(undefined))} maxLength={POST_MAX} aria-label="Post text" className="min-h-40" autoFocus />
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </Sheet>
  );
}
