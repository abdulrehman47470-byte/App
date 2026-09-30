import { Camera, Flame, HelpCircle, Images, MapPin, PenLine, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar } from '@/components/brand/portrait';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input, Select, Textarea } from '@/components/ui/field';
import { Card } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { MOCK_LOUNGES } from '@/data/mock/content';
import { useFeedActions, useMe } from '@/features/queries';
import { CameraCapture } from '@/features/verification/camera-capture';
import { POST_MAX } from '@/lib/api/mock';
import { checkImageFile, compressImage } from '@/lib/media';
import type { PostKind } from '@/types';

const KINDS: { id: PostKind; label: string; icon: typeof PenLine; hint: string }[] = [
  { id: 'update', label: 'Update', icon: PenLine, hint: 'Share something with the community…' },
  { id: 'smoking', label: 'Smoking', icon: Flame, hint: 'How is it smoking? Draw, burn, flavors…' },
  { id: 'checkin', label: 'Check in', icon: MapPin, hint: 'Who is around? What is the room like tonight?' },
  { id: 'question', label: 'Ask', icon: HelpCircle, hint: 'Ask the community a question…' },
];

/** "Start a post" card + composer sheet. */
export function Composer() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const [startKind, setStartKind] = useState<PostKind>('update');

  const openWith = (k: PostKind) => {
    setStartKind(k);
    setOpen(true);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={me?.name || 'You'} hue={me?.photoHue ?? 30} src={me?.photoUrl} size={44} />
        <button
          type="button"
          onClick={() => openWith('update')}
          className="h-12 flex-1 rounded-full border border-line-strong px-4 text-left text-[15px] text-muted transition-colors hover:border-gold hover:text-text"
        >
          Start a post
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {KINDS.filter((k) => k.id !== 'update').map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => openWith(id)} className="flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-[12px] text-sm text-muted hover:bg-surface-2 hover:text-text">
            <Icon className="size-4 text-gold" strokeWidth={1.75} /> {label}
          </button>
        ))}
      </div>
      {open && <ComposerSheet open={open} onOpenChange={setOpen} initialKind={startKind} />}
    </Card>
  );
}

function ComposerSheet({ open, onOpenChange, initialKind }: { open: boolean; onOpenChange: (v: boolean) => void; initialKind: PostKind }) {
  const { create } = useFeedActions();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [body, setBody] = useState('');
  const [cigar, setCigar] = useState('');
  const [loungeId, setLoungeId] = useState('');
  const [image, setImage] = useState<string>();
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState<string>();
  const meta = KINDS.find((k) => k.id === kind)!;

  const pickFile = async (f?: File) => {
    if (!f) return;
    const problem = checkImageFile(f);
    if (problem) return setError(problem);
    const url = URL.createObjectURL(f);
    setImage(await compressImage(url, 1280));
    URL.revokeObjectURL(url);
    setError(undefined);
  };

  const submit = async () => {
    if (kind === 'checkin' && !loungeId) return setError('Choose the lounge you are at.');
    try {
      await create.mutateAsync({ kind, body, imageUrl: image, cigar: kind === 'smoking' ? cigar : undefined, loungeId: kind === 'checkin' ? loungeId : undefined });
      toast('Posted to the feed');
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const canPost = (body.trim() || image) && body.length <= POST_MAX && !create.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={camera ? 'Take a photo' : 'Create a post'}
      footer={
        camera ? undefined : (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => file.current?.click()} aria-label="Add photo from library" className="grid size-11 place-items-center rounded-full text-gold hover:bg-surface-2">
              <Images className="size-5" strokeWidth={1.75} />
            </button>
            <button type="button" onClick={() => setCamera(true)} aria-label="Take a photo" className="grid size-11 place-items-center rounded-full text-gold hover:bg-surface-2">
              <Camera className="size-5" strokeWidth={1.75} />
            </button>
            <span className="ml-auto mr-2 text-xs text-faint">
              {body.length}/{POST_MAX}
            </span>
            <Button onClick={submit} disabled={!canPost}>
              Post
            </Button>
          </div>
        )
      }
    >
      {camera ? (
        <div className="pb-2">
          <CameraCapture
            guide="none"
            confirmLabel="Add to post"
            onCancel={() => setCamera(false)}
            onCapture={(img) => {
              setImage(img);
              setCamera(false);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          <div role="radiogroup" aria-label="Post type" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5">
            {KINDS.map((k) => (
              <Chip key={k.id} size="sm" role="radio" label={k.label} selected={kind === k.id} onToggle={() => setKind(k.id)} />
            ))}
          </div>
          {kind === 'smoking' && <Input value={cigar} onChange={(e) => setCigar(e.target.value)} placeholder="Which cigar? e.g. Padrón 1964 Maduro" aria-label="Cigar" maxLength={80} />}
          {kind === 'checkin' && (
            <Select value={loungeId} onChange={(e) => setLoungeId(e.target.value)} aria-label="Lounge">
              <option value="">Choose a lounge…</option>
              {MOCK_LOUNGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {l.city}, {l.state}
                </option>
              ))}
            </Select>
          )}
          <Textarea
            autoFocus
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError(undefined);
            }}
            maxLength={POST_MAX}
            placeholder={meta.hint}
            aria-label="Post text"
            className="min-h-36 border-transparent bg-transparent px-0 text-base hover:border-transparent focus:border-transparent focus:ring-0"
          />
          {image && (
            <div className="relative overflow-hidden rounded-[16px] border border-line">
              <img src={image} alt="Attached photo" className="max-h-72 w-full object-cover" />
              <button type="button" onClick={() => setImage(undefined)} aria-label="Remove photo" className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-bg/80 text-text">
                <X className="size-4" />
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <p className="text-[11px] leading-relaxed text-faint">
            Posts follow the Stogie Ethics: be respectful, no selling or trading cigars, no explicit photos. Everyone here
            is 21+.
          </p>
          <input ref={file} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>
      )}
    </Sheet>
  );
}
