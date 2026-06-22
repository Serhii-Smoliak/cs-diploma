export type LeaderboardPositionDisplay =
  | { kind: 'medal'; label: string }
  | { kind: 'rank'; label: string };

export function getPositionDisplay(position: number): LeaderboardPositionDisplay {
  if (position === 1) return { kind: 'medal', label: '🥇' };
  if (position === 2) return { kind: 'medal', label: '🥈' };
  if (position === 3) return { kind: 'medal', label: '🥉' };
  return { kind: 'rank', label: String(position) };
}

/** @deprecated Use getPositionDisplay for UI that needs rank badges. */
export function getPositionLabel(position: number): string {
  return getPositionDisplay(position).label;
}
