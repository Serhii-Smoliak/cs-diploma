import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import type { Level, SentenceConstructorSubmission, SentenceField } from '@cybertactics/shared';
import { motion, AnimatePresence } from 'framer-motion';
import TaskHints from './TaskHints';
import TaskSubmitButton from './TaskSubmitButton';

interface SentenceConstructorProps {
  level: Level;
}

import type { TFunction } from 'i18next';

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
  const [result, setResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);
  const { submitAnswer, isLoading, loadLevel, levels, currentLevel } = useGameStore();

  const resetFields = () => {
    const initial: Record<string, (string | null)[]> = {};
    for (const field of fields) {
      initial[field.id] = Array(field.slots).fill(null);
    }
    setFieldSlots(initial);
  };

  const toggleAttachment = (attachmentId: string) => {
    setSelectedAttachments((prev) =>
      prev.includes(attachmentId)
        ? prev.filter((id) => id !== attachmentId)
        : [...prev, attachmentId]
    );
  };

  const isComplete = fields.every((field) => {
    const slots = fieldSlots[field.id] || [];
    return slots.length === field.slots && slots.every(Boolean);
  });

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const submission: SentenceConstructorSubmission = {
      to: emailTo,
      fields: Object.fromEntries(
        fields.map((field) => [field.id, (fieldSlots[field.id] || []).filter(Boolean) as string[]])
      ),
      attachments: selectedAttachments,
    };

    try {
      const response = await submitAnswer(submission);

      if (response?.success) {
        setIsSuccess(true);
        setXpGained(response.xpGained || null);
        setNextLevelId(response.nextLevelId || null);
        setResult(
          `${t('success', { ns: 'tasks' })}\n${response.message || t('taskCompleted', { ns: 'tasks' })}`
        );
        resetFields();
        setSelectedAttachments([]);
      } else if (response) {
        setIsSuccess(false);
        setResult(
          `${t('failure', { ns: 'tasks' })}\n${response.message || t('wrongAnswer', { ns: 'tasks' })}`
        );
      }
    } catch (error) {
      setIsSuccess(false);
      setResult(
        `${t('error', { ns: 'tasks' })}\n${error instanceof Error ? error.message : t('errorOccurred', { ns: 'tasks' })}`
      );
    }
  };

  const handleNextLevel = () => {
    if (nextLevelId) {
      loadLevel(nextLevelId);
    } else {
      const currentIndex = levels.findIndex((l) => l.level_id === currentLevel?.level_id);
      if (currentIndex >= 0 && currentIndex < levels.length - 1) {
        loadLevel(levels[currentIndex + 1].level_id);
      }
    }
    setIsSuccess(false);
    setResult(null);
    setXpGained(null);
    setNextLevelId(null);
  };

  const hasNextLevel = () => {
    if (nextLevelId) return true;
    const currentIndex = levels.findIndex((l) => l.level_id === currentLevel?.level_id);
    return currentIndex >= 0 && currentIndex < levels.length - 1;
  };

  /* eslint-disable react-hooks/exhaustive-deps -- reset when level changes */
  useEffect(() => {
    setIsSuccess(false);
    setResult(null);
    setXpGained(null);
    setNextLevelId(null);
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

      <div className="min-w-0 max-w-full">
        <label className="block text-sm font-medium text-cyber-primary mb-2">
          {t('emailAttachments', { ns: 'tasks' })}
        </label>
        <div className="grid gap-2 min-w-0 max-w-full [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
          {attachments.map((attachment) => {
            const isSelected = selectedAttachments.includes(attachment.id);

            return (
              <button
                key={attachment.id}
                type="button"
                onClick={() => toggleAttachment(attachment.id)}
                className={`min-w-0 max-w-full p-3 rounded-lg border cursor-pointer text-left transition-colors ${
                  isSelected
                    ? 'bg-cyber-success/20 border-cyber-success'
                    : 'bg-cyber-panel border-cyber-border hover:border-cyber-primary hover:bg-cyber-primary/5'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">
                    {attachment.type.includes('word')
                      ? '📄'
                      : attachment.type.includes('exe')
                        ? '⚙️'
                        : '📁'}
                  </span>
                  <span className="text-xs text-gray-400 truncate min-w-0 flex-1">
                    {attachment.name}
                  </span>
                  {isSelected && <span className="text-cyber-success text-lg shrink-0">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <TaskSubmitButton
        disabled={isLoading || !isComplete || selectedAttachments.length === 0}
        onClick={handleSubmit}
      >
        {isLoading ? t('sendingEmail', { ns: 'tasks' }) : t('sendEmail', { ns: 'tasks' })}
      </TaskSubmitButton>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg ${
              isSuccess
                ? 'bg-green-900/30 text-cyber-success border-0'
                : 'bg-red-900/20 text-cyber-danger border border-cyber-danger'
            }`}
          >
            <pre className="whitespace-pre-wrap font-mono text-sm">{result}</pre>
            {isSuccess && hasNextLevel() && (
              <button
                type="button"
                onClick={handleNextLevel}
                className="w-full cyber-button py-3 text-base mt-3"
              >
                {t('nextLevel', { ns: 'tasks' })} →
              </button>
            )}
            {isSuccess && xpGained && (
              <div className="text-cyber-success font-bold text-xl mt-2">+{xpGained} XP</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <TaskHints hints={level.hints ?? []} />
    </div>
  );
}
