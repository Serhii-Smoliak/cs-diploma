import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import type { Level } from '@cybertactics/shared';
import { motion } from 'framer-motion';
import MitreTechniqueBadge from '../components/mitre/MitreTechniqueBadge';

export default function MissionAssignmentsPage() {
  const { t } = useTranslation(['missions', 'ui']);
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { currentMission, levels, setMission, loadLevel } = useGameStore();
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const getMissionName = (missionId: string, fallbackName: string): string => {
    const translationKey = `${missionId}.name`;
    const translated = t(translationKey, { ns: 'missions', defaultValue: fallbackName });
    return translated !== translationKey ? translated : fallbackName;
  };

  const getMissionDescription = (missionId: string, fallbackDescription: string): string => {
    const translationKey = `${missionId}.description`;
    const translated = t(translationKey, { ns: 'missions', defaultValue: fallbackDescription });
    return translated !== translationKey ? translated : fallbackDescription;
  };

  useEffect(() => {
    if (!missionId) {
      navigate('/missions');
      return;
    }

    loadMissionData();
  }, [missionId]);

  // Оновлюємо прогрес після повернення на сторінку (наприклад, після виконання завдання)
  useEffect(() => {
    const refreshProgress = async () => {
      const authStore = useAuthStore.getState();
      if (authStore.user?.id && currentMission) {
        try {
          const progress = await api.getUserProgress(authStore.user.id);
          const progressMap: Record<string, boolean> = {};
          progress.forEach(p => {
            progressMap[p.levelId] = p.completed;
          });
          setUserProgress(progressMap);
        } catch (error) {
          console.error('Failed to refresh user progress:', error);
        }
      }
    };

    // Оновлюємо прогрес, коли вікно знову в фокусі
    const handleFocus = () => {
      refreshProgress();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentMission]);

  const loadMissionData = async () => {
    try {
      setLoading(true);
      
      // Завантажуємо місію
      const missions = await api.getMissions();
      const mission = missions.find(m => m.id === missionId);
      
      if (!mission) {
        navigate('/missions');
        return;
      }

      // Підключаємо місію (завантажить завдання, але не обере поточне)
      await setMission(mission);

      // Завантажуємо прогрес користувача
      const authStore = useAuthStore.getState();
      if (authStore.user?.id) {
        try {
          const progress = await api.getUserProgress(authStore.user.id);
          const progressMap: Record<string, boolean> = {};
          progress.forEach(p => {
            progressMap[p.levelId] = p.completed;
          });
          setUserProgress(progressMap);
        } catch (error) {
          console.error('Failed to load user progress:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load mission:', error);
      navigate('/missions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssignment = async (level: Level) => {
    await loadLevel(level.level_id);
    navigate(`/missions/${missionId}/assignments/${level.level_id}`);
  };

  // Чи доступне завдання за порядком
  const isAssignmentAvailable = (levelIndex: number): boolean => {
    // Перше завдання завжди доступне
    if (levelIndex === 0) return true;
    
    // Чи виконано попереднє завдання
    const previousLevel = levels[levelIndex - 1];
    if (!previousLevel) return true;
    
    return userProgress[previousLevel.level_id] || false;
  };

  const handleBackToMissions = () => {
    navigate('/missions');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyber-primary font-heading">{t('loadingAssignments', { ns: 'ui' })}</div>
      </div>
    );
  }

  if (!currentMission || levels.length === 0) {
    return (
      <div className="p-8">
        <button
          onClick={handleBackToMissions}
          className="mb-4 text-cyber-primary hover:text-cyber-success transition-colors"
        >
          ← {t('backToMissions', { ns: 'ui' })}
        </button>
        <div className="text-center py-12 text-gray-400">
          {t('assignmentsNotFound', { ns: 'ui' })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBackToMissions}
          className="mb-4 text-cyber-primary hover:text-cyber-success transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>{t('backToMissions', { ns: 'ui' })}</span>
        </button>
        <h1 className="font-heading font-bold text-3xl text-cyber-primary mb-2">
          {getMissionName(currentMission.id, currentMission.name)}
        </h1>
        {currentMission.description && (
          <p className="text-gray-400">{getMissionDescription(currentMission.id, currentMission.description)}</p>
        )}
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-cyber-primary mb-4">
          {t('missionAssignmentsSubtitle', { ns: 'ui', count: levels.length })}
        </h2>
        
        {levels.map((level, index) => {
          const isCompleted = userProgress[level.level_id] || false;
          const isAvailable = isAssignmentAvailable(index);
          
          return (
            <motion.div
              key={level.level_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={isAvailable ? { scale: 1.02 } : {}}
              whileTap={isAvailable ? { scale: 0.98 } : {}}
              onClick={() => isAvailable && handleStartAssignment(level)}
              className={`cyber-panel p-6 border-2 transition-all duration-300 ${
                !isAvailable
                  ? 'border-cyber-border/30 opacity-50 cursor-not-allowed'
                  : isCompleted
                  ? 'border-cyber-success hover:border-cyber-success hover:cyber-glow cursor-pointer'
                  : 'border-cyber-border hover:border-cyber-primary hover:cyber-glow cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-cyber-primary font-mono text-sm">
                      {t('assignmentLabel', { ns: 'ui', n: index + 1 })}
                    </span>
                    {isCompleted && (
                      <span className="text-xs px-2 py-1 bg-cyber-success/20 text-cyber-success rounded border border-cyber-success">
                        {t('assignmentCompleted', { ns: 'ui' })}
                      </span>
                    )}
                    {!isAvailable && !isCompleted && (
                      <span className="text-xs px-2 py-1 bg-gray-800/50 text-gray-500 rounded border border-gray-700">
                        {t('assignmentLocked', { ns: 'ui' })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-cyber-primary mb-2">
                    {level.title}
                  </h3>
                  
                  {/* MITRE Technique */}
                  {level.mitre_technique && (
                    <div className="mb-3">
                      <MitreTechniqueBadge
                        technique={level.mitre_technique}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Task Type */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">{t('taskTypeLabel', { ns: 'ui' })}</span>
                    <span className="text-xs px-2 py-1 bg-cyber-panel border border-cyber-border rounded text-cyber-primary">
                      {level.task_type === 'code_editor' && t('taskTypeCodeEditor', { ns: 'ui' })}
                      {level.task_type === 'tactical_choice' && t('taskTypeTacticalChoice', { ns: 'ui' })}
                      {level.task_type === 'phishing_constructor' && t('taskTypePhishingConstructor', { ns: 'ui' })}
                    </span>
                  </div>

                  {/* Rewards */}
                  {level.rewards && (
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {level.rewards.xp > 0 && (
                        <span>XP: +{level.rewards.xp}</span>
                      )}
                      {level.rewards.stealth_impact !== 0 && (
                        <span>
                          Stealth: {level.rewards.stealth_impact > 0 ? '+' : ''}
                          {level.rewards.stealth_impact}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-cyber-primary">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

