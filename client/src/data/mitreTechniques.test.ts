import { describe, expect, it } from 'vitest';
import { getAllTechniques, MITRE_TACTICS, MITRE_TECHNIQUES } from './mitreTechniques';

describe('mitreTechniques', () => {
  it('defines five static techniques with matching ids', () => {
    expect(Object.keys(MITRE_TECHNIQUES)).toEqual([
      'T1593',
      'T1583.001',
      'T1566.001',
      'T1059.001',
      'T1547.001',
    ]);

    for (const [id, technique] of Object.entries(MITRE_TECHNIQUES)) {
      expect(technique.id).toBe(id);
      expect(technique.name).toBeTruthy();
      expect(technique.tactic).toBeTruthy();
      expect(technique.description).toBeTruthy();
    }
  });

  it('groups each tactic with one technique from the same tactic name', () => {
    expect(MITRE_TACTICS).toHaveLength(5);

    for (const tactic of MITRE_TACTICS) {
      expect(tactic.id).toBeTruthy();
      expect(tactic.name).toBeTruthy();
      expect(tactic.description).toBeTruthy();
      expect(tactic.techniques).toHaveLength(1);
      expect(tactic.techniques[0]?.tactic).toBe(tactic.name);
      expect(MITRE_TECHNIQUES[tactic.techniques[0]!.id]).toBe(tactic.techniques[0]);
    }
  });

  it('returns all techniques via getAllTechniques', () => {
    const techniques = getAllTechniques();

    expect(techniques).toHaveLength(5);
    expect(techniques.map((technique) => technique.id).sort()).toEqual(
      Object.keys(MITRE_TECHNIQUES).sort()
    );
  });
});
