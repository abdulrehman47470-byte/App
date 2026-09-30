import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useMemo } from 'react';
import { Avatar } from '@/components/brand/portrait';
import { Button } from '@/components/ui/button';
import type { Member, MyProfile } from '@/types';

export function MatchOverlay({
  member,
  me,
  onClose,
  onMessage,
}: {
  member: Member | null;
  me?: MyProfile;
  onClose: () => void;
  onMessage: () => void;
}) {
  const reduce = useReducedMotion();
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2 + Math.random() * 0.3;
        const d = 120 + Math.random() * 160;
        return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: 3 + Math.random() * 5, delay: Math.random() * 0.15 };
      }),
    [],
  );

  return (
    <AnimatePresence>
      {member && (
        <m.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="match-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-bg/95 px-6"
        >
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_42%,rgba(217,164,65,0.25),transparent_70%)]" />
          {!reduce && (
            <div aria-hidden className="absolute left-1/2 top-[42%]">
              {particles.map((p, i) => (
                <m.span
                  key={i}
                  className="absolute rounded-full bg-gold-light"
                  style={{ width: p.s, height: p.s }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
                  transition={{ duration: 1.4, delay: 0.25 + p.delay, ease: 'easeOut' }}
                />
              ))}
            </div>
          )}

          <div className="relative flex items-center">
            <m.div initial={{ x: -120, rotate: -14, opacity: 0 }} animate={{ x: 14, rotate: -8, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
              <Avatar name={me?.name || 'You'} hue={me?.photoHue ?? 30} src={me?.photoUrl} size={128} ring className="border-2 shadow-[var(--shadow-glow)]" />
            </m.div>
            <m.div initial={{ x: 120, rotate: 14, opacity: 0 }} animate={{ x: -14, rotate: 8, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
              <Avatar name={member.name} hue={member.photoHue} size={128} ring className="border-2 shadow-[var(--shadow-glow)]" />
            </m.div>
          </div>

          <m.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="relative mt-10 text-center">
            <p className="micro-label !text-gold">Mutual like</p>
            <h2 id="match-title" className="gold-text mt-2 font-serif text-[44px] italic leading-tight">
              It’s a match!
            </h2>
            <p className="mt-2 text-[15px] text-muted">You and {member.name} liked each other.</p>
          </m.div>

          <m.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="relative mt-10 w-full max-w-sm space-y-3">
            <Button size="lg" block onClick={onMessage} autoFocus>
              <MessageCircle className="size-5" /> Say hello
            </Button>
            <Button size="lg" variant="ghost" block onClick={onClose}>
              Keep browsing
            </Button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
