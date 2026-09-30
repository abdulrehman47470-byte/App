import { useEffect, useRef, useState } from 'react';
import { useMe, useSaveMe } from '@/features/queries';
import type { MyProfile } from '@/types';

/** Local draft of the member's profile with debounced autosave. */
export function useProfileDraft() {
  const { data: me } = useMe();
  const save = useSaveMe();
  const [draft, setDraft] = useState<MyProfile | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (me && !draft) setDraft(me);
  }, [me, draft]);

  const { mutate } = save;
  useEffect(() => {
    if (!draft || !dirty.current) return;
    // Save once typing pauses, and only when the browser is idle, so saving never delays a keystroke.
    let idle = 0;
    const t = setTimeout(() => {
      const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1));
      idle = ric(() => mutate(draft), { timeout: 1500 });
    }, 700);
    return () => {
      clearTimeout(t);
      if (idle) (window.cancelIdleCallback ?? clearTimeout)(idle);
    };
  }, [draft, mutate]);

  const patch = (p: Partial<MyProfile>) => {
    dirty.current = true;
    setDraft((d) => (d ? { ...d, ...p } : d));
  };

  /** Update from the latest draft (keeps callbacks stable, so untouched parts of the form don't re-render). */
  const update = (fn: (d: MyProfile) => Partial<MyProfile>) => {
    dirty.current = true;
    setDraft((d) => (d ? { ...d, ...fn(d) } : d));
  };

  const flush = async () => {
    if (draft) await save.mutateAsync(draft);
  };

  return { draft, patch, update, flush, saving: save.isPending };
}
