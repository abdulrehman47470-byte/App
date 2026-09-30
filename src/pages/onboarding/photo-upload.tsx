import { Camera, Check, ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Frame } from '@/components/layout/app-shell';
import { OnboardingHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/misc';
import { PHOTO_RULES } from '@/content/legal';
import { useSaveMe } from '@/features/queries';
import { nextStep, useSession } from '@/lib/session';

const MAX_MB = 10;

/** Client-side compression: longest side 640px, JPEG 80%. */
function compress(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height));
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

export default function PhotoUpload() {
  const { session, update } = useSession();
  const saveMe = useSaveMe();
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const onFile = (f?: File) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type)) return setError('Please choose a JPG, PNG, WebP or HEIC image.');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Photo must be under ${MAX_MB} MB.`);
    setError(undefined);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <Frame>
      <OnboardingHeader title="Profile Photo" progress={4 / 6} step="4/6" backTo="/ethics" />
      <div className="flex min-h-[calc(100dvh-90px)] flex-col px-5 pb-8 pt-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="group relative mx-auto mt-2 grid size-44 place-items-center overflow-hidden rounded-full border-2 border-dashed border-line-strong bg-surface transition-colors hover:border-gold"
          aria-label={preview ? 'Change photo' : 'Choose a photo'}
        >
          {preview ? (
            <img src={preview} alt="Your selected profile photo" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-12 text-muted transition-colors group-hover:text-gold" strokeWidth={1} />
          )}
          <span className="gold-gradient absolute bottom-2 right-6 grid size-11 place-items-center rounded-full text-gold-ink shadow-[var(--shadow-glow)]">
            <Camera className="size-5" />
          </span>
        </button>
        <input ref={input} type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} tabIndex={-1} />

        <p className="mx-auto mt-5 max-w-xs text-center text-sm text-muted">
          A clear, recent photo of you is required. It is used on your profile and for matching.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <Card className="mt-6 p-5">
          <h2 className="micro-label mb-3">Photo rules</h2>
          <ul className="space-y-2.5">
            {PHOTO_RULES.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-sm text-text">
                <Check className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={2.5} /> {r}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-xs text-faint">
            New photos are reviewed by our team. You can see yours right away; other members see it once approved.
          </p>
        </Card>

        <div className="mt-auto space-y-3 pt-8">
          <Button
            size="lg"
            block
            disabled={!preview || saveMe.isPending}
            onClick={async () => {
              // Phase 2: compress client-side, upload to a private Storage bucket, status = pending.
              await saveMe.mutateAsync({ photoStatus: 'pending', photoUrl: await compress(preview!) });
              update({ photoUploaded: true });
              navigate(nextStep({ ...session, photoUploaded: true }));
            }}
          >
            {preview ? 'Use this photo' : 'Upload photo'}
          </Button>
          {!preview && (
            <Button size="lg" variant="secondary" block onClick={() => input.current?.click()}>
              Choose from library
            </Button>
          )}
          <p className="text-center text-xs text-faint">A profile photo is required to use Daily Stogie.</p>
        </div>
      </div>
    </Frame>
  );
}
