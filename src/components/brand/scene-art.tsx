import { cn } from '@/lib/utils';

/**
 * Generated still-life for mock post images: a cigar resting on an ashtray beside a glass.
 * Served as a cached SVG image (rasterised once by the browser) so the feed scrolls smoothly.
 */
const cache = new Map<number, string>();
function sceneUrl(h: number): string {
  const hit = cache.get(h);
  if (hit) return hit;
  const bokeh = [0, 1, 2, 3]
    .map((i) => `<circle cx="${40 + ((h * 9 + i * 97) % 330)}" cy="${30 + ((h * 3 + i * 41) % 90)}" r="${10 + i * 4}" fill="url(#s)" opacity=".14"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="bg" cx="0.3" cy="0.2" r="1"><stop offset="0" stop-color="hsl(${h} 55% 30%)"/><stop offset="0.6" stop-color="hsl(${h} 40% 11%)"/><stop offset="1" stop-color="hsl(25 30% 5%)"/></radialGradient>
<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h + 5} 45% 20%)"/><stop offset="1" stop-color="hsl(${h} 40% 8%)"/></linearGradient>
<linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h + 12} 85% 55%)" stop-opacity=".95"/><stop offset="1" stop-color="hsl(${h + 4} 80% 28%)"/></linearGradient>
<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h + 2} 45% 34%)"/><stop offset="1" stop-color="hsl(${h} 45% 16%)"/></linearGradient>
<radialGradient id="s"><stop offset="0" stop-color="hsl(${h + 15} 90% 70%)"/><stop offset="1" stop-color="hsl(${h + 15} 90% 70%)" stop-opacity="0"/></radialGradient>
<radialGradient id="e"><stop offset="0" stop-color="hsl(30 100% 65%)"/><stop offset="1" stop-color="hsl(20 95% 55%)" stop-opacity="0"/></radialGradient>
</defs>
<rect width="400" height="250" fill="url(#bg)"/>${bokeh}
<rect y="170" width="400" height="80" fill="url(#t)"/>
<line x1="0" y1="170" x2="400" y2="170" stroke="hsl(${h} 60% 45%)" stroke-opacity=".35"/>
<g transform="translate(270 92)">
<path d="M0 0h70l-6 88a8 8 0 0 1-8 7H14a8 8 0 0 1-8-7Z" fill="rgba(243,233,214,0.07)" stroke="rgba(243,233,214,0.25)"/>
<path d="M4 42h62l-3.2 46a6 6 0 0 1-6 5.5H13.2a6 6 0 0 1-6-5.5Z" fill="url(#d)" opacity=".9"/>
<rect x="18" y="30" width="22" height="18" rx="3" fill="rgba(243,233,214,0.35)" transform="rotate(-10 29 39)"/>
<path d="M10 4v70" stroke="rgba(255,255,255,0.18)" stroke-width="3" stroke-linecap="round"/>
</g>
<ellipse cx="130" cy="192" rx="92" ry="20" fill="hsl(${h} 25% 12%)" stroke="hsl(${h} 40% 30%)"/>
<ellipse cx="130" cy="188" rx="70" ry="12" fill="hsl(${h} 25% 7%)"/>
<g transform="rotate(-8 130 170)">
<rect x="55" y="162" width="170" height="17" rx="8.5" fill="url(#c)"/>
<rect x="170" y="162" width="18" height="17" fill="hsl(${h + 8} 70% 45%)" opacity=".9"/>
<rect x="174" y="165" width="10" height="11" rx="1" fill="hsl(${h} 50% 20%)" opacity=".6"/>
<rect x="51" y="162.5" width="10" height="16" rx="3" fill="hsl(30 10% 70%)" opacity=".85"/>
<circle cx="52" cy="170.5" r="8" fill="url(#e)"/>
</g>
<path d="M48 150c-16-24 18-34 4-60s20-40 6-70" stroke="hsl(35 30% 90%)" stroke-opacity=".08" stroke-width="12" fill="none" stroke-linecap="round"/>
<path d="M52 148c-8-18 12-26 2-46" stroke="hsl(35 30% 90%)" stroke-opacity=".2" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(h, url);
  return url;
}

export function SceneArt({ hue, className, label = 'Illustration of a cigar and a glass' }: { hue: number; className?: string; label?: string }) {
  return <img src={sceneUrl(hue)} alt={label} loading="lazy" decoding="async" draggable={false} className={cn('block size-full select-none object-cover', className)} />;
}
