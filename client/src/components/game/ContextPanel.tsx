import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DialogueMessage, EmailSubmission, Level, SentenceConstructorSubmission } from '@cybertactics/shared';
import { useGameStore } from '@/store/gameStore.ts';
import DialogueLog from './DialogueLog';
import MitreTechniqueBadge from '../mitre/MitreTechniqueBadge';

function wrapAnswerBlock(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return trimmed;
  return `\`\`\`\n${trimmed}\n\`\`\``;
}

function formatLastAnswer(level: Level | null, lastAnswer: string): string {
  if (level?.task_type === 'tactical_choice' && level?.work_area?.choices) {
    const choice = level.work_area.choices.find((c) => c.id === lastAnswer);
    if (choice) return wrapAnswerBlock(choice.text);
  }

  if (level?.task_type === 'phishing_constructor') {
    try {
      const parsed = JSON.parse(lastAnswer) as EmailSubmission;
      const parts: string[] = [];

      if (parsed.subject) {
        parts.push(`Тема: ${parsed.subject}`);
      }
      if (parsed.body) {
        parts.push(`Текст: ${parsed.body}`);
      }
      if (parsed.attachments?.length) {
        const names = parsed.attachments
          .map((id) => level.work_area.attachments?.find((att) => att.id === id)?.name || id)
          .join(', ');
        parts.push(`Вкладення: ${names}`);
      }

      if (parts.length > 0) {
        return wrapAnswerBlock(parts.join('\n'));
      }
    } catch {
      // fall through
    }
  }

  if (level?.task_type === 'sentence_constructor') {
    try {
      const parsed = JSON.parse(lastAnswer) as SentenceConstructorSubmission;
      const parts: string[] = [];
      const fields = level.work_area.fields || [];

      for (const field of fields) {
        const tokenIds = parsed.fields?.[field.id] || [];
        const text = tokenIds
          .map((id) => field.tokens.find((token) => token.id === id)?.text || id)
          .join(' ');
        if (text) {
          const label =
            field.id === 'subject' ? 'Тема' : field.id === 'body' ? 'Текст' : field.label || field.id;
          parts.push(`${label}: ${text}`);
        }
      }

      if (parsed.attachments?.length) {
        const names = parsed.attachments
          .map((id) => level.work_area.attachments?.find((att) => att.id === id)?.name || id)
          .join(', ');
        parts.push(`Вкладення: ${names}`);
      }

      if (parts.length > 0) {
        return wrapAnswerBlock(parts.join('\n'));
      }
    } catch {
      // fall through
    }
  }

  if (level?.task_type === 'code_editor') {
    return wrapAnswerBlock(lastAnswer);
  }

  return wrapAnswerBlock(lastAnswer);
}

function enrichProgressDialogues(
  dialogues: DialogueMessage[],
  options: {
    isCompleted: boolean;
    lastAnswer: string | null;
    notCompletedText: string;
    handlerCompletedText?: string;
  },
): DialogueMessage[] {
  const result = [...dialogues];

  if (!options.isCompleted) {
    let insertIndex = 0;
    while (insertIndex < result.length && result[insertIndex].speaker === 'system') {
      insertIndex++;
    }
    result.splice(insertIndex, 0, { speaker: 'system', text: options.notCompletedText });
    return result;
  }

  if (!options.handlerCompletedText || !options.lastAnswer) {
    return result;
  }

  let lastHandlerIndex = -1;
  for (let i = 0; i < result.length; i++) {
    if (result[i].speaker === 'handler') {
      lastHandlerIndex = i;
    }
  }

  const insertIndex = lastHandlerIndex >= 0 ? lastHandlerIndex + 1 : result.length;
  result.splice(insertIndex, 0, { speaker: 'handler', text: options.handlerCompletedText });
  return result;
}

export default function ContextPanel() {
  const { t } = useTranslation(['ui', 'common']);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const levelProgress = useGameStore((state) => state.levelProgress);

  const isCompleted = levelProgress?.completed ?? false;
  const lastAnswer = levelProgress?.lastAnswer ?? null;

  const enrichedDialogues = useMemo(() => {
    const base = currentLevel?.dialogue ?? [];

    const handlerCompletedText =
      isCompleted && lastAnswer
        ? t('handlerTaskCompleted', {
            ns: 'ui',
            answer: formatLastAnswer(currentLevel, lastAnswer),
          })
        : undefined;

    return enrichProgressDialogues(base, {
      isCompleted,
      lastAnswer,
      notCompletedText: t('taskStatusNotCompleted', { ns: 'ui' }),
      handlerCompletedText,
    });
  }, [currentLevel, isCompleted, lastAnswer, t]);

  return (
    <div className="h-full cyber-panel flex flex-col">
      {currentLevel?.mitre_technique && (
        <div className="mb-4 pb-4 border-b border-cyber-border">
          <div className="text-xs text-gray-500 mb-2">{t('currentMitreTechnique', { ns: 'ui' })}</div>
          <MitreTechniqueBadge
            technique={currentLevel.mitre_technique}
            size="sm"
            showDescription={false}
          />
        </div>
      )}

      <div className="flex-1 mt-4 overflow-hidden">
        <DialogueLog dialogues={enrichedDialogues} />
      </div>
    </div>
  );
}
