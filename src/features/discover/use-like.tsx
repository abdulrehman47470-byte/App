import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnectionActions, useMe } from '@/features/queries';
import type { Member } from '@/types';
import { MatchOverlay } from './match-overlay';

/**
 * Shared connect flow (Discover, Mentors, map, profiles, requests): send a request or accept one,
 * and celebrate with "You're connected!" when it becomes mutual.
 */
export function useConnectFlow() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { connect, accept } = useConnectionActions();
  const [connected, setConnected] = useState<Member | null>(null);

  const send = async (memberId: string) => {
    const res = await connect.mutateAsync(memberId);
    if (res.connected) setConnected(res.member);
    return res;
  };
  const acceptRequest = async (memberId: string) => {
    const res = await accept.mutateAsync(memberId);
    setConnected(res.member);
    return res;
  };

  const overlay = (
    <MatchOverlay
      member={connected}
      me={me}
      onClose={() => setConnected(null)}
      onMessage={() => {
        // Null-safe on purpose: the React Compiler reads a callback's dependencies during render.
        const id = connected?.id;
        setConnected(null);
        if (id) navigate(`/messages/${id}`);
      }}
    />
  );

  return { connect: send, like: send, accept: acceptRequest, overlay };
}

/** @deprecated kept for existing call sites; same as useConnectFlow. */
export const useLikeFlow = useConnectFlow;
