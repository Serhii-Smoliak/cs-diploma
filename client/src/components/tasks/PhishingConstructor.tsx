import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import type { Level, EmailSubmission } from '@cybertactics/shared';
import TaskHints from './TaskHints';
import TaskSubmitButton from './TaskSubmitButton';
import AttachmentPicker from './AttachmentPicker';
import { toggleAttachmentSelection } from './attachmentUtils';
import TaskResultPanel from './TaskResultPanel';
import { preventTaskMouseDefault, useTaskProgress } from './useTaskProgress';

interface PhishingConstructorProps {
  level: Level;
}

export default function PhishingConstructor({ level }: PhishingConstructorProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const [to, setTo] = useState(level.work_area.email_fields?.to || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
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

  const attachments = level.work_area.attachments || [];

  const handleSubmit = async (event?: React.MouseEvent) => {
    preventTaskMouseDefault(event);

    const emailData: EmailSubmission = {
      to,
      subject,
      body,
      attachments: selectedAttachments,
    };

    try {
      const response = await submitAnswer(emailData);
      applySubmitResponse(response, t, () => {
        setSubject('');
        setBody('');
        setSelectedAttachments([]);
      });
    } catch (error) {
      applySubmitError(error, t);
    }
  };

  useEffect(() => {
    resetProgress();
    setSubject('');
    setBody('');
    setSelectedAttachments([]);
    setTo(level.work_area.email_fields?.to || '');
  }, [level.level_id, level.work_area.email_fields?.to, resetProgress]);

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

      <AttachmentPicker
        attachments={attachments}
        selectedIds={selectedAttachments}
        label={t('emailAttachments', { ns: 'tasks' })}
        onToggle={(attachmentId) =>
          setSelectedAttachments((prev) => toggleAttachmentSelection(prev, attachmentId))
        }
      />

      <TaskSubmitButton
        disabled={isLoading || !subject || !body}
        onClick={(event) => {
          preventTaskMouseDefault(event);
          handleSubmit();
        }}
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
      />

      <TaskHints hints={level.hints ?? []} />
    </div>
  );
}
