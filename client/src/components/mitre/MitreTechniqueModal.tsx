import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MitreTechnique } from '@/services/api.ts';
import { api } from '@/services/api.ts';

const KILL_CHAIN_STAGES = [
  { id: 'reconnaissance', icon: '🔍', color: 'blue' },
  { id: 'resource-development', icon: '🛠️', color: 'purple' },
  { id: 'initial-access', icon: '🚪', color: 'orange' },
  { id: 'execution', icon: '⚡', color: 'yellow' },
  { id: 'persistence', icon: '🔒', color: 'red' },
  { id: 'privilege-escalation', icon: '⬆️', color: 'pink' },
  { id: 'defense-evasion', icon: '👻', color: 'gray' },
  { id: 'credential-access', icon: '🔑', color: 'amber' },
  { id: 'discovery', icon: '🔎', color: 'cyan' },
  { id: 'lateral-movement', icon: '➡️', color: 'indigo' },
  { id: 'collection', icon: '📦', color: 'green' },
  { id: 'command-and-control', icon: '🎮', color: 'teal' },
  { id: 'exfiltration', icon: '📤', color: 'rose' },
  { id: 'impact', icon: '💥', color: 'red' },
];

function normalizeTactic(tactic: string): string {
  return tactic.toLowerCase().replace(/\s+/g, '-');
}

function toClarification(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLocaleLowerCase() + trimmed.slice(1);
}

interface MitreTechniqueModalProps {
  technique: MitreTechnique | null;
  isOpen: boolean;
  onClose: () => void;
  isCompleted: boolean;
}

interface RelatedMission {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
}

