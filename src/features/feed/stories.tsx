import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Plus, Volume2, VolumeX, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Avatar } from '@/components/brand/portrait';
import { Skeleton } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { useMe, useStories, useStoryActions } from '@/features/queries';
import { checkImageFile, compressImage } from '@/lib/media';
import { newMediaId, putMedia, rememberMediaUrl } from '@/lib/media-store';
import { cn, timeAgo } from '@/lib/utils';
import type { Story } from '@/types';
import { useAssetUrl } from './post-media';

const IMAGE_MS = 5000;
const MAX_VIDEO_MS = 15000;

/** Horizontal row of story avatars. Gold ring = something new to watch. */
export function StoriesBar() {
  const { data: stories, isLoading } = useStories();
  const { data: me } = useMe();
  const { add } = useStoryActions();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  // Snapshot of the list when the viewer opens, so the order doesn't shift as stories get marked seen.
  const [viewing, setViewing] = useState<{ list: Story[]; index: number } | null>(null);

  const mine = stories?.find((s) => s.author.id === 'me');
  const others = stories?.filter((s) => s.author.id !== 'me') ?? [];

  const upload = async (f?: File) => {
    if (!f) return;
    const id = newMediaId();
    try {
      if (f.type.startsWith('video/')) {
        rememberMediaUrl(id, URL.createObjectURL(f));
        await add.mutateAsync({ type: 'video', mediaId: id });
        putMedia(id, f).catch(() => {});
      } else {
        const problem = checkImageFile(f);
        if (problem) return toast(problem, 'danger');
        const raw = URL.createObjectURL(f);
        const img = await compressImage(raw, 1280);
        URL.revokeObjectURL(raw);
        rememberMediaUrl(id, img);
        await add.mutateAsync({ type: 'image', mediaId: id });
        putMedia(id, await (await fetch(img)).blob()).catch(() => {});
      }
      toast('Added to your story. It disappears after 24 hours.');
    } catch (e) {
      toast((e as Error).message, 'danger');
    }
  };

  const open = (story: Story) => {
    const list = stories ?? [];
    setViewing({ list, index: Math.max(0, list.findIndex((s) => s.id === story.id)) });
  };

  return (
    <section aria-label="Stories" className="-mx-4">
      <ul className="scrollbar-none flex gap-3 overflow-x-auto px-4 pb-1 pt-0.5">
        <li className="shrink-0">
          <div className="relative w-[72px]">
            <button
              type="button"
              onClick={() => (mine ? open(mine) : input.current?.click())}
              aria-label={mine ? 'View your story' : 'Add to your story'}
              className="flex w-full flex-col items-center gap-1.5"
            >
              <StoryRing seen={mine ? mine.seen : true} dashed={!mine}>
                <Avatar name={me?.name || 'You'} src={me?.photoUrl} size={60} />
              </StoryRing>
              <span className="w-full truncate text-center text-[11px] font-medium text-text">Your story</span>
            </button>
            <button
              type="button"
              onClick={() => input.current?.click()}
              aria-label="Add a photo or video to your story"
              className="gold-gradient absolute right-0.5 top-[46px] grid size-6 place-items-center rounded-full border-2 border-bg text-gold-ink"
            >
              <Plus className="size-3.5" strokeWidth={3} />
            </button>
          </div>
          <input ref={input} type="file" accept="image/*,video/*" className="sr-only" tabIndex={-1} onChange={(e) => (upload(e.target.files?.[0]), (e.target.value = ''))} />
        </li>
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
                <Skeleton className="size-[68px] rounded-full" />
                <Skeleton className="h-2.5 w-12" />
              </li>
            ))
          : others.map((s) => (
              <li key={s.id} className="shrink-0">
                <button type="button" onClick={() => open(s)} aria-label={`${s.author.name}'s story${s.seen ? '' : ', new'}`} className="flex w-[72px] flex-col items-center gap-1.5">
                  <StoryRing seen={s.seen}>
                    <Avatar name={s.author.name} src={s.author.photoUrl} size={60} />
                  </StoryRing>
                  <span className={cn('w-full truncate text-center text-[11px]', s.seen ? 'text-muted' : 'font-medium text-text')}>{s.author.name.split(' ')[0]}</span>
                </button>
              </li>
            ))}
      </ul>
      {viewing && <StoryViewer stories={viewing.list} startIndex={viewing.index} onClose={() => setViewing(null)} />}
    </section>
  );
}

