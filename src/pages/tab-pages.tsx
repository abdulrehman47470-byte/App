// The main tab screens, shared by the router (App.tsx) and the keep-alive tab cache so both use the
// exact same components (a tab pre-built in the background is reused, not rebuilt, when opened).
import type { ReactNode } from 'react';
import { lazyPage } from '@/lib/lazy-page';
import { pages } from '@/routes';

export const Feed = lazyPage(pages.feed);
export const Discover = lazyPage(pages.discover);
export const MemberMap = lazyPage(pages.map);
export const Messages = lazyPage(pages.messages);
export const MyProfile = lazyPage(pages.myProfile);
export const Mentors = lazyPage(pages.mentors);
export const Connections = lazyPage(pages.connections);

export const TAB_ELEMENTS: Record<string, ReactNode> = {
  '/feed': <Feed />,
  '/discover': <Discover />,
  '/map': <MemberMap />,
  '/messages': <Messages />,
  '/profile': <MyProfile />,
  '/mentors': <Mentors />,
  '/connections': <Connections />,
};
