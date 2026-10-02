import { UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConnections } from '@/features/queries';
import { cn } from '@/lib/utils';

/** Header button for connection activity, with a badge for requests waiting on you. */
export function RequestsIndicator({ className }: { className?: string }) {
  const { data } = useConnections();
  const received = data?.received.length ?? 0;
  const sent = data?.sent.length ?? 0;
  return (
    <Link
      to="/connections"
      aria-label={`Connections: ${received} requests received, ${sent} pending sent`}
      className={cn('relative grid size-11 place-items-center rounded-full border border-line bg-surface-2 text-text transition-colors hover:border-line-strong', className)}
    >
      <UsersRound className="size-5" strokeWidth={1.75} />
      {received > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full border-2 border-bg bg-ember px-1 text-[10px] font-bold leading-4 text-white">
          {received}
        </span>
      )}
    </Link>
  );
}
