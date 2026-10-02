import { LogoMark } from '@/components/brand/logo';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export function BackButton({ to }: { to?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      aria-label="Back"
      className="-ml-2 grid size-11 place-items-center rounded-full text-text transition-colors hover:bg-surface-2"
    >
      <ChevronLeft className="size-6" strokeWidth={1.5} />
    </button>
  );
}

export function PageHeader({
  title,
  back,
  backTo,
  action,
  subtitle,
  large,
}: {
  title: string;
  back?: boolean;
  backTo?: string;
  action?: ReactNode;
  subtitle?: string;
  large?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/[0.97] px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="flex min-h-11 items-center gap-1">
        {back || backTo ? <BackButton to={backTo} /> : large ? <LogoMark className="mr-2 size-10" /> : null}
        <div className={cn('min-w-0 flex-1', (back || backTo) && !large && 'text-center')}>
          <h1 className={cn('truncate font-serif text-text', large ? 'text-[28px]' : 'text-xl')}>{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
        <div className={cn('flex min-w-11 justify-end', !action && (back || backTo) && !large && 'w-11')}>{action}</div>
      </div>
    </header>
  );
}

/** Page body with a gentle enter transition. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    // Plain CSS animation: content is visible immediately, even before animation code loads.
    <div className={cn('page-enter px-4 py-5', className)}>{children}</div>
  );
}

/** Onboarding header with a shared progress bar that animates between steps. */
export function OnboardingHeader({
  title,
  progress,
  step,
  backTo,
}: {
  title: string;
  progress?: number;
  step?: string;
  backTo?: string;
}) {
  return (
    <header className="sticky top-0 z-30 bg-bg/[0.97] px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="flex min-h-11 items-center">
        <BackButton to={backTo} />
        <h1 className="flex-1 text-center font-serif text-xl text-text">{title}</h1>
        <span className="w-11 text-right text-xs text-muted">{step}</span>
      </div>
      {progress !== undefined && (
        <div className="mt-2">
          <ProgressBar value={progress} label={`${title} progress`} />
        </div>
      )}
    </header>
  );
}

/** Sticky footer for primary actions on long forms. */
export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line/60 bg-bg/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
      {children}
    </div>
  );
}
