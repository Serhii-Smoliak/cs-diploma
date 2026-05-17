import { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import ContextPanel from './ContextPanel';
import WorkArea from './WorkArea';

interface GameLayoutProps {
  children?: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const { t } = useTranslation(['ui', 'missions']);
  const navigate = useNavigate();
  const { missionId } = useParams<{ missionId: string }>();
  const currentMission = useGameStore((state) => state.currentMission);

  const getMissionName = (missionId: string, fallbackName: string): string => {
    const translationKey = `${missionId}.name`;
    const translated = t(translationKey, { ns: 'missions', defaultValue: fallbackName });
    return translated !== translationKey ? translated : fallbackName;
  };

  const handleBackToAssignments = () => {
    if (missionId) {
      navigate(`/missions/${missionId}/assignments`);
    } else {
      navigate('/missions');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back Button */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleBackToAssignments();
          }}
          className="text-cyber-primary hover:text-cyber-success transition-colors flex items-center gap-2 mb-2"
        >
          <span>←</span>
          <span>{t('backToAssignments', { ns: 'ui' })}</span>
          {currentMission && (
            <span className="text-gray-400">• {getMissionName(currentMission.id, currentMission.name)}</span>
          )}
        </button>
      </div>

      {/* Game Content */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <ContextPanel />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <WorkArea />
        </div>
        {children}
      </div>
    </div>
  );
}

