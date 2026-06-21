import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import type { Level, SentenceConstructorSubmission, SentenceField } from '@cybertactics/shared';
import TaskHints from './TaskHints';
import TaskSubmitButton from './TaskSubmitButton';
import AttachmentPicker from './AttachmentPicker';
import { toggleAttachmentSelection } from './attachmentUtils';
import TaskResultPanel from './TaskResultPanel';
import { preventTaskMouseDefault, useTaskProgress } from './useTaskProgress';
import type { TFunction } from 'i18next';

interface SentenceConstructorProps {
  level: Level;
}

function getFieldLabel(field: SentenceField, t: TFunction): string {
  if (field.label) return field.label;
  if (field.id === 'subject') return t('emailSubject', { ns: 'tasks' });
  if (field.id === 'body') return t('emailBody', { ns: 'tasks' });
  return field.id;
}

function FieldBuilder({
  field,
  slots,
  onChange,
  label,
}: {
  field: SentenceField;
  slots: (string | null)[];
  onChange: (next: (string | null)[]) => void;
  label: string;
}) {
  const tokenMap = useMemo(
    () => new Map(field.tokens.map((token) => [token.id, token.text])),
    [field.tokens]
  );

  const usedIds = new Set(slots.filter(Boolean) as string[]);
  const availableTokens = field.tokens.filter((token) => !usedIds.has(token.id));

  const addToken = (tokenId: string) => {
    const emptyIndex = slots.findIndex((slot) => slot === null);
    if (emptyIndex === -1) return;
    const next = [...slots];
    next[emptyIndex] = tokenId;
    onChange(next);
  };

  const removeAt = (index: number) => {
    const next = [...slots];
    next[index] = null;
    onChange(next);
  };

  return (
    <div className="min-w-0 max-w-full">
      <label className="block text-sm font-medium text-cyber-primary mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-lg border border-cyber-border bg-cyber-panel/40 mb-3 min-w-0 max-w-full">
        {slots.map((tokenId, index) => (
          <button
            key={`${field.id}-slot-${index}`}
            type="button"
            onClick={() => tokenId && removeAt(index)}
            className={`max-w-full px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              tokenId
                ? 'border-cyber-primary bg-cyber-primary/10 text-white hover:border-cyber-danger'
                : 'border-dashed border-cyber-border text-gray-600 min-w-[72px]'
            }`}
          >
            {tokenId ? tokenMap.get(tokenId) : '___'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 min-w-0 max-w-full">
        {availableTokens.map((token) => (
          <button
            key={token.id}
            type="button"
            onClick={() => addToken(token.id)}
            className="max-w-full px-3 py-1.5 rounded-lg border border-cyber-border bg-cyber-panel hover:border-cyber-primary hover:bg-cyber-primary/5 text-sm text-gray-200 transition-colors"
          >
            {token.text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SentenceConstructor({ level }: SentenceConstructorProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const fields = level.work_area.fields || [];
  const attachments = level.work_area.attachments || [];
  const emailTo = level.work_area.email_to || level.work_area.email_fields?.to || '';

  const [fieldSlots, setFieldSlots] = useState<Record<string, (string | null)[]>>({});
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const { submitAnswer, isLoading } = useGameStore();
  const {
    result,
    isSuccess,
    xpGained,
    resetProgress,
    applySubmitResponse,
    applySubmitError,
    hasNextLevel,
    goToNextLevel,
  } = useTaskProgress();

  const resetFields = () => {
    const initial: Record<string, (string | null)[]> = {};
    for (const field of fields) {
      initial[field.id] = Array(field.slots).fill(null);
    }
    setFieldSlots(initial);
  };

  const isComplete = fields.every((field) => {
    const slots = fieldSlots[field.id] || [];
    return slots.length === field.slots && slots.every(Boolean);
  });

  const handleSubmit = async (event?: React.MouseEvent) => {
    preventTaskMouseDefault(event);

    const submission: SentenceConstructorSubmission = {
      to: emailTo,
      fields: Object.fromEntries(
        fields.map((field) => [field.id, (fieldSlots[field.id] || []).filter(Boolean) as string[]])
      ),
      attachments: selectedAttachments,
    };

    try {
      const response = await submitAnswer(submission);
      applySubmitResponse(response, t, () => {
        resetFields();
        setSelectedAttachments([]);
      });
    } catch (error) {
      applySubmitError(error, t);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps -- reset when level changes */
  useEffect(() => {
    resetProgress();
    setSelectedAttachments([]);
    resetFields();
  }, [level.level_id]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      <div className="text-sm text-gray-400 mb-2">
        {t('sentenceConstructorHint', { ns: 'tasks' })}
      </div>

      <div>
        <label className="block text-sm font-medium text-cyber-primary mb-2">
          {t('emailTo', { ns: 'tasks' })}
        </label>
        <input
          type="email"
          value={emailTo}
          readOnly
          disabled
          tabIndex={-1}
          className="w-full cyber-input opacity-60 cursor-not-allowed bg-cyber-panel/40"
        />
      </div>

      {fields.map((field) => (
        <FieldBuilder
          key={field.id}
          field={field}
          label={getFieldLabel(field, t)}
          slots={fieldSlots[field.id] || Array(field.slots).fill(null)}
          onChange={(next) => setFieldSlots((prev) => ({ ...prev, [field.id]: next }))}
        />
      ))}

      <AttachmentPicker
        attachments={attachments}
        selectedIds={selectedAttachments}
        label={t('emailAttachments', { ns: 'tasks' })}
        onToggle={(attachmentId) =>
          setSelectedAttachments((prev) => toggleAttachmentSelection(prev, attachmentId))
        }
      />

      <TaskSubmitButton
        disabled={isLoading || !isComplete || selectedAttachments.length === 0}
        onClick={handleSubmit}
      >
        {isLoading ? t('sendingEmail', { ns: 'tasks' }) : t('sendEmail', { ns: 'tasks' })}
      </TaskSubmitButton>

      <TaskResultPanel
        result={result}
        isSuccess={isSuccess}
        xpGained={xpGained}
        hasNextLevel={hasNextLevel()}
        onNextLevel={goToNextLevel}
        t={t}
        layout="compact"
      />

      <TaskHints hints={level.hints ?? []} />
    </div>
  );
}
