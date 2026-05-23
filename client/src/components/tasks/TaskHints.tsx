import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TaskHintsProps {
  hints: string[];
}

export default function TaskHints({ hints }: TaskHintsProps) {
  const { t } = useTranslation(['tasks']);
  const [visible, setVisible] = useState(false);

  if (!hints.length) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="text-sm text-yellow-400 hover:text-yellow-300 underline transition-colors"
      >
        {visible ? t('hideHints', { ns: 'tasks' }) : t('showHints', { ns: 'tasks' })}
      </button>

      {visible && (
        <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
          <p className="text-sm font-medium text-yellow-400 mb-2">{t('hints', { ns: 'tasks' })}</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-300">
            {hints.map((hint, idx) => (
              <li key={idx}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
