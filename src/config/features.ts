// Feature switches.
// The client's original rules said "IM only: no public feed, posts or comments". The feed and the
// member map were added on 2026-09-30 at the product owner's request. Set either to false to
// return to the original IM-only design (tabs and routes adapt automatically).
// TODO(needs-client): confirm the client wants the feed and member map.
export const FEATURES = {
  feed: true,
  memberMap: true,
};

/** Where members land after sign-up and sign-in. */
export const HOME = FEATURES.feed ? '/feed' : '/discover';

/** "Explore with a demo member" shortcut: on while the app runs on mock data, off with the real backend. */
export const DEMO_ENABLED = import.meta.env.DEV || import.meta.env.VITE_DATA_PROVIDER !== 'supabase';
