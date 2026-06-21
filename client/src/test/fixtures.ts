import type { Level, Mission } from '@cybertactics/shared';
import { vi } from 'vitest';
import type { MitreTechnique } from '../services/api';

export const testMission: Mission = {
  id: 'operation_ghost',
  name: 'Operation Ghost',
  description: 'Infiltrate Apex Dynamics.',
  difficulty: 'beginner',
  mitreTechniques: ['T1593', 'T1583.001', 'T1566.001'],
  order: 1,
};

export const testMitreTechnique: MitreTechnique = {
  id: 'T1593',
  name: 'Search Open Websites',
  description: 'Gather data from public sites.',
  tactic: 'reconnaissance',
  url: 'https://attack.mitre.org/techniques/T1593',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export function createTestLevel(overrides: Partial<Level> = {}): Level {
  return {
    level_id: 'ghost_recon_01',
    mission_id: 'operation_ghost',
    mitre_id: 'T1593',
    mitre_technique: {
      id: 'T1593',
      name: 'Search Open Websites',
      tactic: 'reconnaissance',
      description: 'Gather data from public sites.',
      url: null,
    },
    title: 'Find admin email',
    order: 1,
    dialogue: [{ speaker: 'handler', text: 'Find the email.' }],
    task_type: 'code_editor',
    work_area: { input_type: 'regex', placeholder: 'Enter regex' },
    validation: { type: 'regex_match', correct_pattern: '.*' },
    rewards: { xp: 100, stealth_impact: 0 },
    hints: ['Use regex'],
    ...overrides,
  };
}

export const tacticalLevel = createTestLevel({
  level_id: 'ghost_choice_01',
  task_type: 'tactical_choice',
  work_area: {
    choices: [
      { id: 'choice_1', text: 'Use phishing domain A' },
      { id: 'choice_2', text: 'Use phishing domain B' },
    ],
  },
  validation: { type: 'choice', correct_choice_id: 'choice_1' },
});

export const phishingLevel = createTestLevel({
  level_id: 'ghost_phish_01',
  task_type: 'phishing_constructor',
  work_area: {
    email_to: 'admin@target.test',
    email_fields: { to: 'admin@target.test', subject: '', body: '' },
    attachments: [{ id: 'att1', name: 'report.pdf', type: 'pdf', allowed: true }],
  },
  validation: {
    type: 'email_check',
    required_keyword_groups: [['urgent']],
    blocked_extensions: ['.exe'],
  },
});

export const sentenceLevel = createTestLevel({
  level_id: 'ghost_sentence_01',
  task_type: 'sentence_constructor',
  work_area: {
    fields: [{ id: 'cmd', label: 'Command', slots: 2, tokens: [{ id: 't1', text: 'part_a' }] }],
    attachments: [{ id: 'lnk1', name: 'invoice.lnk', type: 'lnk', allowed: true }],
  },
  validation: {
    type: 'sentence_combination',
    correct_sequences: { cmd: [['part_a']] },
    required_attachments: ['lnk1'],
  },
});

export function createFetchMock(
  overrides: Partial<{
    missions: Mission[];
    levels: Level[];
    techniques: MitreTechnique[];
    progress: Array<{ levelId: string; completed: boolean; attempts: number }>;
    stats: Record<string, unknown>;
    submitResult: Record<string, unknown>;
  }> = {}
) {
  const missions = overrides.missions ?? [testMission];
  const levels = overrides.levels ?? [
    createTestLevel(),
    createTestLevel({ level_id: 'ghost_02', order: 2 }),
  ];
  const techniques = overrides.techniques ?? [testMitreTechnique];
  const progress = overrides.progress ?? [];
  const stats = overrides.stats ?? { mitreTechniques: ['T1593'] };
  const submitResult = overrides.submitResult ?? { success: true, message: 'OK', xpGained: 10 };

  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('/api/missions') && !url.includes('/levels')) {
      return { ok: true, json: async () => missions };
    }
    if (url.includes('/levels/') && url.includes('/submit')) {
      return { ok: true, json: async () => submitResult };
    }
    if (url.includes('/levels') || (url.includes('/missions/') && url.includes('/levels'))) {
      return { ok: true, json: async () => levels };
    }
    if (url.includes('/mitre/techniques/')) {
      return {
        ok: true,
        json: async () => ({ ...testMitreTechnique, relatedMissions: [missions[0]] }),
      };
    }
    if (url.includes('/mitre/techniques')) {
      return { ok: true, json: async () => techniques };
    }
    if (url.includes('/progress')) {
      return { ok: true, json: async () => progress };
    }
    if (url.includes('/stats')) {
      return { ok: true, json: async () => stats };
    }
    if (url.includes('/users/me') && !url.includes('avatar') && !url.includes('locale')) {
      return {
        ok: true,
        json: async () => ({
          id: 'u1',
          username: 'agent',
          email: 'agent@test.com',
          xp: 100,
          rank: 'Novice Hacker',
          stealth: 80,
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      };
    }
    if (url.includes('/leaderboard')) {
      return { ok: true, json: async () => [] };
    }
    if (url.includes('/translations')) {
      return { ok: true, json: async () => ({}) };
    }

    return { ok: true, json: async () => ({}) };
  });
}
