import { describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import {
  getMissionAssignmentsPath,
  getMissionDescription,
  getMissionDifficultyClass,
  getMissionDifficultyLabel,
  getMissionName,
} from './missionText';

function mockT(translations: Record<string, string>): TFunction {
  return ((key: string, options?: { ns?: string; defaultValue?: string }) => {
    const fullKey = options?.ns ? `${options.ns}:${key}` : key;
    return translations[fullKey] ?? translations[key] ?? options?.defaultValue ?? key;
  }) as TFunction;
}

describe('missionText', () => {
  it('returns translated mission name when key exists', () => {
    const t = mockT({ 'missions:operation_iron_signal.name': 'Операція Залізний Сигнал' });
    expect(getMissionName(t, 'operation_iron_signal', 'Operation Iron Signal')).toBe(
      'Операція Залізний Сигнал'
    );
  });

  it('falls back to API name when translation missing', () => {
    const t = mockT({});
    expect(getMissionName(t, 'operation_iron_signal', 'Operation Iron Signal')).toBe(
      'Operation Iron Signal'
    );
  });

  it('builds assignments path from mission id', () => {
    expect(getMissionAssignmentsPath('operation_iron_signal')).toBe(
      '/missions/operation_iron_signal/assignments'
    );
  });

  it('translates difficulty via ui namespace', () => {
    const t = vi.fn((key: string, options?: { ns?: string; defaultValue?: string }) => {
      if (key === 'difficulty.intermediate' && options?.ns === 'ui') return 'Середній';
      return options?.defaultValue ?? key;
    }) as unknown as TFunction;

    expect(getMissionDifficultyLabel(t, 'intermediate')).toBe('Середній');
  });

  it('returns difficulty badge classes', () => {
    expect(getMissionDifficultyClass('beginner')).toContain('green');
    expect(getMissionDifficultyClass('intermediate')).toContain('yellow');
    expect(getMissionDifficultyClass('advanced')).toContain('red');
  });

  it('returns translated description', () => {
    const t = mockT({ 'missions:operation_ghost.description': 'Uk desc' });
    expect(getMissionDescription(t, 'operation_ghost', 'En desc')).toBe('Uk desc');
  });
});
