import { describe, expect, it } from 'vitest';
import { ageFromDob, isOfAge } from './utils';

describe('age gate', () => {
  const today = new Date('2026-09-30T12:00:00');

  it('computes age from date of birth', () => {
    expect(ageFromDob('1989-04-18', today)).toBe(37);
  });

  it('allows members who turn 21 today', () => {
    expect(isOfAge('2005-09-30', today)).toBe(true);
  });

  it('blocks members who turn 21 tomorrow', () => {
    expect(isOfAge('2005-10-01', today)).toBe(false);
  });

  it('rejects invalid dates', () => {
    expect(isOfAge('not-a-date', today)).toBe(false);
  });
});
