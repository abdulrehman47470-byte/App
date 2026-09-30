"""Builds the logo assets from the client's logo (transparent PNG).
Usage: python scripts/logo_assets.py path/to/logo-mark.png
Outputs (in public/):
  logo-mark.webp / logo-mark@2x.webp  cropped transparent mark for the in-app medallion
  pwa-192.png, pwa-512.png, apple-touch-icon.png, favicon.png  mark on a cream disc over the dark background
"""
import sys
from PIL import Image, ImageDraw, ImageFilter

src = Image.open(sys.argv[1]).convert('RGBA')
mark = src.crop(src.getchannel('A').getbbox())

# square canvas with a little breathing room
side = max(mark.size)
sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
sq.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2), mark)

for size, name in [(160, 'logo-mark.webp'), (320, 'logo-mark@2x.webp')]:
    sq.resize((size, size), Image.LANCZOS).save(f'public/{name}', 'WEBP', quality=90, method=6)

BG = (13, 10, 8, 255)
CREAM_IN = (246, 237, 220)
CREAM_OUT = (228, 208, 172)
GOLD = (217, 164, 65, 255)


def medallion(size: int, full_bleed_bg: bool) -> Image.Image:
    s = size * 4  # supersample for smooth edges
    img = Image.new('RGBA', (s, s), BG if full_bleed_bg else (0, 0, 0, 0))
    pad = int(s * 0.06)
    disc = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(disc)
    # radial-ish cream fill: concentric circles from outside in
    r0 = s // 2 - pad
    steps = 60
    for i in range(steps):
        t = i / (steps - 1)
        r = int(r0 * (1 - t * 0.999))
        col = tuple(int(CREAM_OUT[k] + (CREAM_IN[k] - CREAM_OUT[k]) * t) for k in range(3)) + (255,)
        d.ellipse([s // 2 - r, s // 2 - r, s // 2 + r, s // 2 + r], fill=col)
    d.ellipse([s // 2 - r0, s // 2 - r0, s // 2 + r0, s // 2 + r0], outline=GOLD, width=max(4, s // 60))
    shadow = disc.getchannel('A').filter(ImageFilter.GaussianBlur(s // 40))
    img.paste((0, 0, 0, 140), (0, s // 80), shadow)
    img.alpha_composite(disc)
    inner = int(r0 * 2 * 0.80)
    m = sq.resize((inner, inner), Image.LANCZOS)
    img.alpha_composite(m, ((s - inner) // 2, (s - inner) // 2 + int(s * 0.01)))
    return img.resize((size, size), Image.LANCZOS)


medallion(192, True).save('public/pwa-192.png', optimize=True)
medallion(512, True).save('public/pwa-512.png', optimize=True)
medallion(180, True).save('public/apple-touch-icon.png', optimize=True)
medallion(64, False).save('public/favicon.png', optimize=True)
print('logo assets written')