function StoryRing({ seen, dashed, children }: { seen: boolean; dashed?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'grid size-[68px] place-items-center rounded-full p-[2.5px]',
        dashed ? 'border-2 border-dashed border-line-strong' : seen ? 'bg-line' : 'bg-[conic-gradient(from_200deg,#F3AA3B,#CC8229,#9f5516,#E09830,#F3AA3B)]',
      )}
    >
      <span className="grid size-full place-items-center rounded-full bg-bg p-[2px]">{children}</span>
    </span>
  );
}

/**
 * Full-screen story viewer. Tap right/left to move, hold to pause, swipe down or Esc to close.
 * Moves on to the next person automatically and marks each story as seen.
 */
function StoryViewer({ stories, startIndex, onClose }: { stories: Story[]; startIndex: number; onClose: () => void }) {
  const { seen } = useStoryActions();
  const [pos, setPos] = useState({ story: startIndex, item: 0, dir: 0 });
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const story = stories[pos.story];
  const item = story?.items[pos.item];

  useEffect(() => {
    if (story && !story.seen) seen.mutate(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  const next = useCallback(() => {
    setPos((p) => {
      const s = stories[p.story];
      if (s && p.item < s.items.length - 1) return { ...p, item: p.item + 1 };
      if (p.story < stories.length - 1) return { story: p.story + 1, item: 0, dir: 1 };
      onClose();
      return p;
    });
  }, [stories, onClose]);

  const prev = useCallback(() => {
    setPos((p) => {
      if (p.item > 0) return { ...p, item: p.item - 1 };
      if (p.story > 0) return { story: p.story - 1, item: stories[p.story - 1].items.length - 1, dir: -1 };
      return { ...p, item: 0 };
    });
  }, [stories]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') {
        e.preventDefault();
        setPaused((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Hold-to-pause vs. tap-to-advance on the same surface.
  const press = useRef<{ t: number; x: number; y: number } | null>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const held = useRef(false);

  if (!story || !item) return null;

  return (
    <Dialog.Root open onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-[95] bg-black" />
        <Dialog.Content className="fixed inset-0 z-[95] grid place-items-center focus:outline-none" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{story.author.name}&apos;s story</Dialog.Title>
          <div className="relative h-full w-full overflow-hidden bg-black sm:h-[min(92dvh,860px)] sm:w-auto sm:aspect-[9/16] sm:rounded-[20px]">
            <AnimatePresence initial={false} custom={pos.dir} mode="popLayout">
              <m.div
                key={story.id}
                custom={pos.dir}
                initial={{ x: pos.dir >= 0 ? '100%' : '-100%', opacity: 0.6 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: pos.dir >= 0 ? '-30%' : '30%', opacity: 0 }}
                transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <StoryMedia key={item.id} item={item} paused={paused} muted={muted} onDone={next} />
              </m.div>
            </AnimatePresence>

            {/* Tap zones: left third goes back, the rest goes forward. Hold anywhere to pause. */}
            <div
              className="absolute inset-0 z-10 select-none"
              style={{ WebkitTouchCallout: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                press.current = { t: Date.now(), x: e.clientX, y: e.clientY };
                held.current = false;
                holdTimer.current = window.setTimeout(() => {
                  held.current = true;
                  setPaused(true);
                }, 220);
              }}
              onPointerUp={(e) => {
                window.clearTimeout(holdTimer.current);
                const p = press.current;
                press.current = null;
                if (held.current) return setPaused(false);
                if (!p) return;
                if (e.clientY - p.y > 90) return onClose(); // swipe down
                if (Math.abs(e.clientX - p.x) > 60) return e.clientX < p.x ? next() : prev(); // swipe sideways
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX - rect.left < rect.width / 3) prev();
                else next();
              }}
              onPointerCancel={() => {
                window.clearTimeout(holdTimer.current);
                if (held.current) setPaused(false);
              }}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-[max(10px,env(safe-area-inset-top))]">
              <div className="flex gap-1" aria-hidden>
                {story.items.map((it, i) => (
                  <span key={it.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                    <span
                      className={cn('block h-full w-full origin-left bg-white', i === pos.item ? 'story-progress' : i < pos.item ? 'scale-x-100' : 'scale-x-0')}
                      data-story-bar={i === pos.item ? '' : undefined}
                    />
                  </span>
                ))}
              </div>
              <div className="pointer-events-auto mt-3 flex items-center gap-2.5">
                <Avatar name={story.author.name} src={story.author.photoUrl} size={36} />
                <div className="min-w-0 flex-1 text-white">
                  <p className="truncate text-sm font-semibold">{story.author.id === 'me' ? 'Your story' : story.author.name}</p>
                  <p className="text-[11px] text-white/70">{timeAgo(item.createdAt)}</p>
                </div>
                <button type="button" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Play story' : 'Pause story'} className="grid size-10 place-items-center rounded-full text-white hover:bg-white/15">
                  {paused ? <Play className="size-5 fill-current" /> : <Pause className="size-5 fill-current" />}
                </button>
                {item.type === 'video' && (
                  <button type="button" onClick={() => setMuted((v) => !v)} aria-label={muted ? 'Turn sound on' : 'Mute'} className="grid size-10 place-items-center rounded-full text-white hover:bg-white/15">
                    {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                  </button>
                )}
                <Dialog.Close className="grid size-10 place-items-center rounded-full text-white hover:bg-white/15" aria-label="Close stories">
                  <X className="size-6" />
                </Dialog.Close>
              </div>
            </div>

            {item.caption && (
              <p className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 to-transparent px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-16 text-center text-[15px] font-medium leading-snug text-white">
                {item.caption}
              </p>
            )}

            {/* Desktop arrows */}
            <button type="button" onClick={prev} aria-label="Previous" className="absolute left-2 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:grid">
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" onClick={next} aria-label="Next" className="absolute right-2 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:grid">
              <ChevronRight className="size-6" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * One story frame. The progress bar is a CSS animation (no per-frame React work);
 * `animationend` on it, or the video ending, moves to the next frame.
 */
function StoryMedia({ item, paused, muted, onDone }: { item: Story['items'][number]; paused: boolean; muted: boolean; onDone: () => void }) {
  const url = useAssetUrl(item);
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [ms, setMs] = useState(IMAGE_MS);

  // Drive the progress bar of the active segment.
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('[data-story-bar]');
    if (!bar) return;
    bar.style.setProperty('--story-ms', `${ms}ms`);
    bar.style.animationPlayState = paused || !ready ? 'paused' : 'running';
    const end = () => onDone();
    bar.addEventListener('animationend', end);
    return () => bar.removeEventListener('animationend', end);
  }, [ms, paused, ready, onDone]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (paused || !ready) v.pause();
    else v.play().catch(() => {});
  }, [paused, ready]);

  useEffect(() => {
    if (url === null) setReady(true); // missing file: still time out and move on
  }, [url]);

  if (url === null) {
    return (
      <div className="grid size-full place-items-center text-sm text-white/70">
        This story is no longer available on this device.
      </div>
    );
  }
  return (
    <div className="grid size-full place-items-center">
      {!ready && <div className="absolute inset-0 animate-pulse bg-white/5" />}
      {url && item.type === 'image' && <img src={url} alt={item.caption ?? 'Story photo'} onLoad={() => setReady(true)} draggable={false} className="size-full object-cover" />}
      {url && item.type === 'video' && (
        <video
          ref={video}
          src={url}
          muted={muted}
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => setMs(Math.min(MAX_VIDEO_MS, (e.currentTarget.duration || 5) * 1000))}
          onCanPlay={() => setReady(true)}
          className="size-full object-cover"
          aria-label={item.caption ?? 'Story video'}
        />
      )}
    </div>
  );
}
