import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Level } from '@cybertactics/shared';

function getCardBorderClass(
  isAvailable: boolean,
  isSelected: boolean,
  isCompleted: boolean
): string {
  if (!isAvailable) return 'border-cyber-border/30 opacity-50';
  if (isSelected) return 'border-cyber-success bg-green-900/10';
  if (isCompleted) return 'border-cyber-success hover:border-cyber-success hover:bg-green-900/10';
  return 'border-cyber-border hover:border-cyber-primary hover:bg-cyber-primary/5';
}

function getStepBadgeClass(isCompleted: boolean, isAvailable: boolean): string {
  if (isCompleted) return 'border-cyber-success text-cyber-success bg-green-900/20';
  if (!isAvailable) return 'border-gray-600 text-gray-500';
  return 'border-cyber-primary text-cyber-primary bg-cyber-primary/10';
}

function getStatusTextClass(isCompleted: boolean, isAvailable: boolean): string {
  if (isCompleted) return 'text-cyber-success';
  if (!isAvailable) return 'text-red-400';
  return 'text-yellow-400';
}

function getStatusLabel(
  isCompleted: boolean,
  isAvailable: boolean,
  labels: { completed: string; locked: string; incomplete: string }
): string {
  if (isCompleted) return labels.completed;
  if (!isAvailable) return labels.locked;
  return labels.incomplete;
}

function getStartButtonClass(isAvailable: boolean, isSelected: boolean): string {
  if (!isAvailable) return 'text-gray-500 opacity-40 cursor-not-allowed';
  if (isSelected) return 'text-cyber-success hover:bg-cyber-success/10 cursor-pointer';
  return 'text-white hover:text-cyber-primary hover:bg-cyber-primary/10 cursor-pointer';
}

interface AssignmentListItemProps {
  readonly level: Level;
  readonly index: number;
  readonly isCompleted: boolean;
  readonly isAvailable: boolean;
  readonly isSelected: boolean;
  readonly isEn: boolean;
  readonly title: string;
  readonly taskTypeLabel: string;
  readonly onSelect: (level: Level) => void;
  readonly onStart: (level: Level) => void;
}

export default function AssignmentListItem({
  level,
  index,
  isCompleted,
  isAvailable,
  isSelected,
  isEn,
  title,
  taskTypeLabel,
  onSelect,
  onStart,
}: AssignmentListItemProps) {
  const { t } = useTranslation(['ui']);

  const statusLabels = {
    completed: t('assignmentStatusCompleted', { ns: 'ui' }),
    locked: t('assignmentStatusLocked', { ns: 'ui' }),
    incomplete: t('assignmentStatusIncomplete', { ns: 'ui' }),
  };

  const startLabel = t('assignmentStart', {
    ns: 'ui',
    defaultValue: isEn ? 'Start assignment' : 'Почати завдання',
  });

  const handleStart = () => {
    if (isAvailable) {
      onStart(level).catch((error) => {
        console.error('Failed to start assignment:', error);
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`w-full cyber-panel p-3 sm:p-4 border-2 transition-all duration-200 ${getCardBorderClass(
        isAvailable,
        isSelected,
        isCompleted
      )}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${getStepBadgeClass(
            isCompleted,
            isAvailable
          )}`}
        >
          {index + 1}
        </span>

        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => isAvailable && onSelect(level)}
          className={`flex-1 min-w-0 text-left ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        >
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${getStatusTextClass(isCompleted, isAvailable)}`}>
              {getStatusLabel(isCompleted, isAvailable, statusLabels)}
            </span>
          </div>

          <h3 className="font-heading font-bold text-base text-cyber-primary leading-snug">
            {title}
          </h3>

          <p className="mt-1 text-xs text-gray-500 truncate">
            {level.mitre_technique?.id && (
              <span className="font-mono text-cyber-primary/80 mr-2">
                {level.mitre_technique.id}
              </span>
            )}
            {taskTypeLabel}
          </p>
        </button>

        <button
          type="button"
          disabled={!isAvailable}
          onClick={handleStart}
          title={startLabel}
          className={`flex-shrink-0 self-center p-1 rounded transition-colors ${getStartButtonClass(
            isAvailable,
            isSelected
          )}`}
          aria-label={startLabel}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
