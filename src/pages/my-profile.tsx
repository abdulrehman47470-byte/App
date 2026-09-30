import { Clock, Pencil, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CigarBand, CompletenessAvatar, VerifiedBadge } from '@/components/brand/ornaments';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Badge, Card, Skeleton } from '@/components/ui/misc';
import { userTypeLabel } from '@/data/options';
import { ProfileSections } from '@/features/profile/profile-sections';
import { useMe } from '@/features/queries';
import { SettingsMenu } from '@/features/settings/settings-menu';
import { ActivitySection } from '@/features/feed/activity-section';
import { FEATURES } from '@/config/features';
import { profileCompleteness } from '@/lib/completeness';

export default function MyProfile() {
  const { data: me } = useMe();

  if (!me) {
    return (
      <PageBody className="space-y-4">
        <Skeleton className="mx-auto size-28 rounded-full" />
        <Skeleton className="h-8" />
        <Skeleton className="h-40" />
      </PageBody>
    );
  }

  const pct = profileCompleteness(me);
  const headline = [userTypeLabel(me.userType), [me.city, me.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  const mentorship = (me.preferences.mentorship as string[] | undefined)?.[0];

  return (
    <>
      <PageHeader
        title="Profile"
        large
        action={
          <Button variant="ghost" size="icon" asChild aria-label="Settings">
            <Link to="/settings">
              <Settings className="size-5" strokeWidth={1.5} />
            </Link>
          </Button>
        }
      />
      <PageBody className="space-y-5">
        <div className="flex flex-col items-center text-center">
          <CompletenessAvatar name={me.name || 'You'} hue={me.photoHue} src={me.photoUrl} pct={pct} size={104} />
          <div className="mt-4 flex items-center gap-2">
            <h2 className="font-serif text-[28px] text-text">{me.name || 'Your name'}</h2>
            {me.age > 0 && <span className="text-xl font-light text-muted">{me.age}</span>}
            {me.photoVerified && <VerifiedBadge />}
          </div>
          {me.pronouns && <p className="text-sm text-muted">{me.pronouns}</p>}
          {headline && <p className="mt-1 text-[15px] text-text/85">{headline}</p>}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {me.photoStatus === 'pending' && (
              <Badge tone="warning">
                <Clock className="size-3" /> Photo in review
              </Badge>
            )}
          </div>
        </div>

        {pct < 100 && (
          <Card className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Your profile is {pct}% complete</p>
              <p className="text-xs text-muted">Complete profiles get better matches.</p>
            </div>
            <Button size="sm" asChild>
              <Link to="/profile/edit/2">Finish</Link>
            </Button>
          </Card>
        )}

        <Button variant="outline" block asChild>
          <Link to="/profile/edit/1">
            <Pencil className="size-4" /> Edit profile
          </Link>
        </Button>

        {me.bio && (
          <Card className="p-5">
            <h3 className="micro-label mb-2">About me</h3>
            <p className="text-[15px] leading-relaxed text-text/90">{me.bio}</p>
          </Card>
        )}

        <ProfileSections
          prefs={me.preferences}
          about={me.about}
          mentorship={mentorship ? { label: mentorship, topics: (me.preferences.mentorTopics as string[]) ?? [] } : undefined}
        />

        {FEATURES.feed && <ActivitySection memberId="me" name="You" />}

        <CigarBand label="Settings" className="pt-2" />
        <SettingsMenu />
      </PageBody>
    </>
  );
}
