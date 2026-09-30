import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Centered 430px column over the textured background; bottom tabs on mobile, side rail on desktop. */
export function Frame({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="texture min-h-dvh">
      <div
        className={cn(
          'relative mx-auto min-h-dvh w-full bg-bg lg:border-x lg:border-line lg:shadow-[0_0_80px_rgba(0,0,0,0.6)]',
          wide ? 'max-w-[1100px]' : 'max-w-[430px]',
        )}
      >
        {children}
      </div>
    </div>
  );
}
