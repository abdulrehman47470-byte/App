// Fictional feed posts for the mock backend. Images are generated art (imageHue), never stock photos.
import type { PostKind } from '@/types';

export interface MockPost {
  id: string;
  authorId: string;
  kind: PostKind;
  body: string;
  imageHue?: number;
  loungeId?: string;
  cigar?: string;
  minsAgo: number;
  likes: number;
  comments: { authorId: string; body: string; minsAgo: number }[];
}

export const MOCK_FEED: MockPost[] = [
  {
    id: 'f1', authorId: 'm2', kind: 'checkin', loungeId: 'l1', cigar: 'Liga Privada T52', minsAgo: 35, likes: 24, imageHue: 14,
    body: 'Monthly tasting night is on. Six of us, a flight of three maduros and a very patient bartender. New faces always welcome next month.',
    comments: [
      { authorId: 'm7', body: 'Save me a seat next time!', minsAgo: 30 },
      { authorId: 'm5', body: 'Which one won the flight?', minsAgo: 22 },
    ],
  },
  {
    id: 'f2', authorId: 'm3', kind: 'question', minsAgo: 95, likes: 11,
    body: 'Beginner question: punch or guillotine for a robusto? My first two cigars both unravelled a little at the cap.',
    comments: [
      { authorId: 'm4', body: 'Guillotine, and only take off the very top of the cap: 1–2 mm. A sharp double blade makes all the difference.', minsAgo: 80 },
      { authorId: 'm10', body: 'Agree with Victor. Also let them rest a week if they came from a dry shop.', minsAgo: 70 },
    ],
  },
  {
    id: 'f3', authorId: 'm13', kind: 'smoking', cigar: 'Tatuaje Havana VI', minsAgo: 180, likes: 38, imageHue: 30,
    body: 'Porch, Broadleaf, a pour of barrel-proof bourbon and a thunderstorm rolling in. Tuesday done right.',
    comments: [{ authorId: 'm6', body: 'That pairing is dangerous in the best way.', minsAgo: 150 }],
  },
  {
    id: 'f4', authorId: 'm11', kind: 'checkin', loungeId: 'l7', minsAgo: 60 * 5, likes: 19,
    body: 'Dominoes table is open at The Maduro Social tonight. Any Daily Stogie members in Miami, come say hi.',
    comments: [],
  },
  {
    id: 'f5', authorId: 'm12', kind: 'update', minsAgo: 60 * 9, likes: 42, imageHue: 8,
    body: 'Finally finished my cedar-lined travel case. Holds five lanceros and survives a subway commute. Happy to share the build notes.',
    comments: [
      { authorId: 'm10', body: 'Beautiful work. Please post the notes!', minsAgo: 60 * 8 },
      { authorId: 'm9', body: 'Would buy one of these. Just saying.', minsAgo: 60 * 7 },
    ],
  },
  {
    id: 'f6', authorId: 'm14', kind: 'question', minsAgo: 60 * 20, likes: 7,
    body: 'Visiting Chicago in November. Which lounges should be on my list for a quiet evening?',
    comments: [{ authorId: 'm1', body: 'The Ember Room, no contest. Ask for a seat by the window.', minsAgo: 60 * 19 }],
  },
  {
    id: 'f7', authorId: 'm4', kind: 'update', minsAgo: 60 * 30, likes: 55, imageHue: 20,
    body: 'Opened a box I put away in 2019. The wrapper has gone oily and the pepper has mellowed into baking spice. Patience pays.',
    comments: [],
  },
  {
    id: 'f8', authorId: 'm15', kind: 'smoking', cigar: 'Macanudo Café Hampton Court', minsAgo: 60 * 44, likes: 16,
    body: 'Third cigar ever and the first one I finished without it going out. Small wins!',
    comments: [
      { authorId: 'm2', body: 'That is the milestone. Welcome to the club!', minsAgo: 60 * 43 },
      { authorId: 'm8', body: 'Same boat as you, we should compare notes.', minsAgo: 60 * 40 },
    ],
  },
];
