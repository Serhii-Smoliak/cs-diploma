import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getMitreTranslationCoverage } from './mitreTranslationCoverage.js';

const prismaMock = vi.hoisted(() => ({
  mitreTechnique: {
    findMany: vi.fn(),
  },
  translation: {
    findMany: vi.fn(),
  },
}));

vi.mock('../db/database.js', () => ({ default: prismaMock }));

describe('getMitreTranslationCoverage', () => {
  beforeEach(() => {
    prismaMock.mitreTechnique.findMany.mockResolvedValue([
      {
        id: 'T1593',
        tactic: 'Reconnaissance',
        name: 'Search Open Websites/Domains',
        description: 'English MITRE description',
      },
      {
        id: 'T1123',
        tactic: 'Collection',
        name: 'Audio Capture',
        description: 'English MITRE description',
      },
      {
        id: 'T9999',
        tactic: 'Unknown Tactic',
        name: 'Unknown Technique',
        description: null,
      },
    ]);
    prismaMock.translation.findMany.mockResolvedValue([
      { key: 'technique.name.T1593', locale: 'uk' },
      { key: 'technique.description.T1593', locale: 'uk' },
      { key: 'technique.name.T1593', locale: 'en' },
      { key: 'technique.description.T1593', locale: 'en' },
      { key: 'tactic.explanation.Collection', locale: 'uk' },
      { key: 'killChain.goal.collection', locale: 'uk' },
      { key: 'tactic.explanation.Reconnaissance', locale: 'en' },
      { key: 'killChain.goal.reconnaissance', locale: 'en' },
      { key: 'tactic.explanation.Collection', locale: 'en' },
      { key: 'killChain.goal.collection', locale: 'en' },
    ]);
  });

  it('classifies visible translation coverage by locale', async () => {
    const result = await getMitreTranslationCoverage();

    expect(result.totalTechniques).toBe(3);
    expect(result.uk).toEqual({ full: 1, partial: 1, none: 1 });
    expect(result.en).toEqual({ full: 2, partial: 1, none: 0 });
  });
});
