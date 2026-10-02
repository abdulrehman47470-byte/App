import { cn } from '@/lib/utils';

/**
 * Profile pictures. Members must upload a photo to use the app; until a photo is available
 * (or while it is loading) the client's logo is shown in its place, never a generic silhouette.
 * `hue` is kept in the props for callers but is no longer used.
 */

/** Small square version of a bundled member photo, for avatars (keeps lists light). */
const thumbOf = (src: string) => (src.startsWith('/members/') ? src.replace(/\.webp$/, '-sm.webp') : src);

function LogoPlaceholder({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn('logo-placeholder grid size-full place-items-center', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <img src="/logo-mark.webp" srcSet="/logo-mark.webp 1x, /logo-mark@2x.webp 2x" alt="" draggable={false} decoding="async" className="size-[62%] select-none object-contain opacity-90" />
    </div>
  );
}

/** Large photo (Discover cards, profile headers). */
export function PortraitArt({ name, src, className }: { name: string; hue?: number; src?: string; className?: string }) {
  if (!src) return <LogoPlaceholder className={className} label={`${name} has not added a photo yet`} />;
  return (
    <img
      src={src}
      alt={`Photo of ${name}`}
      draggable={false}
      decoding="async"
      className={cn('block size-full select-none object-cover object-[50%_30%]', className)}
    />
  );
}

/** Round avatar. Decorative (alt=""): the member's name is always shown next to it. */
export function Avatar({
  size = 48,
  className,
  ring,
  src,
}: {
  name: string;
  hue?: number;
  size?: number;
  className?: string;
  ring?: boolean;
  src?: string;
}) {
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden rounded-full border bg-surface-2', ring ? 'border-brand-gold' : 'border-line-strong', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={size <= 192 ? thumbOf(src) : src} alt="" decoding="async" loading="lazy" draggable={false} className="size-full select-none object-cover object-[50%_25%]" />
      ) : (
        <LogoPlaceholder />
      )}
    </div>
  );
}
