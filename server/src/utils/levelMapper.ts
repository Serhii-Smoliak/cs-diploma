import type { Level as PrismaLevel, MitreTechnique } from '@prisma/client';
import type { Level, DialogueMessage, WorkArea, Validation, Rewards } from '@cybertactics/shared';

const defaultRewards: Rewards = { xp: 0, stealth_impact: 0 };

function asDialogue(value: unknown): DialogueMessage[] {
  return Array.isArray(value) ? (value as DialogueMessage[]) : [];
}

function asWorkArea(value: unknown): WorkArea {
  return value !== null && typeof value === 'object' ? (value as WorkArea) : {};
}

function asValidation(value: unknown): Validation {
  if (value !== null && typeof value === 'object' && 'type' in value) {
    return value as Validation;
  }
  return { type: 'choice', correct_choice_id: '' };
}

function asRewards(value: unknown): Rewards {
  return value !== null && typeof value === 'object' ? (value as Rewards) : defaultRewards;
}

function asHints(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

type PrismaLevelWithMitre = PrismaLevel & { mitreTechnique?: MitreTechnique | null };

export function mapPrismaLevelToLevel(l: PrismaLevelWithMitre): Level {
  return {
    level_id: l.levelId,
    mission_id: l.missionId,
    mitre_id: l.mitreId || '',
    mitre_technique: l.mitreTechnique
      ? {
          id: l.mitreTechnique.id,
          name: l.mitreTechnique.name,
          description: l.mitreTechnique.description,
          tactic: l.mitreTechnique.tactic,
          url: l.mitreTechnique.url,
        }
      : null,
    title: l.title,
    order: l.orderIndex,
    dialogue: asDialogue(l.dialogue),
    task_type: l.taskType as Level['task_type'],
    work_area: asWorkArea(l.workArea),
    validation: asValidation(l.validation),
    rewards: asRewards(l.rewards),
    hints: asHints(l.hints),
  };
}
