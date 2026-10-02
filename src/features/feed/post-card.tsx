import { AnimatePresence, m } from 'framer-motion';
import { Bookmark, CornerDownRight, Flame, Heart, HelpCircle, MapPin, MessageCircle, MoreHorizontal, Pencil, Send, Share2, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { Card, Skeleton } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { MOCK_LOUNGES } from '@/data/mock/content';
import { userTypeLabel } from '@/data/user-types';
import { useComments, useFeedActions, useMe } from '@/features/queries';
import { SafetySheet } from '@/features/safety/safety-sheet';
import { COMMENT_MAX, POST_MAX } from '@/lib/api/mock';
import { cn, timeAgo } from '@/lib/utils';
import type { Comment, Post, PostAuthor } from '@/types';
import { PostMedia } from './post-media';
import { ReactionButton, ReactionSummary } from './reactions';

const profileLink = (a: PostAuthor) => (a.id === 'me' ? '/profile' : `/member/${a.id}`);
const headline = (a: PostAuthor) => [userTypeLabel(a.userType), [a.city, a.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');

export function PostCard({ post, defaultOpen = false }: { post: Post; defaultOpen?: boolean }) {
  const [showComments, setShowComments] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ownMenu, setOwnMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const { react, remove, save } = useFeedActions();
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
            <Avatar name={a.name} src={a.photoUrl} size={46} />
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
              <Link to={`/search?tab=lounges&focus=${lounge.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-xs text-text hover:border-ember">
                <MapPin className="size-3.5 text-ember" /> Checked in at <strong className="font-semibold">{lounge.name}</strong>
              </Link>
            )}
            {post.cigar && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/40 bg-gold-fill px-3 py-1 text-xs text-gold-light">
                <Flame className="size-3.5" /> Smoking {post.cigar}
              </span>
            )}
            {post.kind === 'question' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-info/10 px-3 py-1 text-xs text-info">
                <HelpCircle className="size-3.5" /> Question
              </span>
            )}
          </div>
        )}

        {post.body && (
          <p className="whitespace-pre-wrap break-words px-4 pb-3 text-[15px] leading-relaxed text-text">
            {long && !expanded ? `${post.body.slice(0, 240).trimEnd()}… ` : post.body}
            {long && !expanded && (
              <button type="button" onClick={() => setExpanded(true)} className="font-medium text-gold hover:underline">
                see more
              </button>
            )}
          </p>
        )}

        {post.attachment && <PostMedia asset={post.attachment} author={a.name} />}

        <div className="flex min-h-9 items-center justify-between px-4 py-2 text-xs text-muted">
          <ReactionSummary reactions={post.reactions} />
          {post.commentCount > 0 && (
            <button type="button" onClick={() => setShowComments((v) => !v)} className="hover:text-text hover:underline">
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 border-t border-line/60">
          <ReactionButton value={post.myReaction} onReact={(reaction) => react.mutate({ id: post.id, reaction })} />
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
            <Bookmark className={cn('size-5', post.savedByMe && 'fill-brand-gold text-gold')} strokeWidth={1.75} />
          </ActionButton>
        </div>

        <AnimatePresence initial={false}>
          {showComments && (
            <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-line/60 bg-bg-elevated">
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

/** Comment thread: top-level comments with one level of replies, likes and a reply composer. */
function Comments({ postId }: { postId: string }) {
  const { data, isLoading } = useComments(postId);
  const { data: me } = useMe();
  const { comment } = useFeedActions();
  const toast = useToast();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const threads = useMemo(() => {
    const list = data ?? [];
    const top = list.filter((c) => !c.parentId);
    return top.map((c) => ({ comment: c, replies: list.filter((r) => r.parentId === c.id) }));
  }, [data]);

  const startReply = (c: Comment) => {
    setReplyTo(c);
    setText((t) => (t.startsWith('@') ? t : `@${c.author.id === 'me' ? 'you' : c.author.name} `));
    requestAnimationFrame(() => input.current?.focus());
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    // replies always attach to the top-level comment (one level of threading keeps it readable)
    const parentId = replyTo ? (replyTo.parentId ?? replyTo.id) : undefined;
    setText('');
    setReplyTo(null);
    comment.mutate({ postId, body, parentId }, { onError: (err) => toast((err as Error).message, 'danger') });
  };

  return (
    <div className="space-y-4 p-4">
      {isLoading ? (
        <Skeleton className="h-14" />
      ) : threads.length ? (
        threads.map(({ comment: c, replies }) => <Thread key={c.id} comment={c} replies={replies} onReply={startReply} />)
      ) : (
        <p className="py-2 text-center text-xs text-faint">No comments yet. Start the conversation.</p>
      )}

      <form onSubmit={submit} className="space-y-1.5 pt-1">
        {replyTo && (
          <p className="flex items-center gap-1.5 pl-11 text-xs text-muted">
            <CornerDownRight className="size-3.5" /> Replying to <strong className="font-semibold text-text">{replyTo.author.id === 'me' ? 'your comment' : replyTo.author.name}</strong>
            <button type="button" onClick={() => (setReplyTo(null), setText(''))} aria-label="Cancel reply" className="ml-1 grid size-6 place-items-center rounded-full hover:bg-surface-2">
              <X className="size-3.5" />
            </button>
          </p>
        )}
        <div className="flex items-center gap-2">
          {me && <Avatar name={me.name || 'You'} src={me.photoUrl} size={34} />}
          <label htmlFor={`c-${postId}`} className="sr-only">
            {replyTo ? 'Write a reply' : 'Add a comment'}
          </label>
          <input
            ref={input}
            id={`c-${postId}`}
            value={text}
            maxLength={COMMENT_MAX}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'}
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm text-text placeholder:text-faint focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/25"
          />
          <button type="submit" disabled={!text.trim()} aria-label={replyTo ? 'Post reply' : 'Post comment'} className="gold-gradient grid size-11 shrink-0 place-items-center rounded-full text-gold-ink transition-opacity disabled:opacity-40">
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function Thread({ comment, replies, onReply }: { comment: Comment; replies: Comment[]; onReply: (c: Comment) => void }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? replies : replies.slice(-2);
  const hidden = replies.length - visible.length;
  return (
    <div>
      <CommentItem c={comment} onReply={onReply} />
      {replies.length > 0 && (
        <div className="ml-11 mt-2 space-y-2 border-l-2 border-line pl-3">
          {hidden > 0 && (
            <button type="button" onClick={() => setShowAll(true)} className="text-xs font-semibold text-gold hover:underline">
              View {hidden} more {hidden === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {visible.map((r) => (
            <CommentItem key={r.id} c={r} onReply={onReply} small />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ c, onReply, small }: { c: Comment; onReply: (c: Comment) => void; small?: boolean }) {
  const { likeComment } = useFeedActions();
  return (
    <div className="flex gap-2.5">
      <Link to={profileLink(c.author)} aria-label={`${c.author.name}'s profile`} className="shrink-0">
        <Avatar name={c.author.name} src={c.author.photoUrl} size={small ? 28 : 34} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-[16px] rounded-tl-[4px] bg-surface-2 px-3.5 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <Link to={profileLink(c.author)} className="truncate text-[13px] font-semibold text-text hover:text-gold-light">
              {c.author.id === 'me' ? 'You' : c.author.name}
            </Link>
            <time dateTime={c.createdAt} className="shrink-0 text-[11px] text-faint">
              {timeAgo(c.createdAt)}
            </time>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text">{c.body}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 pl-2 text-xs">
          <button
            type="button"
            onClick={() => likeComment.mutate({ postId: c.postId, commentId: c.id })}
            aria-pressed={c.likedByMe}
            className={cn('flex min-h-8 items-center gap-1 font-semibold transition-colors', c.likedByMe ? 'text-danger' : 'text-muted hover:text-text')}
          >
            <Heart className={cn('size-3.5', c.likedByMe && 'fill-current')} /> {c.likedByMe ? 'Liked' : 'Like'}
            {c.likes > 0 && <span className="font-normal tabular-nums text-faint">· {c.likes}</span>}
          </button>
          <button type="button" onClick={() => onReply(c)} className="min-h-8 font-semibold text-muted hover:text-text">
            Reply
          </button>
        </div>
      </div>
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
