import type { TFunction } from 'i18next';

export function getMissionName(t: TFunction, missionId: string, fallbackName: string): string {
  const translationKey = `${missionId}.name`;
  const translated = t(translationKey, { ns: 'missions', defaultValue: fallbackName });
  return translated !== translationKey ? translated : fallbackName;
}

export function getMissionDescription(
  t: TFunction,
  missionId: string,
  fallbackDescription: string | null | undefined
): string {
  const fallback = fallbackDescription ?? '';
  const translationKey = `${missionId}.description`;
  const translated = t(translationKey, { ns: 'missions', defaultValue: fallback });
  return translated !== translationKey ? translated : fallback;
}

export function getMissionDifficultyLabel(t: TFunction, difficulty: string): string {
  return t(`difficulty.${difficulty}`, { ns: 'ui', defaultValue: difficulty });
}

export function getMissionAssignmentsPath(missionId: string): string {
  return `/missions/${missionId}/assignments`;
}
