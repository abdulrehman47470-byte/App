import { ABOUT_YOU_FIELDS, ALL_PREFERENCE_GROUPS } from '@/data/options';
import type { MyProfile } from '@/types';

const DEMOGRAPHIC_KEYS: (keyof MyProfile)[] = ['name', 'dob', 'gender', 'pronouns', 'country', 'state', 'city', 'zip', 'userType', 'bio'];

/** Share (0-100) of profile fields filled. Sensitive fields are not required, so not counted. */
export function profileCompleteness(me: MyProfile): number {
  const aboutFields = ABOUT_YOU_FIELDS.filter((f) => !f.sensitive);
  const total = DEMOGRAPHIC_KEYS.length + ALL_PREFERENCE_GROUPS.length + aboutFields.length + 2;
  let filled = DEMOGRAPHIC_KEYS.filter((k) => !!me[k]).length;
  filled += ALL_PREFERENCE_GROUPS.filter((g) => (me.preferences[g.id] as string[] | undefined)?.length).length;
  filled += aboutFields.filter((f) => me.about[f.id]?.length).length;
  if (me.preferences.priceMin !== undefined) filled++;
  if (me.photoUrl || me.photoStatus === 'approved') filled++;
  return Math.round((filled / total) * 100);
}
