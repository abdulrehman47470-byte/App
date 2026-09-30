// Mock backend with small artificial latency. The member's own profile and the mock state
// (likes, matches, messages, posts, comments, blocks) are kept in localStorage so reloads keep them.
import { MOCK_FEED } from '@/data/mock/feed';
import { MOCK_MEMBERS, findMember } from '@/data/mock/members';
import { MOCK_LOUNGES, MOCK_POSTS, MOCK_REPORT_REASONS, MOCK_SESSIONS, MOCK_THREADS } from '@/data/mock/content';
import { scoreMatch } from '@/lib/matching';
import { storage } from '@/lib/storage';
import type { Comment, DiscoverCard, Match, Member, Message, MyProfile, PendingPhoto, Post, PostAuthor, Report } from '@/types';
import type { DataProvider } from './types';

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const EMPTY_PROFILE: MyProfile = {
  name: '', dob: '', age: 0, country: 'United States', state: '', city: '', zip: '', bio: '',
  website: '', instagram: '', facebook: '', linkedin: '', preferences: {}, about: {},
  // Private by default: members opt in to appearing on the member map.
  visibility: { ethnicity: false, religion: false, political: false, map: false },
  photoHue: 30, photoStatus: 'pending', photoVerified: false,
};

// Demo profile used once onboarding is complete, so Discover has something to score against.
export const DEMO_PROFILE: MyProfile = {
  ...EMPTY_PROFILE,
  name: 'Alex Morgan', dob: '1989-04-18', age: 37, pronouns: 'they/them', city: 'Chicago', state: 'Illinois', zip: '60614',
  userType: 'intermediate', bio: 'Weekend lounge regular. Nicaraguan puros, bourbon and long conversations.',
  instagram: '@alex.smokes', visibility: { ethnicity: false, religion: false, political: false, map: true }, photoHue: 2, photoStatus: 'approved', photoVerified: true,
  preferences: {
    strength: ['Medium', 'Medium-Full'], flavors: ['Leather', 'Coffee', 'Cocoa', 'Cedar'], wrapper: ['Maduro', 'Habano'],
    origin: ['Nicaragua'], vitola: ['Robusto', 'Toro'], brands: ['Padrón', 'Liga Privada', 'My Father'],
    pairing: ['Bourbon', 'Espresso'], venue: ['Cigar Lounge', 'Patio'], pace: ['Relaxed'], socialStyle: ['Small Groups'],
    atmosphere: ['Relaxed', 'Social'], frequency: ['Weekly'], collectionSize: ['25-50'], priceMin: 10, priceMax: 30,
    meetup: ['Open to Local Meetups'], mentorship: ['Looking for a Mentor'], mentorTopics: ['Aging'],
  },
  about: { industry: ['Technology'], hobbies: ['Watches', 'Travel'], sports: ['Golf'], languages: ['English'], music: ['Jazz'] },
};

const ME_KEY = 'ds.me';

export const MOCK_STATE_KEY = 'ds.mock';

const authorOf = (m: Member): PostAuthor => ({
  id: m.id, name: m.name, hue: m.photoHue, userType: m.userType, city: m.city, state: m.state, verified: m.photoVerified,
});

function initialFeed() {
  const posts: Post[] = [];
  const comments = new Map<string, Comment[]>();
  for (const f of MOCK_FEED) {
    const author = findMember(f.authorId);
    if (!author) continue;
    const list = f.comments.map((c, i) => ({
      id: `${f.id}-c${i}`, postId: f.id, author: authorOf(findMember(c.authorId)!), body: c.body, createdAt: minsAgo(c.minsAgo),
    }));
    comments.set(f.id, list);
    posts.push({
      id: f.id, author: authorOf(author), kind: f.kind, body: f.body, imageHue: f.imageHue, loungeId: f.loungeId, cigar: f.cigar,
      createdAt: minsAgo(f.minsAgo), likes: f.likes, likedByMe: false, commentCount: list.length,
    });
  }
  return { posts, comments };
}

