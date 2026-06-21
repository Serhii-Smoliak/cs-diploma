import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import type { Level } from '@cybertactics/shared';
import { motion } from 'framer-motion';
import TaskHints from './TaskHints';
import TaskSubmitButton from './TaskSubmitButton';
import TaskResultPanel from './TaskResultPanel';
import { preventTaskMouseDefault, useTaskProgress } from './useTaskProgress';

interface TacticalChoiceProps {
  level: Level;
}

export default function TacticalChoice({ level }: TacticalChoiceProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const { submitAnswer, isLoading } = useGameStore();
  const {
    result,
    isSuccess,
    xpGained,
    resetProgress,
    applySubmitResponse,
    applySubmitError,
    hasNextLevel,
    goToNextLevel,
  } = useTaskProgress();

  const handleSubmit = async (event?: React.MouseEvent) => {
    preventTaskMouseDefault(event);
    if (!selectedChoice) return;

    try {
      const response = await submitAnswer(selectedChoice);
      applySubmitResponse(response, t, () => setSelectedChoice(null));
    } catch (error) {
      applySubmitError(error, t);
    }
  };

  useEffect(() => {
    resetProgress();
    setSelectedChoice(null);
  }, [level.level_id, resetProgress]);

  const choices = level.work_area.choices || [];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {choices.map((choice) => (
          <motion.label
            key={choice.id}
            whileHover={{ x: 4 }}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
              selectedChoice === choice.id
                ? 'bg-cyber-primary/20 border-cyber-primary cyber-glow'
                : 'bg-cyber-panel border-cyber-border hover:border-cyber-primary/50'
            }`}
          >
            <input
              type="radio"
              name="choice"
              value={choice.id}
              checked={selectedChoice === choice.id}
              onChange={(e) => setSelectedChoice(e.target.value)}
              className="mt-1 w-5 h-5 text-cyber-primary focus:ring-cyber-primary"
            />
            <span className="flex-1 text-sm">{choice.text}</span>
          </motion.label>
        ))}
      </div>

      <TaskSubmitButton
        disabled={isLoading || !selectedChoice}
        onClick={(event) => {
          preventTaskMouseDefault(event);
          handleSubmit();
        }}
      >
        {isLoading ? t('executing', { ns: 'tasks' }) : t('execute', { ns: 'tasks' })}
      </TaskSubmitButton>

      <TaskResultPanel
        result={result}
        isSuccess={isSuccess}
        xpGained={xpGained}
        hasNextLevel={hasNextLevel()}
        onNextLevel={goToNextLevel}
        t={t}
      />

      <TaskHints hints={level.hints ?? []} />
    </div>
  );
}
