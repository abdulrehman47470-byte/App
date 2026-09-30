// TanStack Query hooks: the only place components reach the data layer.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type LoungeQuery, type MentorSegment, type NewPost } from '@/lib/api';
import type { DiscoverFilters, FeedFilter, Message, MyProfile, Post } from '@/types';

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: api.getMe });

export function useSaveMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<MyProfile>) => api.saveMe(patch),
    onSuccess: (me) => {
      qc.setQueryData(['me'], me);
      // Mark Discover stale (it re-scores against the new profile next time it is shown) without
      // refetching now, so autosave never competes with typing.
      qc.invalidateQueries({ queryKey: ['discover'], refetchType: 'none' });
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

// ---- Feed ----
export const useFeed = (filter: FeedFilter) => useQuery({ queryKey: ['feed', filter], queryFn: () => api.getFeed(filter) });
export const useFeedPost = (id: string) => useQuery({ queryKey: ['feed-post', id], queryFn: () => api.getFeedPost(id) });
export const useMemberPosts = (memberId: string) =>
  useQuery({ queryKey: ['feed', 'member', memberId], queryFn: () => api.getMemberPosts(memberId) });
export const useComments = (postId: string, enabled = true) =>
  useQuery({ queryKey: ['comments', postId], queryFn: () => api.getComments(postId), enabled });

export function useFeedActions() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['feed-post'] });
  };
  /** Update a post in every cached list that contains it (optimistic UI). */
  const patchPost = (id: string, fn: (p: Post) => Post) => {
    qc.setQueriesData<Post[]>({ queryKey: ['feed'] }, (list) => list?.map((p) => (p.id === id ? fn(p) : p)));
    qc.setQueriesData<Post | null>({ queryKey: ['feed-post', id] }, (p) => (p ? fn(p) : p));
  };
  return {
    create: useMutation({
      mutationFn: (p: NewPost) => api.createPost(p),
      // Show the new post at the top straight away, then sync the lists.
      onSuccess: (post) => {
        qc.setQueriesData<Post[]>({ queryKey: ['feed', 'all'] }, (list) => (list ? [post, ...list] : list));
        refresh();
      },
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: string }) => api.updatePost(id, body),
      onSuccess: (post) => patchPost(post.id, () => post),
    }),
    save: useMutation({
      mutationFn: (id: string) => api.togglePostSave(id),
      onMutate: (id) => patchPost(id, (p) => ({ ...p, savedByMe: !p.savedByMe })),
      onSettled: () => qc.invalidateQueries({ queryKey: ['feed', 'saved'] }),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.deletePost(id),
      // Remove it from every list immediately.
      onMutate: (id) => qc.setQueriesData<Post[]>({ queryKey: ['feed'] }, (list) => list?.filter((p) => p.id !== id)),
      onSettled: refresh,
    }),
    like: useMutation({
      mutationFn: (id: string) => api.togglePostLike(id),
      onMutate: (id) => patchPost(id, (p) => ({ ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) })),
      onError: refresh,
    }),
    comment: useMutation({
      mutationFn: ({ postId, body }: { postId: string; body: string }) => api.addComment(postId, body),
      onSuccess: (_c, { postId }) => {
        qc.invalidateQueries({ queryKey: ['comments', postId] });
        patchPost(postId, (p) => ({ ...p, commentCount: p.commentCount + 1 }));
      },
    }),
  };
}

export const useMapMembers = () => useQuery({ queryKey: ['map-members'], queryFn: api.getMapMembers });
