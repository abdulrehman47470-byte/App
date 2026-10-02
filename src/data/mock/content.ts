// Mock lounges, sessions, blog posts and conversations. All names, addresses and phone
// numbers are fictional (555 numbers). Phase 7 replaces lounges with the 515 rows from
// US Cigar Lounges.xlsx.
import type { BlogPost, Lounge, SessionVideo } from '@/types';

export const MOCK_LOUNGES: Lounge[] = [
  { id: 'l1', name: 'The Ember Room', venueType: 'Cigar Lounge', street: '1720 N Harbor Ave', city: 'Chicago', state: 'IL', phone: '(312) 555-0111', metroArea: 'Chicago', lat: 41.913, lng: -87.648 },
  { id: 'l2', name: 'Bottled Leaf', venueType: 'Whiskey & Cigar Lounge', street: '414 N Clark St', city: 'Chicago', state: 'IL', phone: '(312) 555-0168', metroArea: 'Chicago', lat: 41.89, lng: -87.631 },
  { id: 'l3', name: 'Cedar & Ash', venueType: 'Lounge & Bar', street: '66 W Maple St', city: 'Chicago', state: 'IL', phone: '(312) 555-0144', metroArea: 'Chicago', lat: 41.902, lng: -87.63, verificationNote: 'Phone number not confirmed' },
  { id: 'l4', name: 'The Humidor Club', venueType: 'Members-Only Club', street: '215 Lake St', city: 'Oak Park', state: 'IL', phone: '(708) 555-0192', metroArea: 'Chicago', lat: 41.888, lng: -87.79 },
  { id: 'l5', name: 'Smoke & Oak', venueType: 'Retail Shop With Lounge', street: '903 Davis St', city: 'Evanston', state: 'IL', phone: '(847) 555-0127', metroArea: 'Chicago', lat: 42.047, lng: -87.681 },
  { id: 'l6', name: 'Harbor Leaf Lounge', venueType: 'Cigar Lounge', street: '120 E Ocean Dr', city: 'Miami', state: 'FL', phone: '(305) 555-0183', metroArea: 'Miami', lat: 25.774, lng: -80.19 },
  { id: 'l7', name: 'The Maduro Social', venueType: 'Social Cigar Club', street: '48 Calle Ocho', city: 'Miami', state: 'FL', phone: '(305) 555-0105', metroArea: 'Miami', lat: 25.765, lng: -80.219, verificationNote: 'Hours vary seasonally' },
  { id: 'l8', name: 'Copper Band', venueType: 'Speakeasy / Cocktail Lounge', street: '310 Broadway', city: 'Nashville', state: 'TN', phone: '(615) 555-0150', metroArea: 'Nashville', lat: 36.161, lng: -86.777 },
  { id: 'l9', name: 'Longfiller Lounge', venueType: 'Hotel / Resort Lounge', street: '2 Riverwalk Plaza', city: 'San Antonio', state: 'TX', phone: '(210) 555-0133', metroArea: 'San Antonio', lat: 29.424, lng: -98.489 },
  { id: 'l10', name: 'The Wrapper Room', venueType: 'Upscale / Luxury Lounge', street: '77 W 44th St', city: 'New York', state: 'NY', phone: '(212) 555-0171', metroArea: 'New York', lat: 40.756, lng: -73.982 },
];

export const MOCK_SESSIONS: SessionVideo[] = [
  { id: 's1', title: 'Cutting & Lighting, the Right Way', description: 'Guillotine, punch or V-cut: when to use each, and how to toast the foot for an even burn. A five-minute habit that fixes most first-cigar problems.', vimeoId: 'TODO', durationMin: 9, hue: 30, category: 'Basics', host: 'Victor H.', thumb: '/media/cigar-box.webp', src: '/media/smoke.mp4', level: 'Beginner' },
  { id: 's2', title: 'Reading a Wrapper', description: 'Connecticut to Oscuro: what wrapper colour tells you about flavour, and what it does not. With side-by-side tasting notes.', vimeoId: 'TODO', durationMin: 14, hue: 18, category: 'Tasting', host: 'Elena R.', thumb: '/media/cigar-brandy.webp', src: '/media/lounge-table.mp4', level: 'All levels' },
  { id: 's3', title: 'Humidor Basics', description: 'Seasoning a new humidor, two-way humidity packs, and where to put the hygrometer so your collection stays happy year-round.', vimeoId: 'TODO', durationMin: 12, hue: 36, category: 'Care', host: 'Grace L.', thumb: '/media/cozy-lounge.webp', src: '/media/bookstore.mp4', level: 'Beginner' },
  { id: 's4', title: 'Pairing with Bourbon', description: 'Complementary vs contrasting pairings, with three easy starting points and the one pairing mistake almost everyone makes.', vimeoId: 'TODO', durationMin: 11, hue: 24, category: 'Pairing', host: 'Beau T.', thumb: '/media/bourbon-pour.webp', src: '/media/lounge-table.mp4', level: 'All levels' },
  { id: 's5', title: 'Resting and Aging', description: 'Fresh from the shop, rested for weeks, or aged for years: what really changes, and how to run your own side-by-side test.', vimeoId: 'TODO', durationMin: 16, hue: 14, category: 'Care', host: 'Victor H.', thumb: '/media/whiskey-glass.webp', src: '/media/smoke.mp4', level: 'Advanced' },
  { id: 's6', title: 'Lounge Etiquette', description: 'Ashtrays, sharing tables and bringing your own cigars: the unwritten rules that make every lounge visit a good one.', vimeoId: 'TODO', durationMin: 7, hue: 40, category: 'Culture', host: 'Rafael M.', thumb: '/media/bar-shelf.webp', src: '/media/barbershop.mp4', level: 'All levels' },
];

