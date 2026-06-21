import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { api, type MitreTechnique } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import MitreTechniqueModal from '../components/mitre/MitreTechniqueModal';
import { tacticSectionId } from '../utils/mitreLinks';

interface TacticGroup {
  tactic: string;
  techniques: MitreTechnique[];
  completed: number;
  total: number;
}

const EXPANDED_TACTICS_STORAGE_KEY = 'cybertactics.skillMatrix.expandedTactics';

function loadExpandedTactics(): Set<string> {
  try {
    const raw = localStorage.getItem(EXPANDED_TACTICS_STORAGE_KEY);
    if (!raw) return new Set();

    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((t): t is string => typeof t === 'string'));
    }
  } catch {
    // ignore invalid storage
  }
  return new Set();
}

function saveExpandedTactics(tactics: Set<string>) {
  try {
    localStorage.setItem(EXPANDED_TACTICS_STORAGE_KEY, JSON.stringify(Array.from(tactics)));
  } catch {
    // ignore quota / private mode
  }
}

export default function SkillMatrixPage() {
  const { t } = useTranslation(['skillMatrix', 'common']);
  const { user } = useAuthStore();
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [completedTechniques, setCompletedTechniques] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTactics, setExpandedTactics] = useState<Set<string>>(loadExpandedTactics);
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastViewedTechniqueId, setLastViewedTechniqueId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingTechniqueIdRef = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allTechniques, stats] = await Promise.all([
        api.getMitreTechniques(),
        user ? api.getUserStats().catch(() => null) : Promise.resolve(null),
      ]);

      setTechniques(allTechniques);
      if (stats) {
        setCompletedTechniques(stats.mitreTechniques || []);
      }
    } catch (error) {
      console.error('Failed to load MITRE data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const techniqueId = searchParams.get('technique');
    if (techniqueId) {
      pendingTechniqueIdRef.current = techniqueId;
    }
  }, [searchParams]);

  useEffect(() => {
    if (loading || techniques.length === 0) return;

    const techniqueId = pendingTechniqueIdRef.current;
    if (!techniqueId) return;

    const technique = techniques.find((t) => t.id === techniqueId);
    pendingTechniqueIdRef.current = null;
    setSearchParams({}, { replace: true });

    if (!technique) return;

    setExpandedTactics((prev) => new Set([...prev, technique.tactic]));

    window.setTimeout(() => {
      document.getElementById(tacticSectionId(technique.tactic))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      setLastViewedTechniqueId(technique.id);
      setSelectedTechnique(technique);
      setIsModalOpen(true);
    }, 400);
  }, [loading, techniques, setSearchParams]);

  const isTechniqueCompleted = useCallback(
    (techniqueId: string): boolean => {
      return completedTechniques.includes(techniqueId);
    },
    [completedTechniques]
  );

  useEffect(() => {
    saveExpandedTactics(expandedTactics);
  }, [expandedTactics]);

  const getCompletionPercentage = (): number => {
    if (techniques.length === 0) return 0;
    return Math.round((completedTechniques.length / techniques.length) * 100);
  };

  const tacticGroups = useMemo((): TacticGroup[] => {
    let filtered = techniques;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tech) =>
          tech.id.toLowerCase().includes(query) ||
          tech.name.toLowerCase().includes(query) ||
          tech.description?.toLowerCase().includes(query) ||
          tech.tactic.toLowerCase().includes(query)
      );
    }

    if (filterCompleted === 'completed') {
      filtered = filtered.filter((tech) => isTechniqueCompleted(tech.id));
    } else if (filterCompleted === 'incomplete') {
      filtered = filtered.filter((tech) => !isTechniqueCompleted(tech.id));
    }

    const grouped: Record<string, MitreTechnique[]> = {};
    filtered.forEach((tech) => {
      if (!grouped[tech.tactic]) {
        grouped[tech.tactic] = [];
      }
      grouped[tech.tactic].push(tech);
    });

    return Object.entries(grouped)
      .map(([tactic, techs]) => ({
        tactic,
        techniques: techs.sort((a, b) => a.id.localeCompare(b.id)),
        completed: techs.filter((t) => isTechniqueCompleted(t.id)).length,
        total: techs.length,
      }))
      .sort((a, b) => a.tactic.localeCompare(b.tactic));
  }, [techniques, searchQuery, filterCompleted, isTechniqueCompleted]);

  const toggleTactic = (tactic: string) => {
    setExpandedTactics((prev) => {
      const next = new Set(prev);
      if (next.has(tactic)) {
        next.delete(tactic);
      } else {
        next.add(tactic);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTactics(new Set(tacticGroups.map((g) => g.tactic)));
  };

  const collapseAll = () => {
    setExpandedTactics(new Set());
  };

  const handleTechniqueClick = (technique: MitreTechnique) => {
    setLastViewedTechniqueId(technique.id);
    setSelectedTechnique(technique);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTechnique(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-cyber-primary font-heading">{t('loading', { ns: 'skillMatrix' })}</div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto w-full">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-4 text-center">
            {t('title', { ns: 'skillMatrix' })}
          </h1>

          <div className="mb-4">
            <div className="border border-cyber-border rounded-lg bg-cyber-panel/40 px-4 py-3">
              <div className="text-xs text-gray-400 mb-2">
                {t('progress', { ns: 'skillMatrix' })}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="text-xl font-bold text-cyber-primary">{completionPercentage}%</div>
                <div className="flex-1 w-full">
                  <div className="h-2 bg-cyber-panel rounded-full overflow-hidden border border-cyber-border">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-cyber-success cyber-glow-green"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {completedTechniques.length} / {techniques.length}{' '}
                  {t('techniques', { ns: 'skillMatrix' })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-0 w-full sm:min-w-[200px]">
              <input
                type="text"
                placeholder={t('searchPlaceholder', { ns: 'skillMatrix' })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full cyber-input text-sm py-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterCompleted}
                onChange={(e) =>
                  setFilterCompleted(e.target.value as 'all' | 'completed' | 'incomplete')
                }
                className="cyber-input text-sm px-3 py-2 appearance-none cursor-pointer bg-cyber-panel border border-cyber-border rounded-lg text-white focus:border-cyber-primary focus:outline-none pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="all">{t('filterAll', { ns: 'skillMatrix' })}</option>
                <option value="completed">{t('filterCompleted', { ns: 'skillMatrix' })}</option>
                <option value="incomplete">{t('filterIncomplete', { ns: 'skillMatrix' })}</option>
              </select>
              <button
                onClick={expandAll}
                className="cyber-button text-sm px-2.5 py-1"
                title={t('expandAll', { ns: 'skillMatrix' })}
              >
                ↓
              </button>
              <button
                onClick={collapseAll}
                className="cyber-button text-sm px-2.5 py-1"
                title={t('collapseAll', { ns: 'skillMatrix' })}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto cyber-scrollbar min-h-0 p-4 sm:p-6 pt-0">
        {tacticGroups.length === 0 ? (
          <div className="max-w-3xl mx-auto cyber-panel p-8 text-center text-gray-400">
            <p>{t('notFound', { ns: 'skillMatrix' })}</p>
            {searchQuery && (
              <p className="text-sm mt-2">{t('tryAnotherQuery', { ns: 'skillMatrix' })}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tacticGroups.map((group) => {
              const isExpanded = expandedTactics.has(group.tactic);
              const completionRate =
                group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0;

              return (
                <div key={group.tactic} id={tacticSectionId(group.tactic)}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-3xl mx-auto border border-cyber-border rounded-lg bg-cyber-panel/40 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTactic(group.tactic)}
                      className="w-full flex items-center justify-between p-3 hover:bg-cyber-panel/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <motion.span
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-cyber-primary text-sm shrink-0"
                        >
                          ▶
                        </motion.span>
                        <div className="flex-1 text-left min-w-0">
                          <h2 className="font-heading font-bold text-sm sm:text-base text-cyber-primary truncate">
                            {group.tactic}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-xs text-gray-400">
                              {group.techniques.length}{' '}
                              {t('techniquesShort', { ns: 'skillMatrix' })}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {t('completed', { ns: 'skillMatrix' })}
                              </span>
                              <span className="text-xs font-medium text-cyber-success">
                                {group.completed} / {group.total} ({completionRate}%)
                              </span>
                            </div>
                            <div className="w-20 h-1.5 bg-cyber-panel rounded-full overflow-hidden border border-cyber-border">
                              <div
                                className="h-full bg-cyber-success transition-all duration-300"
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="w-full px-4 sm:px-6 pb-2 pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {group.techniques.map((technique) => {
                              const isCompleted = isTechniqueCompleted(technique.id);
                              const isLastViewed = lastViewedTechniqueId === technique.id;
                              const cardClass = isCompleted
                                ? 'border-cyber-success bg-green-900/10 hover:bg-green-900/20'
                                : isLastViewed
                                  ? 'border-cyber-primary bg-cyber-primary/10 hover:bg-cyber-primary/20 shadow-glow'
                                  : 'border-cyber-border bg-cyber-panel/50 hover:border-cyber-primary/50 hover:bg-cyber-panel';
                              return (
                                <motion.div
                                  key={technique.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleTechniqueClick(technique)}
                                  className={`p-3 rounded-lg border-2 transition-colors duration-200 cursor-pointer outline-none ${cardClass}`}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <span
                                      className={`font-mono text-xs font-bold flex-shrink-0 ${
                                        isCompleted ? 'text-cyber-success' : 'text-cyber-primary'
                                      }`}
                                    >
                                      {technique.id}
                                    </span>
                                    {isCompleted && (
                                      <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-cyber-success text-sm flex-shrink-0"
                                      >
                                        ✓
                                      </motion.span>
                                    )}
                                  </div>
                                  <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">
                                    {technique.name}
                                  </h3>
                                  {technique.description && (
                                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                                      {technique.description}
                                    </p>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {techniques.length === 0 && !loading && (
        <div className="max-w-3xl mx-auto cyber-panel p-6 text-center text-gray-400 text-sm m-4 sm:m-6">
          <p>{t('notLoaded', { ns: 'skillMatrix' })}</p>
          <p className="text-sm mt-2">{t('syncRequired', { ns: 'skillMatrix' })}</p>
        </div>
      )}

      <MitreTechniqueModal
        technique={selectedTechnique}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isCompleted={selectedTechnique ? isTechniqueCompleted(selectedTechnique.id) : false}
      />
    </div>
  );
}
