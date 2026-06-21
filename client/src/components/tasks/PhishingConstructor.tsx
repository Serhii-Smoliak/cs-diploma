import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import type { Level, EmailSubmission } from '@cybertactics/shared';
import { motion, AnimatePresence } from 'framer-motion';
import TaskHints from './TaskHints';
import TaskSubmitButton from './TaskSubmitButton';

interface PhishingConstructorProps {
  level: Level;
}

export default function PhishingConstructor({ level }: PhishingConstructorProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const [to, setTo] = useState(level.work_area.email_fields?.to || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);
  const { submitAnswer, isLoading, loadLevel, levels, currentLevel } = useGameStore();

  const attachments = level.work_area.attachments || [];

  const toggleAttachment = (attachmentId: string) => {
    setSelectedAttachments((prev) =>
      prev.includes(attachmentId)
        ? prev.filter((id) => id !== attachmentId)
        : [...prev, attachmentId]
    );
  };

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const emailData: EmailSubmission = {
      to,
      subject,
      body,
      attachments: selectedAttachments,
    };

    try {
      const response = await submitAnswer(emailData);
      
      if (response?.success) {
        setIsSuccess(true);
        setXpGained(response.xpGained || null);
        setNextLevelId(response.nextLevelId || null);
        setResult(`${t('success', { ns: 'tasks' })}\n${response.message || t('taskCompleted', { ns: 'tasks' })}`);
        
        setSubject('');
        setBody('');
        setSelectedAttachments([]);
      } else {
        setIsSuccess(false);
        setResult(`${t('failure', { ns: 'tasks' })}\n${response?.message || t('wrongAnswer', { ns: 'tasks' })}`);
      }
    } catch (error) {
      setIsSuccess(false);
      setResult(`${t('error', { ns: 'tasks' })}\n${error instanceof Error ? error.message : t('errorOccurred', { ns: 'tasks' })}`);
    }
  };

  const handleNextLevel = () => {
    if (nextLevelId) {
      loadLevel(nextLevelId);
      setIsSuccess(false);
      setResult(null);
      setXpGained(null);
      setNextLevelId(null);
    } else {
      const currentIndex = levels.findIndex((l) => l.level_id === currentLevel?.level_id);
      if (currentIndex >= 0 && currentIndex < levels.length - 1) {
        const nextLevel = levels[currentIndex + 1];
        loadLevel(nextLevel.level_id);
        setIsSuccess(false);
        setResult(null);
        setXpGained(null);
        setNextLevelId(null);
      }
    }
  };

  const hasNextLevel = () => {
    if (nextLevelId) return true;
    const currentIndex = levels.findIndex((l) => l.level_id === currentLevel?.level_id);
    return currentIndex >= 0 && currentIndex < levels.length - 1;
  };

  useEffect(() => {
    setIsSuccess(false);
    setResult(null);
    setSubject('');
    setBody('');
    setSelectedAttachments([]);
    setXpGained(null);
    setNextLevelId(null);
    setTo(level.work_area.email_fields?.to || '');
  }, [level.level_id, level.work_area.email_fields?.to]);

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      <div className="text-sm text-gray-400 mb-4">
        {t('phishingConstructorTitle', { ns: 'tasks' })}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-cyber-primary mb-2">
            {t('emailTo', { ns: 'tasks' })}
          </label>
          <input
            type="email"
            value={to}
            readOnly
            disabled
            tabIndex={-1}
            className="w-full cyber-input opacity-60 cursor-not-allowed bg-cyber-panel/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyber-primary mb-2">
            {t('emailSubject', { ns: 'tasks' })}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('emailSubjectPlaceholder', { ns: 'tasks' })}
            className="w-full cyber-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyber-primary mb-2">
            {t('emailBody', { ns: 'tasks' })}
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('emailBodyPlaceholder', { ns: 'tasks' })}
            rows={8}
            className="w-full cyber-input font-body"
          />
        </div>
      </div>

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
                    {attachment.type.includes('word') ? '📄' : attachment.type.includes('exe') ? '⚙️' : '📁'}
                  </span>
                  <span className="text-xs text-gray-400 truncate min-w-0 flex-1">{attachment.name}</span>
                  {isSelected && <span className="text-cyber-success text-lg shrink-0">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <TaskSubmitButton
        disabled={isLoading || !subject || !body}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit();
        }}
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
            <div className="flex items-start gap-3">
              {isSuccess && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-2xl"
                >
                  ✓
                </motion.span>
              )}
              <div className="flex-1">
                {isSuccess && (
                  <>
                    <div className="text-cyber-success font-bold text-lg mb-2">{t('successTitle', { ns: 'tasks' })}</div>
                    {xpGained && (
                      <div className="text-cyber-success font-bold text-xl mb-3">
                        +{xpGained} XP
                      </div>
                    )}
                  </>
                )}
                {!isSuccess && (
                  <pre className="whitespace-pre-wrap font-mono text-sm mb-3">{result}</pre>
                )}
                {isSuccess && hasNextLevel() && (
                  <button
                    type="button"
                    onClick={handleNextLevel}
                    className="w-full cyber-button py-3 text-base"
                  >
                    {t('nextLevel', { ns: 'tasks' })} →
                  </button>
                )}
                {isSuccess && !hasNextLevel() && (
                  <div className="text-cyber-success font-medium text-sm">
                    {t('allCompleted', { ns: 'tasks' })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskHints hints={level.hints ?? []} />
    </div>
  );
}

