import { describe, expect, it } from 'vitest';
import { mapPrismaLevelToLevel } from './levelMapper';

describe('mapPrismaLevelToLevel', () => {
  it('maps prisma level with mitre technique', () => {
    const mapped = mapPrismaLevelToLevel({
      levelId: 'ghost_recon_01',
      missionId: 'operation_ghost',
      mitreId: 'T1598',
      title: 'Find admin email',
      orderIndex: 1,
      dialogue: [{ speaker: 'system', text: 'Start' }],
      taskType: 'code_editor',
      workArea: { type: 'code_editor', language: 'regex', starter_code: '' },
      validation: { type: 'regex_match', correct_pattern: '.*', test_string: 'x' },
      rewards: { xp: 10, stealth_impact: -2 },
      hints: ['hint'],
      mitreTechnique: {
        id: 'T1598',
        name: 'Phishing for Information',
        description: 'desc',
        tactic: 'reconnaissance',
        url: 'https://attack.mitre.org/techniques/T1598/',
        platforms: [],
        dataSources: null,
        defenseBypassed: null,
        permissionsRequired: null,
        examples: null,
        mitigation: null,
        updatedAt: new Date(),
      },
    } as never);

    expect(mapped.level_id).toBe('ghost_recon_01');
    expect(mapped.mitre_technique?.id).toBe('T1598');
    expect(mapped.dialogue).toHaveLength(1);
    expect(mapped.rewards).toEqual({ xp: 10, stealth_impact: -2 });
  });

  it('falls back to safe defaults for malformed json fields', () => {
    const mapped = mapPrismaLevelToLevel({
      levelId: 'broken',
      missionId: 'operation_ghost',
      mitreId: null,
      title: 'Broken',
      orderIndex: 0,
      dialogue: null,
      taskType: 'tactical_choice',
      workArea: null,
      validation: null,
      rewards: null,
      hints: null,
    } as never);

    expect(mapped.dialogue).toEqual([]);
    expect(mapped.work_area).toEqual({});
    expect(mapped.validation).toEqual({ type: 'choice', correct_choice_id: '' });
    expect(mapped.rewards).toEqual({ xp: 0, stealth_impact: 0 });
    expect(mapped.hints).toEqual([]);
    expect(mapped.mitre_technique).toBeNull();
  });
});
