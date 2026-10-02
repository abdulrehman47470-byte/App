import { Check, Clock, MessageCircle, Plus, UserCheck, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { useConnectFlow } from '@/features/discover/use-like';
import { useConnectionActions, useConnectionStatus } from '@/features/queries';
import { cn } from '@/lib/utils';

/**
 * The one connection button used everywhere a member appears. It always shows the right next step:
 * Connect → Requested (withdraw) → Accept / Decline (if they asked you) → Message (connected).
 */
export function ConnectButton({
  memberId,
  name,
  size = 'md',
  block,
  className,
}: {
  memberId: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  className?: string;
}) {
  const { data: status = 'none' } = useConnectionStatus(memberId);
  const { connect, accept, overlay } = useConnectFlow();
  const { decline, withdraw } = useConnectionActions();
  const toast = useToast();
  const [manage, setManage] = useState(false);
  const icon = size === 'sm' ? 'size-4' : 'size-5';

  let content;
  if (status === 'connected') {
    content = (
      <Button size={size} block={block} className={className} asChild>
        <Link to={`/messages/${memberId}`}>
          <MessageCircle className={icon} /> Message
        </Link>
      </Button>
    );
  } else if (status === 'received') {
    content = (
      <div className={cn('flex gap-2', block && 'w-full', className)}>
        <Button size={size} className="flex-1" onClick={() => accept(memberId)}>
          <Check className={icon} strokeWidth={2.5} /> Accept
        </Button>
        <Button
          size={size}
          variant="secondary"
          className="flex-1"
          onClick={() => {
            decline.mutate(memberId);
            toast(`Declined ${name}'s request`);
          }}
        >
          <X className={icon} /> Decline
        </Button>
      </div>
    );
  } else if (status === 'sent') {
    content = (
      <Button size={size} variant="secondary" block={block} className={className} onClick={() => setManage(true)} aria-label={`Request sent to ${name}. Manage request`}>
        <Clock className={icon} /> Requested
      </Button>
    );
  } else {
    content = (
      <Button
        size={size}
        block={block}
        className={className}
        onClick={async () => {
          const res = await connect(memberId);
          if (!res.connected) toast(`Connection request sent to ${name}`);
        }}
      >
        <Plus className={icon} strokeWidth={2.5} /> Connect
      </Button>
    );
  }

  return (
    <>
      {content}
      <Sheet open={manage} onOpenChange={setManage} title="Request pending" description={`${name} hasn’t responded yet. You’ll be notified when they accept.`}>
        <div className="space-y-2 pb-2">
          <Button variant="secondary" block size="lg" className="justify-start" asChild>
            <Link to={`/member/${memberId}`} onClick={() => setManage(false)}>
              <UserCheck className="size-5 text-gold" strokeWidth={1.5} /> View {name}’s profile
            </Link>
          </Button>
          <Button
            variant="danger"
            block
            size="lg"
            className="justify-start"
            onClick={() => {
              withdraw.mutate(memberId);
              setManage(false);
              toast('Request withdrawn');
            }}
          >
            <X className="size-5" /> Withdraw request
          </Button>
        </div>
      </Sheet>
      {overlay}
    </>
  );
}
