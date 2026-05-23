import { ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import ContextPanel from './ContextPanel';
import WorkArea from './WorkArea';

interface GameLayoutProps {
  children?: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const { t } = useTranslation(['ui', 'missions', 'levels']);
  const { missionId } = useParams<{ missionId: string }>();
  const currentMission = useGameStore((state) => state.currentMission);
  const currentLevel = useGameStore((state) => state.currentLevel);

  const getMissionName = (id: string, fallbackName: string): string => {
    const translationKey = `${id}.name`;
    const translated = t(translationKey, { ns: 'missions', defaultValue: fallbackName });
    return translated !== translationKey ? translated : fallbackName;
  };

  const getLevelTitle = (levelId: string, fallbackTitle: string): string => {
    const translationKey = `${levelId}.title`;
    const translated = t(translationKey, { ns: 'levels', defaultValue: fallbackTitle });
    return translated !== translationKey ? translated : fallbackTitle;
  };

  const assignmentsPath = missionId ? `/missions/${missionId}/assignments` : '/missions';

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto lg:overflow-hidden">
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 shrink-0">
        {currentLevel && (
          <div className="mb-1">
            {currentMission && (
              <Link
                to={assignmentsPath}
                className="block text-xs sm:text-sm text-gray-500 hover:text-cyber-primary transition-colors mb-1"
              >
                {getMissionName(currentMission.id, currentMission.name)}
              </Link>
            )}
            <h1 className="font-heading font-bold text-lg sm:text-xl lg:text-2xl text-cyber-primary leading-tight">
              {getLevelTitle(currentLevel.level_id, currentLevel.title)}
            </h1>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-3 sm:gap-4 p-3 sm:p-4 min-h-0">
        <div className="flex-none lg:flex-[3] min-h-[240px] sm:min-h-[280px] lg:min-h-0 lg:overflow-hidden">
          <ContextPanel />
        </div>
        <div className="flex-1 lg:flex-[7] min-h-[320px] lg:min-h-0 lg:overflow-hidden">
          <WorkArea />
        </div>
        {children}
      </div>
    </div>
  );
}
