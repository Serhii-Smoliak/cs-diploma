import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n, { loadMultipleNamespaces } from '../i18n/config';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { api, type MitreTechnique } from '../services/api';
import type { Level } from '@cybertactics/shared';
import { motion, AnimatePresence } from 'framer-motion';
import MitreTechniqueBadge from '../components/mitre/MitreTechniqueBadge';

const KILL_CHAIN_STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

const KILL_CHAIN_COPY = {
  en: {
    title: 'Cyber Kill Chain',
    intro: 'Mission tasks follow the attack stages in order:',
    steps: [
      'Reconnaissance — find the admin email (task 1)',
      'Resource Development — choose a phishing domain (task 2)',
      'Initial Access — craft a phishing email (task 3)',
      'Execution — run a PowerShell payload (task 4)',
      'Persistence — registry autostart (task 5)',
    ],
    expandLabel: 'Show Cyber Kill Chain',
    collapseLabel: 'Hide Cyber Kill Chain',
  },
  uk: {
    title: 'Ланцюг кібератак',
    intro: 'Завдання місії відповідають етапам атаки по порядку:',
    steps: [
      'Розвідка — знайти email адміністратора (завдання 1)',
      'Розробка ресурсів — обрати домен для фішингу (завдання 2)',
      'Початковий доступ — фішинговий лист (завдання 3)',
      'Виконання — запуск PowerShell payload (завдання 4)',
      'Стійкість — автозапуск через реєстр (завдання 5)',
    ],
    expandLabel: 'Показати ланцюг кібератак',
    collapseLabel: 'Згорнути ланцюг кібератак',
  },
} as const;

function getLocaleCode(): 'en' | 'uk' {
  const raw = i18n.resolvedLanguage || i18n.language || 'uk';
  return raw.startsWith('en') ? 'en' : 'uk';
}

