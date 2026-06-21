import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Level } from '@cybertactics/shared';
import MitreTechniqueChip from '../mitre/MitreTechniqueChip';

function getStealthImpactClass(impact: number): string {
  if (impact < 0) return 'text-orange-400';
  if (impact > 0) return 'text-green-400';
  return 'text-gray-400';
}

interface AssignmentPanelProps {
  readonly className?: string;
  readonly isEn: boolean;
  readonly selectedLevel: Level | null;
  readonly selectedLevelIndex: number;
  readonly killChainStep: string | null;
  readonly isCompleted: boolean;
  readonly onStart: (level: Level) => Promise<void>;
  readonly getLevelTitle: (levelId: string, fallback: string) => string;
  readonly getTaskTypeLabel: (taskType: Level['task_type']) => string;
  readonly getTechniqueName: (techniqueId: string, fallback: string) => string;
  readonly getTacticLabel: (tactic: string) => string;
  readonly getTacticExplanation: (tactic: string) => string;
  readonly getTechniqueDescription: (techniqueId: string, fallback: string | null) => string;
}

function AssignmentPanelEmpty({ className = '', isEn }: { className?: string; isEn: boolean }) {
  const { t } = useTranslation(['ui']);

  return (
    <div
      className={`w-full cyber-panel border border-cyber-border border-dashed p-8 flex flex-col items-center justify-center text-center ${className}`}
    >
      <span className="text-4xl mb-4 opacity-40" aria-hidden>
        ◈
      </span>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        {t('assignmentPanelEmpty', {
          ns: 'ui',
          defaultValue: isEn ? 'Select an assignment on the left' : 'Оберіть завдання зліва',
        })}
      </p>
      <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
        {t('assignmentPanelEmptyHint', {
          ns: 'ui',
          defaultValue: isEn
            ? 'Details, progress and MITRE context will appear here.'
            : 'Тут з’являться деталі, прогрес і контекст MITRE.',
        })}
      </p>
    </div>
  );
}

function AssignmentLearnSection({
  level,
  getTaskTypeLabel,
  getTechniqueName,
  getTacticLabel,
  getTacticExplanation,
  getTechniqueDescription,
  isEn,
}: {
  level: Level;
  isEn: boolean;
  getTaskTypeLabel: (taskType: Level['task_type']) => string;
  getTechniqueName: (techniqueId: string, fallback: string) => string;
  getTacticLabel: (tactic: string) => string;
  getTacticExplanation: (tactic: string) => string;
  getTechniqueDescription: (techniqueId: string, fallback: string | null) => string;
}) {
  const { t } = useTranslation(['ui']);
  const technique = level.mitre_technique;
  const tacticExplanation = technique ? getTacticExplanation(technique.tactic) : '';

  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/40 p-4">
      <h4 className="text-[11px] uppercase tracking-wider text-cyber-success mb-3">
        {t('assignmentPanelLearnTitle', {
          ns: 'ui',
          defaultValue: isEn ? 'What you will learn' : 'Чого навчишся',
        })}
      </h4>

      {technique ? (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <MitreTechniqueChip
              techniqueId={technique.id}
              title={getTechniqueName(technique.id, technique.name)}
            />
            <span className="text-xs px-2 py-1 rounded bg-cyber-panel border border-cyber-border text-gray-400">
              {getTacticLabel(technique.tactic)}
            </span>
          </div>
          {tacticExplanation && (
            <p className="text-xs text-gray-400 mb-2 leading-relaxed">{tacticExplanation}</p>
          )}
          <p className="text-sm text-gray-300 leading-relaxed">
            {getTechniqueDescription(technique.id, technique.description)}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-300 leading-relaxed">{getTaskTypeLabel(level.task_type)}</p>
      )}
    </div>
  );
}

function AssignmentStatsGrid({
  level,
  getTaskTypeLabel,
}: {
  level: Level;
  getTaskTypeLabel: (taskType: Level['task_type']) => string;
}) {
  const { t } = useTranslation(['ui']);
  const stealthImpact = level.rewards?.stealth_impact ?? 0;

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 px-3 py-2.5">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">
          {t('taskTypeCaption', { ns: 'ui' })}
        </span>
        <span className="text-sm text-cyber-primary font-medium leading-tight">
          {getTaskTypeLabel(level.task_type)}
        </span>
      </div>

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 px-3 py-2.5">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">
          {t('xp', { ns: 'ui' })}
        </span>
        <span className="text-sm text-cyber-primary font-mono font-medium">
          +{level.rewards?.xp ?? 0}
        </span>
      </div>

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 px-3 py-2.5">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">
          {t('stealth', { ns: 'ui' })}
        </span>
        <span className={`text-sm font-mono font-medium ${getStealthImpactClass(stealthImpact)}`}>
          {stealthImpact > 0 ? '+' : ''}
          {stealthImpact}
        </span>
      </div>
    </div>
  );
}

export default function AssignmentPanel({
  className = '',
  isEn,
  selectedLevel,
  selectedLevelIndex,
  killChainStep,
  isCompleted,
  onStart,
  getLevelTitle,
  getTaskTypeLabel,
  getTechniqueName,
  getTacticLabel,
  getTacticExplanation,
  getTechniqueDescription,
}: AssignmentPanelProps) {
  const { t } = useTranslation(['ui']);

  if (!selectedLevel) {
    return <AssignmentPanelEmpty className={className} isEn={isEn} />;
  }

  const handleStartClick = () => {
    onStart(selectedLevel).catch((error) => {
      console.error('Failed to start assignment:', error);
    });
  };

  return (
    <motion.div
      key={selectedLevel.level_id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2 }}
      className={`w-full cyber-panel border border-cyber-success/30 bg-gradient-to-b from-green-900/10 to-transparent p-5 sm:p-6 flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold ${
            isCompleted
              ? 'border-cyber-success text-cyber-success bg-green-900/20'
              : 'border-cyber-primary text-cyber-primary bg-cyber-primary/10'
          }`}
        >
          {selectedLevelIndex + 1}
        </span>
        <div className="min-w-0 flex-1">
          <span
            className={`text-xs font-medium ${
              isCompleted ? 'text-cyber-success' : 'text-yellow-400'
            }`}
          >
            {isCompleted
              ? t('assignmentStatusCompleted', { ns: 'ui' })
              : t('assignmentStatusIncomplete', { ns: 'ui' })}
          </span>
          <h3 className="font-heading font-bold text-lg text-cyber-primary leading-snug mt-0.5">
            {getLevelTitle(selectedLevel.level_id, selectedLevel.title)}
          </h3>
        </div>
      </div>

      {killChainStep && (
        <p className="text-xs text-gray-400 leading-relaxed pl-3 border-l-2 border-cyber-primary/40">
          {killChainStep}
        </p>
      )}

      <AssignmentLearnSection
        level={selectedLevel}
        isEn={isEn}
        getTaskTypeLabel={getTaskTypeLabel}
        getTechniqueName={getTechniqueName}
        getTacticLabel={getTacticLabel}
        getTacticExplanation={getTacticExplanation}
        getTechniqueDescription={getTechniqueDescription}
      />

      <AssignmentStatsGrid level={selectedLevel} getTaskTypeLabel={getTaskTypeLabel} />

      <button
        type="button"
        onClick={handleStartClick}
        className="w-full cyber-button-success py-3 mt-2 flex items-center justify-center gap-2"
      >
        <span>
          {t('assignmentStart', {
            ns: 'ui',
            defaultValue: isEn ? 'Start assignment' : 'Почати завдання',
          })}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </motion.div>
  );
}
