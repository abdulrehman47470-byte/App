import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell, Frame } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/misc';
import { nextStep, useSession } from '@/lib/session';

import Welcome from '@/pages/onboarding/welcome';
import SignIn from '@/pages/onboarding/sign-in';
import VerifyAge from '@/pages/onboarding/verify-age';
import VerifyFace from '@/pages/onboarding/verify-face';
import Restricted from '@/pages/onboarding/restricted';
import Ethics from '@/pages/onboarding/ethics';
import PhotoUpload from '@/pages/onboarding/photo-upload';
import Paywall from '@/pages/onboarding/paywall';
import ProfileSetup from '@/pages/profile-setup';
import Discover from '@/pages/discover';

const MemberProfile = lazy(() => import('@/pages/member-profile'));
const Mentors = lazy(() => import('@/pages/mentors'));
const Matches = lazy(() => import('@/pages/matches'));
const Messages = lazy(() => import('@/pages/messages'));
const Chat = lazy(() => import('@/pages/chat'));
const MyProfile = lazy(() => import('@/pages/my-profile'));
const StogieSearch = lazy(() => import('@/pages/stogie-search'));
const Admin = lazy(() => import('@/pages/admin'));
const Settings = lazy(() => import('@/pages/settings').then((m) => ({ default: m.SettingsPage })));
const Subscription = lazy(() => import('@/pages/settings').then((m) => ({ default: m.SubscriptionPage })));
const Refer = lazy(() => import('@/pages/settings').then((m) => ({ default: m.ReferPage })));
const DeleteAccount = lazy(() => import('@/pages/settings').then((m) => ({ default: m.DeleteAccountPage })));
const Sessions = lazy(() => import('@/pages/content').then((m) => ({ default: m.SessionsPage })));
const SessionDetail = lazy(() => import('@/pages/content').then((m) => ({ default: m.SessionDetailPage })));
const Blog = lazy(() => import('@/pages/content').then((m) => ({ default: m.BlogPage })));
const BlogPost = lazy(() => import('@/pages/content').then((m) => ({ default: m.BlogPostPage })));
const Legal = lazy(() => import('@/pages/content').then((m) => ({ default: m.LegalPage })));

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
