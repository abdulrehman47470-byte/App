import type {
  BlogPost,
  Conversation,
  DiscoverCard,
  DiscoverFilters,
  Lounge,
  Match,
  Member,
  Message,
  MyProfile,
  PendingPhoto,
  Report,
  SessionVideo,
} from '@/types';

export type MentorSegment = 'find' | 'guide';

export interface LoungeQuery {
  q?: string;
  state?: string;
  venueType?: string;
}

/**
 * Everything the UI needs from the backend. Phase 0 ships MockProvider; Phase 1+ adds a
 * SupabaseProvider implementing the same interface (matching via SQL RPC, realtime chat, etc.).
 */
export interface DataProvider {
  getMe(): Promise<MyProfile>;
  saveMe(patch: Partial<MyProfile>): Promise<MyProfile>;

  getDiscover(filters: DiscoverFilters): Promise<DiscoverCard[]>;
  getMemberCard(id: string): Promise<DiscoverCard | null>;
  like(memberId: string): Promise<{ matched: boolean; member: Member }>;
  pass(memberId: string): Promise<void>;
  undoPass(memberId: string): Promise<void>;
  getMentors(segment: MentorSegment, topic?: string): Promise<DiscoverCard[]>;

  getMatches(): Promise<Match[]>;
  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, body: string): Promise<Message>;

  block(memberId: string): Promise<void>;
  report(memberId: string, reason: string): Promise<void>;

  getLounges(query: LoungeQuery): Promise<Lounge[]>;
  getSessions(): Promise<SessionVideo[]>;
  getSession(id: string): Promise<SessionVideo | null>;
  getPosts(): Promise<BlogPost[]>;
  getPost(slug: string): Promise<BlogPost | null>;

  admin: {
    getPendingPhotos(): Promise<PendingPhoto[]>;
    reviewPhoto(id: string, decision: 'approve' | 'reject'): Promise<void>;
    getReports(): Promise<Report[]>;
    actOnReport(id: string, action: 'warn' | 'suspend' | 'ban' | 'dismiss'): Promise<void>;
    getUsers(q?: string): Promise<Member[]>;
  };
}
