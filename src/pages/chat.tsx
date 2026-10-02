import { AnimatePresence, m as M } from 'framer-motion';
import { Check, CheckCheck, Clock, MoreVertical, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SafetyBanner, VerifiedBadge } from '@/components/brand/ornaments';
import { Avatar } from '@/components/brand/portrait';
import { BackButton } from '@/components/layout/page';
import { Skeleton } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { userTypeLabel } from '@/data/options';
import { useMatches, useMessages, useSendMessage } from '@/features/queries';
import { SafetySheet } from '@/features/safety/safety-sheet';
import { clockTime, cn } from '@/lib/utils';
import type { Message } from '@/types';

export const MAX_MESSAGE = 1000; // Phase 5: app_config + server-side check and rate limit

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function Chat() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: matches, isLoading: loadingMatches } = useMatches();
  const { data: messages, isLoading } = useMessages(id);
  const send = useSendMessage(id);
  const [text, setText] = useState('');
  const [safety, setSafety] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const match = matches?.find((m) => m.id === id);
  const m = match?.member;

  const qc = useQueryClient();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  // Opening a conversation marks it read (Phase 5: read receipts in the database).
  useEffect(() => {
    if (messages) qc.invalidateQueries({ queryKey: ['conversations'] });
  }, [messages, qc]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    send.mutate(body, { onError: (err) => toast((err as Error).message, 'danger') });
  };

  if (!loadingMatches && !match) {
    return (
      <div className="px-6 py-20 text-center">
        <h1 className="font-serif text-2xl text-text">Conversation unavailable</h1>
        <p className="mt-2 text-sm text-muted">Only connected members can message each other.</p>
        <Link to="/matches" className="mt-6 inline-block text-gold hover:underline">
          Go to Connections
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-76px-env(safe-area-inset-bottom))] flex-col lg:h-dvh">
      <header className="flex items-center gap-2 border-b border-line bg-bg/95 px-3 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <BackButton to="/messages" />
        {m ? (
          <Link to={`/member/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={m.name} hue={m.photoHue} src={m.photo} size={40} />
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-[15px] font-semibold text-text">
                {m.name} {m.photoVerified && <VerifiedBadge className="size-4" />}
              </p>
              <p className="truncate text-xs text-muted">
                {userTypeLabel(m.userType)} · {m.city}
              </p>
            </div>
          </Link>
        ) : (
          <Skeleton className="h-10 flex-1" />
        )}
        <button type="button" onClick={() => setSafety(true)} aria-label="Report or block" className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
          <MoreVertical className="size-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-label={`Conversation with ${m?.name ?? ''}`}>
        <SafetyBanner className="mb-4" />
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
          </div>
        ) : !messages?.length ? (
          <div className="py-10 text-center">
            {m && <Avatar name={m.name} hue={m.photoHue} src={m.photo} size={88} ring className="mx-auto" />}
            <p className="mt-4 font-serif text-xl text-text">You and {m?.name} are connected</p>
            <p className="mt-1 text-sm text-muted">Break the ice: ask about their favorite smoke.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const day = dayLabel(msg.sentAt);
                const showDay = i === 0 || day !== dayLabel(messages[i - 1].sentAt);
                const nextSame = messages[i + 1]?.fromMe === msg.fromMe;
                return (
                  <M.li key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    {showDay && <p className="my-3 text-center text-[11px] uppercase tracking-wider text-faint">{day}</p>}
                    <Bubble msg={msg} tail={!nextSame} />
                  </M.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-line bg-bg-elevated px-3 py-2.5">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={text}
          maxLength={MAX_MESSAGE}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) onSubmit(e);
          }}
          placeholder="Type a message…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-[22px] border border-line bg-surface px-4 py-2.5 text-[15px] text-text placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Send" className="gold-gradient grid size-11 shrink-0 place-items-center rounded-full text-gold-ink transition-opacity disabled:opacity-40">
          <SendHorizontal className="size-5" />
        </button>
      </form>
      {text.length > MAX_MESSAGE - 100 && <p className="bg-bg-elevated px-4 pb-2 text-right text-[11px] text-faint">{text.length}/{MAX_MESSAGE}</p>}

      {m && <SafetySheet memberId={m.id} name={m.name} open={safety} onOpenChange={setSafety} onBlocked={() => navigate('/messages')} />}
    </div>
  );
}

function Bubble({ msg, tail }: { msg: Message; tail: boolean }) {
  const Status = msg.status === 'sending' ? Clock : msg.status === 'read' ? CheckCheck : Check;
  return (
    <div className={cn('flex', msg.fromMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-[20px] px-4 py-2.5 text-[15px] leading-snug',
          msg.fromMe ? 'gold-gradient text-gold-ink' : 'border border-line bg-surface-2 text-text',
          tail && (msg.fromMe ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'),
          msg.status === 'sending' && 'opacity-70',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
        <p className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', msg.fromMe ? 'text-gold-ink/70' : 'text-faint')}>
          {clockTime(msg.sentAt)}
          {msg.fromMe && <Status className="size-3" aria-label={msg.status} />}
        </p>
      </div>
    </div>
  );
}
