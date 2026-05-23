import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
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
  const { t } = useTranslation(['mitre', 'common']);
  const [relatedMissions, setRelatedMissions] = useState<RelatedMission[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; width: number } | null>(null);
  const [selectedMitigationTip, setSelectedMitigationTip] = useState<number | null>(null);
  const [mitigationTooltipPosition, setMitigationTooltipPosition] = useState<{ x: number; y: number; width: number } | null>(null);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [exampleTooltipPosition, setExampleTooltipPosition] = useState<{ x: number; y: number; width: number } | null>(null);
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
      setSelectedStageId(null);
      setTooltipPosition(null);
      setSelectedMitigationTip(null);
      setMitigationTooltipPosition(null);
      setSelectedExample(null);
      setExampleTooltipPosition(null);
      setIdCopied(false);
      setIdHovered(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedStageId && selectedMitigationTip === null && selectedExample === null) return;

    const handleScroll = () => {
      setSelectedStageId(null);
      setTooltipPosition(null);
      setSelectedMitigationTip(null);
      setMitigationTooltipPosition(null);
      setSelectedExample(null);
      setExampleTooltipPosition(null);
    };

    const modalContent = document.querySelector('[data-modal-content]') || 
                         document.querySelector('.overflow-y-auto') ||
                         window;
    
    modalContent.addEventListener('scroll', handleScroll, true);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      modalContent.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [selectedStageId, selectedMitigationTip, selectedExample]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!technique) return null;

  const getKillChainStages = () => KILL_CHAIN_STAGES.map(stage => ({
    ...stage,
    name: t(`killChain.stage.${stage.id}`, { defaultValue: stage.id, ns: 'mitre' })
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
    
    if (tipLower.includes('regular') || tipLower.includes('update') || tipLower.includes('оновл')) return 'regular-updates';
    if (tipLower.includes('monitor') || tipLower.includes('log') || tipLower.includes('монітор')) return 'monitoring';
    if (tipLower.includes('privilege') || tipLower.includes('least') || tipLower.includes('привіл')) return 'least-privilege';
    if (tipLower.includes('mfa') || tipLower.includes('multi-factor') || tipLower.includes('багатофактор')) return 'mfa';
    if (tipLower.includes('train') || tipLower.includes('employee') || tipLower.includes('навча') || tipLower.includes('співробіт')) return 'training';
    if (tipLower.includes('segment') || tipLower.includes('network') || tipLower.includes('сегмент')) return 'segmentation';
    if (tipLower.includes('backup') || tipLower.includes('резерв') || tipLower.includes('копі')) return 'backup';

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

  const examples = technique.examples && technique.examples.length > 0
    ? technique.examples
    : [technique.name];

  const getExampleTranslated = (example: string): string => {
    const exampleKey = example.toLowerCase().replace(/[^\w-]/g, '-');
    const translated = t(`example.${exampleKey}`, { defaultValue: example, ns: 'mitre' });
    return translated;
  };

  const mitigationTips = technique.mitigation && technique.mitigation.length > 0
    ? technique.mitigation
    : [t('mitigation.regular-updates', { ns: 'mitre' }), t('mitigation.monitoring', { ns: 'mitre' })];

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
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className={`cyber-panel border-2 w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto ${
                isCompleted ? 'border-cyber-success' : 'border-cyber-primary'
              }`}
            >
              <div className={`flex-shrink-0 p-6 border-b border-cyber-border ${
                isCompleted ? 'bg-green-900/20' : 'bg-cyber-panel'
              }`}>
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
                      {t(`technique.name.${technique.id}`, { defaultValue: technique.name, ns: 'mitre' })}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm px-3 py-1 rounded bg-cyber-panel border border-cyber-border text-cyber-primary">
                        {getKillChainStages().find(s => s.id === normalizeTactic(technique.tactic))?.name || technique.tactic}
                      </span>
                      {isCompleted && (
                        <span className="text-sm px-3 py-1 rounded bg-green-900/30 border border-cyber-success text-cyber-success">
                          {t('modal.completed', { ns: 'mitre' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto cyber-scrollbar p-6" data-modal-content>
                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg text-cyber-primary mb-3">
                    {t('modal.whatIsThis', { ns: 'mitre' })}
                  </h3>
                  <div className="cyber-panel p-4 border border-cyber-border bg-cyber-primary/5">
                    <p className="text-gray-200 leading-relaxed">
                      {t(`technique.description.${technique.id}`, { 
                        defaultValue: getSimpleExplanation(technique.tactic),
                        ns: 'mitre' 
                      })}
                    </p>
                    {technique.platforms && technique.platforms.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">{t('modal.platforms', { ns: 'mitre' })}</span>
                        {technique.platforms.map((platform, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded bg-cyber-panel border border-cyber-border text-cyber-primary">
                            {platform}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg text-cyber-primary mb-4">
                    {t('modal.howItWorks', { ns: 'mitre' })}
                  </h3>
                  
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyber-primary/20 border-2 border-cyber-primary flex items-center justify-center text-cyber-primary font-bold text-lg">
                        1
                      </div>
                      <div className="flex-1 cyber-panel p-4 border border-cyber-border">
                        <div className="text-cyber-primary font-medium mb-2 text-base">{t('modal.attackGoal', { ns: 'mitre' })}</div>
                        <div className="text-sm text-gray-300 leading-relaxed">
                          {getAttackGoalTranslated(technique.tactic)}
                        </div>
                      </div>
                    </motion.div>

                    <div className="flex justify-center">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.1 }}
                        className="w-0.5 h-8 bg-cyber-primary"
                      />
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyber-primary/20 border-2 border-cyber-primary flex items-center justify-center text-cyber-primary font-bold text-lg">
                        2
                      </div>
                      <div className="flex-1 cyber-panel p-4 border-2 border-cyber-primary bg-cyber-primary/10">
                        <div className="text-cyber-primary font-medium mb-2 text-base">{t('modal.action', { ns: 'mitre' })}</div>
                        <div className="text-sm text-gray-300 leading-relaxed">
                          {examples.length > 0 && examples[0] 
                            ? getExampleTranslated(examples[0])
                            : t(`technique.description.${technique.id}`, { 
                                defaultValue: getSimpleExplanation(technique.tactic),
                                ns: 'mitre' 
                              })
                          }
                        </div>
                      </div>
                    </motion.div>

                    <div className="flex justify-center">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-0.5 h-8 bg-red-500"
                      />
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 font-bold text-lg">
                        3
                      </div>
                      <div className="flex-1 cyber-panel p-4 border-2 border-red-500/50 bg-red-900/10">
                        <div className="text-red-400 font-medium mb-2 text-base">{t('modal.attackResult', { ns: 'mitre' })}</div>
                        <div className="text-sm text-gray-300 leading-relaxed">
                          {getAttackResultTranslated(technique.tactic)}
                        </div>
                      </div>
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
                          className="cyber-panel p-4 border border-cyber-border hover:border-cyber-primary transition-colors relative"
                        >
                          <div 
                            className="flex items-start gap-3 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMitigationTip(null);
                              setMitigationTooltipPosition(null);
                              setSelectedStageId(null);
                              setTooltipPosition(null);

                              if (selectedExample === idx) {
                                setSelectedExample(null);
                                setExampleTooltipPosition(null);
                                return;
                              }
                              
                              const rect = e.currentTarget.getBoundingClientRect();
                              const modal = document.querySelector('.cyber-panel.border-2.max-h-\\[90vh\\]');
                              const modalRect = modal?.getBoundingClientRect();
                              
                              if (modalRect) {
                                const tooltipWidth = 400;
                                const padding = 16;
                                const targetCenterX = rect.left + rect.width / 2;
                                
                                let finalLeft = targetCenterX - tooltipWidth / 2;
                                
                                const minLeft = modalRect.left + padding;
                                const maxLeft = modalRect.right - padding - tooltipWidth;
                                
                                finalLeft = Math.max(minLeft, Math.min(finalLeft, maxLeft));
                                
                                setExampleTooltipPosition({ 
                                  x: finalLeft,
                                  y: rect.top,
                                  width: tooltipWidth
                                });
                                setSelectedExample(idx);
                              }
                            }}
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-primary/20 border border-cyber-primary flex items-center justify-center text-cyber-primary text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-gray-300 text-sm leading-relaxed">{getExampleTranslated(example)}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <AnimatePresence>
                      {selectedExample !== null && exampleTooltipPosition && examples[selectedExample] && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="fixed z-[100]"
                          style={{ 
                            width: `${exampleTooltipPosition.width}px`,
                            minWidth: '300px',
                            left: `${exampleTooltipPosition.x}px`,
                            top: `${exampleTooltipPosition.y - 12}px`,
                            transform: 'translateY(-100%)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="cyber-panel p-4 border-2 border-cyber-primary bg-gray-900 shadow-2xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-cyber-primary text-2xl">ℹ️</span>
                              <h4 className="text-cyber-primary font-bold text-base">
                                {getExampleTranslated(examples[selectedExample])}
                              </h4>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {t(`example.description.${examples[selectedExample].toLowerCase().replace(/[^\w-]/g, '-')}`, { 
                                defaultValue: t('example.defaultDescription', { 
                                  example: examples[selectedExample], 
                                  defaultValue: `This is an example of how ${technique.name} can be used in attacks.`,
                                  ns: 'mitre' 
                                }),
                                ns: 'mitre' 
                              })}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedExample(null);
                                setExampleTooltipPosition(null);
                              }}
                              className="mt-3 text-cyber-primary hover:text-blue-400 text-xs underline"
                            >
                              {t('close', { ns: 'common' })}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {mitigationTips.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-heading font-bold text-lg text-cyber-primary mb-3">
                      {t('modal.howToProtect', { ns: 'mitre' })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mitigationTips.map((tip, idx) => (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();

                            setSelectedStageId(null);
                            setTooltipPosition(null);

                            if (selectedMitigationTip === idx) {
                              setSelectedMitigationTip(null);
                              setMitigationTooltipPosition(null);
                              return;
                            }
                            
                            const rect = e.currentTarget.getBoundingClientRect();
                            const modal = document.querySelector('.cyber-panel.border-2.max-h-\\[90vh\\]');
                            const modalRect = modal?.getBoundingClientRect();
                            
                            if (modalRect) {
                              const tooltipWidth = 400;
                              const padding = 16;
                              const targetCenterX = rect.left + rect.width / 2;

                              let finalLeft = targetCenterX - tooltipWidth / 2;

                              const minLeft = modalRect.left + padding;
                              const maxLeft = modalRect.right - padding - tooltipWidth;
                              
                              finalLeft = Math.max(minLeft, Math.min(finalLeft, maxLeft));
                              
                              setMitigationTooltipPosition({ 
                                x: finalLeft,
                                y: rect.top,
                                width: tooltipWidth
                              });
                              setSelectedMitigationTip(idx);
                            }
                          }}
                          className="cyber-panel p-3 border border-cyber-success/30 bg-green-900/10 flex items-start gap-3 cursor-pointer hover:border-cyber-success hover:bg-green-900/20 transition-all"
                        >
                          <span className="text-cyber-success font-bold flex-shrink-0">✓</span>
                          <span className="text-gray-300 text-sm">{getMitigationTipTranslated(tip)}</span>
                        </div>
                      ))}
                    </div>

                    <AnimatePresence>
                      {selectedMitigationTip !== null && mitigationTooltipPosition && mitigationTips[selectedMitigationTip] && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="fixed z-[100]"
                          style={{ 
                            width: `${mitigationTooltipPosition.width}px`,
                            minWidth: '300px',
                            left: `${mitigationTooltipPosition.x}px`,
                            top: `${mitigationTooltipPosition.y - 12}px`,
                            transform: 'translateY(-100%)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="cyber-panel p-4 border-2 border-cyber-success bg-gray-900 shadow-2xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-cyber-success text-2xl">✓</span>
                              <h4 className="text-cyber-success font-bold text-base">
                                {getMitigationTipTranslated(mitigationTips[selectedMitigationTip])}
                              </h4>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {getMitigationTipDescriptionTranslated(mitigationTips[selectedMitigationTip])}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedMitigationTip(null);
                                setMitigationTooltipPosition(null);
                              }}
                              className="mt-3 text-cyber-success hover:text-green-400 text-xs underline"
                            >
                              {t('close', { ns: 'common' })}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {technique.dataSources && technique.dataSources.length > 0 && (
                      <div className="mt-4 cyber-panel p-3 border border-cyber-border">
                        <div className="text-xs text-gray-400 mb-2">{t('modal.dataSources', { ns: 'mitre' })}</div>
                        <div className="flex flex-wrap gap-2">
                          {technique.dataSources.map((ds, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 rounded bg-cyber-panel border border-cyber-border text-cyber-primary">
                              {ds.source}{ds.component ? `: ${ds.component}` : ''}
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
                            <span className={`text-xs px-2 py-1 rounded ${
                              mission.difficulty === 'beginner' ? 'bg-green-900/30 text-green-400' :
                              mission.difficulty === 'intermediate' ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-red-900/30 text-red-400'
                            }`}>
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

                  <div className="cyber-panel p-4 pt-28 pb-20 border border-cyber-border overflow-x-auto overflow-y-visible relative">
                    <div className="flex items-center gap-1 min-w-max pb-4">
                      {getKillChainStages().map((stage, idx) => {
                        const normalizedTactic = normalizeTactic(technique.tactic);
                        const isCurrent = stage.id === normalizedTactic;
                        const currentIndex = getKillChainStages().findIndex(s => s.id === normalizedTactic);
                        const isBefore = currentIndex > idx;
                        
                        return (
                          <div key={stage.id} className="flex items-center">
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200 }}
                              className="relative flex flex-col items-center min-w-[70px] z-30"
                            >
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  setSelectedMitigationTip(null);
                                  setMitigationTooltipPosition(null);

                                  if (selectedStageId === stage.id) {
                                    setSelectedStageId(null);
                                    setTooltipPosition(null);
                                    return;
                                  }
                                  
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const modal = document.querySelector('.cyber-panel.border-2.max-h-\\[90vh\\]');
                                  const modalRect = modal?.getBoundingClientRect();
                                  
                                  if (modalRect) {
                                    const tooltipWidth = 400;
                                    const padding = 16;
                                    const targetCenterX = rect.left + rect.width / 2;
                                    
                                    let finalLeft = targetCenterX - tooltipWidth / 2;
                                    
                                    const minLeft = modalRect.left + padding;
                                    const maxLeft = modalRect.right - padding - tooltipWidth;
                                    
                                    finalLeft = Math.max(minLeft, Math.min(finalLeft, maxLeft));
                                    
                                    setTooltipPosition({ 
                                      x: finalLeft,
                                      y: rect.top,
                                      width: tooltipWidth
                                    });
                                    setSelectedStageId(stage.id);
                                  }
                                }}
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl mb-1 transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'border-cyber-primary bg-cyber-primary/20 cyber-glow scale-110 shadow-lg shadow-cyber-primary/50'
                                    : isBefore
                                    ? 'border-green-500 bg-green-900/20 hover:border-green-400'
                                    : 'border-gray-600 bg-gray-800/50 opacity-50 hover:opacity-70'
                                }`}
                              >
                                {stage.icon}
                              </motion.div>
                              
                              <div className={`text-[10px] text-center font-medium px-1 leading-tight ${
                                isCurrent ? 'text-cyber-primary font-bold' : isBefore ? 'text-green-400' : 'text-gray-500'
                              }`}>
                                {stage.name}
                              </div>
                              
                              {isCurrent && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.3 }}
                                  className="absolute -top-20 left-0 right-0 flex justify-center whitespace-nowrap z-30"
                                >
                                  <div className="bg-cyber-primary text-white text-base px-4 py-2 rounded font-mono font-bold shadow-lg border-2 border-white">
                                    {technique.id}
                                  </div>
                                  <svg
                                    className="absolute -bottom-4 left-1/2 transform -translate-x-1/2" 
                                    width="40" 
                                    height="20" 
                                    viewBox="0 0 40 20"
                                  >
                                    <path d="M 20 20 L 0 0 L 40 0 Z" fill="white" />
                                    <path d="M 20 18 L 2 2 L 38 2 Z" fill="rgb(0, 255, 255)" />
                                  </svg>
                                </motion.div>
                              )}
                            </motion.div>
                            
                            {idx < KILL_CHAIN_STAGES.length - 1 && (
                              <div className="w-10 h-0.5 mx-1.5 relative flex items-center">
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: idx * 0.02 + 0.15 }}
                                  className={`w-full h-full ${
                                    isBefore ? 'bg-green-500' : 'bg-gray-600'
                                  }`}
                                />
                                <div className={`absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[3px] border-b-[3px] border-l-[6px] border-transparent ${
                                  isBefore ? 'border-l-green-500' : 'border-l-gray-600'
                                }`} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <AnimatePresence>
                      {selectedStageId && tooltipPosition && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="fixed z-[100]"
                          style={{ 
                            width: `${tooltipPosition.width}px`,
                            minWidth: '300px',
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y - 12}px`,
                            transform: 'translateY(-100%)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="cyber-panel p-4 border-2 border-cyber-success bg-gray-900 shadow-2xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">
                                {KILL_CHAIN_STAGES.find(s => s.id === selectedStageId)?.icon}
                              </span>
                              <h4 className="text-cyber-success font-bold text-base">
                                {getKillChainStages().find(s => s.id === selectedStageId)?.name}
                              </h4>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {selectedStageId && getStageFullDescriptionTranslated(selectedStageId)}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedStageId(null);
                                setTooltipPosition(null);
                              }}
                              className="mt-3 text-cyber-success hover:text-green-400 text-xs underline"
                            >
                              {t('close', { ns: 'common' })}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 p-4 bg-cyber-primary/10 border border-cyber-primary rounded-lg"
                    >
                      <p className="text-sm text-gray-300 leading-relaxed">
                        <strong className="text-cyber-primary font-bold">{t(`technique.name.${technique.id}`, { defaultValue: technique.name, ns: 'mitre' })}</strong> {t('modal.usedOnStage', { ns: 'mitre' })} {' '}
                        <strong className="text-cyber-primary font-bold">{getKillChainStages().find(s => s.id === normalizeTactic(technique.tactic))?.name || technique.tactic}</strong> - {t('modal.meansAttackerAlready', { ns: 'mitre' })} {' '}
                        <strong className="text-cyber-primary">{getStageDescriptionTranslated(technique.tactic)}</strong>.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 p-6 border-t border-cyber-border flex items-center justify-end gap-4">
                <button onClick={onClose} className="cyber-button px-6 py-2">
                  {t('close', { ns: 'common' })}
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
