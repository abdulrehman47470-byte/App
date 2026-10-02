import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Bottom sheet on mobile, centered dialog on wider screens. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  // Paint the sheet frame first and fill in its contents on the next frame (while it is still
  // sliding up), so opening never blocks a frame, even for sheets with sliders and many chips.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) return setReady(false);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-scrim" />
        <Dialog.Content
          className={cn(
            'sheet-content surface fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-[430px] flex-col rounded-t-[24px] pb-[env(safe-area-inset-bottom)] focus:outline-none sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[24px]',
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
            <div>
              <Dialog.Title className="font-serif text-xl text-text">{title}</Dialog.Title>
              <Dialog.Description className={description ? 'mt-1 text-sm text-muted' : 'sr-only'}>
                {description ?? title}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="-mr-2 grid size-11 place-items-center rounded-full text-muted hover:text-text"
              aria-label="Close"
            >
              <X className="size-5" strokeWidth={1.5} />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">{ready ? children : <div className="h-40" aria-hidden />}</div>
          {footer && <div className="border-t border-line px-5 py-4">{ready ? footer : <div className="h-11" aria-hidden />}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
