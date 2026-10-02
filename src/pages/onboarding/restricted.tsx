import { Lock } from 'lucide-react';
import { Frame } from '@/components/layout/frame';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/misc';
import { useSession } from '@/lib/session';

export default function Restricted() {
  const { signOut } = useSession();
  return (
    <Frame>
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
        <Card className="w-full border-danger/30 px-6 py-10">
          <div className="mx-auto grid size-16 place-items-center rounded-full border border-danger/50 bg-danger/10">
            <Lock className="size-7 text-danger" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 font-serif text-[32px] text-text">Access Restricted</h1>
          <p className="mx-auto mt-3 max-w-xs text-[15px] text-muted">
            Daily Stogie is for adults 21 and over. Thanks for your interest. We look forward to welcoming you when
            you are old enough to join.
          </p>
          <div className="mx-auto mt-8 grid size-24 place-items-center rounded-full border-2 border-danger/60 font-serif text-3xl font-semibold text-danger">
            21+
          </div>
          <p className="mt-8 text-xs text-faint">
            We keep only the minimum information required by law. {/* TODO(legal): confirm retention wording */}
          </p>
        </Card>
        <div className="mt-6 w-full space-y-3">
          {/* TODO(needs-client): support email address */}
          <Button variant="outline" block asChild>
            <a href="mailto:support@example.com">Contact support</a>
          </Button>
          <Button variant="ghost" block onClick={() => signOut()}>
            Back to start
          </Button>
        </div>
      </div>
    </Frame>
  );
}