function initialState() {
  const messages = new Map<string, Message[]>();
  for (const [memberId, thread] of Object.entries(MOCK_THREADS)) {
    messages.set(
      memberId,
      thread.map((t, i) => ({
        id: `${memberId}-${i}`, conversationId: memberId, fromMe: t.fromMe, body: t.body,
        sentAt: minsAgo(t.minsAgo), status: 'read' as const,
      })),
    );
  }
  const feed = initialFeed();
  return {
    posts: feed.posts,
    comments: feed.comments,
    liked: new Set<string>(),
    passed: [] as string[],
    blocked: new Set<string>(),
    // Threads with an unread incoming message until the member opens them.
    unread: new Set(['m2']),
    // Members who already liked you, so liking them back creates a match.
    likesMe: new Set(['m1', 'm8', 'm3']),
    matches: new Map<string, string>([
      ['m2', minsAgo(60 * 30)], ['m5', minsAgo(60 * 50)], ['m7', minsAgo(60 * 70)], ['m4', minsAgo(60 * 90)], ['m10', minsAgo(90)],
    ]),
    messages,
    pendingPhotos: [
      { id: 'p1', member: MOCK_MEMBERS[2], submittedAt: minsAgo(120) },
      { id: 'p2', member: MOCK_MEMBERS[8], submittedAt: minsAgo(60 * 24) },
      { id: 'p3', member: MOCK_MEMBERS[5], submittedAt: minsAgo(60 * 72) },
    ] as PendingPhoto[],
    reports: [
      { id: 'r1', reported: MOCK_MEMBERS[8], reason: MOCK_REPORT_REASONS[0], createdAt: minsAgo(300), status: 'open' },
      { id: 'r2', reported: MOCK_MEMBERS[5], reason: MOCK_REPORT_REASONS[2], createdAt: minsAgo(60 * 30), status: 'open' },
    ] as Report[],
  };
}

type Saved = {
  liked: string[]; passed: string[]; blocked: string[]; unread: string[];
  matches: [string, string][]; messages: [string, Message[]][]; pendingPhotos: PendingPhoto[]; reports: Report[];
  posts?: Post[]; comments?: [string, Comment[]][];
};

/** Mock state survives page reloads (localStorage) so manual testing is realistic. Sign-out clears it. */
function hydrate() {
  const base = initialState();
  const saved = storage.get<Saved>(MOCK_STATE_KEY);
  if (!saved) return base;
  return {
    ...base,
    liked: new Set(saved.liked), passed: saved.passed, blocked: new Set(saved.blocked), unread: new Set(saved.unread),
    matches: new Map(saved.matches), messages: new Map(saved.messages), pendingPhotos: saved.pendingPhotos, reports: saved.reports,
    posts: saved.posts ?? base.posts, comments: saved.comments ? new Map(saved.comments) : base.comments,
  };
}

const state = hydrate();

function persist() {
  const saved: Saved = {
    liked: [...state.liked], passed: state.passed, blocked: [...state.blocked], unread: [...state.unread],
    matches: [...state.matches], messages: [...state.messages], pendingPhotos: state.pendingPhotos, reports: state.reports,
    posts: state.posts, comments: [...state.comments],
  };
  storage.set(MOCK_STATE_KEY, saved);
}

function loadMe(): MyProfile {
  return storage.get<MyProfile>(ME_KEY) ?? EMPTY_PROFILE;
}

function card(me: MyProfile, m: Member): DiscoverCard {
  const { pct, shared } = scoreMatch(me, m);
  return { member: m, matchPct: pct, shared: shared.slice(0, 5) };
}

const visible = (m: Member) => !state.blocked.has(m.id);

function myAuthor(): PostAuthor {
  const me = loadMe();
  return { id: 'me', name: me.name || 'You', hue: me.photoHue, photoUrl: me.photoUrl, userType: me.userType, city: me.city, state: me.state, verified: me.photoVerified };
}

/** Posts and comments are text with limits (Phase 1: app_config + database check). */
export const POST_MAX = 1000;
export const COMMENT_MAX = 500;

function sameArea(me: MyProfile, a: PostAuthor) {
  if (a.id === 'me') return true;
  if (me.city && a.city.toLowerCase() === me.city.toLowerCase()) return true;
  // Mock members store state codes (IL); the wizard stores names (Illinois).
  return !!me.state && (a.state === me.state || US_CODES[me.state] === a.state);
}
const US_CODES: Record<string, string> = { Illinois: 'IL', Wisconsin: 'WI', Florida: 'FL', 'New York': 'NY', Tennessee: 'TN', Texas: 'TX' };

