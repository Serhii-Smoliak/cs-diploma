import type { Level, Validation } from '@cybertactics/shared';
import { describe, expect, it } from 'vitest';
import { validateAnswer } from './AnswerValidator';

function createLevel(validation: Validation, overrides: Partial<Level> = {}): Level {
  return {
    level_id: 'test_level',
    mission_id: 'operation_ghost',
    mitre_id: 'T1598',
    mitre_technique: null,
    title: 'Test level',
    order: 1,
    dialogue: [],
    task_type: 'code_editor',
    work_area: {},
    validation,
    rewards: { xp: 10, stealth_impact: 0 },
    hints: [],
    ...overrides,
  };
}

describe('validateAnswer', () => {
  it('validates regex_match answers against test string', () => {
    const level = createLevel({
      type: 'regex_match',
      correct_pattern: '.*@.*',
      test_string: 'admin@apexdynamics.tech',
    });

    expect(validateAnswer(level, '[a-z]+@apexdynamics\\.tech')).toBe(true);
    expect(validateAnswer(level, 'wrong')).toBe(false);
    expect(validateAnswer(level, '')).toBe(false);
  });

  it('validates choice answers by id string', () => {
    const level = createLevel({
      type: 'choice',
      correct_choice_id: 'choice_1',
    });

    expect(validateAnswer(level, 'choice_1')).toBe(true);
    expect(validateAnswer(level, 'choice_2')).toBe(false);
    expect(validateAnswer(level, 1)).toBe(false);
  });

  it('validates email_check keyword groups and blocked extensions', () => {
    const level = createLevel(
      {
        type: 'email_check',
        required_keyword_groups: [['urgent'], ['password']],
        blocked_extensions: ['.exe'],
      },
      {
        task_type: 'phishing_constructor',
        work_area: {
          attachments: [{ id: 'att1', name: 'report.pdf', type: 'pdf', allowed: true }],
        },
      }
    );

    expect(
      validateAnswer(level, {
        to: 'victim@apexdynamics.tech',
        subject: 'Urgent password reset',
        body: 'Please update your password now',
        attachments: ['att1'],
      })
    ).toBe(true);

    expect(
      validateAnswer(level, {
        to: 'victim@apexdynamics.tech',
        subject: 'Hello',
        body: 'No keywords here',
        attachments: [],
      })
    ).toBe(false);

    expect(
      validateAnswer(level, {
        to: 'victim@apexdynamics.tech',
        subject: 'Urgent password reset',
        body: 'Download malware.exe attachment',
        attachments: ['malware.exe'],
      })
    ).toBe(false);
  });

  it('validates sentence_combination sequences and attachments', () => {
    const level = createLevel(
      {
        type: 'sentence_combination',
        correct_sequences: {
          cmd: [['part_a', 'part_b']],
        },
        required_attachments: ['lnk1'],
        blocked_extensions: ['.exe'],
      },
      {
        task_type: 'sentence_constructor',
        work_area: {
          attachments: [{ id: 'lnk1', name: 'invoice.lnk', type: 'lnk', allowed: true }],
        },
      }
    );

    expect(
      validateAnswer(level, {
        fields: { cmd: ['part_a', 'part_b'] },
        attachments: ['lnk1'],
      })
    ).toBe(true);

    expect(
      validateAnswer(level, {
        fields: { cmd: ['part_b', 'part_a'] },
        attachments: ['lnk1'],
      })
    ).toBe(false);
  });

  it('validates ast_parse patterns including iwr alias', () => {
    const level = createLevel({
      type: 'ast_parse',
      correct_pattern: 'invoke-webrequest',
    });

    expect(validateAnswer(level, 'Invoke-WebRequest http://evil.test')).toBe(true);
    expect(validateAnswer(level, 'iwr http://evil.test')).toBe(true);
    expect(validateAnswer(level, 'curl http://evil.test')).toBe(false);
  });

  it('returns false for unknown validation type', () => {
    const level = createLevel({ type: 'choice', correct_choice_id: 'x' });
    level.validation = { type: 'unknown' as 'choice', correct_choice_id: 'x' };
    expect(validateAnswer(level, 'x')).toBe(false);
  });
});
