import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, type MitreTechnique } from '../services/api';
import type { Mission } from '@cybertactics/shared';
import { motion } from 'framer-motion';
import MitreTechniqueChip from '../components/mitre/MitreTechniqueChip';

type MissionStatus = 'none' | 'in_progress' | 'completed';

export default function MissionsPage() {
  const { t } = useTranslation(['missions', 'ui']);
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [mitreTechniques, setMitreTechniques] = useState<Record<string, MitreTechnique>>({});
  const [missionStatus, setMissionStatus] = useState<Record<string, MissionStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const [missionsData, techniquesData, progress] = await Promise.all([
        api.getMissions(),
        api.getMitreTechniques(),
        api.getUserProgress(),
      ]);

      setMissions(missionsData);

      const techniquesMap: Record<string, MitreTechnique> = {};
      techniquesData.forEach((tech) => {
        techniquesMap[tech.id] = tech;
      });
      setMitreTechniques(techniquesMap);

      const progressByLevel = Object.fromEntries(progress.map((p) => [p.levelId, p]));
      const levelsByMission = await Promise.all(
        missionsData.map((mission) => api.getMissionLevels(mission.id))
      );

      const status: Record<string, MissionStatus> = {};
      missionsData.forEach((mission, index) => {
        const levels = levelsByMission[index];
        if (levels.length === 0) {
          status[mission.id] = 'none';
          return;
        }

        const allCompleted = levels.every((level) => progressByLevel[level.level_id]?.completed);
        if (allCompleted) {
          status[mission.id] = 'completed';
          return;
        }

        const hasActivity = levels.some((level) => {
          const entry = progressByLevel[level.level_id];
          return entry && (entry.completed || entry.attempts > 0);
        });
        status[mission.id] = hasActivity ? 'in_progress' : 'none';
      });
      setMissionStatus(status);
    } catch (error) {
      console.error('Failed to load missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMission = async (mission: Mission) => {
    navigate(`/missions/${mission.id}/assignments`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyber-primary font-heading">{t('loadingMissions', { ns: 'ui' })}</div>
      </div>
    );
  }

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-6 sm:mb-8 text-center">
        {t('missions', { ns: 'ui' })}
      </h1>

      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6">
        {missions.map((mission) => {
          const status = missionStatus[mission.id] ?? 'none';

          return (
            <motion.div
              key={mission.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleStartMission(mission)}
              className="w-full min-w-[18rem] max-w-[28rem] sm:flex-1 sm:basis-[calc(50%-0.75rem)] sm:max-w-[28rem] cyber-panel p-6 cursor-pointer border-cyber-border hover:border-cyber-primary transition-colors duration-200 hover:cyber-glow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-heading font-bold text-lg sm:text-xl text-cyber-primary leading-snug">
                  {getMissionName(mission.id, mission.name)}
                </h2>
                {status === 'completed' && (
                  <span
                    className="shrink-0 text-xl text-cyber-success leading-none"
                    title={t('missionCompletedBadge', { ns: 'ui' })}
                    aria-label={t('missionCompletedBadge', { ns: 'ui' })}
                  >
                    ✓
                  </span>
                )}
                {status === 'in_progress' && (
                  <span
                    className="shrink-0 text-xl text-yellow-400 leading-none"
                    title={t('missionInProgressBadge', { ns: 'ui' })}
                    aria-label={t('missionInProgressBadge', { ns: 'ui' })}
                  >
                    ✓
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                {getMissionDescription(mission.id, mission.description)}
              </p>

              {mission.mitreTechniques.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">
                    {t('mitreTechniques', { ns: 'ui' })}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mission.mitreTechniques.slice(0, 3).map((techId) => {
                      const tech = mitreTechniques[techId];
                      return (
                        <MitreTechniqueChip key={techId} techniqueId={techId} title={tech?.name} />
                      );
                    })}
                    {mission.mitreTechniques.length > 3 && (
                      <div className="text-xs px-2 py-1 text-gray-400">
                        +{mission.mitreTechniques.length - 3} {t('more', { ns: 'ui' })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    mission.difficulty === 'beginner'
                      ? 'bg-green-900/30 text-green-400'
                      : mission.difficulty === 'intermediate'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  {t(`difficulty.${mission.difficulty}`, {
                    ns: 'ui',
                    defaultValue: mission.difficulty,
                  })}
                </span>
                <span className="text-xs text-gray-400">
                  {mission.mitreTechniques.length} {t('techniques', { ns: 'ui' })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {missions.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {t('noMissionsAvailable', { ns: 'ui' })}
        </div>
      )}
    </div>
  );
}
