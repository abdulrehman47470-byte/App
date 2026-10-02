import { ArrowDown, ArrowUp, Eye, ImagePlus, PenLine, Pilcrow, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { useAssetUrl } from '@/features/feed/post-media';
import { useBlogActions } from '@/features/queries';
import { checkImageFile, compressImage } from '@/lib/media';
import { deleteMedia, newMediaId, putMedia, rememberMediaUrl } from '@/lib/media-store';
import { cn } from '@/lib/utils';
import type { BlogBlock, BlogPost } from '@/types';

type Category = BlogPost['category'];
type Block = BlogBlock & { key: string };
interface Draft {
  title: string;
  category: Category;
  cover?: { mediaId: string };
  blocks: Block[];
}

const DRAFT_KEY = 'ds.blog-draft';
const TITLE_MAX = 120;
const key = () => Math.random().toString(36).slice(2, 9);
const emptyDraft = (): Draft => ({
  title: '',
  category: 'Guides',
  blocks: [{ type: 'p', text: '', key: key() }],
});

function loadDraft(): Draft {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null;
    return d?.blocks?.length ? d : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

/** Upload one photo: compress, show it at once, save it to the device in the background. */
async function uploadImage(f: File): Promise<string> {
  const problem = checkImageFile(f);
  if (problem) throw new Error(problem);
  const raw = URL.createObjectURL(f);
  const img = await compressImage(raw, 1600);
  URL.revokeObjectURL(raw);
  const id = newMediaId();
  rememberMediaUrl(id, img);
  putMedia(id, await (await fetch(img)).blob()).catch(() => {});
  return id;
}

/** Write a blog: cover photo, title, category, then paragraphs and photos in any order. */
export function BlogEditorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { create } = useBlogActions();
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [preview, setPreview] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [error, setError] = useState<string>();
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const insertAt = useRef<number>(0);

  // Autosave so nothing is lost if the member leaves mid-way.
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage full or blocked: the draft simply isn't kept */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [draft]);

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(undefined);
  };
  const setBlock = (i: number, b: Block) =>
    set({ blocks: draft.blocks.map((x, j) => (j === i ? b : x)) });
  const removeBlock = (i: number) => {
    const b = draft.blocks[i];
    if (b.type === 'img' && b.mediaId) deleteMedia(b.mediaId).catch(() => {});
    const rest = draft.blocks.filter((_, j) => j !== i);
    set({ blocks: rest.length ? rest : [{ type: 'p', text: '', key: key() }] });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.blocks.length) return;
    const next = [...draft.blocks];
    [next[i], next[j]] = [next[j], next[i]];
    set({ blocks: next });
  };
  const addParagraph = () => {
    set({ blocks: [...draft.blocks, { type: 'p', text: '', key: key() }] });
    requestAnimationFrame(() =>
      document.querySelector<HTMLTextAreaElement>('[data-block]:last-of-type textarea')?.focus(),
    );
  };

  const words = draft.blocks.reduce(
    (n, b) => n + (b.type === 'p' ? b.text.trim().split(/\s+/).filter(Boolean).length : 0),
    0,
  );
  const ready = draft.title.trim() && words > 0;

  const publish = async () => {
    if (!draft.title.trim()) return setError('Add a title.');
    if (!words) return setError('Write at least one paragraph.');
    try {
      const blog = await create.mutateAsync({
        title: draft.title,
        category: draft.category,
        cover: draft.cover,
        blocks: draft.blocks.map((b) => {
          const { key: _, ...rest } = b;
          void _;
          return rest as BlogBlock;
        }),
      });
      localStorage.removeItem(DRAFT_KEY);
      toast('Your blog is published');
      navigate(`/blog/${blog.slug}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const pick = async (f: File | undefined, target: 'cover' | 'block') => {
    if (!f) return;
    try {
      const mediaId = await uploadImage(f);
      if (target === 'cover') {
        if (draft.cover) deleteMedia(draft.cover.mediaId).catch(() => {});
        set({ cover: { mediaId } });
      } else {
        const next = [...draft.blocks];
        next.splice(insertAt.current, 0, { type: 'img', mediaId, caption: '', key: key() });
        set({ blocks: next });
      }
    } catch (e) {
      toast((e as Error).message, 'danger');
    }
  };

  return (
    <>
      <PageHeader
        title={preview ? 'Preview' : 'Write a blog'}
        back
        action={
          <Button size="sm" onClick={publish} disabled={!ready || create.isPending}>
            {create.isPending ? 'Publishing…' : 'Publish'}
          </Button>
        }
      />
      <div className="sticky top-[76px] z-20 flex items-center gap-2 border-b border-line bg-bg px-4 py-2">
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          aria-pressed={preview}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
            preview
              ? 'border-brand-gold bg-gold-fill text-gold-light'
              : 'border-line text-muted hover:text-text',
          )}
        >
          {preview ? <PenLine className="size-4" /> : <Eye className="size-4" />}{' '}
          {preview ? 'Back to editing' : 'Preview'}
        </button>
        <span className="ml-auto text-xs text-faint">
          {words} {words === 1 ? 'word' : 'words'} · {Math.max(1, Math.round(words / 200))} min read
          · Draft saved
        </span>
      </div>

      {preview ? (
        <DraftPreview draft={draft} />
      ) : (
        <PageBody className="space-y-5">
          <CoverPicker
            mediaId={draft.cover?.mediaId}
            onPick={() => coverInput.current?.click()}
            onRemove={() => (
              draft.cover && deleteMedia(draft.cover.mediaId).catch(() => {}),
              set({ cover: undefined })
            )}
          />

          <label className="block">
            <span className="sr-only">Title</span>
            <textarea
              value={draft.title}
              onChange={(e) => set({ title: e.target.value.replace(/\n/g, ' ') })}
              maxLength={TITLE_MAX}
              rows={2}
              placeholder="Your title"
              className="w-full resize-none bg-transparent font-serif text-[30px] leading-tight text-text placeholder:text-faint focus:outline-none"
            />
          </label>

          <Segmented
            label="Category"
            value={draft.category}
            onChange={(category) => set({ category })}
            options={[
              { value: 'Guides', label: 'Guide' },
              { value: 'Reviews', label: 'Review' },
              { value: 'Culture', label: 'Culture' },
            ]}
          />

          <ol className="space-y-3">
            {draft.blocks.map((b, i) => (
              <li key={b.key} data-block className="group relative">
                {b.type === 'p' ? (
                  <textarea
                    value={b.text}
                    onChange={(e) => {
                      setBlock(i, { ...b, text: e.target.value });
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={4}
                    placeholder={
                      i === 0
                        ? 'Start writing. Tell the story, share the notes, make the case…'
                        : 'Keep going…'
                    }
                    aria-label={`Paragraph ${i + 1}`}
                    className="w-full resize-none rounded-[14px] border border-transparent bg-transparent px-3 py-2 text-[16px] leading-[1.7] text-text placeholder:text-faint hover:border-line focus:border-brand-gold focus:outline-none"
                  />
                ) : (
                  <ImageBlock block={b} onCaption={(caption) => setBlock(i, { ...b, caption })} />
                )}
                <div className="mt-1 flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  <BlockTool label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="size-4" />
                  </BlockTool>
                  <BlockTool
                    label="Move down"
                    onClick={() => move(i, 1)}
                    disabled={i === draft.blocks.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </BlockTool>
                  <BlockTool
                    label={b.type === 'p' ? 'Remove paragraph' : 'Remove photo'}
                    onClick={() => removeBlock(i)}
                  >
                    <Trash2 className="size-4" />
                  </BlockTool>
                </div>
              </li>
            ))}
          </ol>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={addParagraph}>
              <Pilcrow className="size-4 text-gold" /> Add paragraph
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                insertAt.current = draft.blocks.length;
                imageInput.current?.click();
              }}
            >
              <ImagePlus className="size-4 text-gold" /> Add photo
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setDiscard(true)}
              className="text-sm text-muted hover:text-danger"
            >
              Discard draft
            </button>
            <Button onClick={publish} disabled={!ready || create.isPending}>
              Publish blog
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-faint">
            Blogs are visible to all members and appear on your profile. Follow the Stogie Ethics:
            no selling or trading cigars.
          </p>
        </PageBody>
      )}

      <input
        ref={coverInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => (pick(e.target.files?.[0], 'cover'), (e.target.value = ''))}
      />
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => (pick(e.target.files?.[0], 'block'), (e.target.value = ''))}
      />

      <Sheet
        open={discard}
        onOpenChange={setDiscard}
        title="Discard this draft?"
        description="Your title, text and photos will be removed."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" block onClick={() => setDiscard(false)}>
              Keep writing
            </Button>
            <Button
              variant="dangerSolid"
              block
              onClick={() => {
                [
                  draft.cover?.mediaId,
                  ...draft.blocks.map((b) => (b.type === 'img' ? b.mediaId : undefined)),
                ].forEach((id) => id && deleteMedia(id).catch(() => {}));
                localStorage.removeItem(DRAFT_KEY);
                navigate('/blog', { replace: true });
              }}
            >
              Discard
            </Button>
          </div>
        }
      >
        <span />
      </Sheet>
    </>
  );
}

function BlockTool({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function CoverPicker({
  mediaId,
  onPick,
  onRemove,
}: {
  mediaId?: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  const url = useAssetUrl(mediaId ? { mediaId } : undefined);
  if (!mediaId || !url) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-line-strong bg-surface-2 text-muted transition-colors hover:border-brand-gold hover:text-text"
      >
        <ImagePlus className="size-7 text-gold" strokeWidth={1.5} />
        <span className="text-sm font-medium">Add a cover photo</span>
        <span className="text-xs text-faint">Optional · shown at the top and in lists</span>
      </button>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-line">
      <img src={url} alt="Cover" className="aspect-[16/7] w-full object-cover" />
      <div className="absolute right-2 top-2 flex gap-2">
        <button
          type="button"
          onClick={onPick}
          className="h-9 rounded-full bg-bg/90 px-3 text-sm font-medium text-text"
        >
          Change
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove cover"
          className="grid size-9 place-items-center rounded-full bg-bg/90 text-text"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ImageBlock({
  block,
  onCaption,
}: {
  block: Extract<Block, { type: 'img' }>;
  onCaption: (c: string) => void;
}) {
  const url = useAssetUrl(block);
  return (
    <figure className="space-y-2">
      <div className="overflow-hidden rounded-[16px] border border-line bg-surface-2">
        {url ? (
          <img
            src={url}
            alt={block.caption || 'Blog photo'}
            className="max-h-[60dvh] w-full object-cover"
          />
        ) : (
          <div className="aspect-video" />
        )}
      </div>
      <input
        value={block.caption ?? ''}
        onChange={(e) => onCaption(e.target.value)}
        maxLength={140}
        placeholder="Add a caption (optional)"
        aria-label="Photo caption"
        className="w-full bg-transparent px-1 text-center text-sm italic text-muted placeholder:text-faint focus:outline-none"
      />
    </figure>
  );
}

function DraftPreview({ draft }: { draft: Draft }) {
  const cover = useAssetUrl(draft.cover);
  return (
    <article>
      {cover && <img src={cover} alt="" className="aspect-[16/9] w-full object-cover" />}
      <PageBody>
        <p className="micro-label !text-gold">{draft.category}</p>
        <h1 className="mt-2 font-serif text-[30px] leading-tight text-text">
          {draft.title || 'Untitled'}
        </h1>
        <BlogBlocks blocks={draft.blocks} />
      </PageBody>
    </article>
  );
}

/** Renders a blog's paragraphs and photos (used by the reader and the preview). */
export function BlogBlocks({ blocks }: { blocks: BlogBlock[] }) {
  let firstP = true;
  return (
    <div className="mt-6 space-y-5 text-[17px] leading-[1.75] text-text/90">
      {blocks.map((b, i) => {
        if (b.type === 'p') {
          if (!b.text.trim()) return null;
          const drop = firstP;
          firstP = false;
          return (
            <p
              key={i}
              className={cn(
                'whitespace-pre-wrap',
                drop &&
                  'first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-5xl first-letter:leading-none first-letter:text-gold',
              )}
            >
              {b.text}
            </p>
          );
        }
        return <BlogFigure key={i} block={b} />;
      })}
    </div>
  );
}

function BlogFigure({ block }: { block: Extract<BlogBlock, { type: 'img' }> }) {
  const url = useAssetUrl(block);
  if (!url) return null;
  return (
    <figure className="-mx-4 sm:mx-0">
      <img
        src={url}
        alt={block.caption || 'Blog photo'}
        loading="lazy"
        decoding="async"
        className="w-full object-cover sm:rounded-[16px]"
      />
      {block.caption && (
        <figcaption className="mt-2 px-4 text-center text-sm italic text-muted sm:px-0">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}
