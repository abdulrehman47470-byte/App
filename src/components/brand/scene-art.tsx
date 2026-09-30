import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Generated still-life for mock post images: a cigar resting on an ashtray beside a glass. */
export function SceneArt({ hue, className, label = 'Illustration of a cigar and a glass' }: { hue: number; className?: string; label?: string }) {
  const id = useId().replace(/:/g, '');
  const h = hue;
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className={cn('block size-full', className)} role="img" aria-label={label}>
      <defs>
        <radialGradient id={`bg-${id}`} cx="0.3" cy="0.2" r="1">
          <stop offset="0" stopColor={`hsl(${h} 55% 30%)`} />
          <stop offset="0.6" stopColor={`hsl(${h} 40% 11%)`} />
          <stop offset="1" stopColor="hsl(25 30% 5%)" />
        </radialGradient>
        <linearGradient id={`table-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h + 5} 45% 20%)`} />
          <stop offset="1" stopColor={`hsl(${h} 40% 8%)`} />
        </linearGradient>
        <linearGradient id={`drink-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h + 12} 85% 55%)`} stopOpacity=".95" />
          <stop offset="1" stopColor={`hsl(${h + 4} 80% 28%)`} />
        </linearGradient>
        <linearGradient id={`cigar-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h + 2} 45% 34%)`} />
          <stop offset="1" stopColor={`hsl(${h} 45% 16%)`} />
        </linearGradient>
        <filter id={`soft-${id}`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="400" height="250" fill={`url(#bg-${id})`} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={40 + ((h * 9 + i * 97) % 330)} cy={30 + ((h * 3 + i * 41) % 90)} r={10 + i * 4} fill={`hsl(${h + 15} 90% 70%)`} opacity=".08" filter={`url(#soft-${id})`} />
      ))}
      <rect y="170" width="400" height="80" fill={`url(#table-${id})`} />
      <line x1="0" y1="170" x2="400" y2="170" stroke={`hsl(${h} 60% 45%)`} strokeOpacity=".35" />
      {/* glass */}
      <g transform="translate(270 92)">
        <path d="M0 0h70l-6 88a8 8 0 0 1-8 7H14a8 8 0 0 1-8-7Z" fill="rgba(243,233,214,0.07)" stroke="rgba(243,233,214,0.25)" />
        <path d="M4 42h62l-3.2 46a6 6 0 0 1-6 5.5H13.2a6 6 0 0 1-6-5.5Z" fill={`url(#drink-${id})`} opacity=".9" />
        <rect x="18" y="30" width="22" height="18" rx="3" fill="rgba(243,233,214,0.35)" transform="rotate(-10 29 39)" />
        <path d="M10 4v70" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* ashtray */}
      <ellipse cx="130" cy="192" rx="92" ry="20" fill={`hsl(${h} 25% 12%)`} stroke={`hsl(${h} 40% 30%)`} />
      <ellipse cx="130" cy="188" rx="70" ry="12" fill={`hsl(${h} 25% 7%)`} />
      {/* cigar */}
      <g transform="rotate(-8 130 170)">
        <rect x="55" y="162" width="170" height="17" rx="8.5" fill={`url(#cigar-${id})`} />
        <rect x="170" y="162" width="18" height="17" fill={`hsl(${h + 8} 70% 45%)`} opacity=".9" />
        <rect x="174" y="165" width="10" height="11" rx="1" fill={`hsl(${h} 50% 20%)`} opacity=".6" />
        <rect x="51" y="162.5" width="10" height="16" rx="3" fill="hsl(30 10% 70%)" opacity=".85" />
        <circle cx="52" cy="170.5" r="5" fill="hsl(20 95% 55%)" opacity=".85" filter={`url(#soft-${id})`} />
      </g>
      {/* smoke */}
      <path d="M48 150c-16-24 18-34 4-60s20-40 6-70" stroke="hsl(35 30% 90%)" strokeOpacity=".16" strokeWidth="10" fill="none" strokeLinecap="round" filter={`url(#soft-${id})`} />
      <path d="M52 148c-8-18 12-26 2-46" stroke="hsl(35 30% 90%)" strokeOpacity=".2" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