export const mockProvider: DataProvider = {
  async getMe() {
    await wait(120);
    return loadMe();
  },
  async saveMe(patch) {
    const next = { ...loadMe(), ...patch };
    storage.set(ME_KEY, next);
    return next;
  },

  async getDiscover(f) {
    await wait(450);
    const me = loadMe();
    return MOCK_MEMBERS.filter(
      (m) =>
        visible(m) &&
        !state.liked.has(m.id) &&
        !state.passed.includes(m.id) &&
        !state.matches.has(m.id) &&
        (f.maxDistance >= 100 || m.distanceMi <= f.maxDistance) &&
        m.age >= f.ageMin &&
        m.age <= f.ageMax &&
        (!f.userTypes.length || f.userTypes.includes(m.userType)) &&
        (!f.meetup.length || f.meetup.some((x) => m.meetup.includes(x))) &&
        (!f.mentorship.length || f.mentorship.includes(m.mentorship)),
    )
      .map((m) => card(me, m))
      .sort((a, b) => b.matchPct - a.matchPct);
  },
  async getMemberCard(id) {
    await wait(200);
    const m = findMember(id);
    return m && visible(m) ? card(loadMe(), m) : null;
  },
  async like(id) {
    await wait(150);
    state.liked.add(id);
    const member = findMember(id)!;
    const matched = state.likesMe.has(id);
    if (matched) state.matches.set(id, new Date().toISOString());
    persist();
    return { matched, member };
  },
  async pass(id) {
    await wait(100);
    state.passed.push(id);
    persist();
  },
  async undoPass(id) {
    await wait(100);
    state.passed = state.passed.filter((x) => x !== id);
    persist();
  },
  async getMentors(segment, topic) {
    await wait(350);
    const me = loadMe();
    const wanted = segment === 'find' ? ['guide', 'both'] : ['seeking', 'both'];
    return MOCK_MEMBERS.filter(
      (m) => visible(m) && wanted.includes(m.mentorship) && (!topic || m.mentorTopics.includes(topic)),
    ).map((m) => card(me, m));
  },

  async getMatches() {
    await wait(300);
    return [...state.matches.entries()]
      .map(([id, at]): Match | null => {
        const member = findMember(id);
        if (!member || !visible(member)) return null;
        return { id, member, matchedAt: at, hasMessages: (state.messages.get(id)?.length ?? 0) > 0 };
      })
      .filter((x): x is Match => !!x)
      .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt));
  },
  async getConversations() {
    await wait(300);
    return [...state.messages.entries()]
      .filter(([id, msgs]) => msgs.length && state.matches.has(id) && !state.blocked.has(id))
      .map(([id, msgs]) => {
        const last = msgs[msgs.length - 1];
        return {
          id, member: findMember(id)!, lastMessage: last.body, lastAt: last.sentAt,
          unread: state.unread.has(id) && !last.fromMe ? 1 : 0,
        };
      })
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  },
  async getMessages(id) {
    await wait(250);
    if (state.unread.delete(id)) persist();
    return state.messages.get(id) ?? [];
  },
  async sendMessage(id, body) {
    await wait(300);
    // Rule: only matched members can message (Phase 5 enforces this in RLS).
    if (!state.matches.has(id)) throw new Error('You can only message your matches.');
    const msg: Message = { id: crypto.randomUUID(), conversationId: id, fromMe: true, body, sentAt: new Date().toISOString(), status: 'delivered' };
    state.messages.set(id, [...(state.messages.get(id) ?? []), msg]);
    persist();
    return msg;
  },

  async block(id) {
    await wait(150);
    state.blocked.add(id);
    state.matches.delete(id);
    persist();
  },
  async report(id, reason) {
    await wait(150);
    state.reports.unshift({ id: crypto.randomUUID(), reported: findMember(id)!, reason, createdAt: new Date().toISOString(), status: 'open' });
    persist();
  },

  async getLounges({ q, state: st, venueType }) {
    await wait(250);
    const needle = q?.trim().toLowerCase();
    return MOCK_LOUNGES.filter(
      (l) =>
        (!needle || [l.name, l.city, l.state, l.street, l.venueType].some((v) => v.toLowerCase().includes(needle))) &&
        (!st || l.state === st) &&
        (!venueType || l.venueType === venueType),
    );
  },
  async getSessions() {
    await wait(250);
    return MOCK_SESSIONS;
  },
  async getSession(id) {
    await wait(150);
    return MOCK_SESSIONS.find((s) => s.id === id) ?? null;
  },
  async getPosts() {
    await wait(250);
    return MOCK_POSTS;
  },
  async getPost(slug) {
    await wait(150);
    return MOCK_POSTS.find((p) => p.slug === slug) ?? null;
  },

  async getFeed(filter) {
    await wait(350);
    const me = loadMe();
    return state.posts
      .filter((p) => !state.blocked.has(p.author.id))
      .filter((p) =>
        filter === 'near' ? sameArea(me, p.author) : filter === 'checkin' ? p.kind === 'checkin' : filter === 'question' ? p.kind === 'question' : true,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getFeedPost(id) {
    await wait(150);
    const p = state.posts.find((x) => x.id === id);
    return p && !state.blocked.has(p.author.id) ? p : null;
  },
  async getMemberPosts(memberId) {
    await wait(200);
    return state.posts.filter((p) => p.author.id === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createPost(input) {
    await wait(300);
    const body = input.body.trim();
    if (!body && !input.imageUrl) throw new Error('Write something or add a photo.');
    if (body.length > POST_MAX) throw new Error(`Posts can be up to ${POST_MAX} characters.`);
    const post: Post = {
      id: crypto.randomUUID(), author: myAuthor(), kind: input.kind, body, imageUrl: input.imageUrl, loungeId: input.loungeId,
      cigar: input.cigar?.trim() || undefined, createdAt: new Date().toISOString(), likes: 0, likedByMe: false, commentCount: 0,
    };
    state.posts = [post, ...state.posts];
    persist();
    return post;
  },
  async deletePost(id) {
    await wait(150);
    state.posts = state.posts.filter((p) => !(p.id === id && p.author.id === 'me'));
    persist();
  },
  async togglePostLike(id) {
    await wait(120);
    state.posts = state.posts.map((p) => (p.id === id ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p));
    persist();
    return state.posts.find((p) => p.id === id)!;
  },
  async getComments(postId) {
    await wait(200);
    return (state.comments.get(postId) ?? []).filter((c) => !state.blocked.has(c.author.id));
  },
  async addComment(postId, body) {
    await wait(200);
    const text = body.trim();
    if (!text) throw new Error('Comment is empty.');
    if (text.length > COMMENT_MAX) throw new Error(`Comments can be up to ${COMMENT_MAX} characters.`);
    const c: Comment = { id: crypto.randomUUID(), postId, author: myAuthor(), body: text, createdAt: new Date().toISOString() };
    state.comments.set(postId, [...(state.comments.get(postId) ?? []), c]);
    state.posts = state.posts.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
    persist();
    return c;
  },
  async getMapMembers() {
    await wait(300);
    const me = loadMe();
    // Phase 4: only members who opted in (visibility.map) are returned, with city-level coordinates.
    return MOCK_MEMBERS.filter(visible).map((m) => card(me, m));
  },

  admin: {
    async getPendingPhotos() {
      await wait(250);
      return state.pendingPhotos;
    },
    async reviewPhoto(id) {
      await wait(150);
      state.pendingPhotos = state.pendingPhotos.filter((p) => p.id !== id);
      persist();
    },
    async getReports() {
      await wait(250);
      return state.reports;
    },
    async actOnReport(id, action) {
      await wait(150);
      const map = { warn: 'warned', suspend: 'suspended', ban: 'banned', dismiss: 'dismissed' } as const;
      state.reports = state.reports.map((r) => (r.id === id ? { ...r, status: map[action] } : r));
      persist();
    },
    async getUsers(q) {
      await wait(250);
      const n = q?.toLowerCase().trim();
      return MOCK_MEMBERS.filter((m) => !n || m.name.toLowerCase().includes(n) || m.city.toLowerCase().includes(n));
    },
  },
};
