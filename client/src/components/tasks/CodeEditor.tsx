import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import { useGameStore } from '../../store/gameStore';
import type { Level } from '@cybertactics/shared';
import { motion, AnimatePresence } from 'framer-motion';
import TaskHints from './TaskHints';
import TaskSubmitButton from './TaskSubmitButton';
import { useTaskProgress } from './useTaskProgress';

interface CodeEditorProps {
  level: Level;
}

const CodeEditor = memo(
  function CodeEditor({ level }: CodeEditorProps) {
    const { t } = useTranslation(['tasks', 'common']);
    const [code, setCode] = useState('');
    const [regexInput, setRegexInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userAnswer, setUserAnswer] = useState<string | null>(null);
    const submitAnswer = useGameStore((state) => state.submitAnswer);
    const {
      result,
      isSuccess,
      xpGained,
      applySubmitResponse,
      applySubmitError,
      hasNextLevel,
      goToNextLevel,
    } = useTaskProgress();

    const handleSubmit = async (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (isSubmitting) return;

      setIsSubmitting(true);
      try {
        const answer = level.work_area.input_type === 'regex' ? regexInput : code;
        const answerString = typeof answer === 'string' ? answer : JSON.stringify(answer);
        setUserAnswer(answerString);

        const response = await submitAnswer(answer);

        if (response?.userAnswer) {
          setUserAnswer(response.userAnswer);
        }

        applySubmitResponse(response, t, () => {
          setCode('');
          setRegexInput('');
        });
      } catch (error) {
        console.error('Submit error:', error);
        applySubmitError(error, t);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleNextLevel = () => {
      goToNextLevel();
      setUserAnswer(null);
    };

    const isRegexTask = level.work_area.input_type === 'regex';

    return (
      <div className="space-y-4">
        {level.work_area.code_snippet && (
          <div className="bg-black rounded-lg p-4 border border-cyber-border">
            <Editor
              height="180px"
              defaultLanguage="html"
              value={level.work_area.code_snippet}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: 'Fira Code',
              }}
            />
          </div>
        )}

        {isRegexTask ? (
          <div>
            <label className="block text-sm font-medium text-cyber-primary mb-2">
              {t('enterRegexPattern', { ns: 'tasks' })}
            </label>
            <input
              type="text"
              value={regexInput}
              onChange={(e) => setRegexInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                level.work_area.placeholder || t('enterRegexPatternPlaceholder', { ns: 'tasks' })
              }
              className="w-full cyber-input font-code"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-cyber-primary mb-2">
              {t('enterCode', { ns: 'tasks' })}
            </label>
            <div className="bg-black rounded-lg border border-cyber-border">
              <Editor
                height="300px"
                defaultLanguage={level.work_area.input_type === 'code' ? 'javascript' : 'bash'}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'Fira Code',
                }}
              />
            </div>
          </div>
        )}

        <TaskSubmitButton
          disabled={isSubmitting || (isRegexTask ? !regexInput.trim() : !code.trim())}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
          }}
        >
          {isSubmitting ? t('executing', { ns: 'tasks' }) : t('execute', { ns: 'tasks' })}
        </TaskSubmitButton>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg ${
                isSuccess
                  ? 'bg-green-900/30 text-cyber-success border border-cyber-success'
                  : 'bg-red-900/20 text-cyber-danger border border-cyber-danger'
              }`}
            >
              <div className="flex items-start gap-3">
                {isSuccess && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl">
                    ✓
                  </motion.span>
                )}
                {!isSuccess && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-2xl text-cyber-danger"
                  >
                    ✗
                  </motion.span>
                )}
                <div className="flex-1">
                  {isSuccess ? (
                    <>
                      <div className="text-cyber-success font-bold text-lg mb-2">
                        {t('successTitle', { ns: 'tasks' })}
                      </div>
                      {xpGained && (
                        <div className="text-cyber-success font-bold text-xl mb-3">
                          +{xpGained} XP
                        </div>
                      )}
                      {result && (
                        <div className="text-cyber-success text-sm mb-3 whitespace-pre-wrap">
                          {result.replace(`${t('success', { ns: 'tasks' })}\n`, '')}
                        </div>
                      )}

                      {hasNextLevel() && (
                        <motion.button
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleNextLevel}
                          className="w-full cyber-button py-3 text-base mt-3"
                        >
                          {t('nextLevel', { ns: 'tasks' })} →
                        </motion.button>
                      )}
                      {!hasNextLevel() && (
                        <div className="text-cyber-success font-medium text-sm mt-3">
                          {t('allCompleted', { ns: 'tasks' })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <div className="text-cyber-danger font-bold text-lg mb-2">
                        {result.startsWith(t('error', { ns: 'tasks' }))
                          ? t('error', { ns: 'tasks' }).replace(':', '')
                          : t('failureTitle', { ns: 'tasks' })}
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-sm text-cyber-danger mb-3">
                        {result
                          .replace(`${t('failure', { ns: 'tasks' })}\n`, '')
                          .replace(`${t('error', { ns: 'tasks' })}\n`, '')}
                      </pre>

                      {userAnswer && (
                        <div className="mb-3 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                          <div className="text-red-400 font-medium text-sm mb-2">
                            Ваша відповідь:
                          </div>
                          <pre className="text-red-300 font-mono text-sm break-all">
                            {userAnswer}
                          </pre>
                        </div>
                      )}
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
  },
  (prevProps, nextProps) => {
    return prevProps.level.level_id === nextProps.level.level_id;
  }
);

export default CodeEditor;
