// Demo feed: posts, comments and stories. Names and text are invented; media is royalty-free
// (see docs/media-credits.md). Comments with `replyTo` are replies to the comment at that index.
import type { MediaAsset, PostKind, ReactionType } from '@/types';

export interface MockComment {
  authorId: string;
  body: string;
  minsAgo: number;
  likes?: number;
  replyTo?: number;
}

export interface MockPost {
  id: string;
  authorId: string;
  kind: PostKind;
  body: string;
  attachment?: MediaAsset;
  loungeId?: string;
  cigar?: string;
  minsAgo: number;
  reactions: Partial<Record<ReactionType, number>>;
  comments: MockComment[];
}

const JAZZ_CREDIT = '“smooth jazz 02” by Jose Gil · CC BY 3.0';
const LOUNGE_CREDIT = '“Lounge” by CyberSDF · CC BY 3.0';

export const MOCK_FEED: MockPost[] = [
  {
    id: 'f1', authorId: 'm2', kind: 'checkin', loungeId: 'l1', cigar: 'Liga Privada T52', minsAgo: 35,
    attachment: { type: 'image', src: '/media/cigar-brandy.webp' },
    body: 'Monthly tasting night is on. Six of us, a flight of three maduros and a very patient bartender. New faces always welcome next month.',
    reactions: { like: 18, love: 9, fire: 5, wow: 1 },
    comments: [
      { authorId: 'm7', body: 'Save me a seat next time!', minsAgo: 30, likes: 3 },
      { authorId: 'm2', body: 'Always. Second Thursday, 8 pm. Bring your favourite maduro.', minsAgo: 26, likes: 2, replyTo: 0 },
      { authorId: 'm5', body: 'Which one won the flight?', minsAgo: 22, likes: 1 },
    ],
  },
  {
    id: 'f2', authorId: 'm7', kind: 'smoking', cigar: 'Nicaraguan Habano toro', minsAgo: 95,
    attachment: { type: 'video', src: '/media/lounge-table.mp4', poster: '/media/lounge-table-poster.webp' },
    body: 'Sunday ritual: a cold pour, a long toro and absolutely nowhere to be. How is everyone spending the afternoon?',
    reactions: { fire: 14, like: 21, love: 6, haha: 1 },
    comments: [
      { authorId: 'm6', body: 'Same plan, but on the golf course.', minsAgo: 80, likes: 4 },
      { authorId: 'm11', body: 'That burn line is perfect.', minsAgo: 64, likes: 2 },
    ],
  },
  {
    id: 'f3', authorId: 'm5', kind: 'update', minsAgo: 160,
    attachment: { type: 'audio', src: '/media/smooth-jazz.mp3', poster: '/media/jazz-stage-sm.webp', title: 'smooth jazz 02', artist: 'Jose Gil', credit: JAZZ_CREDIT },
    body: 'Tonight’s lounge soundtrack. Slow saxophone, a medium-bodied Corojo and good company. What do you put on when you light up?',
    reactions: { love: 15, like: 9, wow: 2 },
    comments: [
      { authorId: 'm13', body: 'Delta blues, every time.', minsAgo: 140, likes: 5 },
      { authorId: 'm5', body: 'Respect. Send me a playlist?', minsAgo: 133, likes: 1, replyTo: 0 },
      { authorId: 'm12', body: 'Bill Evans and a lancero. Unbeatable.', minsAgo: 120, likes: 3 },
    ],
  },
  {
    id: 'f4', authorId: 'm3', kind: 'question', minsAgo: 60 * 4,
    body: 'Beginner question: punch or guillotine for a robusto? My first two cigars both unravelled a little at the cap.',
    reactions: { like: 11, haha: 0, wow: 0, love: 2 },
    comments: [
      { authorId: 'm4', body: 'Guillotine, and only take off the very top of the cap: 1–2 mm. A sharp double blade makes all the difference.', minsAgo: 60 * 3.6, likes: 9 },
      { authorId: 'm3', body: 'That’s exactly where I was going wrong. Thank you!', minsAgo: 60 * 3.4, likes: 2, replyTo: 0 },
      { authorId: 'm10', body: 'Also let them rest a week if they came from a dry shop.', minsAgo: 60 * 3, likes: 4 },
    ],
  },
  {
    id: 'f5', authorId: 'm13', kind: 'smoking', cigar: 'Pennsylvania Broadleaf maduro', minsAgo: 60 * 7,
    attachment: { type: 'image', src: '/media/patio.webp' },
    body: 'Porch, Broadleaf, a pour of barrel-proof bourbon and a thunderstorm rolling in. Tuesday done right.',
    reactions: { fire: 22, like: 30, love: 8 },
    comments: [{ authorId: 'm6', body: 'That pairing is dangerous in the best way.', minsAgo: 60 * 6, likes: 3 }],
  },
  {
    id: 'f6', authorId: 'm11', kind: 'checkin', loungeId: 'l7', minsAgo: 60 * 11,
    attachment: { type: 'image', src: '/media/espresso.webp' },
    body: 'Café cubano and a Corojo at The Maduro Social. Dominoes table is open tonight. Any Daily Stogie members in Miami, come say hi.',
    reactions: { like: 19, love: 4 },
    comments: [],
  },
  {
    id: 'f7', authorId: 'm12', kind: 'update', minsAgo: 60 * 20,
    attachment: { type: 'audio', src: '/media/lounge.mp3', poster: '/media/cozy-lounge-sm.webp', title: 'Lounge', artist: 'CyberSDF', credit: LOUNGE_CREDIT },
    body: 'Rainy Sunday, reading chair, Connecticut-wrapped lonsdale. This track has been on repeat all afternoon.',
    reactions: { love: 12, like: 7 },
    comments: [{ authorId: 'm8', body: 'This is the vibe I want for my first humidor tasting.', minsAgo: 60 * 18, likes: 2 }],
  },
  {
    id: 'f8', authorId: 'm4', kind: 'update', minsAgo: 60 * 30,
    attachment: { type: 'image', src: '/media/cigar-box.webp' },
    body: 'Opened a box I put away in 2019. The wrapper has gone oily and the pepper has mellowed into baking spice. Patience pays.',
    reactions: { wow: 9, like: 33, fire: 6, love: 7 },
    comments: [{ authorId: 'm9', body: 'Five years of discipline. Respect.', minsAgo: 60 * 28, likes: 6 }],
  },
  {
    id: 'f9', authorId: 'm14', kind: 'question', minsAgo: 60 * 44,
    body: 'Visiting Chicago in November. Which lounges should be on my list for a quiet evening?',
    reactions: { like: 6 },
    comments: [
      { authorId: 'm1', body: 'The Ember Room, no contest. Ask for a seat by the window.', minsAgo: 60 * 43, likes: 4 },
      { authorId: 'm14', body: 'Noted. Cheers, Marcus!', minsAgo: 60 * 42, likes: 1, replyTo: 0 },
    ],
  },
];

