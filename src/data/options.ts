// Client option lists for the profile wizard.
// Source for Phase 0: the build prompt (which summarises Profile Page 2.docx).
// TODO(requirements): once /docs is populated, diff every list here against the .docx files
// and the client's latest notes via `npm run verify:requirements` (Phase 1). In Phase 1 these
// move into Supabase lookup tables; this file then becomes the seed source + fallback.
// Single vs multi select is a best reading of the prompt; confirm against the doc.

import type { Mentorship } from '@/types';

// Kept in a tiny module so badges do not pull this whole file into the first download.
export { USER_TYPES, userTypeLabel } from './user-types';

// ---- Profile #1: Demographics ----
// TODO(needs-client): gender, pronoun, ethnicity and country lists were not provided
// ("Complete list", "Country scroller"). These are PLACEHOLDER seeds until the client supplies them.
export const GENDERS_PLACEHOLDER = ['Man', 'Woman', 'Non-binary', 'Other', 'Prefer not to say'];
export const PRONOUNS = ['he/him', 'she/her', 'they/them', 'other', 'prefer not to say'];
export const ETHNICITIES_PLACEHOLDER = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Middle Eastern or North African',
  'Native Hawaiian or Pacific Islander',
  'White',
  'Multiracial',
  'Other',
  'Prefer not to say',
];
export const COUNTRIES_PLACEHOLDER = [
  'United States',
  'Canada',
  'Mexico',
  'Dominican Republic',
  'Nicaragua',
  'Honduras',
  'United Kingdom',
  'Germany',
  'Spain',
  'Australia',
];
export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];
export const CA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
  'Northwest Territories', 'Nunavut', 'Yukon',
];
/** States/regions per country. Countries without a list fall back to a free-text field. */
export const STATES_BY_COUNTRY: Record<string, string[]> = {
  'United States': US_STATES,
  Canada: CA_PROVINCES,
};

export const BIO_MAX = 500; // Phase 1: read from app_config

// ---- Profile #2: Stogie Preferences ----
export type OptionKind = 'single' | 'multi';
export interface OptionGroup {
  id: string;
  label: string;
  kind: OptionKind;
  options?: string[];
  grouped?: { label: string; options: string[] }[];
  searchable?: boolean;
}
export interface PreferenceSection {
  id: string;
  title: string;
  groups: OptionGroup[];
  /** extra non-chip controls rendered by the wizard */
  special?: 'price' | 'strengthScale' | 'wishlist';
}

export const MEETUP = ['Open to Local Meetups', 'Open to Cigar Events', 'Open to Traveling for Events', 'Friends/Established Groups Only', 'Online Only', 'Prefer Not To Meet'];
export const MENTOR_TOPICS = ['Cigar Basics', 'Cutting & Lighting', 'Tasting', 'Pairing', 'Humidor Management', 'Aging'];

