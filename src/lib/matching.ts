// Client-side stand-in for the Phase 4 Postgres scoring function. Same idea: weighted
// overlap of cigar preferences + shared interests + proximity, 0-100. Sensitive fields
// (ethnicity, religion, political) are never used. Weights move to app_config in Phase 4.
import type { AboutYou, Member, Preferences, UserType } from '@/types';

export const MATCH_WEIGHTS: Record<string, number> = {
  strength: 8, flavors: 10, wrapper: 7, origin: 6, vitola: 5, brands: 8, pairing: 7,
  venue: 5, pace: 3, socialStyle: 6, atmosphere: 4, userType: 5,
  hobbies: 6, sports: 4, music: 4, languages: 4, industry: 3, proximity: 5,
};

const PREF_KEYS = ['strength', 'flavors', 'wrapper', 'origin', 'vitola', 'brands', 'pairing', 'venue', 'pace', 'socialStyle', 'atmosphere'];
const ABOUT_KEYS = ['hobbies', 'sports', 'music', 'languages', 'industry'];
const TYPE_ORDER: UserType[] = ['beginner', 'intermediate', 'advanced', 'aficionado', 'collector'];

function jaccard(a: string[] = [], b: string[] = []) {
  if (!a.length || !b.length) return 0;
  const sb = new Set(b);
  const inter = a.filter((x) => sb.has(x)).length;
  return inter / new Set([...a, ...b]).size;
}

export interface Scorable {
  preferences: Preferences;
  about: AboutYou;
  userType?: UserType;
  city: string;
  state: string;
}

export function scoreMatch(me: Scorable, other: Member): { pct: number; shared: string[] } {
  let total = 0;
  let got = 0;
  const shared: string[] = [];
  const add = (key: string, s: number) => {
    total += MATCH_WEIGHTS[key];
    got += MATCH_WEIGHTS[key] * s;
  };
  for (const k of PREF_KEYS) {
    const a = me.preferences[k] as string[] | undefined;
    const b = other.preferences[k] as string[] | undefined;
    add(k, Math.min(1, jaccard(a, b) * 1.8));
    a?.forEach((x) => b?.includes(x) && shared.push(x));
  }
  for (const k of ABOUT_KEYS) {
    const a = me.about[k];
    const b = other.about[k];
    add(k, Math.min(1, jaccard(a, b) * 1.8));
    a?.forEach((x) => b?.includes(x) && shared.push(x));
  }
  if (me.userType) {
    const d = Math.abs(TYPE_ORDER.indexOf(me.userType) - TYPE_ORDER.indexOf(other.userType));
    add('userType', 1 - d / 4);
  }
  add('proximity', me.city === other.city ? 1 : me.state === other.state ? 0.6 : 0.1);
  const pct = total ? Math.round(45 + (got / total) * 55) : 50;
  return { pct: Math.min(99, pct), shared: [...new Set(shared)] };
}
