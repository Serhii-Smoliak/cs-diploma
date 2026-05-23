import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import type { Level } from '@cybertactics/shared';
import { motion, AnimatePresence } from 'framer-motion';
import TaskHints from './TaskHints';

interface TacticalChoiceProps {
  level: Level;
}

export default function TacticalChoice({ level }: TacticalChoiceProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);
  const { submitAnswer, isLoading, loadLevel, levels, currentLevel } = useGameStore();

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedChoice) return;

    try {
      const response = await submitAnswer(selectedChoice);
      
      if (response?.success) {
        setIsSuccess(true);
        setXpGained(response.xpGained || null);
        setNextLevelId(response.nextLevelId || null);
        setResult(`${t('success', { ns: 'tasks' })}\n${response.message || t('taskCompleted', { ns: 'tasks' })}`);
        
        setSelectedChoice(null);
      } else {
        setIsSuccess(false);
        setResult(`${t('failure', { ns: 'tasks' })}\n${response?.message || t('wrongAnswer', { ns: 'tasks' })}`);
      }
    } catch (error) {
      setIsSuccess(false);
      setResult(`${t('error', { ns: 'tasks' })}\n${error instanceof Error ? error.message : t('errorOccurred', { ns: 'tasks' })}`);
    }
  };

  const handleNextLevel = () => {
    if (nextLevelId) {
      loadLevel(nextLevelId);
      setIsSuccess(false);
      setResult(null);
      setXpGained(null);
      setNextLevelId(null);
    } else {
      const currentIndex = levels.findIndex((l) => l.level_id === currentLevel?.level_id);
      if (currentIndex >= 0 && currentIndex < levels.length - 1) {
        const nextLevel = levels[currentIndex + 1];
        loadLevel(nextLevel.level_id);
        setIsSuccess(false);
        setResult(null);
        setXpGained(null);
        setNextLevelId(null);
      }
    }
  };

  const hasNextLevel = () => {
    if (nextLevelId) return true;
    const currentIndex = levels.findIndex((l) => l.level_id === currentLevel?.level_id);
    return currentIndex >= 0 && currentIndex < levels.length - 1;
  };

  useEffect(() => {
    setIsSuccess(false);
    setResult(null);
    setSelectedChoice(null);
    setXpGained(null);
    setNextLevelId(null);
  }, [level.level_id]);

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

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit();
        }}
        disabled={isLoading || !selectedChoice}
        className="w-full cyber-button-success py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('executing', { ns: 'tasks' }) : t('execute', { ns: 'tasks' })}
      </motion.button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg ${
              isSuccess
                ? 'bg-green-900/30 text-cyber-success border-0'
                : 'bg-red-900/20 text-cyber-danger border border-cyber-danger'
            }`}
          >
            <div className="flex items-start gap-3">
              {isSuccess && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-2xl"
                >
                  ✓
                </motion.span>
              )}
              <div className="flex-1">
                {isSuccess && (
                  <>
                    <div className="text-cyber-success font-bold text-lg mb-2">{t('successTitle', { ns: 'tasks' })}</div>
                    {xpGained && (
                      <div className="text-cyber-success font-bold text-xl mb-3">
                        +{xpGained} XP
                      </div>
                    )}
                  </>
                )}
                {!isSuccess && (
                  <pre className="whitespace-pre-wrap font-mono text-sm mb-3">{result}</pre>
                )}
                {isSuccess && hasNextLevel() && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextLevel}
                    className="w-full cyber-button py-3 text-base"
                  >
                    {t('nextLevel', { ns: 'tasks' })} →
                  </motion.button>
                )}
                {isSuccess && !hasNextLevel() && (
                  <div className="text-cyber-success font-medium text-sm">
                    {t('allCompleted', { ns: 'tasks' })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskHints hints={level.hints ?? []} />
    </div>
  );
}