export const PREFERENCE_SECTIONS: PreferenceSection[] = [
  {
    id: 'lounge',
    title: 'Lounge Type & Atmosphere',
    groups: [
      {
        id: 'loungeType', label: 'Lounge type', kind: 'multi',
        options: ['Traditional Cigar Lounge', 'Upscale/Luxury Lounge', 'Cigar Bar', 'Members-Only Club', 'Social Cigar Club', 'Whiskey/Cigar Lounge', 'Outdoor Cigar Patio', 'Private Humidor Club', 'Hotel/Resort Lounge', 'Retail Shop With Lounge', 'Speakeasy/Cocktail Lounge', 'No Preference'],
      },
      {
        id: 'atmosphere', label: 'Atmosphere', kind: 'multi',
        options: ['Quiet', 'Relaxed', 'Social', 'Sophisticated', 'Lively', 'Upscale', 'Casual', 'Music-Friendly', 'Sports-Friendly'],
      },
    ],
  },
  {
    id: 'frequency',
    title: 'Frequency',
    groups: [
      { id: 'frequency', label: 'How often do you smoke?', kind: 'single', options: ['Daily', 'Several times a week', 'Weekly', 'A few times a month', 'Occasionally', 'Rarely'] },
    ],
  },
  {
    id: 'brands',
    title: 'Favorite Brands',
    groups: [
      {
        // TODO(requirements): full ~130-brand list lives in Profile Page 2.docx; load it in Phase 1.
        id: 'brands', label: 'Favorite brands', kind: 'multi', searchable: true,
        options: ['Arturo Fuente', 'Padrón', 'Liga Privada', 'My Father', 'Rocky Patel', 'Oliva', 'Perdomo', 'Davidoff', 'Cohiba', 'Montecristo', 'Macanudo', 'Tatuaje', 'Illusione', 'Crowned Heads', 'Camacho', 'AJ Fernandez'],
      },
    ],
  },
  {
    id: 'purchase',
    title: 'Purchase Habits',
    groups: [
      { id: 'purchaseHabits', label: 'How you buy', kind: 'multi', options: ['Single', '2-5 Cigars', '5-10 Cigars', 'Bundle', 'Box', 'Box Splits', 'Sampler', 'Limited Releases', 'Online Deals', 'Lounge/Retail Shop', 'Auctions/Secondary Market'] },
      { id: 'buyingPhilosophy', label: 'Buying philosophy', kind: 'multi', options: ['Buy what I plan to smoke', 'Stock up on favorites', 'Hunt for deals', 'Hunt limited releases', 'Buy based on recommendations', 'Buy based on brand', 'Buy based on wrapper/origin', 'Impulse/New Discovery'] },
    ],
  },
  { id: 'price', title: 'Price Comfort Zone', groups: [], special: 'price' },
  {
    id: 'ringGauge',
    title: 'Ring Gauge',
    groups: [{ id: 'ringGauge', label: 'Ring gauge', kind: 'multi', options: ['Slim 32-42', 'Medium 43-49', 'Thick 50-54', 'Extra Thick 55+'] }],
  },
  {
    id: 'vitola',
    title: 'Vitola',
    groups: [{ id: 'vitola', label: 'Vitola', kind: 'multi', options: ['Corona', 'Lonsdale', 'Robusto', 'Toro', 'Gordo', 'Double Corona', 'Lancero'] }],
  },
  {
    id: 'length',
    title: 'Length',
    groups: [{ id: 'length', label: 'Length', kind: 'multi', options: ['Short (under 5")', 'Medium (5-6")', 'Long (6-7")', 'Extra Long (7"+)'] }],
  },
  {
    id: 'duration',
    title: 'Smoking Duration',
    groups: [{ id: 'duration', label: 'Smoking duration', kind: 'multi', options: ['Under 30 min', '30-45 min', '45-60 min', '60-90 min', '90+ min'] }],
  },
  {
    id: 'collection',
    title: 'Collection',
    groups: [
      { id: 'collectionSize', label: 'Collection size', kind: 'single', options: ["I don't keep a collection", 'Under 25', '25-50', '51-100', '101-300', '301-500', '500+'] },
      { id: 'collectionStyle', label: 'Collection style', kind: 'multi', options: ['Casual Smoker', 'Curated Rotation', 'Serious Collector', 'Aging Focused', 'Trader', 'Limited Release Hunter', 'Brand Loyalist', 'Boutique Hunter', '"Buy What I Like"', 'Investment/Rare Cigar Collector'] },
    ],
  },
  {
    id: 'origin',
    title: 'Origin',
    groups: [{ id: 'origin', label: 'Origin', kind: 'multi', options: ['Nicaragua', 'Dominican Republic', 'Honduras', 'Cuba', 'Mexico', 'Ecuador', 'United States', 'Brazil', 'Cameroon', 'Indonesia', 'Costa Rica', 'Colombia', 'Other', 'Open to All'] }],
  },
  {
    id: 'strength',
    title: 'Strength',
    special: 'strengthScale',
    groups: [
      { id: 'strength', label: 'Strength preference', kind: 'multi', options: ['Mild', 'Mild-Medium', 'Medium', 'Medium-Full', 'Full'] },
      { id: 'strengthStyle', label: 'Style', kind: 'multi', options: ['Complex/Layered', 'Smooth/Creamy', 'Bold/Robust', 'Pepper-Forward', 'Flavor-Forward', 'Construction-Focused', 'Long-Finish', 'Consistent/Reliable', 'Experimental/Unique', 'Limited/Rare Releases', 'Boutique/Small-Batch', 'Classic/Traditional'] },
      { id: 'intensity', label: 'Intensity', kind: 'single', options: ['Low', 'Medium', 'High', 'Very High'] },
    ],
  },
  {
    id: 'wrapper',
    title: 'Wrapper',
    groups: [{ id: 'wrapper', label: 'Wrapper', kind: 'multi', options: ['Connecticut Shade', 'Connecticut Broadleaf', 'Ecuador Connecticut', 'Habano', 'Ecuador Habano', 'Nicaraguan Habano', 'Mexican San Andrés', 'Maduro', 'Oscuro', 'Cameroon', 'Corojo', 'Criollo', 'Sumatra', 'Pennsylvania Broadleaf', 'Candela', 'Other', 'No Preference'] }],
  },
  {
    id: 'binder',
    title: 'Binder & Filler',
    groups: [
      { id: 'binderFiller', label: 'Binder / filler', kind: 'multi', options: ['Nicaraguan', 'Dominican', 'Honduran', 'Mexican', 'Ecuadorian', 'Indonesian', 'Other', 'No Preference'] },
      { id: 'binderImportance', label: 'How important is it?', kind: 'single', options: ['Very Important', 'Somewhat Important', 'I know enough to care', "I don't really care", "I don't know / Teach me"] },
    ],
  },
  {
    id: 'aging',
    title: 'Aging & Resting',
    groups: [
      { id: 'aging', label: 'Aging / resting', kind: 'multi', options: ['Smoke Fresh', 'Rest a Few Weeks', 'Rest Several Months', 'Age 1-2 Years', 'Age 3-5 Years', 'Long-Term Aging', 'Prefer Well-Aged Cigars', 'No Preference'] },
      { id: 'agingInterest', label: 'Aging interest', kind: 'single', options: ['Not Interested', 'Curious', 'Serious Aging', 'Hobby'] },
    ],
  },
  {
    id: 'flavors',
    title: 'Flavors',
    groups: [
      {
        // Deduplicated: Earth, Citrus and Coffee appear more than once in the source list.
        id: 'flavors', label: 'Flavors', kind: 'multi', searchable: true,
        grouped: [
          { label: 'Earth & Mineral', options: ['Earth', 'Loam', 'Mineral'] },
          { label: 'Wood', options: ['Wood', 'Cedar', 'Oak', 'Leather'] },
          { label: 'Coffee & Roast', options: ['Coffee', 'Espresso', 'Roasted'] },
          { label: 'Sweet', options: ['Sweet', 'Cream', 'Caramel', 'Vanilla', 'Honey', 'Molasses', 'Brown Sugar'] },
          { label: 'Nuts', options: ['Almond', 'Cashew', 'Walnut', 'Hazelnut'] },
          { label: 'Chocolate', options: ['Cocoa', 'Dark Chocolate', 'Milk Chocolate'] },
          { label: 'Spice', options: ['Black Pepper', 'White Pepper', 'Red Pepper', 'Baking Spice', 'Cinnamon', 'Nutmeg'] },
          { label: 'Fruit', options: ['Dried Fruit', 'Raisin', 'Fig', 'Cherry', 'Citrus'] },
          { label: 'Other', options: ['Toast', 'Bread', 'Tobacco', 'Floral', 'Herbal', 'Licorice', 'Tea', 'Butter'] },
        ],
      },
      { id: 'flavorIntensity', label: 'Flavor intensity', kind: 'single', options: ['Subtle', 'Moderate', 'Pronounced'] },
    ],
  },
  {
    id: 'cut',
    title: 'Preferred Cut',
    groups: [{ id: 'cut', label: 'Cut', kind: 'multi', options: ['Straight/Guillotine', 'Double Blade', 'V-Cut', 'Punch', 'Scissors', 'Perfect Cutter', 'No Preference'] }],
  },
  {
    id: 'venue',
    title: 'Preferred Venue',
    groups: [{ id: 'venue', label: 'Where you smoke', kind: 'multi', options: ['Home', 'Cigar Lounge', 'Cigar Bar', 'Patio', 'Backyard', 'Beach/Outdoor', 'Golf', 'Travel', 'Hotel/Resort', 'Events', 'Private Club', 'Anywhere I Can Smoke'] }],
  },
  {
    id: 'pairing',
    title: 'Pairings',
    groups: [
      { id: 'pairing', label: 'Spirit pairing', kind: 'multi', options: ['Whiskey', 'Bourbon', 'Rye', 'Scotch', 'Irish Whiskey', 'Japanese Whisky', 'Cognac', 'Armagnac', 'Rum', 'Tequila', 'Mezcal', 'Brandy', 'Craft Beer', 'Wine', 'Port', 'Coffee', 'Espresso', 'Tea', 'Sparkling Water', 'Non-Alcoholic Cocktails', 'Water'] },
      { id: 'pairingStyle', label: 'Pairing style', kind: 'multi', options: ['Complementary', 'Contrasting', 'Sweet + Bold', 'Smooth + Strong', 'Experimental'] },
    ],
  },
  {
    id: 'time',
    title: 'Time of Day & Pace',
    groups: [
      { id: 'timeOfDay', label: 'Time of day', kind: 'multi', options: ['Morning', 'Late Morning', 'Afternoon', 'Early Evening', 'Evening', 'Late Night', 'After Dinner', 'Anytime'] },
      { id: 'pace', label: 'Smoking pace', kind: 'single', options: ['Slow & Contemplative', 'Relaxed', 'Medium', 'Fast', 'Depends on the cigar'] },
    ],
  },
  {
    id: 'storage',
    title: 'Storage',
    groups: [
      { id: 'storage', label: 'Storage', kind: 'multi', options: ['Desktop Humidor', 'Cabinet Humidor', 'Travel Humidor', 'Tupperdor', 'Cigar Cooler', 'Humidor Bag', 'Factory Box', 'Multiple Systems', 'Boveda/2-Way', 'Electronic Humidification', 'Temperature Controlled', 'No Formal Storage'] },
      { id: 'humidity', label: 'Humidity tracking', kind: 'single', options: ["Don't Track", 'Occasionally Check', 'Regularly Monitor', 'Precision Collector'] },
    ],
  },
  {
    id: 'smoke',
    title: 'Smoke & Ash',
    groups: [
      { id: 'smokeVolume', label: 'Smoke volume', kind: 'single', options: ['Light', 'Medium', 'Heavy', 'Very Heavy', 'No Preference'] },
      { id: 'ash', label: 'Ash', kind: 'single', options: ['Let It Ride', 'Tap Frequently', 'Long Ash', 'Depends on the Cigar', "I Don't Care", 'Ashtray Is Part of the Experience'] },
    ],
  },
  {
    id: 'construction',
    title: 'Construction',
    groups: [{ id: 'construction', label: 'Construction preferences', kind: 'multi', options: ['Firm Draw', 'Open Draw', 'Medium Draw', 'Easy Draw', 'Excellent Combustion', 'Slow Burning', 'Even Burn', 'Long Ash', 'Firm Ash', 'Consistent Construction', 'Construction Tolerance', 'Depends on the Cigar'] }],
  },
  { id: 'wishlist', title: 'Wishlist', groups: [], special: 'wishlist' },
  {
    id: 'social',
    title: 'Social Style',
    groups: [
      { id: 'socialStyle', label: 'Social style', kind: 'multi', options: ['Solo Smoker', 'One-on-One', 'Small Groups', 'Large Groups', 'Cigar Events', 'Club/Membership', 'Online Communities', 'Depends on the Occasion'] },
      { id: 'meetup', label: 'Meetup willingness', kind: 'multi', options: MEETUP },
    ],
  },
  {
    id: 'mentorship',
    title: 'Mentorship',
    groups: [
      { id: 'mentorship', label: 'Mentorship', kind: 'single', options: ['Willing to Guide Beginners', 'Looking for a Mentor', 'Both', 'Neither'] },
      { id: 'mentorTopics', label: 'Topics', kind: 'multi', options: MENTOR_TOPICS },
    ],
  },
];


