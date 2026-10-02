// TanStack Query hooks: the only place components reach the data layer.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type LoungeQuery, type MentorSegment, type NewBlog, type NewPost } from '@/lib/api';
import type { Comment, DiscoverFilters, FeedFilter, Message, MyProfile, Post, ReactionType, StoryItem } from '@/types';

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

// ---- Connections ----
export const useConnections = () => useQuery({ queryKey: ['connections'], queryFn: api.getConnections });
export const useConnectionStatus = (id: string) =>
  useQuery({ queryKey: ['connection-status', id], queryFn: () => api.getConnectionStatus(id), enabled: !!id });

/** Send / accept / decline / withdraw, keeping every connection-related list in sync. */
export function useConnectionActions() {
  const qc = useQueryClient();
  const sync = () => {
    for (const key of ['connections', 'connection-status', 'matches', 'conversations', 'mentors', 'map-members']) qc.invalidateQueries({ queryKey: [key] });
    // Discover's card stack manages itself; just mark it stale for next time.
    qc.invalidateQueries({ queryKey: ['discover'], refetchType: 'none' });
  };
  const setStatus = (id: string, status: string) => qc.setQueryData(['connection-status', id], status);
  return {
    connect: useMutation({
      mutationFn: (id: string) => api.connect(id),
      onMutate: (id) => setStatus(id, 'sent'),
      onSuccess: (r, id) => setStatus(id, r.connected ? 'connected' : 'sent'),
      onSettled: sync,
    }),
    accept: useMutation({ mutationFn: (id: string) => api.acceptConnection(id), onMutate: (id) => setStatus(id, 'connected'), onSettled: sync }),
    decline: useMutation({ mutationFn: (id: string) => api.declineConnection(id), onMutate: (id) => setStatus(id, 'none'), onSettled: sync }),
    withdraw: useMutation({ mutationFn: (id: string) => api.withdrawConnection(id), onMutate: (id) => setStatus(id, 'none'), onSettled: sync }),
  };
}
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
export const useMemberBlogs = (memberId: string) => useQuery({ queryKey: ['posts', 'member', memberId], queryFn: () => api.getMemberBlogs(memberId) });

export function useBlogActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['posts'] });
  return {
    create: useMutation({ mutationFn: (b: NewBlog) => api.createBlog(b), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteBlog(id), onSuccess: refresh }),
  };
}

// ---- Search ----
export const useSearch = (q: string) =>
  useQuery({ queryKey: ['search', q], queryFn: () => api.search(q), enabled: q.trim().length > 0, placeholderData: (prev) => prev });

// ---- Stories ----
export const useStories = () => useQuery({ queryKey: ['stories'], queryFn: api.getStories });
export function useStoryActions() {
  const qc = useQueryClient();
  return {
    add: useMutation({ mutationFn: (item: Omit<StoryItem, 'id' | 'createdAt'>) => api.addStory(item), onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }) }),
    seen: useMutation({ mutationFn: (id: string) => api.markStorySeen(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }) }),
  };
}

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
    react: useMutation({
      mutationFn: ({ id, reaction }: { id: string; reaction: ReactionType | null }) => api.reactToPost(id, reaction),
      // Optimistic: the reaction shows on the post instantly.
      onMutate: ({ id, reaction }) =>
        patchPost(id, (p) => {
          const r = { ...p.reactions };
          if (p.myReaction) r[p.myReaction] = Math.max(0, (r[p.myReaction] ?? 1) - 1);
          if (reaction) r[reaction] = (r[reaction] ?? 0) + 1;
          return { ...p, reactions: r, myReaction: reaction ?? undefined };
        }),
      onError: refresh,
    }),
    comment: useMutation({
      mutationFn: ({ postId, body, parentId }: { postId: string; body: string; parentId?: string }) => api.addComment(postId, body, parentId),
      onSuccess: (c, { postId }) => {
        qc.setQueryData<Comment[]>(['comments', postId], (list) => (list ? [...list, c] : [c]));
        patchPost(postId, (p) => ({ ...p, commentCount: p.commentCount + 1 }));
      },
    }),
    likeComment: useMutation({
      mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) => api.toggleCommentLike(postId, commentId),
      onMutate: ({ postId, commentId }) =>
        qc.setQueryData<Comment[]>(['comments', postId], (list) =>
          list?.map((c) => (c.id === commentId ? { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) } : c)),
        ),
    }),
  };
}

export const useMapMembers = () => useQuery({ queryKey: ['map-members'], queryFn: api.getMapMembers });
