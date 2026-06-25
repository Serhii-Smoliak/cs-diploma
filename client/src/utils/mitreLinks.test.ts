import { describe, expect, it } from 'vitest';
import {
  getMitreTacticUrl,
  getMitreTechniqueUrl,
  getSkillMatrixTechniqueUrl,
  tacticSectionId,
} from './mitreLinks';

describe('mitreLinks', () => {
  it('builds skill matrix url with encoded technique id', () => {
    expect(getSkillMatrixTechniqueUrl('T1566.001')).toBe('/skill-matrix?technique=T1566.001');
  });

  it('builds stable tactic section ids', () => {
    expect(tacticSectionId('initial-access')).toBe('tactic-initial-access');
    expect(tacticSectionId('lateral movement')).toBe('tactic-lateral%20movement');
  });

  it('builds MITRE technique urls for base and sub-techniques', () => {
    expect(getMitreTechniqueUrl('T1593')).toBe('https://attack.mitre.org/techniques/T1593/');
    expect(getMitreTechniqueUrl('T1087.002')).toBe(
      'https://attack.mitre.org/techniques/T1087/002/'
    );
  });

  it('prefers stored technique url when provided', () => {
    expect(getMitreTechniqueUrl('T1593', 'https://attack.mitre.org/techniques/T1593/')).toBe(
      'https://attack.mitre.org/techniques/T1593/'
    );
  });

  it('builds MITRE tactic urls from display names and slugs', () => {
    expect(getMitreTacticUrl('Discovery')).toBe('https://attack.mitre.org/tactics/TA0007/');
    expect(getMitreTacticUrl('initial-access')).toBe('https://attack.mitre.org/tactics/TA0001/');
  });
});
