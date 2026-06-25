import type { TFunction } from 'i18next';

export function getMissionName(t: TFunction, missionId: string, fallbackName: string): string {
  const translationKey = `${missionId}.name`;
  const translated = t(translationKey, { ns: 'missions', defaultValue: fallbackName });
  return translated === translationKey ? fallbackName : translated;
}

export function getMissionDescription(
  t: TFunction,
  missionId: string,
  fallbackDescription: string = ''
): string {
  const translationKey = `${missionId}.description`;
  const translated = t(translationKey, { ns: 'missions', defaultValue: fallbackDescription });
  return translated === translationKey ? fallbackDescription : translated;
}

export function getMissionDifficultyLabel(t: TFunction, difficulty: string): string {
  return t(`difficulty.${difficulty}`, { ns: 'ui', defaultValue: difficulty });
}

export function getMissionDifficultyClass(difficulty: string): string {
  if (difficulty === 'beginner') {
    return 'bg-green-900/30 text-green-400';
  }
  if (difficulty === 'intermediate') {
    return 'bg-yellow-900/30 text-yellow-400';
  }
  return 'bg-red-900/30 text-red-400';
}

export function getMissionAssignmentsPath(missionId: string): string {
  return `/missions/${missionId}/assignments`;
}
