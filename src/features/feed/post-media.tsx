import * as Dialog from '@radix-ui/react-dialog';
import { ImageOff, Music2, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/misc';
import { useMediaUrl } from '@/lib/media-store';
import { cn } from '@/lib/utils';
import type { MediaAsset } from '@/types';

/** Resolve a bundled (src) or uploaded (mediaId) file to a URL. */
export function useAssetUrl(asset?: { src?: string; mediaId?: string }) {
  const uploaded = useMediaUrl(asset?.mediaId);
  return asset?.src ?? uploaded;
}

// Only one thing plays sound at a time: starting a song or unmuting a video pauses the others.
const PLAY_EVENT = 'ds:media-play';
function claimPlayback(el: HTMLMediaElement) {
  window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: el }));
}
function usePauseWhenOthersPlay(ref: React.RefObject<HTMLMediaElement | null>, onPause?: () => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const el = ref.current;
      if (el && (e as CustomEvent).detail !== el && !el.paused && !el.muted) {
        el.pause();
        onPause?.();
      }
    };
    window.addEventListener(PLAY_EVENT, handler);
    return () => window.removeEventListener(PLAY_EVENT, handler);
  }, [ref, onPause]);
}

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

export function PostMedia({ asset, author }: { asset: MediaAsset; author: string }) {
  if (asset.type === 'image') return <PostImage asset={asset} author={author} />;
  if (asset.type === 'video') return <PostVideo asset={asset} author={author} />;
  return <PostAudio asset={asset} author={author} />;
}

function Missing() {
  return (
    <div className="flex items-center justify-center gap-2 border-y border-line/60 bg-surface-2 py-10 text-sm text-muted">
      <ImageOff className="size-4" /> This file is no longer available on this device.
    </div>
  );
}

/** Photo with a tap-to-enlarge lightbox. */
function PostImage({ asset, author }: { asset: MediaAsset; author: string }) {
  const url = useAssetUrl(asset);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (url === null) return <Missing />;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="relative block w-full overflow-hidden border-y border-line/60 bg-surface-2" aria-label={`Open photo shared by ${author}`}>
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        {url && (
          <img
            src={url}
            alt={`Photo shared by ${author}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={cn('max-h-[70dvh] min-h-48 w-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
          />
        )}
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="sheet-overlay fixed inset-0 z-[90] bg-black/90" />
          <Dialog.Content className="fixed inset-0 z-[90] grid place-items-center p-4 focus:outline-none" onClick={() => setOpen(false)}>
            <Dialog.Title className="sr-only">Photo shared by {author}</Dialog.Title>
            <Dialog.Description className="sr-only">Tap anywhere to close.</Dialog.Description>
            {url && <img src={url} alt={`Photo shared by ${author}`} className="page-enter max-h-full max-w-full rounded-[12px] object-contain" />}
            <Dialog.Close className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Close photo">
              <X className="size-5" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/**
 * Video: plays muted while mostly on screen and pauses when scrolled away. Tap to play/pause,
 * speaker button for sound, thin progress bar.
 */
function PostVideo({ asset, author }: { asset: MediaAsset; author: string }) {
  const url = useAssetUrl(asset);
  const poster = asset.poster;
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const userPaused = useRef(false);
  usePauseWhenOthersPlay(ref, () => setPlaying(false));

  useEffect(() => {
    const v = ref.current;
    if (!v || !url) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          if (!userPaused.current) v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [url]);

  if (url === null) return <Missing />;
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };
  return (
    <div className="relative border-y border-line/60 bg-black">
      {url ? (
        <>
          <video
            ref={ref}
            src={url}
            poster={poster}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onClick={toggle}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
            className="max-h-[75dvh] min-h-48 w-full cursor-pointer object-contain"
            aria-label={`Video shared by ${author}`}
          />
          {!playing && (
            <button type="button" onClick={toggle} aria-label="Play video" className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/40">
                <Play className="ml-1 size-7 fill-current" />
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const v = ref.current;
              setMuted((m) => !m);
              if (v && muted) {
                claimPlayback(v);
                v.play().catch(() => {});
              }
            }}
            aria-label={muted ? 'Turn sound on' : 'Mute'}
            className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-black/55 text-white"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" aria-hidden>
            <div className="h-full bg-brand-gold transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} />
          </div>
        </>
      ) : (
        <Skeleton className="aspect-video rounded-none" />
      )}
    </div>
  );
}

/** Song / audio: cover art, play/pause, seekable progress, times and credit line. */
function PostAudio({ asset }: { asset: MediaAsset; author: string }) {
  const url = useAssetUrl(asset);
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  usePauseWhenOthersPlay(ref, () => setPlaying(false));
  if (url === null) return <Missing />;

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      claimPlayback(a);
      a.play().catch(() => {});
    } else a.pause();
  };
  return (
    <div className="mx-4 mb-3 overflow-hidden rounded-[18px] border border-line bg-gradient-to-br from-surface-2 to-bg-elevated">
      <div className="flex items-center gap-3 p-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[12px] bg-surface-2">
          {asset.poster ? <img src={asset.poster} alt="" className="size-full object-cover" /> : <Music2 className="m-auto mt-5 size-6 text-gold" />}
          {playing && (
            <span className="absolute inset-x-0 bottom-1 flex items-end justify-center gap-0.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="eq-bar w-1 rounded-full bg-white" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-text">{asset.title ?? 'Audio'}</p>
          <p className="truncate text-xs text-muted">{asset.artist ?? 'Shared track'}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] tabular-nums text-faint">
            <span>{fmt(time)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              onChange={(e) => {
                const a = ref.current;
                if (a) a.currentTime = Number(e.target.value);
                setTime(Number(e.target.value));
              }}
              aria-label="Seek"
              className="audio-seek h-1 flex-1"
              style={{ ['--p' as string]: `${duration ? (time / duration) * 100 : 0}%` }}
            />
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="gold-gradient grid size-12 shrink-0 place-items-center rounded-full text-gold-ink shadow-[var(--shadow-glow)] transition-transform active:scale-95"
        >
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
        </button>
      </div>
      {asset.credit && <p className="border-t border-line/60 px-3 py-1.5 text-[10px] text-faint">♪ {asset.credit}</p>}
      {url && (
        <audio
          ref={ref}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        />
      )}
    </div>
  );
}
