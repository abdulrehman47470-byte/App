// Mock backend. The member's own profile and the mock state (connections, messages, posts,
// comments, reactions, stories, blogs, blocks) are kept in localStorage so reloads keep them.
// Set VITE_MOCK_LATENCY=true in .env to simulate network delay (useful for checking loading states).
import { MOCK_FEED, MOCK_STORIES } from '@/data/mock/feed';
import { MOCK_MEMBERS, findMember } from '@/data/mock/members';
import { MOCK_LOUNGES, MOCK_POSTS, MOCK_REPORT_REASONS, MOCK_SESSIONS, MOCK_THREADS } from '@/data/mock/content';
import { userTypeLabel } from '@/data/user-types';
import { scoreMatch } from '@/lib/matching';
import { deleteMedia } from '@/lib/media-store';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import type {
  BlogPost,
  Comment,
  ConnectionStatus,
  DiscoverCard,
  Match,
  Member,
  Message,
  MyProfile,
  PendingPhoto,
  Post,
  PostAuthor,
  ReactionType,
  Report,
  Story,
  StoryItem,
} from '@/types';
import type { DataProvider } from './types';

const SIMULATE_LATENCY = import.meta.env.VITE_MOCK_LATENCY === 'true';
const wait = (ms = 250): Promise<void> => (SIMULATE_LATENCY ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const now = () => new Date().toISOString();

export const EMPTY_PROFILE: MyProfile = {
  name: '', dob: '', age: 0, country: 'United States', state: '', city: '', zip: '', bio: '',
  website: '', instagram: '', facebook: '', linkedin: '', preferences: {}, about: {},
  // Private by default: members opt in to appearing on the member map.
  visibility: { ethnicity: false, religion: false, political: false, map: false },
  photoHue: 30, photoStatus: 'pending', photoVerified: false,
};

// Demo profile used by "explore with a demo member" and the demo account (alex.morgan@example.com).
export const DEMO_PROFILE: MyProfile = {
  ...EMPTY_PROFILE,
  name: 'Alex Morgan', dob: '1989-04-18', age: 37, pronouns: 'they/them', city: 'Chicago', state: 'Illinois', zip: '60614',
  userType: 'intermediate', bio: 'Weekend lounge regular. Nicaraguan puros, bourbon and long conversations.',
  instagram: '@alex.smokes', visibility: { ethnicity: false, religion: false, political: false, map: true }, photoHue: 2, photoUrl: '/members/me.webp', photoStatus: 'approved', photoVerified: true,
  preferences: {
    strength: ['Medium', 'Medium-Full'], flavors: ['Leather', 'Coffee', 'Cocoa', 'Cedar'], wrapper: ['Maduro', 'Habano'],
    origin: ['Nicaragua'], vitola: ['Robusto', 'Toro'], brands: ['Padrón', 'Liga Privada', 'My Father'],
    pairing: ['Bourbon', 'Espresso'], venue: ['Cigar Lounge', 'Patio'], pace: ['Relaxed'], socialStyle: ['Small Groups'],
    atmosphere: ['Relaxed', 'Social'], frequency: ['Weekly'], collectionSize: ['25-50'], priceMin: 10, priceMax: 30,
    meetup: ['Open to Local Meetups'], mentorship: ['Looking for a Mentor'], mentorTopics: ['Aging'],
  },
  about: { industry: ['Technology'], hobbies: ['Watches', 'Travel'], sports: ['Golf'], languages: ['English'], music: ['Jazz'] },
};

/** Posts and comments are text with limits (Phase 1: app_config + database check). */
export const POST_MAX = 1000;
export const COMMENT_MAX = 500;
const STORY_TTL_MS = 24 * 3600_000;

const authorOf = (m: Member): PostAuthor => ({
  id: m.id, name: m.name, hue: m.photoHue, photoUrl: m.photo, userType: m.userType, city: m.city, state: m.state, verified: m.photoVerified,
});

const loadMe = (): MyProfile => storage.get<MyProfile>(STORAGE_KEYS.me) ?? EMPTY_PROFILE;
function myAuthor(): PostAuthor {
  const me = loadMe();
  return { id: 'me', name: me.name || 'You', hue: me.photoHue, photoUrl: me.photoUrl, userType: me.userType, city: me.city, state: me.state, verified: me.photoVerified };
}

// ---------------------------------------------------------------- initial demo state

function initialFeed() {
  const posts: Post[] = [];
  const comments = new Map<string, Comment[]>();
  for (const f of MOCK_FEED) {
    const author = findMember(f.authorId);
    if (!author) continue;
    const list: Comment[] = f.comments.map((c, i) => ({
      id: `${f.id}-c${i}`, postId: f.id, parentId: c.replyTo !== undefined ? `${f.id}-c${c.replyTo}` : undefined,
      author: authorOf(findMember(c.authorId)!), body: c.body, createdAt: minsAgo(c.minsAgo), likes: c.likes ?? 0, likedByMe: false,
    }));
    comments.set(f.id, list);
    posts.push({
      id: f.id, author: authorOf(author), kind: f.kind, body: f.body, attachment: f.attachment, loungeId: f.loungeId, cigar: f.cigar,
      createdAt: minsAgo(f.minsAgo), reactions: f.reactions, commentCount: list.length,
    });
  }
  return { posts, comments };
}

interface StoryRecord {
  id: string;
  authorId: string; // member id or 'me'
  items: StoryItem[];
  seen: boolean;
}

const initialStories = (): StoryRecord[] =>
  MOCK_STORIES.map((s, i) => ({
    id: `st-${s.authorId}`,
    authorId: s.authorId,
    seen: i >= 5, // the last few are already seen, so both ring styles show
    items: s.items.map((it, j) => ({ id: `st-${s.authorId}-${j}`, type: it.type, src: it.src, caption: it.caption, createdAt: minsAgo(it.minsAgo) })),
  }));

function initialBlogs(): BlogPost[] {
  const elena = findMember('m2')!;
  return [
    {
      id: 'mb1', slug: 'building-a-tasting-flight-at-home', title: 'Building a Tasting Flight at Home', category: 'Guides',
      excerpt: 'Three cigars, one evening, and a notebook: how I run a simple side-by-side flight with friends.',
      body: [], author: authorOf(elena), cover: { src: '/media/whiskey-glass.webp' }, publishedAt: minsAgo(60 * 26).slice(0, 10), readMin: 4, hue: 20,
      blocks: [
        { type: 'p', text: 'A tasting flight is just a few cigars smoked side by side so the differences jump out. You do not need a lounge or a sommelier, just a quiet table and a little planning.' },
        { type: 'p', text: 'Pick three cigars that share one thing and differ in another. My favourite: the same blend in three wrappers (Connecticut, Habano, Maduro). Cut all three the same way and take notes after the first third of each.' },
        { type: 'img', src: '/media/cigar-brandy.webp', caption: 'Keep the pairing simple: one spirit for the whole flight.' },
        { type: 'p', text: 'Most importantly, compare notes at the end. The best flights end in an argument about which one won.' },
      ],
    },
  ];
}

function initialState() {
  const messages = new Map<string, Message[]>();
  for (const [memberId, thread] of Object.entries(MOCK_THREADS)) {
    messages.set(memberId, thread.map((t, i) => ({ id: `${memberId}-${i}`, conversationId: memberId, fromMe: t.fromMe, body: t.body, sentAt: minsAgo(t.minsAgo), status: 'read' as const })));
  }
  const feed = initialFeed();
  return {
    posts: feed.posts,
    comments: feed.comments,
    stories: initialStories(),
    blogs: initialBlogs(),
    passed: [] as string[],
    blocked: new Set<string>(),
    /** Threads with an unread incoming message until the member opens them. */
    unread: new Set(['m2']),
    /** Connection requests you received (member id -> when). */
    received: new Map<string, string>([['m1', minsAgo(20)], ['m8', minsAgo(60 * 3)], ['m3', minsAgo(60 * 26)], ['m13', minsAgo(60 * 50)]]),
    /** Connection requests you sent and that are still pending. */
    sent: new Map<string, string>([['m11', minsAgo(60 * 20)], ['m9', minsAgo(60 * 70)]]),
    declined: new Set<string>(),
    /** Connected members (member id -> connected at). Messaging is only allowed between them. */
    matches: new Map<string, string>([['m2', minsAgo(60 * 30)], ['m5', minsAgo(60 * 50)], ['m7', minsAgo(60 * 70)], ['m4', minsAgo(60 * 90)], ['m10', minsAgo(90)]]),
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

type State = ReturnType<typeof initialState>;
type Saved = {
  posts: Post[]; comments: [string, Comment[]][]; stories: StoryRecord[]; blogs: BlogPost[]; passed: string[]; blocked: string[];
  unread: string[]; received: [string, string][]; sent: [string, string][]; declined: string[]; matches: [string, string][];
  messages: [string, Message[]][]; pendingPhotos: PendingPhoto[]; reports: Report[];
};

function hydrate(): State {
  const base = initialState();
  const saved = storage.get<Saved>(STORAGE_KEYS.mock);
  if (!saved) return base;
  try {
    return {
      posts: saved.posts, comments: new Map(saved.comments), stories: saved.stories, blogs: saved.blogs, passed: saved.passed,
      blocked: new Set(saved.blocked), unread: new Set(saved.unread), received: new Map(saved.received), sent: new Map(saved.sent),
      declined: new Set(saved.declined), matches: new Map(saved.matches), messages: new Map(saved.messages),
      pendingPhotos: saved.pendingPhotos, reports: saved.reports,
    };
  } catch {
    return base; // saved state from an older version: start fresh
  }
}

const state = hydrate();

function persist() {
  const saved: Saved = {
    posts: state.posts, comments: [...state.comments], stories: state.stories, blogs: state.blogs, passed: state.passed,
    blocked: [...state.blocked], unread: [...state.unread], received: [...state.received], sent: [...state.sent],
    declined: [...state.declined], matches: [...state.matches], messages: [...state.messages],
    pendingPhotos: state.pendingPhotos, reports: state.reports,
  };
  storage.set(STORAGE_KEYS.mock, saved);
}

// ---------------------------------------------------------------- helpers

const visible = (m: Member) => !state.blocked.has(m.id);

function statusOf(id: string): ConnectionStatus {
  if (state.matches.has(id)) return 'connected';
  if (state.sent.has(id)) return 'sent';
  if (state.received.has(id)) return 'received';
  return 'none';
}

function card(me: MyProfile, m: Member): DiscoverCard {
  const { pct, shared } = scoreMatch(me, m);
  return { member: m, matchPct: pct, shared: shared.slice(0, 5) };
}

function sameArea(me: MyProfile, a: PostAuthor) {
  if (a.id === 'me') return true;
  if (me.city && a.city.toLowerCase() === me.city.toLowerCase()) return true;
  // Mock members store state codes (IL); the wizard stores names (Illinois).
  return !!me.state && (a.state === me.state || US_CODES[me.state] === a.state);
}
const US_CODES: Record<string, string> = { Illinois: 'IL', Wisconsin: 'WI', Florida: 'FL', 'New York': 'NY', Tennessee: 'TN', Texas: 'TX' };

const has = (hay: (string | undefined)[], needle: string) => hay.some((h) => h?.toLowerCase().includes(needle));
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const allBlogs = () => [...state.blogs, ...MOCK_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

function connectWith(id: string) {
  state.received.delete(id);
  state.sent.delete(id);
  state.matches.set(id, now());
}

function storyOut(s: StoryRecord): Story | null {
  const items = s.items.filter((i) => Date.now() - new Date(i.createdAt).getTime() < STORY_TTL_MS);
  if (!items.length) return null;
  const member = s.authorId === 'me' ? null : findMember(s.authorId);
  if (s.authorId !== 'me' && (!member || !visible(member))) return null;
  return { id: s.id, author: member ? authorOf(member) : myAuthor(), items, seen: s.seen };
}

// ---------------------------------------------------------------- provider

export const mockProvider: DataProvider = {
  async getMe() {
    await wait(120);
    return loadMe();
  },
  async saveMe(patch) {
    const next = { ...loadMe(), ...patch };
    storage.set(STORAGE_KEYS.me, next);
    return next;
  },

  async getDiscover(f) {
    await wait(450);
    const me = loadMe();
    return MOCK_MEMBERS.filter(
      (m) =>
        visible(m) &&
        !state.sent.has(m.id) &&
        !state.matches.has(m.id) &&
        !state.declined.has(m.id) &&
        !state.passed.includes(m.id) &&
        (f.maxDistance >= 100 || m.distanceMi <= f.maxDistance) &&
        m.age >= f.ageMin &&
        m.age <= f.ageMax &&
        (!f.userTypes.length || f.userTypes.includes(m.userType)) &&
        (!f.meetup.length || f.meetup.some((x) => m.meetup.includes(x))) &&
        (!f.mentorship.length || f.mentorship.includes(m.mentorship)),
    )
      .map((m) => card(me, m))
      // people who already asked to connect come first
      .sort((a, b) => Number(state.received.has(b.member.id)) - Number(state.received.has(a.member.id)) || b.matchPct - a.matchPct);
  },
  async getMemberCard(id) {
    await wait(200);
    const m = findMember(id);
    return m && visible(m) ? card(loadMe(), m) : null;
  },
  async pass(id) {
    state.passed.push(id);
    persist();
  },
  async undoPass(id) {
    state.passed = state.passed.filter((x) => x !== id);
    persist();
  },
  async getMentors(segment, topic) {
    await wait(350);
    const me = loadMe();
    const wanted = segment === 'find' ? ['guide', 'both'] : ['seeking', 'both'];
    return MOCK_MEMBERS.filter((m) => visible(m) && wanted.includes(m.mentorship) && (!topic || m.mentorTopics.includes(topic))).map((m) => card(me, m));
  },

  async connect(id) {
    const member = findMember(id)!;
    if (state.matches.has(id)) return { connected: true, member };
    if (state.received.has(id)) {
      connectWith(id);
      persist();
      return { connected: true, member };
    }
    state.sent.set(id, now());
    state.declined.delete(id);
    persist();
    return { connected: false, member };
  },
  async acceptConnection(id) {
    connectWith(id);
    persist();
    return { member: findMember(id)! };
  },
  async declineConnection(id) {
    state.received.delete(id);
    state.declined.add(id);
    persist();
  },
  async withdrawConnection(id) {
    state.sent.delete(id);
    persist();
  },
  async getConnections() {
    await wait(200);
    const list = (m: Map<string, string>) =>
      [...m]
        .map(([id, at]) => ({ member: findMember(id)!, at }))
        .filter((r) => r.member && visible(r.member))
        .sort((a, b) => b.at.localeCompare(a.at));
    return { received: list(state.received), sent: list(state.sent), connected: await mockProvider.getMatches() };
  },
  async getConnectionStatus(id) {
    return statusOf(id);
  },
  async getMatches() {
    await wait(200);
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
        return { id, member: findMember(id)!, lastMessage: last.body, lastAt: last.sentAt, unread: state.unread.has(id) && !last.fromMe ? 1 : 0 };
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
    // Rule: only connected members can message (Phase 5 enforces this in RLS).
    if (!state.matches.has(id)) throw new Error('You can only message your connections.');
    const msg: Message = { id: crypto.randomUUID(), conversationId: id, fromMe: true, body, sentAt: now(), status: 'delivered' };
    state.messages.set(id, [...(state.messages.get(id) ?? []), msg]);
    persist();
    return msg;
  },

  async block(id) {
    state.blocked.add(id);
    state.matches.delete(id);
    state.sent.delete(id);
    state.received.delete(id);
    persist();
  },
  async report(id, reason) {
    state.reports.unshift({ id: crypto.randomUUID(), reported: findMember(id)!, reason, createdAt: now(), status: 'open' });
    persist();
  },

  async getLounges({ q, state: st, venueType }) {
    await wait(250);
    const needle = q?.trim().toLowerCase();
    return MOCK_LOUNGES.filter(
      (l) => (!needle || has([l.name, l.city, l.state, l.street, l.venueType], needle)) && (!st || l.state === st) && (!venueType || l.venueType === venueType),
    );
  },
  async getSessions() {
    await wait(250);
    return MOCK_SESSIONS;
  },
  async getSession(id) {
    return MOCK_SESSIONS.find((s) => s.id === id) ?? null;
  },

  async getPosts() {
    await wait(250);
    return allBlogs();
  },
  async getPost(slug) {
    return allBlogs().find((p) => p.slug === slug) ?? null;
  },
  async createBlog(input) {
    const title = input.title.trim();
    if (!title) throw new Error('Add a title.');
    const text = input.blocks.filter((b) => b.type === 'p').map((b) => (b as { text: string }).text.trim()).filter(Boolean);
    if (!text.length) throw new Error('Write at least one paragraph.');
    const words = text.join(' ').split(/\s+/).length;
    const id = crypto.randomUUID();
    const blog: BlogPost = {
      id, slug: `${slugify(title)}-${id.slice(0, 6)}`, title, category: input.category, excerpt: text[0].slice(0, 160), body: [],
      blocks: input.blocks.filter((b) => (b.type === 'p' ? b.text.trim() : b.src || b.mediaId)),
      cover: input.cover, author: myAuthor(), publishedAt: now().slice(0, 10), readMin: Math.max(1, Math.round(words / 200)), hue: 24,
    };
    state.blogs = [blog, ...state.blogs];
    persist();
    return blog;
  },
  async deleteBlog(id) {
    const blog = state.blogs.find((b) => b.id === id && b.author?.id === 'me');
    if (!blog) return;
    state.blogs = state.blogs.filter((b) => b !== blog);
    persist();
    const ids = [blog.cover?.mediaId, ...(blog.blocks ?? []).map((b) => (b.type === 'img' ? b.mediaId : undefined))].filter(Boolean) as string[];
    ids.forEach((m) => deleteMedia(m).catch(() => {}));
  },
  async getMemberBlogs(memberId) {
    return allBlogs().filter((b) => b.author?.id === memberId);
  },

  async getFeed(filter) {
    await wait(350);
    const me = loadMe();
    return state.posts
      .filter((p) => !state.blocked.has(p.author.id))
      .filter((p) =>
        filter === 'near' ? sameArea(me, p.author)
        : filter === 'checkin' ? p.kind === 'checkin'
        : filter === 'question' ? p.kind === 'question'
        : filter === 'saved' ? !!p.savedByMe
        : true,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getFeedPost(id) {
    const p = state.posts.find((x) => x.id === id);
    return p && !state.blocked.has(p.author.id) ? p : null;
  },
  async getMemberPosts(memberId) {
    return state.posts.filter((p) => p.author.id === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createPost(input) {
    const body = input.body.trim();
    if (!body && !input.attachment) throw new Error('Write something or add a photo, video or song.');
    if (body.length > POST_MAX) throw new Error(`Posts can be up to ${POST_MAX} characters.`);
    const post: Post = {
      id: crypto.randomUUID(), author: myAuthor(), kind: input.kind, body, attachment: input.attachment, loungeId: input.loungeId,
      cigar: input.cigar?.trim() || undefined, createdAt: now(), reactions: {}, commentCount: 0,
    };
    state.posts = [post, ...state.posts];
    persist();
    return post;
  },
  async deletePost(id) {
    const post = state.posts.find((p) => p.id === id && p.author.id === 'me');
    if (!post) return;
    state.posts = state.posts.filter((p) => p !== post);
    state.comments.delete(id);
    persist();
    if (post.attachment?.mediaId) deleteMedia(post.attachment.mediaId).catch(() => {});
  },
  async reactToPost(id, reaction) {
    state.posts = state.posts.map((p) => {
      if (p.id !== id) return p;
      const r = { ...p.reactions };
      if (p.myReaction) r[p.myReaction] = Math.max(0, (r[p.myReaction] ?? 1) - 1);
      if (reaction) r[reaction] = (r[reaction] ?? 0) + 1;
      return { ...p, reactions: r, myReaction: reaction ?? undefined };
    });
    persist();
    return state.posts.find((p) => p.id === id)!;
  },
  async togglePostSave(id) {
    state.posts = state.posts.map((p) => (p.id === id ? { ...p, savedByMe: !p.savedByMe } : p));
    persist();
    return state.posts.find((p) => p.id === id)!;
  },
  async updatePost(id, body) {
    const text = body.trim();
    const post = state.posts.find((p) => p.id === id && p.author.id === 'me');
    if (!post) throw new Error('You can only edit your own posts.');
    if (!text && !post.attachment) throw new Error('A post needs text or media.');
    if (text.length > POST_MAX) throw new Error(`Posts can be up to ${POST_MAX} characters.`);
    state.posts = state.posts.map((p) => (p === post ? { ...p, body: text, editedAt: now() } : p));
    persist();
    return state.posts.find((p) => p.id === id)!;
  },
  async getComments(postId) {
    await wait(200);
    return (state.comments.get(postId) ?? []).filter((c) => !state.blocked.has(c.author.id));
  },
  async addComment(postId, body, parentId) {
    const text = body.trim();
    if (!text) throw new Error('Comment is empty.');
    if (text.length > COMMENT_MAX) throw new Error(`Comments can be up to ${COMMENT_MAX} characters.`);
    const c: Comment = { id: crypto.randomUUID(), postId, parentId, author: myAuthor(), body: text, createdAt: now(), likes: 0, likedByMe: false };
    state.comments.set(postId, [...(state.comments.get(postId) ?? []), c]);
    state.posts = state.posts.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
    persist();
    return c;
  },
  async toggleCommentLike(postId, commentId) {
    const list = (state.comments.get(postId) ?? []).map((c) => (c.id === commentId ? { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) } : c));
    state.comments.set(postId, list);
    persist();
    return list.find((c) => c.id === commentId)!;
  },

  async getStories() {
    const out = state.stories.map(storyOut).filter((s): s is Story => !!s);
    const mine = out.filter((s) => s.author.id === 'me');
    const others = out.filter((s) => s.author.id !== 'me').sort((a, b) => Number(a.seen) - Number(b.seen));
    return [...mine, ...others];
  },
  async addStory(item) {
    const entry: StoryItem = { ...item, id: crypto.randomUUID(), createdAt: now() };
    let mine = state.stories.find((s) => s.authorId === 'me');
    if (!mine) {
      mine = { id: 'st-me', authorId: 'me', items: [], seen: true };
      state.stories = [mine, ...state.stories];
    }
    mine.items = [...mine.items, entry];
    persist();
    return storyOut(mine)!;
  },
  async markStorySeen(storyId) {
    const s = state.stories.find((x) => x.id === storyId);
    if (s && !s.seen) {
      s.seen = true;
      persist();
    }
  },

  async search(q) {
    const n = q.trim().toLowerCase();
    if (!n) return { members: [], lounges: [], posts: [], blogs: [], sessions: [] };
    const me = loadMe();
    return {
      members: MOCK_MEMBERS.filter(
        (m) => visible(m) && has([m.name, m.city, m.state, userTypeLabel(m.userType), ...((m.preferences.brands as string[]) ?? []), ...(m.about.industry ?? [])], n),
      ).map((m) => card(me, m)),
      lounges: MOCK_LOUNGES.filter((l) => has([l.name, l.city, l.state, l.venueType, l.metroArea], n)),
      posts: state.posts.filter((p) => !state.blocked.has(p.author.id) && has([p.body, p.author.name, p.cigar], n)),
      blogs: allBlogs().filter((b) => has([b.title, b.excerpt, b.category, b.author?.name], n)),
      sessions: MOCK_SESSIONS.filter((s) => has([s.title, s.description, s.host, s.category], n)),
    };
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
      state.pendingPhotos = state.pendingPhotos.filter((p) => p.id !== id);
      persist();
    },
    async getReports() {
      await wait(250);
      return state.reports;
    },
    async actOnReport(id, action) {
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

export type { ReactionType };
