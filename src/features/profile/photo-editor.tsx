import { Camera, Clock, Images } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/brand/portrait';
import { Button } from '@/components/ui/button';
import { Badge, Card } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { CameraCapture } from '@/features/verification/camera-capture';
import { checkImageFile, compressImage } from '@/lib/media';
import type { PhotoStatus } from '@/types';

/**
 * Profile photo editor (Edit Profile): replace the photo from the phone's photo library or the
 * camera. The photo can be changed but never removed, because a photo is required to use the app.
 */
export function PhotoEditor({
  name,
  photoUrl,
  status,
  error: requiredError,
  onChange,
}: {
  name: string;
  photoUrl?: string;
  status: PhotoStatus;
  error?: string;
  onChange: (dataUrl: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const pick = async (f?: File) => {
    if (!f) return;
    const problem = checkImageFile(f);
    if (problem) return setError(problem);
    setBusy(true);
    const url = URL.createObjectURL(f);
    try {
      onChange(await compressImage(url, 640));
      setError(undefined);
    } catch {
      setError('That photo could not be read. Please try another one.');
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={photoUrl} size={88} ring />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-text">Profile photo</p>
          <p className="text-xs text-muted">Required. A clear, recent photo of you.</p>
          {status === 'pending' && (
            <Badge tone="warning" className="mt-1.5">
              <Clock className="size-3" /> In review
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => input.current?.click()} disabled={busy}>
          <Images className="size-4" /> Photo library
        </Button>
        <Button variant="secondary" onClick={() => setCamera(true)} disabled={busy}>
          <Camera className="size-4" /> Take photo
        </Button>
      </div>
      {(error ?? requiredError) && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error ?? requiredError}
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        New photos are reviewed against the{' '}
        <Link to="/legal/ethics" className="text-gold underline-offset-2 hover:underline">
          photo rules
        </Link>{' '}
        before other members see them.
      </p>
      {/* No `capture` attribute: phones then offer the photo library as well as the camera. */}
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
      <Sheet open={camera} onOpenChange={setCamera} title="Take your profile photo" description="Face the camera in good light, then tap the shutter.">
        {camera && (
          <div className="pb-2">
            <CameraCapture
              confirmLabel="Use photo"
              onCancel={() => setCamera(false)}
              onCapture={(img) => {
                onChange(img);
                setCamera(false);
              }}
            />
          </div>
        )}
      </Sheet>
    </Card>
  );
}
