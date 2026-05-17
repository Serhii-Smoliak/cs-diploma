import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { api } from '../../services/api';

interface Handler {
  codeName: string;
  group: string;
  specialization: string;
}

export default function HandlerAvatar() {
  const { t } = useTranslation(['ui']);
  const currentMission = useGameStore((state) => state.currentMission);
  const [handler, setHandler] = useState<Handler | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHandler = async () => {
      if (!currentMission?.handlerGroup) {
        setLoading(false);
        return;
      }

      try {
        const handlerData = await api.getRandomHandler(currentMission.handlerGroup);
        setHandler(handlerData);
      } catch (error) {
        console.error('Failed to load handler:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHandler();
  }, [currentMission?.handlerGroup]);

  if (loading || !handler) {
    return null;
  }

  const initials = handler.codeName.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 pb-4 border-b border-cyber-border">
      <div className="w-16 h-16 bg-cyber-primary rounded-lg flex items-center justify-center text-cyber-background font-heading font-bold text-2xl cyber-glow">
        {initials}
      </div>
      <div>
        <div className="font-heading font-bold text-cyber-primary">{handler.codeName}</div>
        <div className="text-sm text-gray-400">
          {t(`specialization.${handler.specialization}`, { ns: 'ui', defaultValue: handler.specialization })}
        </div>
      </div>
    </div>
  );
}

