import { describe, expect, it } from 'vitest';
import { getSkillMatrixTechniqueUrl, tacticSectionId } from './mitreLinks';

describe('mitreLinks', () => {
  it('builds skill matrix url with encoded technique id', () => {
    expect(getSkillMatrixTechniqueUrl('T1566.001')).toBe('/skill-matrix?technique=T1566.001');
  });

  it('builds stable tactic section ids', () => {
    expect(tacticSectionId('initial-access')).toBe('tactic-initial-access');
    expect(tacticSectionId('lateral movement')).toBe('tactic-lateral%20movement');
  });
});
