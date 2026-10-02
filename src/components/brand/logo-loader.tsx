import { useEffect } from 'react';

let activeLoaders = 0;

/** Fade out the HTML splash screen (index.html) unless a full-screen load is still in progress. */
export function hideSplash() {
  if (activeLoaders > 0) return;
  document.getElementById('splash')?.classList.add('is-hidden');
}

/**
 * Full-screen loading state while a screen's code is still downloading. It keeps the branded
 * splash (same logo, same place) on screen, so loading always looks like one continuous logo
 * screen instead of a blank or skeleton page.
 */
export function LogoLoader() {
  useEffect(() => {
    activeLoaders++;
    document.getElementById('splash')?.classList.remove('is-hidden');
    return () => {
      activeLoaders--;
      // wait a frame so the screen that replaces this loader is painted before the logo fades
      requestAnimationFrame(hideSplash);
    };
  }, []);
  return null;
}
