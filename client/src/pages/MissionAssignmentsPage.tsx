import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n, { loadMultipleNamespaces } from '../i18n/config';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { api, type MitreTechnique } from '../services/api';
import type { Level } from '@cybertactics/shared';
import { motion, AnimatePresence } from 'framer-motion';
import MitreTechniqueChip from '../components/mitre/MitreTechniqueChip';

const KILL_CHAIN_STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

const KILL_CHAIN_MISSION_DEFAULTS: Record<
  string,
  { en: (typeof KILL_CHAIN_COPY)['en']; uk: (typeof KILL_CHAIN_COPY)['uk'] }
> = {
  operation_ghost: {
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
  },
  operation_iron_signal: {
    en: {
      title: 'Attack progression',
      intro: 'Intermediate mission — post-perimeter tactics in order:',
      steps: [
        'Discovery — find service account in AD dump (task 1)',
        'Credential Access — password spray strategy (task 2)',
        'Initial Access — spearphishing link email (task 3)',
        'Lateral Movement — RDP via jump host (task 4)',
        'Execution — certutil staging download (task 5)',
      ],
      expandLabel: 'Show attack progression',
      collapseLabel: 'Hide attack progression',
    },
    uk: {
      title: 'Етапи атаки',
      intro: 'Місія intermediate — тактики після периметра по порядку:',
      steps: [
        'Discovery — знайти service account у AD dump (завдання 1)',
        'Credential Access — стратегія password spray (завдання 2)',
        'Initial Access — spearphishing з посиланням (завдання 3)',
        'Lateral Movement — RDP через jump host (завдання 4)',
        'Execution — завантаження staging через certutil (завдання 5)',
      ],
      expandLabel: 'Показати етапи атаки',
      collapseLabel: 'Згорнути етапи атаки',
    },
  },
};

const KILL_CHAIN_COPY = KILL_CHAIN_MISSION_DEFAULTS.operation_ghost;

function getLocaleCode(): 'en' | 'uk' {
  const raw = i18n.resolvedLanguage || i18n.language || 'uk';
  return raw.startsWith('en') ? 'en' : 'uk';
}

