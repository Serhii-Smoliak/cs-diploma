import { describe, expect, it } from 'vitest';
import type { MitreTechnique } from '../services/api';
import { matchesMitreTechniqueSearch } from './mitreSearch';

const technique = (overrides: Partial<MitreTechnique>): MitreTechnique => ({
  id: 'T1000',
  name: 'Example',
  description: 'References T1578 in prose.',
  tactic: 'collection',
  url: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('matchesMitreTechniqueSearch', () => {
  it('matches technique ids without description false positives', () => {
    const cloud = technique({
      id: 'T1578.002',
      name: 'Create Cloud Instance',
      tactic: 'defense-impairment',
    });
    const staged = technique({ id: 'T1074', name: 'Data Staged', description: 'See also T1578.' });

    expect(matchesMitreTechniqueSearch(cloud, 'T1578')).toBe(true);
    expect(matchesMitreTechniqueSearch(staged, 'T1578')).toBe(false);
  });

  it('matches exact sub-technique id queries', () => {
    const sub = technique({ id: 'T1578.002' });
    expect(matchesMitreTechniqueSearch(sub, 'T1578.002')).toBe(true);
    expect(matchesMitreTechniqueSearch(sub, 'T1578')).toBe(true);
    expect(matchesMitreTechniqueSearch(sub, '1578.002')).toBe(true);
  });

  it('falls back to text search for non-id queries', () => {
    const staged = technique({ id: 'T1074', name: 'Data Staged' });
    expect(matchesMitreTechniqueSearch(staged, 'data staged')).toBe(true);
  });
});
