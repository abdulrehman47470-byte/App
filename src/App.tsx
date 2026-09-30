import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Frame } from '@/components/layout/frame';
import { Skeleton } from '@/components/ui/misc';
import { FEATURES, HOME } from '@/config/features';
import { nextStep, useSession } from '@/lib/session';
import Welcome from '@/pages/onboarding/welcome';
import { pages, prefetchWhenIdle } from '@/routes';

// Only the Welcome screen ships in the first download; everything else is split out and
// preloaded in the background (see src/routes.ts).
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const AppShell = named(pages.shell, 'AppShell');
const SignIn = lazy(pages.signIn);
const VerifyAge = lazy(pages.verifyAge);
const VerifyFace = lazy(pages.verifyFace);
const Restricted = lazy(pages.restricted);
const Ethics = lazy(pages.ethics);
const PhotoUpload = lazy(pages.photo);
const Paywall = lazy(pages.paywall);
const ProfileSetup = lazy(pages.setup);
const Discover = lazy(pages.discover);
const MemberProfile = lazy(pages.memberProfile);
const Feed = lazy(pages.feed);
const PostPage = named(pages.feed, 'PostPage');
const MemberMap = lazy(pages.map);
const Mentors = lazy(pages.mentors);
const Matches = lazy(pages.matches);
const Messages = lazy(pages.messages);
const Chat = lazy(pages.chat);
const MyProfile = lazy(pages.myProfile);
const StogieSearch = lazy(pages.search);
const Admin = lazy(pages.admin);
const Settings = named(pages.settings, 'SettingsPage');
const Subscription = named(pages.settings, 'SubscriptionPage');
const Refer = named(pages.settings, 'ReferPage');
const DeleteAccount = named(pages.settings, 'DeleteAccountPage');
const Sessions = named(pages.content, 'SessionsPage');
const SessionDetail = named(pages.content, 'SessionDetailPage');
const Blog = named(pages.content, 'BlogPage');
const BlogPost = named(pages.content, 'BlogPostPage');
const Legal = named(pages.content, 'LegalPage');

const TAB_ROUTES = [HOME, '/discover', FEATURES.memberMap ? '/map' : '/matches', '/messages', '/profile', '/member/x', '/messages/x', '/mentors', '/matches'];

/** Preload the screens the member is most likely to open next. */
function Prefetcher() {
  const { session, isComplete } = useSession();
  const { pathname } = useLocation();
  useEffect(() => {
    if (isComplete) prefetchWhenIdle(TAB_ROUTES);
    else if (!session.signedIn) prefetchWhenIdle(['/signin']);
    else prefetchWhenIdle([nextStep(session)]);
  }, [isComplete, session, pathname]);
  return null;
}

/** Sign-up steps need a signed-in (mock) account. */
function RequireSignedIn({ children }: { children?: ReactNode }) {
  const { session } = useSession();
  if (!session.signedIn) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}

/** The app itself needs every sign-up gate passed, in order. Phase 2 mirrors this in RLS. */
function RequireComplete() {
  const { session, isComplete } = useSession();
  if (!isComplete) return <Navigate to={nextStep(session)} replace />;
  return <Outlet />;
}

const PageFallback = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-10 w-1/2" />
    <Skeleton className="h-40" />
    <Skeleton className="h-24" />
  </div>
);

export default function App() {
  return (
    <>
    <Prefetcher />
    <Suspense
      fallback={
        <Frame>
          <PageFallback />
        </Frame>
      }
    >
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/legal/:doc" element={<Legal />} />
        <Route path="/restricted" element={<Restricted />} />
        <Route element={<RequireSignedIn />}>
          <Route path="/verify/age" element={<VerifyAge />} />
          <Route path="/verify/face" element={<VerifyFace />} />
          <Route path="/ethics" element={<Ethics />} />
          <Route path="/photo" element={<PhotoUpload />} />
          <Route path="/subscribe" element={<Paywall />} />
          <Route path="/setup/:step" element={<ProfileSetup />} />
        </Route>

        <Route element={<RequireComplete />}>
          <Route path="/profile/edit/:step" element={<ProfileSetup mode="edit" />} />
          <Route path="/admin" element={<Admin />} />
          <Route element={<AppShell />}>
            {FEATURES.feed && <Route path="/feed" element={<Feed />} />}
            {FEATURES.feed && <Route path="/post/:id" element={<PostPage />} />}
            {FEATURES.memberMap && <Route path="/map" element={<MemberMap />} />}
            <Route path="/discover" element={<Discover />} />
            <Route path="/member/:id" element={<MemberProfile />} />
            <Route path="/mentors" element={<Mentors />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Chat />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/subscription" element={<Subscription />} />
            <Route path="/settings/delete" element={<DeleteAccount />} />
            <Route path="/refer" element={<Refer />} />
            <Route path="/search" element={<StogieSearch />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/sessions/:id" element={<SessionDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={HOME} replace />} />
      </Routes>
    </Suspense>
    </>
  );
}
