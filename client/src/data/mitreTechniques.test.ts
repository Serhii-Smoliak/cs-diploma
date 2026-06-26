import { describe, expect, it } from 'vitest';
import { getAllTechniques, MITRE_TACTICS, MITRE_TECHNIQUES } from './mitreTechniques';

describe('mitreTechniques', () => {
  it('keeps static MITRE data consistent', () => {
    expect(Object.keys(MITRE_TECHNIQUES)).toHaveLength(5);
    expect(MITRE_TACTICS).toHaveLength(5);

    for (const tactic of MITRE_TACTICS) {
      expect(tactic.techniques).toHaveLength(1);
      const technique = tactic.techniques[0]!;
      expect(MITRE_TECHNIQUES[technique.id]).toBe(technique);
      expect(technique.tactic).toBe(tactic.name);
    }

    expect(getAllTechniques()).toEqual(MITRE_TACTICS.flatMap((tactic) => tactic.techniques));
  });
});