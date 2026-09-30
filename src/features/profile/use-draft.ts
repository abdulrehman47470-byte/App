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
    const t = setTimeout(() => mutate(draft), 600);
    return () => clearTimeout(t);
  }, [draft, mutate]);

  const patch = (p: Partial<MyProfile>) => {
    dirty.current = true;
    setDraft((d) => (d ? { ...d, ...p } : d));
  };

  const flush = async () => {
    if (draft) await save.mutateAsync(draft);
  };

  return { draft, patch, flush, saving: save.isPending };
}