// TODO(content): placeholder articles for layout only; the client/admin will publish real ones.
export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'b1', cover: { src: '/media/cigar-box.webp' }, slug: 'best-cigars-for-beginners', title: 'Starting Out: Mild Cigars Worth Your First Evening', category: 'Guides',
    excerpt: 'A gentle introduction to wrappers, sizes and strengths for your first few smokes.', publishedAt: '2026-09-12', readMin: 6, hue: 32,
    body: [
      'Your first cigar should be something you can enjoy slowly, without rushing or fighting it. Look for a mild to mild-medium strength and a medium ring gauge.',
      'Connecticut Shade wrappers are a classic starting point: smooth, creamy and forgiving. A robusto or corona will give you a full experience in under an hour.',
      'Take your time. Puff about once a minute, never inhale, and let the cigar rest between draws. If it goes out, that is fine: re-light it gently.',
    ],
  },
  {
    id: 'b2', cover: { src: '/media/cozy-lounge.webp' }, slug: 'how-to-store-cigars', title: 'How to Store Cigars Properly', category: 'Guides',
    excerpt: 'Humidity, temperature and the simple setup that keeps your collection happy.', publishedAt: '2026-08-28', readMin: 8, hue: 22,
    body: [
      'Cigars like stable conditions. Most smokers aim for roughly 65 to 70 percent relative humidity and a room temperature that does not swing.',
      'A tupperdor with two-way humidity packs is inexpensive and reliable. A desktop humidor looks great but needs seasoning before first use.',
      'Whatever you choose, a calibrated hygrometer is the one accessory worth buying on day one.',
    ],
  },
  {
    id: 'b3', cover: { src: '/media/bar-shelf.webp' }, slug: 'what-makes-a-great-lounge', title: 'What Makes a Great Cigar Lounge', category: 'Culture',
    excerpt: 'Ventilation, seating, staff and the regulars: the ingredients of a room worth returning to.', publishedAt: '2026-08-14', readMin: 5, hue: 12,
    body: [
      'The best lounges feel like someone’s well-kept living room. Good ventilation matters more than decor: you should be able to taste your own cigar.',
      'Knowledgeable staff and a well-kept walk-in humidor come next. Then the people: a great lounge has regulars who make newcomers feel welcome.',
    ],
  },
  {
    id: 'b4', cover: { src: '/media/cigar-brandy.webp' }, slug: 'maduro-myths', title: 'Maduro Myths, Explained', category: 'Reviews',
    excerpt: 'Darker does not always mean stronger. Here is what a maduro wrapper really brings.', publishedAt: '2026-07-30', readMin: 4, hue: 8,
    body: [
      'A maduro wrapper gets its colour from extended fermentation and sun exposure, which tends to bring sweetness: cocoa, coffee, molasses.',
      'Strength mostly comes from the filler, not the wrapper. Plenty of maduros are medium-bodied and smooth.',
    ],
  },
];

export const MOCK_THREADS: Record<string, { fromMe: boolean; body: string; minsAgo: number }[]> = {
  m2: [
    { fromMe: false, body: 'Hi! Saw you are into Liga Privada too. Have you tried the T52?', minsAgo: 240 },
    { fromMe: true, body: 'Not yet, it is on my wishlist. Any pairing you would suggest?', minsAgo: 230 },
    { fromMe: false, body: 'Cognac, no question. I host a small tasting at The Ember Room next Thursday if you want to join.', minsAgo: 12 },
  ],
  m5: [
    { fromMe: false, body: 'That Lancero you mentioned sounds great. Where did you find it?', minsAgo: 180 },
    { fromMe: true, body: 'Smoke & Oak in Evanston had a few boxes last week.', minsAgo: 175 },
  ],
  m7: [{ fromMe: false, body: 'You around this weekend? A few of us are meeting at Bottled Leaf.', minsAgo: 60 * 26 }],
  m4: [{ fromMe: true, body: 'Thanks for the humidor tips, the cedar trick worked.', minsAgo: 60 * 50 }],
};

export const MOCK_REPORT_REASONS = ['Inappropriate photo', 'Harassment', 'Fake profile', 'Spam or solicitation', 'Underage', 'Other'];
