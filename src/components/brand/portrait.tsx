import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Head, neck and shoulders as one outline (viewBox 300x400). */
const FIGURE =
  'M150 70C186 70 204 98 204 136C204 162 196 184 184 198C176 208 172 214 172 226L172 238C176 250 196 258 222 266C258 278 282 310 290 400L10 400C18 310 42 278 78 266C104 258 124 250 128 238L128 226C128 214 124 208 116 198C104 184 96 162 96 136C96 98 114 70 150 70Z';

/**
 * Generated placeholder portrait (mock data never uses real photos): a rim-lit head-and-shoulders
 * silhouette against warm lounge backlight, soft bokeh and a wisp of smoke. Each member gets a
 * stable variation from `hue`.
 */
export function PortraitArt({ name, hue, className }: { name: string; hue: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const h = hue;
  const bokeh = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    cx: (h * 7 + i * 71) % 300,
    cy: 30 + ((h * 5 + i * 43) % 200),
    r: 10 + ((h + i * 13) % 22),
    o: 0.1 + ((i * 7) % 5) / 30,
  }));
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className={cn('block size-full', className)} role="img" aria-label={`Placeholder portrait for ${name}`}>
      <defs>
        <linearGradient id={`base-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h} 35% 16%)`} />
          <stop offset="1" stopColor="hsl(25 30% 5%)" />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx={0.42 + (h % 10) / 100} cy="0.34" r="0.55">
          <stop offset="0" stopColor={`hsl(${h + 6} 70% 48%)`} stopOpacity=".95" />
          <stop offset="0.45" stopColor={`hsl(${h} 60% 30%)`} stopOpacity=".55" />
          <stop offset="1" stopColor={`hsl(${h} 50% 12%)`} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fig-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h} 22% 13%)`} />
          <stop offset="1" stopColor={`hsl(${h} 25% 8%)`} />
        </linearGradient>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor={`hsl(${h + 12} 85% 72%)`} stopOpacity=".9" />
          <stop offset=".45" stopColor={`hsl(${h + 6} 80% 60%)`} stopOpacity=".15" />
          <stop offset="1" stopColor={`hsl(${h} 80% 60%)`} stopOpacity="0" />
        </linearGradient>
        <filter id={`blur-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect width="300" height="400" fill={`url(#base-${id})`} />
      <rect width="300" height="400" fill={`url(#glow-${id})`} />
      <g filter={`url(#blur-${id})`}>
        {bokeh.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={`hsl(${h + 14} 90% 72%)`} opacity={b.o} />
        ))}
      </g>
      <path d={FIGURE} fill={`url(#fig-${id})`} />
      <path d={FIGURE} fill="none" stroke={`url(#rim-${id})`} strokeWidth="2.5" />
      <path
        d={`M${222 + (h % 24)} 330c-14-28 16-42 4-72s18-46 4-82`}
        stroke="hsl(35 30% 88%)"
        strokeOpacity=".1"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        filter={`url(#blur-${id})`}
      />
    </svg>
  );
}

export function Avatar({
  name,
  hue,
  size = 48,
  className,
  ring,
  src,
}: {
  name: string;
  hue: number;
  size?: number;
  className?: string;
  ring?: boolean;
  src?: string;
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border',
        ring ? 'border-gold' : 'border-line-strong',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <PortraitArt name={name} hue={hue} className="scale-110" />
      )}
    </div>
  );
}
