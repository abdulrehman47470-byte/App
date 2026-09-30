// On-device store for post photos and videos (IndexedDB), used by the mock backend.
// localStorage is far too small for video; IndexedDB holds large files efficiently.
// Phase 1+ uploads to Supabase Storage instead; the UI keeps using `useMediaUrl`.
import { useEffect, useState } from 'react';

const DB_NAME = 'ds-media';
const STORE = 'files';
let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = run(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const putMedia = (id: string, blob: Blob) => tx('readwrite', (s) => s.put(blob, id)).then(() => undefined);
export const getMedia = (id: string) => tx<Blob | undefined>('readonly', (s) => s.get(id));
export const deleteMedia = (id: string) => {
  const url = urls.get(id);
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  urls.delete(id);
  return tx('readwrite', (s) => s.delete(id)).then(() => undefined);
};
export const clearMedia = () => tx('readwrite', (s) => s.clear()).then(() => undefined);

// Object URLs for files already in memory, so a just-posted video shows instantly.
const urls = new Map<string, string>();
export const rememberMediaUrl = (id: string, url: string) => urls.set(id, url);

/** URL to show a stored photo/video. `undefined` while loading, `null` if it is missing. */
export function useMediaUrl(id?: string): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(() => (id ? urls.get(id) : undefined));
  useEffect(() => {
    if (!id) return;
    const known = urls.get(id);
    if (known) {
      setUrl(known);
      return;
    }
    let alive = true;
    getMedia(id)
      .then((blob) => {
        if (!alive) return;
        if (!blob) return setUrl(null);
        const u = URL.createObjectURL(blob);
        urls.set(id, u);
        setUrl(u);
      })
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [id]);
  return url;
}

export const newMediaId = () => `media-${crypto.randomUUID()}`;
