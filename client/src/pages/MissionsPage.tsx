import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, type MitreTechnique } from '../services/api';
import type { Mission } from '@cybertactics/shared';
import { motion } from 'framer-motion';
import MitreTechniqueChip from '../components/mitre/MitreTechniqueChip';

export default function MissionsPage() {
  const { t } = useTranslation(['missions', 'ui']);
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [mitreTechniques, setMitreTechniques] = useState<Record<string, MitreTechnique>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const [missionsData, techniquesData] = await Promise.all([
        api.getMissions(),
        api.getMitreTechniques(),
      ]);
      
      setMissions(missionsData);
      
      const techniquesMap: Record<string, MitreTechnique> = {};
      techniquesData.forEach((tech) => {
        techniquesMap[tech.id] = tech;
      });
      setMitreTechniques(techniquesMap);
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

      <div className="flex flex-wrap justify-center gap-6">
        {missions.map((mission) => (
          <motion.div
            key={mission.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStartMission(mission)}
            className="w-full max-w-sm sm:w-72 cyber-panel p-6 cursor-pointer border-cyber-border hover:border-cyber-primary transition-all duration-300 hover:cyber-glow"
          >
            <h2 className="font-heading font-bold text-xl text-cyber-primary mb-2">
              {getMissionName(mission.id, mission.name)}
            </h2>
            <p className="text-sm text-gray-400 mb-4">{getMissionDescription(mission.id, mission.description)}</p>
            
            {/* MITRE Techniques */}
            {mission.mitreTechniques.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">{t('mitreTechniques', { ns: 'ui' })}</div>
                <div className="flex flex-wrap gap-2">
                  {mission.mitreTechniques.slice(0, 3).map((techId) => {
                    const tech = mitreTechniques[techId];
                    return (
                      <MitreTechniqueChip
                        key={techId}
                        techniqueId={techId}
                        title={tech?.name}
                      />
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
              <span className={`text-xs px-2 py-1 rounded ${
                mission.difficulty === 'beginner' ? 'bg-green-900/30 text-green-400' :
                mission.difficulty === 'intermediate' ? 'bg-yellow-900/30 text-yellow-400' :
                'bg-red-900/30 text-red-400'
              }`}>
                {t(`difficulty.${mission.difficulty}`, { ns: 'ui', defaultValue: mission.difficulty })}
              </span>
              <span className="text-xs text-gray-400">
                {mission.mitreTechniques.length} {t('techniques', { ns: 'ui' })}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {missions.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {t('noMissionsAvailable', { ns: 'ui' })}
        </div>
      )}
    </div>
  );
}

