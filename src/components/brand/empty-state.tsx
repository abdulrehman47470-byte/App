import type { ReactNode } from 'react';

const stroke = { stroke: 'var(--gold)', strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const art = {
  humidor: (
    <svg viewBox="0 0 120 90" className="h-20 w-28" aria-hidden>
      <path {...stroke} d="M14 38h92v40H14z" />
      <path {...stroke} d="M14 38l8-18h76l8 18" />
      <path {...stroke} d="M54 52h12v8H54z" opacity=".8" />
      <path {...stroke} d="M24 70h72" opacity=".4" />
      <path {...stroke} d="M60 14c-4-6 4-8 0-13" opacity=".5" />
    </svg>
  ),
  ashtray: (
    <svg viewBox="0 0 120 90" className="h-20 w-28" aria-hidden>
      <ellipse {...stroke} cx="60" cy="62" rx="44" ry="12" />
      <path {...stroke} d="M16 62v6c0 7 20 12 44 12s44-5 44-12v-6" />
      <path {...stroke} d="M34 58l40-14h10a3 3 0 0 1 0 6H76" />
      <path {...stroke} d="M86 40c-3-6 5-9 1-15s4-9 1-14" opacity=".5" />
    </svg>
  ),
  chair: (
    <svg viewBox="0 0 120 90" className="h-20 w-28" aria-hidden>
      <path {...stroke} d="M30 30c0-10 8-16 30-16s30 6 30 16v22H30z" />
      <path {...stroke} d="M20 44c0-6 10-6 10 0v18h60V44c0-6 10-6 10 0v24H20z" />
      <path {...stroke} d="M28 68v10M92 68v10" />
    </svg>
  ),
};

export function EmptyState({
  illustration,
  title,
  body,
  action,
}: {
  illustration: keyof typeof art;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-5 grid size-32 place-items-center rounded-full border border-line bg-surface/60">{art[illustration]}</div>
      <h3 className="font-serif text-xl text-text">{title}</h3>
      <p className="mt-2 max-w-72 text-sm text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
