import { useCallback, useState } from 'react';
import type { TFunction } from 'i18next';
import type { SubmitAnswerResponse } from '@cybertactics/shared';
import { useGameStore } from '../../store/gameStore';

export function preventTaskMouseDefault(event?: React.MouseEvent): void {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
}

export function useTaskProgress() {
  const { loadLevel, levels, currentLevel } = useGameStore();
  const [result, setResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);

  const resetProgress = useCallback(() => {
    setIsSuccess(false);
    setResult(null);
    setXpGained(null);
    setNextLevelId(null);
  }, []);

  const applySubmitResponse = useCallback(
    (response: SubmitAnswerResponse | null | undefined, t: TFunction, onSuccess?: () => void) => {
      if (response?.success) {
        setIsSuccess(true);
        setXpGained(response.xpGained ?? null);
        setNextLevelId(response.nextLevelId ?? null);
        setResult(
          `${t('success', { ns: 'tasks' })}\n${response.message || t('taskCompleted', { ns: 'tasks' })}`
        );
        onSuccess?.();
        return;
      }

      setIsSuccess(false);
      setResult(
        `${t('failure', { ns: 'tasks' })}\n${response?.message || t('wrongAnswer', { ns: 'tasks' })}`
      );
    },
    []
  );

  const applySubmitError = useCallback((error: unknown, t: TFunction) => {
    setIsSuccess(false);
    setResult(
      `${t('error', { ns: 'tasks' })}\n${error instanceof Error ? error.message : t('errorOccurred', { ns: 'tasks' })}`
    );
  }, []);

  const hasNextLevel = useCallback(() => {
    if (nextLevelId) return true;
    const currentIndex = levels.findIndex((level) => level.level_id === currentLevel?.level_id);
    return currentIndex >= 0 && currentIndex < levels.length - 1;
  }, [currentLevel?.level_id, levels, nextLevelId]);

  const goToNextLevel = useCallback(() => {
    if (nextLevelId) {
      loadLevel(nextLevelId);
    } else {
      const currentIndex = levels.findIndex((level) => level.level_id === currentLevel?.level_id);
      if (currentIndex >= 0 && currentIndex < levels.length - 1) {
        loadLevel(levels[currentIndex + 1].level_id);
      }
    }
    resetProgress();
  }, [currentLevel?.level_id, levels, loadLevel, nextLevelId, resetProgress]);

  return {
    result,
    isSuccess,
    xpGained,
    nextLevelId,
    resetProgress,
    applySubmitResponse,
    applySubmitError,
    hasNextLevel,
    goToNextLevel,
    setResult,
    setIsSuccess,
    setXpGained,
    setNextLevelId,
  };
}
