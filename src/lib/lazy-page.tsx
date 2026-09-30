import { lazy, type ComponentType } from 'react';

/** A dynamic import that remembers its module once loaded, so it can be read synchronously. */
export interface CachedLoader<M> {
  (): Promise<M>;
  get(): M | undefined;
}

export function cachedLoader<M>(load: () => Promise<M>): CachedLoader<M> {
  let mod: M | undefined;
  let pending: Promise<M> | undefined;
  const fn = (() => {
    if (mod) return Promise.resolve(mod);
    pending ??= load().then(
      (m) => (mod = m),
      (e) => {
        pending = undefined; // allow a retry after a network error
        throw e;
      },
    );
    return pending;
  }) as CachedLoader<M>;
  fn.get = () => mod;
  return fn;
}

/**
 * Like React.lazy, but once the page's code has been preloaded it renders the real component
 * straight away. Plain React.lazy still suspends on first render, and React throttles revealing
 * suspended content by ~300 ms, which made every first visit to a screen feel slow.
 */
export function lazyPage<M, K extends keyof M & string>(loader: CachedLoader<M>, name: K = 'default' as K) {
  const Lazy = lazy(() => loader().then((m) => ({ default: m[name] as ComponentType })));
  function Page(props: Record<string, unknown>) {
    const mod = loader.get();
    const Component = (mod ? mod[name] : Lazy) as ComponentType<Record<string, unknown>>;
    return <Component {...props} />;
  }
  Page.displayName = `Page(${name})`;
  return Page as ComponentType<Record<string, unknown>>;
}
