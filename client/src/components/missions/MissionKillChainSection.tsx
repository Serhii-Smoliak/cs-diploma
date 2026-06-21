import { motion, AnimatePresence } from 'framer-motion';

interface MissionKillChainSectionProps {
  readonly killChain: {
    title: string;
    intro: string;
    steps: string[];
    expandLabel: string;
    collapseLabel: string;
  };
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

export default function MissionKillChainSection({
  killChain,
  isOpen,
  onToggle,
}: MissionKillChainSectionProps) {
  return (
    <div className="mt-3 max-w-2xl border border-cyber-border rounded-lg bg-cyber-panel/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 py-1.5 px-3 min-h-0 text-left hover:bg-cyber-panel/60 transition-colors"
        aria-expanded={isOpen}
        title={isOpen ? killChain.collapseLabel : killChain.expandLabel}
      >
        <span className="font-heading font-bold text-xs text-cyber-primary leading-none">
          {killChain.title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-cyber-primary text-[10px] leading-none flex-shrink-0"
          aria-hidden
        >
          ▶
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 max-h-48 overflow-y-auto cyber-scrollbar border-t border-cyber-border pt-2">
              <p className="text-xs text-gray-400 mb-2">{killChain.intro}</p>
              <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                {killChain.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