export default function MissionAssignmentsPage() {
  const { t } = useTranslation(['missions', 'ui', 'levels']);
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { currentMission, levels, setMission, loadLevel } = useGameStore();
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [mitreTechniques, setMitreTechniques] = useState<Record<string, MitreTechnique>>({});
  const [loading, setLoading] = useState(true);
  const [killChainOpen, setKillChainOpen] = useState(false);
  const [, setTranslationsTick] = useState(0);

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

  const getMissionKillChain = (missionId: string): {
    title: string;
    intro: string;
    steps: string[];
    expandLabel: string;
    collapseLabel: string;
  } | null => {
    if (missionId !== 'operation_ghost') return null;

    const locale = getLocaleCode();
    const defaults = KILL_CHAIN_COPY[locale];
    const prefix = `${missionId}.killChain`;

    const translate = (suffix: string, fallback: string) => {
      const key = `${prefix}.${suffix}`;
      const translated = t(key, { ns: 'missions', lng: locale, defaultValue: fallback });
      return translated !== key ? translated : fallback;
    };

    return {
      title: translate('title', defaults.title),
      intro: translate('intro', defaults.intro),
      steps: KILL_CHAIN_STEP_KEYS.map((stepKey, index) =>
        translate(stepKey, defaults.steps[index]),
      ),
      expandLabel: translate('expand', defaults.expandLabel),
      collapseLabel: translate('collapse', defaults.collapseLabel),
    };
  };

  const getLevelTitle = (levelId: string, fallbackTitle: string): string => {
    const translationKey = `${levelId}.title`;
    const translated = t(translationKey, { ns: 'levels', defaultValue: fallbackTitle });
    return translated !== translationKey ? translated : fallbackTitle;
  };

  /* eslint-disable react-hooks/exhaustive-deps -- load when missionId changes */
  useEffect(() => {
    if (!missionId) {
      navigate('/missions');
      return;
    }

    loadMissionData();
  }, [missionId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps -- reload translations on language change */
  useEffect(() => {
    const locale = getLocaleCode();
    loadMultipleNamespaces(locale, ['missions'])
      .then(() => setTranslationsTick((tick) => tick + 1))
      .catch((error) => {
        console.error('Failed to reload missions translations:', error);
      });
  }, [i18n.resolvedLanguage, i18n.language]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Оновлюємо прогрес після повернення на сторінку (наприклад, після виконання завдання)
  useEffect(() => {
    const refreshProgress = async () => {
      const authStore = useAuthStore.getState();
      if (authStore.user?.id && currentMission) {
        try {
          const progress = await api.getUserProgress();
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
      
      // Завантажуємо місію та довідник MITRE
      const [missions, techniquesData] = await Promise.all([
        api.getMissions(),
        api.getMitreTechniques(),
      ]);
      const mission = missions.find(m => m.id === missionId);

      const techniquesMap: Record<string, MitreTechnique> = {};
      techniquesData.forEach((tech) => {
        techniquesMap[tech.id] = tech;
      });
      setMitreTechniques(techniquesMap);
      
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
          const progress = await api.getUserProgress();
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyber-primary font-heading">{t('loadingAssignments', { ns: 'ui' })}</div>
      </div>
    );
  }

  if (!currentMission || levels.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12 text-gray-400">
          {t('assignmentsNotFound', { ns: 'ui' })}
        </div>
      </div>
    );
  }

  const killChain = getMissionKillChain(currentMission.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-2">
          {getMissionName(currentMission.id, currentMission.name)}
        </h1>
        {currentMission.description && (
          <p className="text-gray-400">{getMissionDescription(currentMission.id, currentMission.description)}</p>
        )}
        {killChain && (
          <div className="mt-4 cyber-panel border border-cyber-border overflow-hidden">
            <button
              type="button"
              onClick={() => setKillChainOpen((open) => !open)}
              className="w-full flex items-center justify-between gap-2 py-2 px-3 min-h-0 text-left hover:bg-cyber-panel/60 transition-colors"
              aria-expanded={killChainOpen}
              title={killChainOpen ? killChain.collapseLabel : killChain.expandLabel}
            >
              <span className="font-heading font-bold text-sm text-cyber-primary leading-none">
                {killChain.title}
              </span>
              <motion.span
                animate={{ rotate: killChainOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-cyber-primary text-xs leading-none flex-shrink-0"
                aria-hidden
              >
                ▶
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {killChainOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 max-h-56 overflow-y-auto cyber-scrollbar border-t border-cyber-border pt-2">
                    <p className="text-sm text-gray-400 mb-3">{killChain.intro}</p>
                    <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside leading-relaxed">
                      {killChain.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {currentMission.mitreTechniques.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">{t('mitreTechniques', { ns: 'ui' })}</div>
            <div className="flex flex-wrap gap-2">
              {currentMission.mitreTechniques.map((techId) => {
                const tech = mitreTechniques[techId];
                return tech ? (
                  <div
                    key={techId}
                    className="text-xs font-mono px-2 py-1 bg-cyber-panel border border-cyber-border rounded text-cyber-primary"
                    title={tech.name}
                  >
                    {tech.id}
                  </div>
                ) : (
                  <div
                    key={techId}
                    className="text-xs font-mono px-2 py-1 bg-cyber-panel border border-cyber-border rounded text-gray-400"
                  >
                    {techId}
                  </div>
                );
              })}
            </div>
          </div>
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
              className={`cyber-panel p-4 sm:p-6 border-2 transition-all duration-300 ${
                !isAvailable
                  ? 'border-cyber-border/30 opacity-50 cursor-not-allowed'
                  : isCompleted
                  ? 'border-cyber-success hover:border-cyber-success hover:cyber-glow cursor-pointer'
                  : 'border-cyber-border hover:border-cyber-primary hover:cyber-glow cursor-pointer'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isCompleted
                          ? 'text-cyber-success'
                          : !isAvailable
                            ? 'text-red-400'
                            : 'text-yellow-400'
                      }`}
                    >
                      {isCompleted
                        ? t('assignmentStatusCompleted', { ns: 'ui' })
                        : !isAvailable
                          ? t('assignmentStatusLocked', { ns: 'ui' })
                          : t('assignmentStatusIncomplete', { ns: 'ui' })}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-cyber-primary mb-2">
                    {getLevelTitle(level.level_id, level.title)}
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
                    <span className="text-xs text-gray-500">
                      {t('taskTypeCaption', { ns: 'ui' })}
                    </span>
                    <span className="text-xs px-2 py-1 bg-cyber-panel border border-cyber-border rounded text-cyber-primary">
                      {level.task_type === 'code_editor' && t('taskTypeCodeEditor', { ns: 'ui' })}
                      {level.task_type === 'tactical_choice' && t('taskTypeTacticalChoice', { ns: 'ui' })}
                      {level.task_type === 'phishing_constructor' && t('taskTypePhishingConstructor', { ns: 'ui' })}
                      {level.task_type === 'sentence_constructor' && t('taskTypeSentenceConstructor', { ns: 'ui' })}
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

