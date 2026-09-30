import { Activity, createContext, Suspense, useContext, useEffect, useLayoutEffect, useReducer, useRef, type ReactNode } from 'react';
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom';
import { whenIdle } from '@/routes';

/** True while this kept-alive tab is the one on screen. */
const TabActiveContext = createContext(true);
// eslint-disable-next-line react-refresh/only-export-components
export const useTabActive = () => useContext(TabActiveContext);

/**
 * Keeps the main tabs mounted, like a native app: switching tabs is instant (nothing is rebuilt)
 * and each tab keeps its scroll position.
 * - Tabs listed in `prebuild` are built in the background while the member is idle, so even the
 *   first tap on them is instant.
 * - Most tabs use React's <Activity>: hidden tabs keep their state but pause their effects.
 * - `cssOnly` tabs (the Leaflet map, which cannot survive paused effects) are simply hidden.
 * Other pages render normally and open at the top.
 */
export function KeepAliveOutlet({
  tabs,
  elements,
  cssOnly = [],
  prebuild = [],
  fallback,
}: {
  tabs: string[];
  elements: Record<string, ReactNode>;
  cssOnly?: string[];
  prebuild?: string[];
  fallback: ReactNode;
}) {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const mounted = useRef(new Set<string>());
  const scroll = useRef(new Map<string, number>());
  const current = useRef(pathname);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const isTab = tabs.includes(pathname) && !!elements[pathname];
  if (isTab) mounted.current.add(pathname);

  // Build the other tabs in the background once the current screen is up.
  useEffect(() => {
    whenIdle(() => {
      let added = false;
      for (const p of prebuild) {
        if (tabs.includes(p) && elements[p] && !mounted.current.has(p)) {
          mounted.current.add(p);
          added = true;
        }
      }
      if (added) rerender();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remember the scroll position of whichever page is on screen.
  useEffect(() => {
    const onScroll = () => scroll.current.set(current.current, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Restore it when returning to a tab (or going back); new pages start at the top.
  useLayoutEffect(() => {
    current.current = pathname;
    const saved = scroll.current.get(pathname);
    window.scrollTo(0, isTab || navType === 'POP' ? (saved ?? 0) : 0);
  }, [pathname, isTab, navType]);

  return (
    <>
      {[...mounted.current].map((path) => {
        const active = path === pathname;
        const content = (
          <TabActiveContext value={active}>
            <Suspense fallback={active ? fallback : null}>{elements[path]}</Suspense>
          </TabActiveContext>
        );
        return cssOnly.includes(path) ? (
          <div key={path} hidden={!active}>
            {content}
          </div>
        ) : (
          <Activity key={path} mode={active ? 'visible' : 'hidden'}>
            {content}
          </Activity>
        );
      })}
      {!isTab && <Suspense fallback={fallback}>{outlet}</Suspense>}
    </>
  );
}
