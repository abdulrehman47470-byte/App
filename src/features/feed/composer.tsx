import { Camera, Clapperboard, Flame, HelpCircle, Images, MapPin, Music2, PenLine, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { newMediaId, putMedia, rememberMediaUrl } from '@/lib/media-store';
import type { MediaAsset, PostKind } from '@/types';

const MAX_VIDEO_MB = 200;
const MAX_AUDIO_MB = 30;

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

export function ComposerSheet({ open, onOpenChange, initialKind }: { open: boolean; onOpenChange: (v: boolean) => void; initialKind: PostKind }) {
  const { create } = useFeedActions();
  const { data: me } = useMe();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [body, setBody] = useState('');
  const [cigar, setCigar] = useState('');
  const [loungeId, setLoungeId] = useState('');
  const [image, setImage] = useState<string>();
  const [video, setVideo] = useState<{ file: File; url: string }>();
  const [audio, setAudio] = useState<{ file: File; url: string; title: string }>();
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState<string>();
  const meta = KINDS.find((k) => k.id === kind)!;

  // Release the preview URL if the sheet closes without posting.
  const posted = useRef(false);
  useEffect(() => () => void (video && !posted.current && URL.revokeObjectURL(video.url)), [video]);
  useEffect(() => () => void (audio && !posted.current && URL.revokeObjectURL(audio.url)), [audio]);

  const pickFile = async (f?: File) => {
    if (!f) return;
    if (f.type.startsWith('audio/')) {
      if (f.size > MAX_AUDIO_MB * 1024 * 1024) return setError(`Audio files can be up to ${MAX_AUDIO_MB} MB.`);
      setImage(undefined);
      setVideo(undefined);
      setAudio({ file: f, url: URL.createObjectURL(f), title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') });
      setError(undefined);
      return;
    }
    if (f.type.startsWith('video/')) {
      if (!/^video\/(mp4|quicktime|webm|x-m4v|3gpp)$/.test(f.type)) return setError('Please choose an MP4, MOV or WebM video.');
      if (f.size > MAX_VIDEO_MB * 1024 * 1024) return setError(`Videos can be up to ${MAX_VIDEO_MB} MB.`);
      setImage(undefined);
      setAudio(undefined);
      setVideo({ file: f, url: URL.createObjectURL(f) }); // preview appears instantly
      setError(undefined);
      return;
    }
    const problem = checkImageFile(f);
    if (problem) return setError(problem);
    const url = URL.createObjectURL(f);
    setVideo(undefined);
    setAudio(undefined);
    setImage(await compressImage(url, 1280));
    URL.revokeObjectURL(url);
    setError(undefined);
  };

  const submit = async () => {
    if (kind === 'checkin' && !loungeId) return setError('Choose the lounge you are at.');
    // The file shows in the feed immediately from memory; saving to the device happens in the background.
    let attachment: MediaAsset | undefined;
    let blob: Blob | undefined;
    const mediaId = newMediaId();
    if (video) {
      attachment = { type: 'video', mediaId };
      rememberMediaUrl(mediaId, video.url);
      blob = video.file;
    } else if (audio) {
      attachment = { type: 'audio', mediaId, title: audio.title.trim() || 'Untitled track', artist: me?.name || 'You' };
      rememberMediaUrl(mediaId, audio.url);
      blob = audio.file;
    } else if (image) {
      attachment = { type: 'image', mediaId };
      rememberMediaUrl(mediaId, image);
      blob = await (await fetch(image)).blob();
    }
    try {
      await create.mutateAsync({ kind, body, attachment, cigar: kind === 'smoking' ? cigar : undefined, loungeId: kind === 'checkin' ? loungeId : undefined });
      posted.current = true;
      toast('Posted to the feed');
      onOpenChange(false);
      if (attachment && blob) putMedia(mediaId, blob).catch(() => toast('Could not save the file on this device. It will show until you reload.', 'danger'));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const canPost = (body.trim() || image || video || audio) && body.length <= POST_MAX && !create.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={camera ? 'Take a photo' : 'Create a post'}
      footer={
        camera ? undefined : (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => file.current?.click()} aria-label="Add photo or video from library" className="grid size-11 place-items-center rounded-full text-gold hover:bg-surface-2">
              <Images className="size-5" strokeWidth={1.75} />
            </button>
            <button type="button" onClick={() => videoInput.current?.click()} aria-label="Add a video" className="grid size-11 place-items-center rounded-full text-gold hover:bg-surface-2">
              <Clapperboard className="size-5" strokeWidth={1.75} />
            </button>
            <button type="button" onClick={() => audioInput.current?.click()} aria-label="Add a song or audio" className="grid size-11 place-items-center rounded-full text-gold hover:bg-surface-2">
              <Music2 className="size-5" strokeWidth={1.75} />
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
              setVideo(undefined);
              setAudio(undefined);
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
          {video && (
            <div className="relative overflow-hidden rounded-[16px] border border-line bg-black">
              <video src={video.url} className="max-h-72 w-full object-contain" controls playsInline muted autoPlay loop aria-label="Attached video preview" />
              <button type="button" onClick={() => (URL.revokeObjectURL(video.url), setVideo(undefined))} aria-label="Remove video" className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-bg/80 text-text">
                <X className="size-4" />
              </button>
            </div>
          )}
          {audio && (
            <div className="flex items-center gap-3 rounded-[16px] border border-line bg-surface-2 p-3">
              <span className="gold-gradient grid size-12 shrink-0 place-items-center rounded-[12px] text-gold-ink">
                <Music2 className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input value={audio.title} onChange={(e) => setAudio({ ...audio, title: e.target.value })} aria-label="Track title" maxLength={80} className="h-10" />
                <audio src={audio.url} controls className="h-8 w-full" aria-label="Attached audio preview" />
              </div>
              <button type="button" onClick={() => (URL.revokeObjectURL(audio.url), setAudio(undefined))} aria-label="Remove audio" className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-text">
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
          <input ref={file} type="file" accept="image/*,video/*" className="sr-only" tabIndex={-1} onChange={(e) => (pickFile(e.target.files?.[0]), (e.target.value = ''))} />
          <input ref={audioInput} type="file" accept="audio/*" className="sr-only" tabIndex={-1} onChange={(e) => (pickFile(e.target.files?.[0]), (e.target.value = ''))} />
          <input ref={videoInput} type="file" accept="video/*" className="sr-only" tabIndex={-1} onChange={(e) => (pickFile(e.target.files?.[0]), (e.target.value = ''))} />
        </div>
      )}
    </Sheet>
  );
}
