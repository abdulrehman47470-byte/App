// Shared domain types. These mirror the Phase 1 Supabase schema so the mock provider
// can be swapped for the real backend without touching components.

export type UserType = 'beginner' | 'intermediate' | 'advanced' | 'aficionado' | 'collector';

export type PhotoStatus = 'pending' | 'approved' | 'rejected';
export type VerificationState = 'idle' | 'pending' | 'verified' | 'failed';

export type Mentorship = 'guide' | 'seeking' | 'both' | 'neither';

/** Answers from Profile #2 (Stogie Preferences). Keys match OPTION_GROUPS ids. */
export interface Preferences {
  /** Chip answers keyed by option-group id, e.g. flavors: ['Cedar', 'Cocoa']. */
  [groupId: string]: string[] | number | undefined;
  priceMin?: number;
  priceMax?: number;
  strengthScale?: number;
  wishlist?: string[];
}

/** Answers from Profile #3 (About You). Keys match ABOUT_YOU_FIELDS ids. */
export type AboutYou = Partial<Record<string, string[]>>;

export type Visibility = {
  ethnicity: boolean;
  religion: boolean;
  political: boolean;
  /** Show me (approximately, city level) on the member map. */
  map?: boolean;
};

export interface Member {
  id: string;
  name: string;
  age: number;
  pronouns?: string;
  city: string;
  state: string;
  country: string;
  userType: UserType;
  bio: string;
  photoHue: number;
  /** Profile photo URL. Members cannot use the app without one. */
  photo?: string;
  photoVerified: boolean;
  preferences: Preferences;
  about: AboutYou;
  mentorship: Mentorship;
  mentorTopics: string[];
  meetup: string[];
  distanceMi: number;
  /** Approximate (city-level) position for the member map. Never an exact address. */
  lat: number;
  lng: number;
}

export interface DiscoverCard {
  member: Member;
  matchPct: number;
  shared: string[];
}

export interface Match {
  id: string;
  member: Member;
  matchedAt: string;
  hasMessages: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  fromMe: boolean;
  body: string;
  sentAt: string;
  status: 'sending' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  member: Member;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface Lounge {
  id: string;
  name: string;
  venueType: string;
  street: string;
  city: string;
  state: string;
  phone: string;
  metroArea: string;
  verificationNote?: string;
  lat: number;
  lng: number;
}

export interface SessionVideo {
  id: string;
  title: string;
  description: string;
  vimeoId: string;
  durationMin: number;
  hue: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: 'Reviews' | 'Guides' | 'Culture';
  excerpt: string;
  body: string[];
  publishedAt: string;
  readMin: number;
  hue: number;
}

export interface Report {
  id: string;
  reported: Member;
  reason: string;
  createdAt: string;
  status: 'open' | 'warned' | 'suspended' | 'banned' | 'dismissed';
}

export interface PendingPhoto {
  id: string;
  member: Member;
  submittedAt: string;
}

export interface MyProfile {
  name: string;
  dob: string;
  age: number;
  gender?: string;
  pronouns?: string;
  ethnicity?: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  userType?: UserType;
  bio: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  preferences: Preferences;
  about: AboutYou;
  visibility: Visibility;
  photoHue: number;
  /** Phase 0 only: compressed data URL. Phase 2 uses a signed Storage URL. */
  photoUrl?: string;
  photoStatus: PhotoStatus;
  photoVerified: boolean;
}

export interface DiscoverFilters {
  maxDistance: number;
  ageMin: number;
  ageMax: number;
  userTypes: UserType[];
  meetup: string[];
  mentorship: Mentorship[];
}

/** Who wrote a post or comment. `id: 'me'` is the signed-in member. */
export interface PostAuthor {
  id: string;
  name: string;
  hue: number;
  photoUrl?: string;
  userType?: UserType;
  city: string;
  state: string;
  verified: boolean;
}

export type PostKind = 'update' | 'checkin' | 'question' | 'smoking';

export interface Post {
  id: string;
  author: PostAuthor;
  kind: PostKind;
  body: string;
  /** Legacy inline image (data URL). New uploads use `media`. */
  imageUrl?: string;
  /** Uploaded photo or video (Phase 0: on-device store; later Supabase Storage). */
  media?: { id: string; type: 'image' | 'video' };
  /** Generated placeholder art for mock posts (no stock photos). */
  imageHue?: number;
  loungeId?: string;
  cigar?: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  savedByMe?: boolean;
  editedAt?: string;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: PostAuthor;
  body: string;
  createdAt: string;
}

export type FeedFilter = 'all' | 'near' | 'checkin' | 'question' | 'saved';
