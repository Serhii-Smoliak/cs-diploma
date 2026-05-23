import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import CodeEditor from '../tasks/CodeEditor';
import TacticalChoice from '../tasks/TacticalChoice';
import PhishingConstructor from '../tasks/PhishingConstructor';
import SentenceConstructor from '../tasks/SentenceConstructor';

export default function WorkArea() {
  const { t } = useTranslation(['ui', 'common']);
  const navigate = useNavigate();
  const { missionId } = useParams<{ missionId: string }>();
  const currentLevel = useGameStore((state) => state.currentLevel);
  const levels = useGameStore((state) => state.levels);
  const loadLevel = useGameStore((state) => state.loadLevel);
  const levelProgress = useGameStore((state) => state.levelProgress);
  const retryMode = useGameStore((state) => state.retryMode);
  const setRetryMode = useGameStore((state) => state.setRetryMode);

  if (!currentLevel) {
    return (
      <div className="h-full cyber-panel flex items-center justify-center">
        <p className="text-gray-400">{t('selectMission', { ns: 'ui' })}</p>
      </div>
    );
  }

  const isCompleted = levelProgress?.completed ?? false;
  const showCompletedState = isCompleted && !retryMode;

  const currentIndex = levels.findIndex((l) => l.level_id === currentLevel.level_id);
  const nextLevel = currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  const handleNextAssignment = async () => {
    if (!nextLevel) return;
    await loadLevel(nextLevel.level_id);
    if (missionId) {
      navigate(`/missions/${missionId}/assignments/${nextLevel.level_id}`);
    }
  };

  const renderTask = () => {
    const key = `${currentLevel.level_id}-${retryMode ? 'retry' : 'default'}`;

    switch (currentLevel.task_type) {
      case 'code_editor':
        return <CodeEditor key={key} level={currentLevel} />;
      case 'tactical_choice':
        return <TacticalChoice key={key} level={currentLevel} />;
      case 'phishing_constructor':
        return <PhishingConstructor key={key} level={currentLevel} />;
      case 'sentence_constructor':
        return <SentenceConstructor key={key} level={currentLevel} />;
      default:
        return <p className="text-gray-400">{t('unknownTask', { ns: 'ui' })}</p>;
    }
  };

  return (
    <div className="h-full cyber-panel flex flex-col min-h-0">
      <div className="border-b border-cyber-border pb-3 mb-4 flex-shrink-0">
        <h3 className="font-heading font-bold text-lg text-cyber-primary">{t('workArea', { ns: 'ui' })}</h3>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden cyber-scrollbar min-h-0 pr-3">
        {showCompletedState ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="w-full max-w-md px-6 py-8 bg-cyber-success/10 border border-cyber-success rounded-xl">
              <div className="text-cyber-success text-4xl mb-4">✓</div>
              <h4 className="font-heading font-bold text-xl text-cyber-success mb-2">
                {t('levelCompletedTitle', { ns: 'ui' })}
              </h4>
              <p className="text-gray-400 text-sm mb-6">{t('levelCompletedHint', { ns: 'ui' })}</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setRetryMode(true)}
                  className="w-full cyber-button py-3"
                >
                  {t('tryAgain', { ns: 'ui' })}
                </button>
                {nextLevel ? (
                  <button
                    type="button"
                    onClick={handleNextAssignment}
                    className="w-full cyber-button-success py-3"
                  >
                    {t('nextAssignment', { ns: 'ui' })}
                  </button>
                ) : (
                  <>
                    <p className="text-cyber-success text-sm">{t('allMissionTasksCompleted', { ns: 'ui' })}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/missions')}
                      className="w-full cyber-button-success py-3"
                    >
                      {t('backToMissions', { ns: 'ui' })}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          renderTask()
        )}
      </div>
    </div>
  );
}
