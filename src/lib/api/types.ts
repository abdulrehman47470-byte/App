import type {
  BlogBlock,
  BlogPost,
  Comment,
  ConnectionStatus,
  Connections,
  Conversation,
  DiscoverCard,
  DiscoverFilters,
  FeedFilter,
  Lounge,
  Match,
  MediaAsset,
  Member,
  Message,
  MyProfile,
  PendingPhoto,
  Post,
  PostKind,
  ReactionType,
  Report,
  SearchResults,
  SessionVideo,
  Story,
  StoryItem,
} from '@/types';

export type MentorSegment = 'find' | 'guide';

export interface NewPost {
  kind: PostKind;
  body: string;
  attachment?: MediaAsset;
  loungeId?: string;
  cigar?: string;
}

export interface NewBlog {
  title: string;
  category: BlogPost['category'];
  cover?: { mediaId?: string; src?: string };
  blocks: BlogBlock[];
}

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
  pass(memberId: string): Promise<void>;
  undoPass(memberId: string): Promise<void>;
  getMentors(segment: MentorSegment, topic?: string): Promise<DiscoverCard[]>;

  // ---- Connections (request -> accept / decline; either side can withdraw) ----
  /** Send a connection request. If they had already asked you, you are connected straight away. */
  connect(memberId: string): Promise<{ connected: boolean; member: Member }>;
  acceptConnection(memberId: string): Promise<{ member: Member }>;
  declineConnection(memberId: string): Promise<void>;
  withdrawConnection(memberId: string): Promise<void>;
  getConnections(): Promise<Connections>;
  getConnectionStatus(memberId: string): Promise<ConnectionStatus>;
  /** Connected members (messaging is allowed only between them). */
  getMatches(): Promise<Match[]>;

  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, body: string): Promise<Message>;

  block(memberId: string): Promise<void>;
  report(memberId: string, reason: string): Promise<void>;

  getLounges(query: LoungeQuery): Promise<Lounge[]>;
  getSessions(): Promise<SessionVideo[]>;
  getSession(id: string): Promise<SessionVideo | null>;

  // ---- Blog ----
  getPosts(): Promise<BlogPost[]>;
  getPost(slug: string): Promise<BlogPost | null>;
  createBlog(input: NewBlog): Promise<BlogPost>;
  deleteBlog(id: string): Promise<void>;
  getMemberBlogs(memberId: string): Promise<BlogPost[]>;

  // ---- Feed ----
  getFeed(filter: FeedFilter): Promise<Post[]>;
  getFeedPost(id: string): Promise<Post | null>;
  getMemberPosts(memberId: string): Promise<Post[]>;
  createPost(input: NewPost): Promise<Post>;
  deletePost(id: string): Promise<void>;
  /** Set your reaction on a post (null removes it). */
  reactToPost(id: string, reaction: ReactionType | null): Promise<Post>;
  togglePostSave(id: string): Promise<Post>;
  updatePost(id: string, body: string): Promise<Post>;
  getComments(postId: string): Promise<Comment[]>;
  addComment(postId: string, body: string, parentId?: string): Promise<Comment>;
  toggleCommentLike(postId: string, commentId: string): Promise<Comment>;

  // ---- Stories (expire after 24 hours) ----
  getStories(): Promise<Story[]>;
  addStory(item: Omit<StoryItem, 'id' | 'createdAt'>): Promise<Story>;
  markStorySeen(storyId: string): Promise<void>;

  search(q: string): Promise<SearchResults>;

  /** Members who chose to appear on the map, at city-level precision. */
  getMapMembers(): Promise<DiscoverCard[]>;

  admin: {
    getPendingPhotos(): Promise<PendingPhoto[]>;
    reviewPhoto(id: string, decision: 'approve' | 'reject'): Promise<void>;
    getReports(): Promise<Report[]>;
    actOnReport(id: string, action: 'warn' | 'suspend' | 'ban' | 'dismiss'): Promise<void>;
    getUsers(q?: string): Promise<Member[]>;
  };
}
