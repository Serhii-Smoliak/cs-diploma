import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';

interface TaskResultPanelProps {
  readonly result: string | null;
  readonly isSuccess: boolean;
  readonly xpGained: number | null;
  readonly hasNextLevel: boolean;
  readonly onNextLevel: () => void;
  readonly t: TFunction;
  readonly layout?: 'standard' | 'compact';
}

export default function TaskResultPanel({
  result,
  isSuccess,
  xpGained,
  hasNextLevel,
  onNextLevel,
  t,
  layout = 'standard',
}: TaskResultPanelProps) {
  return (
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
          {layout === 'compact' ? (
            <>
              <pre className="whitespace-pre-wrap font-mono text-sm">{result}</pre>
              {isSuccess && hasNextLevel && (
                <button
                  type="button"
                  onClick={onNextLevel}
                  className="w-full cyber-button py-3 text-base mt-3"
                >
                  {t('nextLevel', { ns: 'tasks' })} →
                </button>
              )}
              {isSuccess && xpGained && (
                <div className="text-cyber-success font-bold text-xl mt-2">+{xpGained} XP</div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-3">
              {isSuccess && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl">
                  ✓
                </motion.span>
              )}
              <div className="flex-1">
                {isSuccess && (
                  <>
                    <div className="text-cyber-success font-bold text-lg mb-2">
                      {t('successTitle', { ns: 'tasks' })}
                    </div>
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
                {isSuccess && hasNextLevel && (
                  <button
                    type="button"
                    onClick={onNextLevel}
                    className="w-full cyber-button py-3 text-base"
                  >
                    {t('nextLevel', { ns: 'tasks' })} →
                  </button>
                )}
                {isSuccess && !hasNextLevel && (
                  <div className="text-cyber-success font-medium text-sm">
                    {t('allCompleted', { ns: 'tasks' })}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
