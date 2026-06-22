import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n, { loadMultipleNamespaces } from '../i18n/config';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { api, type MitreTechnique } from '../services/api';
import type { Level } from '@cybertactics/shared';
import { AnimatePresence } from 'framer-motion';
import MitreTechniqueChip from '../components/mitre/MitreTechniqueChip';
import AssignmentPanel from '../components/missions/AssignmentPanel';
import AssignmentListItem from '../components/missions/AssignmentListItem';
import MissionKillChainSection from '../components/missions/MissionKillChainSection';

const KILL_CHAIN_STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

type KillChainLocaleCopy = {
  title: string;
  intro: string;
  steps: string[];
  expandLabel: string;
  collapseLabel: string;
};

const KILL_CHAIN_MISSION_DEFAULTS: Record<
  string,
  { en: KillChainLocaleCopy; uk: KillChainLocaleCopy }
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
    return translated === translationKey ? fallbackName : translated;
  };

  const getMissionDescription = (missionId: string, fallbackDescription: string): string => {
    const translationKey = `${missionId}.description`;
    const translated = t(translationKey, { ns: 'missions', defaultValue: fallbackDescription });
    return translated === translationKey ? fallbackDescription : translated;
  };

  const getMissionKillChain = (
    missionId: string
  ): {
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
      return translated === key ? fallback : translated;
    };

    return {
      title: translate('title', defaults.title),
      intro: translate('intro', defaults.intro),
      steps: KILL_CHAIN_STEP_KEYS.map((stepKey, index) =>
        translate(stepKey, defaults.steps[index])
      ),
      expandLabel: translate('expand', defaults.expandLabel),
      collapseLabel: translate('collapse', defaults.collapseLabel),
    };
  };

  const getLevelTitle = (levelId: string, fallbackTitle: string): string => {
    const translationKey = `${levelId}.title`;
    const translated = t(translationKey, { ns: 'levels', defaultValue: fallbackTitle });
    return translated === translationKey ? fallbackTitle : translated;
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
    return translated === key ? fallback : translated;
  };

  const getTechniqueDescription = (techniqueId: string, fallback: string | null): string => {
    const key = `technique.description.${techniqueId}`;
    const translated = t(key, { ns: 'mitre', defaultValue: fallback || '' });
    return translated === key ? fallback || '' : translated;
  };

  const getTacticLabel = (tactic: string): string => {
    const key = `tactic.${tactic}`;
    const translated = t(key, { ns: 'mitre', defaultValue: tactic });
    return translated === key ? tactic : translated;
  };

  const getTacticExplanation = (tactic: string): string => {
    const key = `tactic.explanation.${tactic}`;
    const translated = t(key, { ns: 'mitre', defaultValue: '' });
    return translated === key ? '' : translated;
  };

  useEffect(() => {
    setSelectedLevelId(null);
  }, [missionId]);

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
          progress.forEach((p) => {
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
      const mission = missions.find((m) => m.id === missionId);

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
          progress.forEach((p) => {
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
        <div className="text-cyber-primary font-heading">
          {t('loadingAssignments', { ns: 'ui' })}
        </div>
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
    ? (levels.find((level) => level.level_id === selectedLevelId) ?? null)
    : null;
  const selectedLevelIndex = selectedLevel
    ? levels.findIndex((level) => level.level_id === selectedLevel.level_id)
    : -1;
  const selectedKillChainStep =
    killChain && selectedLevelIndex >= 0 ? killChain.steps[selectedLevelIndex] : null;
  const selectedIsCompleted = selectedLevel ? userProgress[selectedLevel.level_id] || false : false;

  const assignmentPanel = (
    <AssignmentPanel
      isEn={isEn}
      selectedLevel={selectedLevel}
      selectedLevelIndex={selectedLevelIndex}
      killChainStep={selectedKillChainStep}
      isCompleted={selectedIsCompleted}
      onStart={handleStartAssignment}
      getLevelTitle={getLevelTitle}
      getTaskTypeLabel={getTaskTypeLabel}
      getTechniqueName={getTechniqueName}
      getTacticLabel={getTacticLabel}
      getTacticExplanation={getTacticExplanation}
      getTechniqueDescription={getTechniqueDescription}
    />
  );

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
          <MissionKillChainSection
            killChain={killChain}
            isOpen={killChainOpen}
            onToggle={() => setKillChainOpen((open) => !open)}
          />
        )}
        {currentMission.mitreTechniques.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">{t('mitreTechniques', { ns: 'ui' })}</div>
            <div className="flex flex-wrap gap-2">
              {currentMission.mitreTechniques.map((techId) => {
                const tech = mitreTechniques[techId];
                return <MitreTechniqueChip key={techId} techniqueId={techId} title={tech?.name} />;
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
          {levels.map((level, index) => (
            <AssignmentListItem
              key={level.level_id}
              level={level}
              index={index}
              isCompleted={userProgress[level.level_id] || false}
              isAvailable={isAssignmentAvailable(index)}
              isSelected={selectedLevelId === level.level_id}
              isEn={isEn}
              title={getLevelTitle(level.level_id, level.title)}
              taskTypeLabel={getTaskTypeLabel(level.task_type)}
              onSelect={handleSelectAssignment}
              onStart={handleStartAssignment}
            />
          ))}
        </div>

        {selectedLevel && (
          <div className="lg:hidden mt-4">
            <AnimatePresence mode="wait">{assignmentPanel}</AnimatePresence>
          </div>
        )}

        <aside className="hidden lg:flex min-w-0">
          <AnimatePresence mode="wait">{assignmentPanel}</AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