export const MENTORSHIP_LABEL: Record<Mentorship, string> = {
  guide: 'Willing to Guide Beginners',
  seeking: 'Looking for a Mentor',
  both: 'Both',
  neither: 'Neither',
};

export const ALL_PREFERENCE_GROUPS = PREFERENCE_SECTIONS.flatMap((s) => s.groups);
export const groupOptions = (g: OptionGroup) => g.options ?? g.grouped?.flatMap((x) => x.options) ?? [];

// ---- Profile #3: About You ----
// Phase 0 uses ~10 mock options each. Phase 1 seeds the full xlsx lookups:
// Industries 133, Sports 177, Hobbies 181, Music 166, Religions 133, Languages 220,
// Political 62, First Responders 100.
export interface AboutField {
  id: string;
  label: string;
  sensitive?: boolean;
  options: string[];
}
export const ABOUT_YOU_FIELDS: AboutField[] = [
  { id: 'industry', label: 'Professional Industry', options: ['Accounting', 'Architecture', 'Banking & Finance', 'Construction', 'Education', 'Healthcare', 'Hospitality', 'Law', 'Real Estate', 'Technology'] },
  { id: 'sports', label: 'Sports', options: ['Baseball', 'Basketball', 'Boxing', 'Fishing', 'Football', 'Golf', 'Hockey', 'Hunting', 'Soccer', 'Tennis'] },
  { id: 'hobbies', label: 'Hobbies', options: ['BBQ & Smoking Meats', 'Classic Cars', 'Cooking', 'Photography', 'Poker', 'Reading', 'Travel', 'Watches', 'Whiskey Collecting', 'Woodworking'] },
  { id: 'firstResponder', label: 'Military / First Responder', options: ['Army', 'Navy', 'Air Force', 'Marine Corps', 'Coast Guard', 'Firefighter', 'Police Officer', 'EMT / Paramedic', 'Dispatcher', 'Not applicable'] },
  { id: 'languages', label: 'Languages Spoken', options: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin', 'Arabic', 'Russian', 'Japanese'] },
  { id: 'religion', label: 'Religion', sensitive: true, options: ['Buddhism', 'Catholicism', 'Christianity (Protestant)', 'Hinduism', 'Islam', 'Judaism', 'Orthodox Christianity', 'Spiritual but not religious', 'Agnostic', 'Atheist'] },
  { id: 'music', label: 'Music Preference', options: ['Blues', 'Classic Rock', 'Classical', 'Country', 'Hip-Hop', 'Jazz', 'Latin', 'R&B / Soul', 'Rock', 'Salsa'] },
  { id: 'political', label: 'Political Affiliation', sensitive: true, options: ['Conservative', 'Democrat', 'Independent', 'Libertarian', 'Liberal', 'Moderate', 'Progressive', 'Republican', 'Apolitical', 'Prefer not to say'] },
];
