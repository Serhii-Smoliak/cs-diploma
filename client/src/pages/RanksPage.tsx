import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { RANK_TIERS, getRankFromXp, getRankXpRange } from '../constants/ranks';
import { getRankLabel } from '../utils/rank';
import { loadMultipleNamespaces } from '../i18n/config';

const RANK_DESCRIPTIONS = {
  en: {
    'Script Kiddie':
      'Starting point. In security culture, a "script kiddie" uses ready-made tools without deep understanding. In CyberTactics this marks the beginning of your path in ethical hacking simulations.',
    'Novice Hacker':
      'You grasp reconnaissance basics, MITRE techniques, and mission flow. A junior level in red-team fundamentals.',
    'Intermediate Hacker':
      'You handle multi-step attack chains, OPSEC awareness, and combining techniques across missions.',
    'Advanced Hacker':
      'Strong tactical thinking, stealth management, and complex scenario-based challenges.',
    'Elite Hacker':
      'Mastery level — deep MITRE coverage, optimal mission execution, and top-tier operator skill.',
  },
  uk: {
    'Script Kiddie':
      'Початкова точка. У культурі кібербезпеки «скрипт-кіді» користується готовими інструментами без глибокого розуміння. У CyberTactics це старт вашого шляху в навчальних симуляціях етичного хакінгу.',
    'Novice Hacker':
      'Ви розумієте основи розвідки, технік MITRE та логіку місій. Рівень початківця в основах red team.',
    'Intermediate Hacker':
      'Впевнено проходите багатокрокові ланцюги атак, розумієте OPSEC і поєднуєте техніки в місіях.',
    'Advanced Hacker': 'Сильне тактичне мислення, управління стелсом і складні сценарні завдання.',
    'Elite Hacker':
      'Рівень майстерності — глибоке знання MITRE, оптимальне проходження місій і навички оператора топ-рівня.',
  },
} as const;

export default function RanksPage() {
  const { t, i18n } = useTranslation(['ui']);
  const user = useAuthStore((state) => state.user);
  const [translationsRevision, setTranslationsRevision] = useState(0);
  const xp = user?.xp ?? 0;
  const currentRankId = getRankFromXp(xp);
  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;
  const locale = isEn ? 'en' : 'uk';

  useEffect(() => {
    const code = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk';
    loadMultipleNamespaces(code, ['ui'])
      .then(() => setTranslationsRevision((revision) => revision + 1))
      .catch((error) => {
        console.error('Failed to load ranks translations:', error);
      });
  }, [i18n.resolvedLanguage, i18n.language]);

  const formatXpRange = (from: number, to: number | null): string => {
    if (to === null) {
      return t('ranksXpFrom', {
        ns: 'ui',
        xp: from,
        defaultValue: isEn ? `${from}+ XP` : `від ${from} XP`,
      });
    }
    return t('ranksXpRange', {
      ns: 'ui',
      from,
      to: to - 1,
      defaultValue: isEn ? `${from}–${to - 1} XP` : `${from}–${to - 1} досв`,
    });
  };

  const getRankDescription = (rankId: string): string => {
    const key = `rank.description.${rankId}`;
    const translated = t(key, {
      ns: 'ui',
      defaultValue: RANK_DESCRIPTIONS[locale][rankId as keyof (typeof RANK_DESCRIPTIONS)['uk']],
    });
    return translated === key
      ? (RANK_DESCRIPTIONS[locale][rankId as keyof (typeof RANK_DESCRIPTIONS)['uk']] ?? '')
      : translated;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto" key={translationsRevision}>
      <div className="max-w-lg mx-auto w-full text-center">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-2">
          {t('ranks', {
            ns: 'ui',
            defaultValue: isEn ? 'Career Ranks' : 'Звання',
          })}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-5 px-2">
          {t('ranksIntro', {
            ns: 'ui',
            defaultValue: isEn
              ? 'Ranks reflect your XP from missions. This is a gamified learning ladder — from Script Kiddie to Elite Hacker — inspired by real offensive security culture, not an official certification.'
              : 'Звання відображають ваш досвід (XP) з місій. Це ігрова шкала прогресу — від Скрипт-кіді до Елітного хакера — натхненна культурою offensive security, а не офіційною сертифікацією.',
          })}
        </p>

        <div className="space-y-2 text-left">
          {RANK_TIERS.map((tier, index) => {
            const isCurrent = tier.id === currentRankId;
            const { from, to } = getRankXpRange(index);
            const description = isCurrent ? getRankDescription(tier.id) : '';

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  isCurrent
                    ? 'border-cyber-success/60 bg-green-900/15 shadow-[0_0_16px_rgba(34,197,94,0.12)]'
                    : 'border-cyber-border/80 bg-cyber-panel/30 hover:border-cyber-border'
                }`}
              >
                <div
                  className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center text-base ${
                    isCurrent
                      ? 'border-cyber-success bg-green-900/30 cyber-glow-green'
                      : 'border-cyber-border bg-cyber-panel/80'
                  }`}
                >
                  {tier.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="font-heading font-bold text-sm sm:text-base text-cyber-primary leading-tight">
                      {getRankLabel(tier.id, t)}
                    </h2>
                    {isCurrent && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-cyber-success text-cyber-success">
                        {t('ranksCurrent', {
                          ns: 'ui',
                          defaultValue: isEn ? 'Your rank' : 'Ваше звання',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                    {formatXpRange(from, to)}
                  </p>
                  {description && (
                    <p className="text-xs text-gray-400 leading-snug mt-2 pt-2 border-t border-cyber-border/60">
                      {description}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
