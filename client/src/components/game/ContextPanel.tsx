import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore.ts';
import { useAuthStore } from '@/store/authStore.ts';
import { api } from '@/services/api.ts';
import HandlerAvatar from './HandlerAvatar';
import DialogueLog from './DialogueLog';
import MitreTechniqueBadge from '../mitre/MitreTechniqueBadge';

export default function ContextPanel() {
  const { t } = useTranslation(['ui', 'common']);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const currentMission = useGameStore((state) => state.currentMission);
  const user = useAuthStore((state) => state.user);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);

  useEffect(() => {
    const checkCompletion = async () => {
      if (!currentLevel || !user?.id) {
        setIsCompleted(false);
        setLastAnswer(null);
        return;
      }

      try {
        const progress = await api.getUserProgress(user.id);
        const levelProgress = progress.find(p => p.levelId === currentLevel.level_id);
        setIsCompleted(levelProgress?.completed || false);
        setLastAnswer(levelProgress?.lastAnswer || null);
      } catch (error) {
        console.error('Failed to check completion:', error);
        setIsCompleted(false);
        setLastAnswer(null);
      }
    };

    checkCompletion();
  }, [currentLevel, user]);

  return (
    <div className="h-full cyber-panel flex flex-col">
      <div className="border-b border-cyber-border pb-3 mb-4">
        <h3 className="font-heading font-bold text-lg text-cyber-primary">{t('contextPanel', { ns: 'ui' })}</h3>
      </div>

      {isCompleted && (
        <div className="mb-4 pb-4 border-b border-cyber-border">
          <div className="px-3 py-2 bg-cyber-success/20 border border-cyber-success rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-cyber-success text-lg">✓</span>
              <span className="text-cyber-success font-medium text-sm">{t('taskCompleted', { ns: 'ui' })}</span>
            </div>
          </div>
        </div>
      )}

      {currentLevel?.mitre_technique && (
        <div className="mb-4 pb-4 border-b border-cyber-border">
          <div className="text-xs text-gray-500 mb-2">{t('currentMitreTechnique', { ns: 'ui' })}</div>
          <MitreTechniqueBadge 
            technique={currentLevel.mitre_technique} 
            size="sm"
            showDescription={false}
          />
        </div>
      )}

      <HandlerAvatar />

      {isCompleted && lastAnswer && (() => {
        let displayAnswer = lastAnswer;
        if (currentLevel?.task_type === 'tactical_choice' && currentLevel?.work_area?.choices) {
          const choice = currentLevel.work_area.choices.find((c: any) => c.id === lastAnswer);
          if (choice) {
            displayAnswer = choice.text;
          }
        }
        
        return (
          <div className="mb-4 pb-4 border-b border-cyber-border">
            <div className="px-3 py-2 bg-cyber-primary/10 border border-cyber-primary rounded-lg">
              <div className="text-cyber-primary font-medium text-sm mb-2">
                {t('yourPreviousCorrectAnswer', { ns: 'ui' })}
              </div>
              <div className="text-cyber-primary text-sm whitespace-pre-wrap">
                {displayAnswer}
              </div>
            </div>
          </div>
        );
      })()}

      {!isCompleted && currentLevel?.validation && (() => {
        const validation = currentLevel.validation as any;
        let correctAnswer: string | null = null;
        
        if (validation?.type === 'regex_match') {
          correctAnswer = validation.correct_pattern || null;
        } else if (validation?.type === 'choice') {
          correctAnswer = validation.correct_choice_id || null;
          if (correctAnswer && currentLevel?.work_area?.choices) {
            const choice = currentLevel.work_area.choices.find((c: any) => c.id === correctAnswer);
            if (choice) {
              correctAnswer = choice.text;
            }
          }
        } else {
          correctAnswer = validation?.expected_answer || 
                          validation?.correct_answer || 
                          validation?.answer || null;
        }
        
        return correctAnswer ? (
          <div className="mb-4 pb-4 border-b border-cyber-border">
            <div className="px-3 py-2 bg-green-900/20 border border-green-500/50 rounded-lg">
              <div className="text-green-400 font-medium text-sm mb-2">
                {t('correctAnswerForTraining', { ns: 'ui' })}
              </div>
              <div className="text-green-300 text-sm whitespace-pre-wrap">
                {correctAnswer}
              </div>
            </div>
          </div>
        ) : null;
      })()}

      <div className="flex-1 mt-4 overflow-hidden">
        <DialogueLog dialogues={currentLevel?.dialogue || []} />
      </div>
    </div>
  );
}

