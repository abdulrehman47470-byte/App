// TanStack Query hooks: the only place components reach the data layer.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type LoungeQuery, type MentorSegment } from '@/lib/api';
import type { DiscoverFilters, Message, MyProfile } from '@/types';

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: api.getMe });

export function useSaveMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<MyProfile>) => api.saveMe(patch),
    onSuccess: (me) => {
      qc.setQueryData(['me'], me);
      qc.invalidateQueries({ queryKey: ['discover'] });
    },
  });
}

export const useDiscover = (filters: DiscoverFilters) =>
  useQuery({ queryKey: ['discover', filters], queryFn: () => api.getDiscover(filters), staleTime: Infinity });

export const useMemberCard = (id: string) =>
  useQuery({ queryKey: ['member', id], queryFn: () => api.getMemberCard(id) });

export const useMentors = (segment: MentorSegment, topic?: string) =>
  useQuery({ queryKey: ['mentors', segment, topic], queryFn: () => api.getMentors(segment, topic) });

export const useMatches = () => useQuery({ queryKey: ['matches'], queryFn: api.getMatches });
export const useConversations = () => useQuery({ queryKey: ['conversations'], queryFn: api.getConversations });
export const useMessages = (id: string) => useQuery({ queryKey: ['messages', id], queryFn: () => api.getMessages(id) });

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const key = ['messages', conversationId];
  return useMutation({
    mutationFn: (body: string) => api.sendMessage(conversationId, body),
    // Optimistic UI: show the bubble immediately as "sending".
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Message[]>(key) ?? [];
      const temp: Message = {
        id: `temp-${Date.now()}`, conversationId, fromMe: true, body, sentAt: new Date().toISOString(), status: 'sending',
      };
      qc.setQueryData<Message[]>(key, [...prev, temp]);
      return { prev };
    },
    onError: (_e, _b, ctx) => ctx && qc.setQueryData(key, ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useSafetyActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries();
  return {
    block: useMutation({ mutationFn: api.block, onSuccess: refresh }),
    report: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.report(id, reason) }),
  };
}

export const useLounges = (q: LoungeQuery) => useQuery({ queryKey: ['lounges', q], queryFn: () => api.getLounges(q) });
export const useSessions = () => useQuery({ queryKey: ['sessions'], queryFn: api.getSessions });
export const useSessionVideo = (id: string) => useQuery({ queryKey: ['session', id], queryFn: () => api.getSession(id) });
export const usePosts = () => useQuery({ queryKey: ['posts'], queryFn: api.getPosts });
export const usePost = (slug: string) => useQuery({ queryKey: ['post', slug], queryFn: () => api.getPost(slug) });

export const usePendingPhotos = () => useQuery({ queryKey: ['admin', 'photos'], queryFn: api.admin.getPendingPhotos });
export const useReports = () => useQuery({ queryKey: ['admin', 'reports'], queryFn: api.admin.getReports });
export const useAdminUsers = (q: string) => useQuery({ queryKey: ['admin', 'users', q], queryFn: () => api.admin.getUsers(q) });

export function useAdminActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });
  return {
    reviewPhoto: useMutation({
      mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) => api.admin.reviewPhoto(id, decision),
      onSuccess: refresh,
    }),
    actOnReport: useMutation({
      mutationFn: ({ id, action }: { id: string; action: 'warn' | 'suspend' | 'ban' | 'dismiss' }) =>
        api.admin.actOnReport(id, action),
      onSuccess: refresh,
    }),
  };
}
