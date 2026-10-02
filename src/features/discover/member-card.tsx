import { MoreHorizontal } from 'lucide-react';
import { MatchRing, UserTypeBadge, VerifiedBadge } from '@/components/brand/ornaments';
import { PortraitArt } from '@/components/brand/portrait';
import { Tag } from '@/components/ui/chip';
import type { DiscoverCard } from '@/types';

/** The visual card (no gestures). Used by the swipe deck, mentors list and previews. */
export function MemberCardFace({ card, onMore }: { card: DiscoverCard; onMore?: () => void }) {
  const { member: m, matchPct, shared } = card;
  return (
    <div className="relative size-full overflow-hidden rounded-[24px] border border-line bg-surface shadow-[var(--shadow-card)] [contain:layout_paint]">
      <PortraitArt name={m.name} hue={m.photoHue} src={m.photo} />
      <div className="photo-fade absolute inset-0" aria-hidden />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        {onMore ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMore();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Report or block ${m.name}`}
            className="grid size-11 place-items-center rounded-full bg-bg/80 text-text hover:bg-bg/80"
          >
            <MoreHorizontal className="size-5" />
          </button>
        ) : (
          <span />
        )}
        <MatchRing pct={matchPct} size={60} />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-[32px] leading-none text-on-photo">
            {m.name}
            <span className="ml-2 font-sans text-2xl font-light text-on-photo/85">{m.age}</span>
          </h2>
          {m.photoVerified && <VerifiedBadge className="size-6" />}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-on-photo/80">
          <span>
            {m.city}, {m.state}
          </span>
          <span aria-hidden>·</span>
          <span>{m.distanceMi} mi</span>
          <UserTypeBadge type={m.userType} />
        </div>
        {shared.length > 0 && (
          <div className="mt-3">
            <p className="sr-only">Shared interests:</p>
            <div className="flex flex-wrap gap-1.5">
              {shared.slice(0, 5).map((s) => (
                <Tag key={s} label={s} onPhoto />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
