import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FaqSection } from '../../constants/faq';

interface FaqAccordionProps {
  sections: FaqSection[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function FaqAccordion({ sections, expandedIds, onToggle }: FaqAccordionProps) {
  const { t } = useTranslation(['faq']);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id}>
          <h2 className="font-heading font-bold text-base text-cyber-primary mb-2 text-center">
            {t(section.titleKey, { ns: 'faq' })}
          </h2>
          <div className="space-y-2">
            {section.items.map((item) => {
              const itemKey = `${section.id}.${item.id}`;
              const isExpanded = expandedIds.has(itemKey);

              return (
                <motion.div
                  key={itemKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="cyber-panel border border-cyber-border rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => onToggle(itemKey)}
                    className="w-full flex items-center gap-3 p-3 sm:p-3.5 text-left hover:bg-cyber-panel/50 transition-colors"
                  >
                    <motion.span
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-cyber-primary text-sm shrink-0"
                      aria-hidden
                    >
                      ▶
                    </motion.span>
                    <span className="font-heading font-bold text-sm sm:text-base text-cyber-primary leading-snug">
                      {t(item.questionKey, { ns: 'faq' })}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 sm:px-3.5 pb-3 pt-0 border-t border-cyber-border ml-6">
                          <p className="text-sm text-gray-300 leading-relaxed pt-2.5">
                            {t(item.answerKey, { ns: 'faq' })}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
