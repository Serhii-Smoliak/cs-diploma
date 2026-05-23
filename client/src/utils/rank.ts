import type { TFunction } from 'i18next';

export function getRankLabel(rank: string, t: TFunction): string {
  return t(`rank.${rank}`, { ns: 'ui', defaultValue: rank });
}