export interface MockStory {
  authorId: string;
  items: { type: 'image' | 'video'; src: string; minsAgo: number; caption?: string }[];
}

export const MOCK_STORIES: MockStory[] = [
  { authorId: 'm2', items: [
    { type: 'image', src: '/media/cigar-brandy.webp', minsAgo: 50, caption: 'Tasting night setup 🥃' },
    { type: 'video', src: '/media/smoke.mp4', minsAgo: 45 },
  ] },
  { authorId: 'm7', items: [{ type: 'video', src: '/media/barbershop.mp4', minsAgo: 120, caption: 'Fresh cut, fresh cigar 😄' }] },
  { authorId: 'm5', items: [
    { type: 'image', src: '/media/jazz-stage.webp', minsAgo: 200, caption: 'Live jazz tonight' },
    { type: 'image', src: '/media/espresso.webp', minsAgo: 180 },
  ] },
  { authorId: 'm13', items: [
    { type: 'image', src: '/media/campfire.webp', minsAgo: 300, caption: 'Fire pit season' },
    { type: 'image', src: '/media/bourbon-pour.webp', minsAgo: 290 },
  ] },
  { authorId: 'm12', items: [{ type: 'video', src: '/media/bookstore.mp4', minsAgo: 400, caption: 'Found a new reading spot' }] },
  { authorId: 'm11', items: [{ type: 'image', src: '/media/whiskey-barrel.webp', minsAgo: 520 }] },
  { authorId: 'm6', items: [
    { type: 'image', src: '/media/golf-course.webp', minsAgo: 640, caption: 'Back nine, robusto in hand' },
    { type: 'image', src: '/media/golf-clubs.webp', minsAgo: 630 },
  ] },
];
