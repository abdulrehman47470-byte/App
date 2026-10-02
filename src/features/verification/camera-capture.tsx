import { AnimatePresence, m } from 'framer-motion';
import { Camera, CameraOff, RefreshCw, RotateCcw, SwitchCamera } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { playShutter } from '@/lib/media';
import { cn } from '@/lib/utils';

type CamState = 'starting' | 'live' | 'captured' | 'error';

/**
 * Live camera with an oval face guide and a shutter button ("click"): flash + shutter sound,
 * then Retake / Use photo. Nothing leaves the browser from this component; the caller decides
 * what to do with the captured image (the verification flow discards it after the check).
 */
export function CameraCapture({
  onCapture,
  onCancel,
  prompts,
  confirmLabel = 'Use photo',
  guide = 'oval',
}: {
  onCapture: (dataUrl: string) => void;
  onCancel?: () => void;
  /** Liveness hints shown in turn while the camera is live. */
  prompts?: string[];
  confirmLabel?: string;
  /** 'card' frames an ID document (landscape, rear camera by default). */
  guide?: 'oval' | 'none' | 'card';
}) {
  const card = guide === 'card';
  const ratio = card ? 1.586 : 1; // ID-1 card proportions
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>('starting');
  const [error, setError] = useState('');
  const [shot, setShot] = useState<string>();
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState<'user' | 'environment'>(card ? 'environment' : 'user');
  const [prompt, setPrompt] = useState(0);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    setState('starting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot open the camera. Try the latest Safari or Chrome.');
      setState('error');
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      stream.current = s;
      const v = video.current;
      if (v) {
        v.srcObject = s;
        await v.play().catch(() => {});
        // Only enable the shutter once real frames are arriving.
        if (!v.videoWidth) await new Promise((r) => v.addEventListener('loadeddata', r, { once: true }));
      }
      setState('live');
    } catch (e) {
      const name = (e as DOMException).name;
      setError(
        name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow camera access in your browser settings, then try again.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : 'The camera could not be started. Close other apps using it and try again.',
      );
      setState('error');
    }
  }, [facing, stop]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  useEffect(() => {
    if (state !== 'live' || !prompts?.length) return;
    setPrompt(0);
    const iv = window.setInterval(() => setPrompt((p) => (p + 1) % prompts.length), 1800);
    return () => window.clearInterval(iv);
  }, [state, prompts]);

  const capture = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    // Centre crop in the frame's shape, mirrored for the front camera so it matches the preview.
    const sw = Math.min(v.videoWidth, v.videoHeight * ratio);
    const sh = sw / ratio;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(Math.min(sw, card ? 1000 : 720));
    canvas.height = Math.round(canvas.width / ratio);
    const ctx = canvas.getContext('2d')!;
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    playShutter();
    navigator.vibrate?.(30);
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setShot(canvas.toDataURL('image/jpeg', 0.85));
    setState('captured');
    stop();
  };

  const retake = () => {
    setShot(undefined);
    start();
  };

  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative w-full overflow-hidden border border-line-strong bg-bg-elevated shadow-[var(--shadow-card)]', card ? 'aspect-[1.586/1] max-w-[420px] rounded-[20px]' : 'aspect-square max-w-[340px] rounded-[28px]')}>
        <video
          ref={video}
          playsInline
          muted
          aria-label="Camera preview"
          className={cn('size-full object-cover', facing === 'user' && '-scale-x-100', state !== 'live' && 'invisible')}
        />
        {shot && <img src={shot} alt="Captured photo" className="absolute inset-0 size-full object-cover" />}

        {guide === 'oval' && state === 'live' && (
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
            <defs>
              <mask id="cam-oval">
                <rect width="100" height="100" fill="white" />
                <ellipse cx="50" cy="47" rx="30" ry="38" fill="black" />
              </mask>
            </defs>
            <rect width="100" height="100" fill="rgba(28,16,7,0.55)" mask="url(#cam-oval)" />
            <ellipse cx="50" cy="47" rx="30" ry="38" fill="none" stroke="var(--gold)" strokeWidth="0.8" strokeDasharray="2 1.5" />
          </svg>
        )}

        {card && state === 'live' && (
          <svg viewBox="0 0 158.6 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
            <defs>
              <mask id="cam-card">
                <rect width="158.6" height="100" fill="white" />
                <rect x="10" y="9" width="138.6" height="82" rx="6" fill="black" />
              </mask>
            </defs>
            <rect width="158.6" height="100" fill="rgba(28,16,7,0.5)" mask="url(#cam-card)" />
            {[
              'M10 21V15a6 6 0 0 1 6-6h6',
              'M136.6 9h6a6 6 0 0 1 6 6v6',
              'M148.6 79v6a6 6 0 0 1-6 6h-6',
              'M22 91h-6a6 6 0 0 1-6-6v-6',
            ].map((d) => (
              <path key={d} d={d} fill="none" stroke="var(--brand-gold-1)" strokeWidth="1.6" strokeLinecap="round" />
            ))}
          </svg>
        )}

        {state === 'starting' && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4 animate-spin" /> Starting camera…
            </span>
          </div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <CameraOff className="size-10 text-danger" strokeWidth={1.25} />
            <p className="text-sm text-muted">{error}</p>
          </div>
        )}

        {state === 'live' && prompts?.length ? (
          <div aria-live="polite" className="absolute inset-x-0 bottom-3 flex justify-center">
            <AnimatePresence mode="wait">
              <m.span
                key={prompt}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-full bg-bg/80 px-3.5 py-1.5 text-xs font-medium text-text"
              >
                {prompts[prompt]}
              </m.span>
            </AnimatePresence>
          </div>
        ) : null}

        <AnimatePresence>
          {flash && (
            <m.div initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 bg-white" aria-hidden />
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className={cn('mt-6 flex w-full items-center justify-between', card ? 'max-w-[420px]' : 'max-w-[340px]')}>
        {state === 'captured' ? (
          <div className="grid w-full grid-cols-2 gap-3">
            <Button variant="secondary" size="lg" onClick={retake}>
              <RotateCcw className="size-5" /> Retake
            </Button>
            <Button size="lg" onClick={() => shot && onCapture(shot)}>
              {confirmLabel}
            </Button>
          </div>
        ) : state === 'error' ? (
          <div className="grid w-full gap-3">
            <Button size="lg" onClick={start}>
              <RefreshCw className="size-5" /> Try again
            </Button>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        ) : (
          <>
            <button type="button" onClick={onCancel} className="h-11 min-w-16 text-sm text-muted hover:text-text" disabled={!onCancel} aria-hidden={!onCancel}>
              {onCancel ? 'Cancel' : ''}
            </button>
            {/* Shutter button */}
            <m.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={capture}
              disabled={state !== 'live'}
              aria-label="Take photo"
              className="relative grid size-[76px] place-items-center rounded-full border-4 border-gold-light/80 bg-transparent disabled:opacity-40"
            >
              <span className="gold-gradient grid size-[58px] place-items-center rounded-full shadow-[var(--shadow-glow)]">
                <Camera className="size-6 text-gold-ink" />
              </span>
            </m.button>
            <button
              type="button"
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
              aria-label="Switch camera"
              className="grid size-11 min-w-16 place-items-center text-muted hover:text-text"
            >
              <SwitchCamera className="size-6" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
      {state === 'live' && <p className="mt-2 text-xs text-faint">{card ? 'Fit the whole document inside the frame, then tap the shutter' : 'Tap the shutter to take your photo'}</p>}
    </div>
  );
}
