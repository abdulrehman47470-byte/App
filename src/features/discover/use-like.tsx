import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '@/features/queries';
import { api } from '@/lib/api';
import type { Member } from '@/types';
import { MatchOverlay } from './match-overlay';

/** Shared Like flow (Discover, Mentors, full profile): like, and celebrate on a mutual match. */
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
        const id = matched!.id;
        setMatched(null);
        navigate(`/messages/${id}`);
      }}
    />
  );

  return { like, overlay };
}
