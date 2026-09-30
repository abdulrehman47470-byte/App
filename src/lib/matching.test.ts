import { describe, expect, it } from 'vitest';
import { MOCK_MEMBERS } from '@/data/mock/members';
import { scoreMatch, type Scorable } from './matching';

const base: Scorable = { preferences: {}, about: {}, city: 'Nowhere', state: 'XX' };

describe('scoreMatch', () => {
  it('stays within 0-100', () => {
    for (const m of MOCK_MEMBERS) {
      const { pct } = scoreMatch(base, m);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('scores shared preferences higher and reports them', () => {
    const elena = MOCK_MEMBERS.find((m) => m.id === 'm2')!;
    const similar = scoreMatch({ ...base, preferences: elena.preferences, userType: elena.userType, city: elena.city, state: elena.state }, elena);
    const empty = scoreMatch(base, elena);
    expect(similar.pct).toBeGreaterThan(empty.pct);
    expect(similar.shared).toContain('Maduro');
  });

  it('ignores sensitive fields (religion, political)', () => {
    const m = { ...MOCK_MEMBERS[0], about: { ...MOCK_MEMBERS[0].about, religion: ['Buddhism'], political: ['Independent'] } };
    const a = scoreMatch(base, m);
    const b = scoreMatch({ ...base, about: { religion: ['Buddhism'], political: ['Independent'] } }, m);
    expect(b.pct).toBe(a.pct);
    expect(b.shared).not.toContain('Buddhism');
  });
});
