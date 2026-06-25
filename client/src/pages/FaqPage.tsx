import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadMultipleNamespaces } from '../i18n/config';
import { FAQ_SECTIONS } from '../constants/faq';
import FaqAccordion from '../components/faq/FaqAccordion';

export default function FaqPage() {
  const { t, i18n } = useTranslation(['faq', 'ui']);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [translationsTick, setTranslationsTick] = useState(0);
  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;

  useEffect(() => {
    const locale = isEn ? 'en' : 'uk';
    void loadMultipleNamespaces(locale, ['faq', 'ui']).then(() => {
      setTranslationsTick((tick) => tick + 1);
    });
  }, [isEn, i18n.resolvedLanguage, i18n.language]);

  const toggleItem = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <span hidden>{translationsTick}</span>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-3 text-center">
          {t('title', {
            ns: 'faq',
            defaultValue: isEn ? 'FAQ' : 'Часті питання',
          })}
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-8 text-center">
          {t('intro', {
            ns: 'faq',
            defaultValue: isEn
              ? 'Answers about mission types and how to use CyberTactics.'
              : 'Відповіді про типи місій і як користуватися CyberTactics.',
          })}
        </p>

        <FaqAccordion sections={FAQ_SECTIONS} expandedIds={expandedIds} onToggle={toggleItem} />
      </div>
    </div>
  );
}
