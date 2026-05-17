import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import CodeEditor from '../tasks/CodeEditor';
import TacticalChoice from '../tasks/TacticalChoice';
import PhishingConstructor from '../tasks/PhishingConstructor';

export default function WorkArea() {
  const { t } = useTranslation(['ui', 'common', 'levels']);
  const currentLevel = useGameStore((state) => state.currentLevel);

  if (!currentLevel) {
    return (
      <div className="h-full cyber-panel flex items-center justify-center">
        <p className="text-gray-400">{t('selectMission', { ns: 'ui' })}</p>
      </div>
    );
  }

  const renderTask = () => {
    if (!currentLevel) return null;
    
    const key = currentLevel.level_id;
    
    switch (currentLevel.task_type) {
      case 'code_editor':
        return <CodeEditor key={key} level={currentLevel} />;
      case 'tactical_choice':
        return <TacticalChoice key={key} level={currentLevel} />;
      case 'phishing_constructor':
        return <PhishingConstructor key={key} level={currentLevel} />;
      default:
        return <p className="text-gray-400">{t('unknownTask', { ns: 'ui' })}</p>;
    }
  };

  return (
    <div className="h-full cyber-panel flex flex-col min-h-0">
      <div className="border-b border-cyber-border pb-3 mb-4 flex-shrink-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-cyber-primary">{t('workArea', { ns: 'ui' })}</h3>
            <p className="text-sm text-gray-400 mt-1">{(() => {
              const translationKey = `${currentLevel.level_id}.title`;
              const translated = t(translationKey, { ns: 'levels', defaultValue: currentLevel.title });
              return translated !== translationKey ? translated : currentLevel.title;
            })()}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden cyber-scrollbar min-h-0">
        {renderTask()}
      </div>
    </div>
  );
}

