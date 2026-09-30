import { Ban, Flag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { MOCK_REPORT_REASONS } from '@/data/mock/content';
import { useSafetyActions } from '@/features/queries';

/** Report + Block, available on every card, profile and conversation. */
export function SafetySheet({
  memberId,
  name,
  open,
  onOpenChange,
  onBlocked,
}: {
  memberId: string;
  name: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBlocked?: () => void;
}) {
  const [mode, setMode] = useState<'menu' | 'report' | 'block'>('menu');
  const [reason, setReason] = useState<string>();
  const { block, report } = useSafetyActions();
  const toast = useToast();

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(() => (setMode('menu'), setReason(undefined)), 200);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title={mode === 'report' ? `Report ${name}` : mode === 'block' ? `Block ${name}?` : 'Safety'}
      description={
        mode === 'report'
          ? 'Reports are private. Our team reviews every one against the Code of Ethics.'
          : mode === 'block'
            ? 'You will no longer see each other in Discover, Matches or Messages.'
            : undefined
      }
    >
      {mode === 'menu' && (
        <div className="space-y-2 pb-2">
          <Button variant="secondary" block size="lg" className="justify-start" onClick={() => setMode('report')}>
            <Flag className="size-5 text-danger" strokeWidth={1.5} /> Report {name}
          </Button>
          <Button variant="secondary" block size="lg" className="justify-start" onClick={() => setMode('block')}>
            <Ban className="size-5 text-danger" strokeWidth={1.5} /> Block {name}
          </Button>
        </div>
      )}
      {mode === 'report' && (
        <div className="space-y-5 pb-2">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reason">
            {MOCK_REPORT_REASONS.map((r) => (
              <Chip key={r} role="radio" label={r} selected={reason === r} onToggle={() => setReason(r)} />
            ))}
          </div>
          <Button
            variant="dangerSolid"
            block
            size="lg"
            disabled={!reason || report.isPending}
            onClick={async () => {
              await report.mutateAsync({ id: memberId, reason: reason! });
              toast('Thanks. Your report was sent to our team.');
              close(false);
            }}
          >
            Send report
          </Button>
        </div>
      )}
      {mode === 'block' && (
        <div className="flex gap-3 pb-2">
          <Button variant="secondary" block onClick={() => setMode('menu')}>
            Cancel
          </Button>
          <Button
            variant="dangerSolid"
            block
            disabled={block.isPending}
            onClick={async () => {
              await block.mutateAsync(memberId);
              toast(`${name} is blocked.`);
              close(false);
              onBlocked?.();
            }}
          >
            Block
          </Button>
        </div>
      )}
    </Sheet>
  );
}