export default function MitreTechniqueModal({
  technique,
  isOpen,
  onClose,
  isCompleted,
}: MitreTechniqueModalProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['mitre', 'common']);
  const [relatedMissions, setRelatedMissions] = useState<RelatedMission[]>([]);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [idCopied, setIdCopied] = useState(false);
  const [idHovered, setIdHovered] = useState(false);

  useEffect(() => {
    if (!isOpen || !technique) return;

    let cancelled = false;
    void (async () => {
      try {
        const detailed = await api.getMitreTechnique(technique.id);
        if (!cancelled && detailed.relatedMissions) {
          setRelatedMissions(detailed.relatedMissions);
        }
      } catch (error) {
        console.error('Failed to load related missions:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, technique]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedExample(null);
      setSelectedStageId(null);
      setIdCopied(false);
      setIdHovered(false);
    }
  }, [isOpen]);

  const closeLabel = i18n.resolvedLanguage?.startsWith('en') ? 'Close' : 'Закрити';

  const handleClose = useCallback(() => {
    setSelectedExample(null);
    setSelectedStageId(null);
    onClose();
  }, [onClose]);

  const clearActiveTooltips = useCallback(() => {
    setSelectedExample(null);
    setSelectedStageId(null);
  }, []);

  useEffect(() => {
    i18n.on('languageChanged', clearActiveTooltips);
    return () => {
      i18n.off('languageChanged', clearActiveTooltips);
    };
  }, [i18n, clearActiveTooltips]);

  useEffect(() => {
    if (selectedExample === null) return;

    const modalContent = document.querySelector('[data-modal-content]');
    const handleScroll = () => setSelectedExample(null);

    modalContent?.addEventListener('scroll', handleScroll);
    return () => modalContent?.removeEventListener('scroll', handleScroll);
  }, [selectedExample]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedStageId !== null) {
        setSelectedStageId(null);
        return;
      }
      if (selectedExample !== null) {
        setSelectedExample(null);
        return;
      }
      handleClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose, selectedExample, selectedStageId]);

  if (!technique) return null;

  const getKillChainStages = () =>
    KILL_CHAIN_STAGES.map((stage) => ({
      ...stage,
      name: t(`killChain.stage.${stage.id}`, { defaultValue: stage.id, ns: 'mitre' }),
    }));

  const getStageDescriptionTranslated = (tactic: string): string => {
    const normalized = normalizeTactic(tactic);
    return t(`killChain.description.${normalized}`, { defaultValue: '', ns: 'mitre' });
  };

  const getStageFullDescriptionTranslated = (stageId: string): string => {
    return t(`killChain.fullDescription.${stageId}`, { defaultValue: '', ns: 'mitre' });
  };

  const getAttackGoalTranslated = (tactic: string): string => {
    const normalized = normalizeTactic(tactic);
    return t(`killChain.goal.${normalized}`, { defaultValue: '', ns: 'mitre' });
  };

  const getAttackResultTranslated = (tactic: string): string => {
    const normalized = normalizeTactic(tactic);
    return t(`killChain.result.${normalized}`, { defaultValue: '', ns: 'mitre' });
  };

  const getMitigationTipKey = (tip: string): string => {
    const tipLower = tip.toLowerCase();

    if (tipLower.includes('regular') || tipLower.includes('update') || tipLower.includes('оновл'))
      return 'regular-updates';
    if (tipLower.includes('monitor') || tipLower.includes('log') || tipLower.includes('монітор'))
      return 'monitoring';
    if (tipLower.includes('privilege') || tipLower.includes('least') || tipLower.includes('привіл'))
      return 'least-privilege';
    if (
      tipLower.includes('mfa') ||
      tipLower.includes('multi-factor') ||
      tipLower.includes('багатофактор')
    )
      return 'mfa';
    if (
      tipLower.includes('train') ||
      tipLower.includes('employee') ||
      tipLower.includes('навча') ||
      tipLower.includes('співробіт')
    )
      return 'training';
    if (
      tipLower.includes('segment') ||
      tipLower.includes('network') ||
      tipLower.includes('сегмент')
    )
      return 'segmentation';
    if (tipLower.includes('backup') || tipLower.includes('резерв') || tipLower.includes('копі'))
      return 'backup';

    return tip.toLowerCase().replace(/[^\w-]/g, '-');
  };

  const getMitigationTipTranslated = (tip: string): string => {
    const tipKey = getMitigationTipKey(tip);
    return t(`mitigation.${tipKey}`, { defaultValue: tip, ns: 'mitre' });
  };

  const getMitigationTipDescriptionTranslated = (tip: string): string => {
    const tipKey = getMitigationTipKey(tip);
    return t(`mitigation.description.${tipKey}`, { defaultValue: '', ns: 'mitre' });
  };

  const getSimpleExplanation = (tactic: string): string => {
    const key = `tactic.explanation.${tactic}`;
    const translated = t(key, { defaultValue: '', ns: 'mitre' });
    if (translated && translated !== key) return translated;
    return t('tactic.explanation.default', { tactic, defaultValue: '', ns: 'mitre' });
  };

  const examples =
    technique.examples && technique.examples.length > 0 ? technique.examples : [technique.name];

  const getExampleTranslated = (example: string): string => {
    const exampleKey = example.toLowerCase().replace(/[^\w-]/g, '-');
    const translated = t(`example.${exampleKey}`, { defaultValue: example, ns: 'mitre' });
    return translated;
  };

  const getExampleDescription = (example: string): string => {
    const exampleKey = example.toLowerCase().replace(/[^\w-]/g, '-');
    const translatedExample = getExampleTranslated(example);
    const specificKey = `example.description.${exampleKey}`;

    if (i18n.exists(specificKey, { ns: 'mitre' })) {
      return t(specificKey, { example: translatedExample, ns: 'mitre' });
    }

    return t('example.defaultDescription', {
      example: translatedExample,
      defaultValue: `This is an example of how ${translatedExample} can be used in attacks.`,
      ns: 'mitre',
    });
  };

  const mitigationTips =
    technique.mitigation && technique.mitigation.length > 0
      ? technique.mitigation
      : [
          t('mitigation.regular-updates', { ns: 'mitre' }),
          t('mitigation.monitoring', { ns: 'mitre' }),
        ];

  const copyTechniqueId = async () => {
    try {
      await navigator.clipboard.writeText(technique.id);
      setIdCopied(true);
      window.setTimeout(() => setIdCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy technique id:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => {
                e.stopPropagation();
                clearActiveTooltips();
              }}
              className={`cyber-panel border-2 w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto ${
                isCompleted ? 'border-cyber-success' : 'border-cyber-primary'
              }`}
            >
              <div
                className={`flex-shrink-0 p-6 border-b border-cyber-border ${
                  isCompleted ? 'bg-green-900/20' : 'bg-cyber-panel'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        type="button"
                        onClick={copyTechniqueId}
                        onMouseEnter={() => setIdHovered(true)}
                        onMouseLeave={() => setIdHovered(false)}
                        className="group inline-flex items-center gap-2 font-mono text-2xl font-bold text-cyber-primary hover:text-cyber-success transition-colors cursor-copy"
                        title={
                          idCopied
                            ? t('modal.idCopied', { ns: 'mitre' })
                            : t('modal.copyId', { ns: 'mitre' })
                        }
                      >
                        <span>{technique.id}</span>
                        <span
                          className={`text-base transition-all ${
                            idCopied || idHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                          }`}
                          aria-hidden
                        >
                          {idCopied ? '✓' : '⎘'}
                        </span>
                      </button>
                      {isCompleted && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-cyber-success text-2xl"
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                    <h2 className="font-heading font-bold text-2xl text-white mb-2">
                      {t(`technique.name.${technique.id}`, {
                        defaultValue: technique.name,
                        ns: 'mitre',
                      })}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm px-3 py-1 rounded bg-cyber-panel border border-cyber-border text-cyber-primary">
                        {getKillChainStages().find(
                          (s) => s.id === normalizeTactic(technique.tactic)
                        )?.name || technique.tactic}
                      </span>
                      {isCompleted && (
                        <span className="text-sm px-3 py-1 rounded bg-green-900/30 border border-cyber-success text-cyber-success">
                          {t('modal.completed', { ns: 'mitre' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto cyber-scrollbar p-6"
                data-modal-content
                onClick={clearActiveTooltips}
              >
                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg text-cyber-primary mb-3">
                    {t('modal.whatIsThis', { ns: 'mitre' })}
                  </h3>
                  <div className="cyber-panel p-4 border border-cyber-border bg-cyber-primary/5">
                    <p className="text-gray-200 leading-relaxed">
                      {t(`technique.description.${technique.id}`, {
                        defaultValue: getSimpleExplanation(technique.tactic),
                        ns: 'mitre',
                      })}
                    </p>
                    {technique.platforms && technique.platforms.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {t('modal.platforms', { ns: 'mitre' })}
                        </span>
                        {technique.platforms.map((platform, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded bg-cyber-panel border border-cyber-border text-cyber-primary"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg text-cyber-primary mb-3">
                    {t('modal.howItWorks', { ns: 'mitre' })}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="cyber-panel p-3 border border-cyber-border"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cyber-primary/20 border border-cyber-primary flex items-center justify-center text-cyber-primary font-bold text-xs">
                          1
                        </span>
                        <span className="text-cyber-primary font-semibold text-sm">
                          {t('modal.attackGoal', { ns: 'mitre' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-snug pl-9">
                        {toClarification(getAttackGoalTranslated(technique.tactic))}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="cyber-panel p-3 border-2 border-cyber-primary bg-cyber-primary/10"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cyber-primary/20 border border-cyber-primary flex items-center justify-center text-cyber-primary font-bold text-xs">
                          2
                        </span>
                        <span className="text-cyber-primary font-semibold text-sm">
                          {t('modal.action', { ns: 'mitre' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-snug pl-9">
                        {toClarification(
                          getStageDescriptionTranslated(technique.tactic) ||
                            t(`technique.description.${technique.id}`, {
                              defaultValue: getSimpleExplanation(technique.tactic),
                              ns: 'mitre',
                            })
                        )}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="cyber-panel p-3 border border-red-500/50 bg-red-900/10"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 font-bold text-xs">
                          3
                        </span>
                        <span className="text-red-400 font-semibold text-sm">
                          {t('modal.attackResult', { ns: 'mitre' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-snug pl-9">
                        {toClarification(getAttackResultTranslated(technique.tactic))}
                      </p>
                    </motion.div>
                  </div>
                </div>

                {examples.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-heading font-bold text-lg text-cyber-primary mb-4">
                      {t('modal.examplesTitle', { ns: 'mitre' })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {examples.map((example, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStageId(null);
                              setSelectedExample((prev) => (prev === idx ? null : idx));
                            }}
                            className={`w-full text-left cyber-panel p-4 border transition-colors cursor-pointer ${
                              selectedExample === idx
                                ? 'border-cyber-primary bg-cyber-primary/10'
                                : 'border-cyber-border hover:border-cyber-primary'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-primary/20 border border-cyber-primary flex items-center justify-center text-cyber-primary text-sm font-bold">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-300 text-sm leading-relaxed font-mono break-all line-clamp-2">
                                  {getExampleTranslated(example)}
                                </div>
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {selectedExample === idx && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-30 left-0 right-0 bottom-full mb-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="cyber-panel p-4 border-2 border-cyber-primary bg-gray-900 shadow-xl max-h-52 overflow-y-auto cyber-scrollbar">
                                  <p className="font-mono text-sm text-gray-200 break-all leading-relaxed">
                                    {getExampleTranslated(example)}
                                  </p>
                                  <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                                    {getExampleDescription(example)}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {mitigationTips.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-heading font-bold text-lg text-cyber-primary mb-3">
                      {t('modal.howToProtect', { ns: 'mitre' })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mitigationTips.map((tip, idx) => {
                        const description = getMitigationTipDescriptionTranslated(tip);
                        return (
                          <div
                            key={idx}
                            className="cyber-panel p-3 border border-cyber-success/30 bg-green-900/10 flex items-start gap-3"
                          >
                            <span className="text-cyber-success font-bold flex-shrink-0">✓</span>
                            <div className="min-w-0">
                              <span className="text-gray-300 text-sm block">
                                {getMitigationTipTranslated(tip)}
                              </span>
                              {description && (
                                <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                                  {description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {technique.dataSources && technique.dataSources.length > 0 && (
                      <div className="mt-4 cyber-panel p-3 border border-cyber-border">
                        <div className="text-xs text-gray-400 mb-2">
                          {t('modal.dataSources', { ns: 'mitre' })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {technique.dataSources.map((ds, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-cyber-panel border border-cyber-border text-cyber-primary"
                            >
                              {ds.source}
                              {ds.component ? `: ${ds.component}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {relatedMissions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-heading font-bold text-lg text-cyber-primary mb-3">
                      {t('modal.relatedMissionsTitle', { ns: 'mitre' })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {relatedMissions.map((mission) => (
                        <motion.div
                          key={mission.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            onClose();
                            navigate('/missions');
                          }}
                          className="cyber-panel p-4 border border-cyber-border hover:border-cyber-primary cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-heading font-bold text-cyber-primary">
                              {mission.name}
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                mission.difficulty === 'beginner'
                                  ? 'bg-green-900/30 text-green-400'
                                  : mission.difficulty === 'intermediate'
                                    ? 'bg-yellow-900/30 text-yellow-400'
                                    : 'bg-red-900/30 text-red-400'
                              }`}
                            >
                              {mission.difficulty}
                            </span>
                          </div>
                          {mission.description && (
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {mission.description}
                            </p>
                          )}
                          <div className="mt-2 text-xs text-cyber-primary">
                            {t('modal.goToMission', { ns: 'mitre' })} →
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg text-cyber-primary mb-4">
                    {t('modal.positionInKillChain', { ns: 'mitre' })}
                  </h3>

                  <div className="cyber-panel p-4 border border-cyber-border">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-x-2 gap-y-5">
                      {getKillChainStages().map((stage, idx) => {
                        const normalizedTactic = normalizeTactic(technique.tactic);
                        const isCurrent = stage.id === normalizedTactic;
                        const currentIndex = getKillChainStages().findIndex(
                          (s) => s.id === normalizedTactic
                        );
                        const isBefore = currentIndex > idx;
                        const isSelected = selectedStageId === stage.id;

                        return (
                          <motion.button
                            key={stage.id}
                            type="button"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExample(null);
                              setSelectedStageId((prev) => (prev === stage.id ? null : stage.id));
                            }}
                            className={`relative flex flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-cyber-success/10 ring-1 ring-cyber-success'
                                : 'hover:bg-cyber-primary/5'
                            }`}
                          >
                            <div
                              className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-lg transition-all ${
                                isCurrent
                                  ? 'border-cyber-primary bg-cyber-primary/20 cyber-glow shadow-lg shadow-cyber-primary/40'
                                  : isBefore
                                    ? 'border-green-500 bg-green-900/20'
                                    : 'border-gray-600 bg-gray-800/50 opacity-60'
                              }`}
                            >
                              {stage.icon}
                            </div>

                            <div
                              className={`text-[10px] text-center font-medium leading-tight line-clamp-2 ${
                                isCurrent
                                  ? 'text-cyber-primary font-bold'
                                  : isBefore
                                    ? 'text-green-400'
                                    : 'text-gray-500'
                              }`}
                            >
                              {stage.name}
                            </div>

                            {isCurrent && (
                              <span className="absolute -top-1 right-0 text-[9px] font-mono font-bold text-cyber-primary bg-cyber-panel border border-cyber-primary px-1 rounded">
                                {technique.id}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      {selectedStageId ? (
                        <motion.div
                          key={selectedStageId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="mt-5 cyber-panel p-4 border-2 border-cyber-success bg-green-900/10"
                        >
                          {(() => {
                            const stage = getKillChainStages().find(
                              (s) => s.id === selectedStageId
                            );
                            const isCurrent = selectedStageId === normalizeTactic(technique.tactic);
                            if (!stage) return null;

                            return (
                              <>
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-2xl">{stage.icon}</span>
                                  <div className="min-w-0">
                                    <h4 className="text-cyber-success font-bold text-base">
                                      {stage.name}
                                    </h4>
                                    {isCurrent && (
                                      <span className="text-xs font-mono text-cyber-primary">
                                        {technique.id} ·{' '}
                                        {t('modal.currentStage', {
                                          defaultValue: i18n.resolvedLanguage?.startsWith('en')
                                            ? 'current stage'
                                            : 'поточний етап',
                                          ns: 'mitre',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                  {getStageFullDescriptionTranslated(selectedStageId)}
                                </p>
                              </>
                            );
                          })()}
                        </motion.div>
                      ) : (
                        <motion.p
                          key="hint"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="mt-5 text-center text-sm text-gray-500"
                        >
                          {t('modal.selectKillChainStage', {
                            defaultValue: i18n.resolvedLanguage?.startsWith('en')
                              ? 'Click a stage to see details'
                              : 'Натисніть етап, щоб побачити опис',
                            ns: 'mitre',
                          })}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-4 bg-cyber-primary/10 border border-cyber-primary rounded-lg"
                  >
                    <p className="text-sm text-gray-300 leading-relaxed">
                      <strong className="text-cyber-primary font-bold">
                        {t(`technique.name.${technique.id}`, {
                          defaultValue: technique.name,
                          ns: 'mitre',
                        })}
                      </strong>{' '}
                      {t('modal.usedOnStage', { ns: 'mitre' })}{' '}
                      <strong className="text-cyber-primary font-bold">
                        {getKillChainStages().find(
                          (s) => s.id === normalizeTactic(technique.tactic)
                        )?.name || technique.tactic}
                      </strong>{' '}
                      - {t('modal.meansAttackerAlready', { ns: 'mitre' })}{' '}
                      <strong className="text-cyber-primary">
                        {getStageDescriptionTranslated(technique.tactic)}
                      </strong>
                      .
                    </p>
                  </motion.div>
                </div>
              </div>

              <div className="relative z-[110] flex-shrink-0 p-6 border-t border-cyber-border bg-cyber-panel flex items-center justify-end gap-4">
                <button onClick={handleClose} className="cyber-button px-6 py-2">
                  {closeLabel}
                </button>
                <a
                  href={technique.url || `https://attack.mitre.org/techniques/${technique.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cyber-button-success px-6 py-2"
                >
                  {t('modal.openOnMitre', { ns: 'mitre' })} →
                </a>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
