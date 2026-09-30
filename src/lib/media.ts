/** Client-side compression: longest side `max` px, JPEG 80%. Accepts an object URL or data URL. */
export function compressImage(src: string, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export const IMAGE_TYPES = /^image\/(jpeg|png|webp|heic|heif)$/;
export const MAX_IMAGE_MB = 10;

/** Validates a picked file; returns an error message or null. */
export function checkImageFile(f: File): string | null {
  if (!IMAGE_TYPES.test(f.type)) return 'Please choose a JPG, PNG, WebP or HEIC image.';
  if (f.size > MAX_IMAGE_MB * 1024 * 1024) return `Photo must be under ${MAX_IMAGE_MB} MB.`;
  return null;
}

/** A short synthesized camera-shutter "click" (no audio file needed). Silently skipped if audio is unavailable. */
export function playShutter() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // two quick noise bursts: the "ch-chk" of a shutter
      const t = i / len;
      const env = t < 0.35 ? Math.exp(-t * 30) : 0.6 * Math.exp(-(t - 0.35) * 25);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    src.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}
