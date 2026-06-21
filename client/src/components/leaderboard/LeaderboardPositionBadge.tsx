import { getPositionDisplay } from '../../utils/leaderboard';

interface LeaderboardPositionBadgeProps {
  readonly position: number;
}

export default function LeaderboardPositionBadge({ position }: LeaderboardPositionBadgeProps) {
  const display = getPositionDisplay(position);

  if (display.kind === 'medal') {
    return (
      <span className="inline-flex items-center justify-center min-w-[2rem] text-lg leading-none">
        {display.label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full border border-cyber-border bg-cyber-panel/80 text-cyber-primary text-sm font-mono font-bold tabular-nums"
      aria-label={`#${display.label}`}
    >
      {display.label}
    </span>
  );
}
