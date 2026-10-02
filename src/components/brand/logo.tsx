import { cn } from '@/lib/utils';

/**
 * The client's logo mark on a cream medallion with a gold ring (the black silhouette needs a light
 * backing on the dark theme). Size it with a `size-*` class; the image is 160/320px WebP.
 */
export function LogoMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn('logo-medallion relative inline-grid shrink-0 place-items-center rounded-full', className)} aria-hidden>
      <img
        src="/logo-mark.webp"
        srcSet="/logo-mark.webp 1x, /logo-mark@2x.webp 2x"
        alt=""
        width={160}
        height={160}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
        className="size-[82%] translate-y-[2%] select-none object-contain"
      />
    </span>
  );
}

export function Wordmark({ className, stacked = true }: { className?: string; stacked?: boolean }) {
  return (
    <span className={cn('gold-text font-serif font-semibold uppercase leading-[0.9] tracking-[0.06em]', className)}>
      Daily{stacked ? <br /> : ' '}Stogie
    </span>
  );
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: ['size-10', 'text-lg'], md: ['size-16', 'text-2xl'], lg: ['size-32', 'text-[40px]'] }[size];
  return (
    <div className="flex flex-col items-center gap-4" aria-label="Daily Stogie">
      <LogoMark className={s[0]} priority={size === 'lg'} />
      <Wordmark className={cn(s[1], 'text-center')} />
    </div>
  );
}

/** Small logo between two fading gold lines, used to close a list or an article. */
export function LogoDivider({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-4 text-center', className)}>
      <div className="flex w-full items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line-strong" />
        <LogoMark className="size-10" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line-strong" />
      </div>
      {label && <p className="font-serif text-sm italic text-faint">{label}</p>}
    </div>
  );
}
