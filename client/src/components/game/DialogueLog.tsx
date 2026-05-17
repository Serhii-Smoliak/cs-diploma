import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { DialogueMessage } from '@cybertactics/shared';

interface DialogueLogProps {
  dialogues: DialogueMessage[];
}

export default function DialogueLog({ dialogues }: DialogueLogProps) {
  const { t, i18n } = useTranslation(['ui', 'dialogues']);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [dialogues]);

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'system':
        return 'text-cyber-success';
      case 'handler':
        return 'text-cyber-primary';
      case 'hint':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  const getSpeakerPrefix = (speaker: string) => {
    switch (speaker) {
      case 'system':
        return t('system', { ns: 'ui' });
      case 'handler':
        return t('handlerPrefix', { ns: 'ui' });
      case 'hint':
        return t('hintPrefix', { ns: 'ui' });
      default:
        return '';
    }
  };

  return (
    <div
      ref={logRef}
      className="h-full overflow-y-auto cyber-scrollbar space-y-2 pr-2"
    >
      {dialogues.length === 0 ? (
        <div className="text-gray-500 text-sm">{t('noDialogueAvailable', { ns: 'ui' })}</div>
      ) : (
        dialogues.map((dialogue, index) => {
          const translationKey = dialogue.text;
          let translated = t(translationKey, { ns: 'dialogues', defaultValue: dialogue.text });

          if (translated === translationKey) {
            translated = dialogue.text;
          }

          let displayText = translated;
          displayText = displayText.replace(/^\[System\]:\s*/i, '');
          displayText = displayText.replace(/^\[Система\]:\s*/i, '');
          displayText = displayText.replace(/^\[HANDLER\]:\s*/i, '');
          displayText = displayText.replace(/^\[КООРДИНАТОР\]:\s*/i, '');
          displayText = displayText.replace(/^\[HINT\]:\s*/i, '');
          displayText = displayText.replace(/^\[ПІДКАЗКА\]:\s*/i, '');
          
          return (
            <div
              key={index}
              className={`${getSpeakerColor(dialogue.speaker)} text-sm leading-relaxed`}
            >
              <span className="font-mono font-bold">{getSpeakerPrefix(dialogue.speaker)}:</span>{' '}
              <span>{displayText}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

