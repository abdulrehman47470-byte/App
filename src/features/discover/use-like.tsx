import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '@/features/queries';
import { api } from '@/lib/api';
import type { Member } from '@/types';
import { MatchOverlay } from './match-overlay';

/** Shared Connect flow (Discover, Mentors, map, full profile): send a request; celebrate when it is mutual. */
export function useLikeFlow() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const [matched, setMatched] = useState<Member | null>(null);

  const like = async (memberId: string) => {
    const res = await api.like(memberId);
    qc.invalidateQueries({ queryKey: ['matches'] });
    qc.invalidateQueries({ queryKey: ['mentors'] });
    if (res.matched) setMatched(res.member);
    return res;
  };

  const overlay = (
    <MatchOverlay
      member={matched}
      me={me}
      onClose={() => setMatched(null)}
      onMessage={() => {
        // Null-safe on purpose: the React Compiler reads a callback's dependencies during render.
        const id = matched?.id;
        setMatched(null);
        if (id) navigate(`/messages/${id}`);
      }}
    />
  );

  return { like, overlay };
}