export default function MissionAssignmentsPage() {
  const { t } = useTranslation(['missions', 'ui', 'levels', 'mitre']);
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { currentMission, levels, setMission, loadLevel } = useGameStore();
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [mitreTechniques, setMitreTechniques] = useState<Record<string, MitreTechnique>>({});
  const [loading, setLoading] = useState(true);
  const [killChainOpen, setKillChainOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
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
    if (!KILL_CHAIN_MISSION_DEFAULTS[missionId]) return null;

    const locale = getLocaleCode();
    const defaults = KILL_CHAIN_MISSION_DEFAULTS[missionId][locale];
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

  const getTaskTypeLabel = (taskType: Level['task_type']): string => {
    switch (taskType) {
      case 'code_editor':
        return t('taskTypeCodeEditor', { ns: 'ui' });
      case 'tactical_choice':
        return t('taskTypeTacticalChoice', { ns: 'ui' });
      case 'phishing_constructor':
        return t('taskTypePhishingConstructor', { ns: 'ui' });
      case 'sentence_constructor':
        return t('taskTypeSentenceConstructor', { ns: 'ui' });
      default:
        return taskType;
    }
  };

  const isEn = getLocaleCode() === 'en';

  const getTechniqueName = (techniqueId: string, fallback: string): string => {
    const key = `technique.name.${techniqueId}`;
    const translated = t(key, { ns: 'mitre', defaultValue: fallback });
    return translated !== key ? translated : fallback;
  };

  const getTechniqueDescription = (techniqueId: string, fallback: string | null): string => {
    const key = `technique.description.${techniqueId}`;
    const translated = t(key, { ns: 'mitre', defaultValue: fallback || '' });
    return translated !== key ? translated : (fallback || '');
  };

  const getTacticLabel = (tactic: string): string => {
    const key = `tactic.${tactic}`;
    const translated = t(key, { ns: 'mitre', defaultValue: tactic });
    return translated !== key ? translated : tactic;
  };

  const getTacticExplanation = (tactic: string): string => {
    const key = `tactic.explanation.${tactic}`;
    const translated = t(key, { ns: 'mitre', defaultValue: '' });
    return translated !== key ? translated : '';
  };

  /* eslint-disable react-hooks/exhaustive-deps -- load when missionId changes */
  useEffect(() => {
    setSelectedLevelId(null);
  }, [missionId]);
  /* eslint-enable react-hooks/exhaustive-deps */

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
    loadMultipleNamespaces(locale, ['missions', 'mitre'])
      .then(() => setTranslationsTick((tick) => tick + 1))
      .catch((error) => {
        console.error('Failed to reload mission translations:', error);
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

  const handleSelectAssignment = (level: Level) => {
    setSelectedLevelId(level.level_id);
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
  const selectedLevel = selectedLevelId
    ? levels.find((level) => level.level_id === selectedLevelId) ?? null
    : null;
  const selectedLevelIndex = selectedLevel
    ? levels.findIndex((level) => level.level_id === selectedLevel.level_id)
    : -1;

  const renderAssignmentPanel = (className = '') => {
    if (!selectedLevel) {
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

    const technique = selectedLevel.mitre_technique;
    const killChainStep =
      killChain && selectedLevelIndex >= 0 ? killChain.steps[selectedLevelIndex] : null;
    const isCompleted = userProgress[selectedLevel.level_id] || false;

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
              {getTacticExplanation(technique.tactic) && (
                <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                  {getTacticExplanation(technique.tactic)}
                </p>
              )}
              <p className="text-sm text-gray-300 leading-relaxed">
                {getTechniqueDescription(technique.id, technique.description)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed">
              {getTaskTypeLabel(selectedLevel.task_type)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 px-3 py-2.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">
              {t('taskTypeCaption', { ns: 'ui' })}
            </span>
            <span className="text-sm text-cyber-primary font-medium leading-tight">
              {getTaskTypeLabel(selectedLevel.task_type)}
            </span>
          </div>

          <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 px-3 py-2.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">
              {t('xp', { ns: 'ui' })}
            </span>
            <span className="text-sm text-cyber-primary font-mono font-medium">
              +{selectedLevel.rewards?.xp ?? 0}
            </span>
          </div>

          <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 px-3 py-2.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">
              {t('stealth', { ns: 'ui' })}
            </span>
            <span
              className={`text-sm font-mono font-medium ${
                (selectedLevel.rewards?.stealth_impact ?? 0) < 0
                  ? 'text-orange-400'
                  : (selectedLevel.rewards?.stealth_impact ?? 0) > 0
                    ? 'text-green-400'
                    : 'text-gray-400'
              }`}
            >
              {(selectedLevel.rewards?.stealth_impact ?? 0) > 0 ? '+' : ''}
              {selectedLevel.rewards?.stealth_impact ?? 0}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleStartAssignment(selectedLevel)}
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
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-2">
          {getMissionName(currentMission.id, currentMission.name)}
        </h1>
        {currentMission.description && (
          <p className="max-w-2xl text-sm text-gray-300 leading-relaxed border border-cyber-border rounded-lg bg-cyber-panel/40 px-3 py-2.5">
            {getMissionDescription(currentMission.id, currentMission.description)}
          </p>
        )}
        {killChain && (
          <div className="mt-3 max-w-2xl border border-cyber-border rounded-lg bg-cyber-panel/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setKillChainOpen((open) => !open)}
              className="w-full flex items-center justify-between gap-2 py-1.5 px-3 min-h-0 text-left hover:bg-cyber-panel/60 transition-colors"
              aria-expanded={killChainOpen}
              title={killChainOpen ? killChain.collapseLabel : killChain.expandLabel}
            >
              <span className="font-heading font-bold text-xs text-cyber-primary leading-none">
                {killChain.title}
              </span>
              <motion.span
                animate={{ rotate: killChainOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-cyber-primary text-[10px] leading-none flex-shrink-0"
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
                  <div className="px-3 pb-2.5 max-h-48 overflow-y-auto cyber-scrollbar border-t border-cyber-border pt-2">
                    <p className="text-xs text-gray-400 mb-2">{killChain.intro}</p>
                    <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside leading-relaxed">
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
                return (
                  <MitreTechniqueChip
                    key={techId}
                    techniqueId={techId}
                    title={tech?.name}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Assignments */}
      <h2 className="font-heading font-bold text-xl text-cyber-primary mb-4">
        {t('missionAssignmentsSubtitle', { ns: 'ui', count: levels.length })}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="min-w-0 space-y-2">
            {levels.map((level, index) => {
              const isCompleted = userProgress[level.level_id] || false;
              const isAvailable = isAssignmentAvailable(index);
              const isSelected = selectedLevelId === level.level_id;

              return (
                <motion.div
                  key={level.level_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-full cyber-panel p-3 sm:p-4 border-2 transition-all duration-200 ${
                    !isAvailable
                      ? 'border-cyber-border/30 opacity-50'
                      : isSelected
                      ? 'border-cyber-success bg-green-900/10'
                      : isCompleted
                      ? 'border-cyber-success hover:border-cyber-success hover:bg-green-900/10'
                      : 'border-cyber-border hover:border-cyber-primary hover:bg-cyber-primary/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? 'border-cyber-success text-cyber-success bg-green-900/20'
                          : !isAvailable
                          ? 'border-gray-600 text-gray-500'
                          : 'border-cyber-primary text-cyber-primary bg-cyber-primary/10'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && handleSelectAssignment(level)}
                      className={`flex-1 min-w-0 text-left ${
                        isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium ${
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

                      <h3 className="font-heading font-bold text-base text-cyber-primary leading-snug">
                        {getLevelTitle(level.level_id, level.title)}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500 truncate">
                        {level.mitre_technique?.id && (
                          <span className="font-mono text-cyber-primary/80 mr-2">
                            {level.mitre_technique.id}
                          </span>
                        )}
                        {getTaskTypeLabel(level.task_type)}
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && void handleStartAssignment(level)}
                      title={t('assignmentStart', {
                        ns: 'ui',
                        defaultValue: isEn ? 'Start assignment' : 'Почати завдання',
                      })}
                      className={`flex-shrink-0 self-center p-1 rounded transition-colors ${
                        !isAvailable
                          ? 'text-gray-500 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'text-cyber-success hover:bg-cyber-success/10 cursor-pointer'
                          : 'text-white hover:text-cyber-primary hover:bg-cyber-primary/10 cursor-pointer'
                      }`}
                      aria-label={t('assignmentStart', {
                        ns: 'ui',
                        defaultValue: isEn ? 'Start assignment' : 'Почати завдання',
                      })}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })}
        </div>

        {selectedLevel && (
          <div className="lg:hidden mt-4">
            <AnimatePresence mode="wait">{renderAssignmentPanel()}</AnimatePresence>
          </div>
        )}

        <aside className="hidden lg:flex min-w-0">
          <AnimatePresence mode="wait">{renderAssignmentPanel()}</AnimatePresence>
        </aside>
      </div>
    </div>
  );
}

