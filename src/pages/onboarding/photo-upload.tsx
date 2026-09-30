import { Camera, Check, ImagePlus, Images } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Frame } from '@/components/layout/app-shell';
import { OnboardingHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { PHOTO_RULES } from '@/content/legal';
import { useSaveMe } from '@/features/queries';
import { CameraCapture } from '@/features/verification/camera-capture';
import { checkImageFile, compressImage } from '@/lib/media';
import { nextStep, useSession } from '@/lib/session';

export default function PhotoUpload() {
  const { session, update } = useSession();
  const saveMe = useSaveMe();
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();
  const [camera, setCamera] = useState(false);

  useEffect(() => () => void (preview?.startsWith('blob:') && URL.revokeObjectURL(preview)), [preview]);

  const onFile = (f?: File) => {
    if (!f) return;
    const problem = checkImageFile(f);
    if (problem) return setError(problem);
    setError(undefined);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <Frame>
      <OnboardingHeader title="Profile Photo" progress={4 / 6} step="4/6" backTo="/ethics" />
      <div className="flex min-h-[calc(100dvh-90px)] flex-col px-5 pb-8 pt-2">
        <button
          type="button"
          onClick={() => setCamera(true)}
          className="group relative mx-auto mt-2 grid size-44 place-items-center overflow-hidden rounded-full border-2 border-dashed border-line-strong bg-surface transition-colors hover:border-gold"
          aria-label={preview ? 'Retake photo with camera' : 'Take a photo with camera'}
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
              await saveMe.mutateAsync({ photoStatus: 'pending', photoUrl: await compressImage(preview!) });
              update({ photoUploaded: true });
              navigate(nextStep({ ...session, photoUploaded: true }));
            }}
          >
            {preview ? 'Use this photo' : 'Upload photo'}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" variant="secondary" onClick={() => setCamera(true)}>
              <Camera className="size-5" /> {preview ? 'Retake' : 'Take photo'}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => input.current?.click()}>
              <Images className="size-5" /> Library
            </Button>
          </div>
          <p className="text-center text-xs text-faint">A profile photo is required to use Daily Stogie.</p>
        </div>
      </div>
      <Sheet open={camera} onOpenChange={setCamera} title="Take your profile photo" description="Face the camera in good light, then tap the shutter.">
        {camera && (
          <div className="pb-2">
            <CameraCapture
              confirmLabel="Use photo"
              onCancel={() => setCamera(false)}
              onCapture={(img) => {
                setPreview(img);
                setError(undefined);
                setCamera(false);
              }}
            />
          </div>
        )}
      </Sheet>
    </Frame>
  );
}
