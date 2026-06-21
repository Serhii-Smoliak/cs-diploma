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
  const [, setTranslationsTick] = useState(0);
  const xp = user?.xp ?? 0;
  const currentRankId = getRankFromXp(xp);
  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;
  const locale = isEn ? 'en' : 'uk';

  useEffect(() => {
    const code = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk';
    void loadMultipleNamespaces(code, ['ui']).then(() => {
      setTranslationsTick((tick) => tick + 1);
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
      defaultValue: isEn ? `${from}–${to - 1} XP` : `${from}–${to - 1} XP`,
    });
  };

  const getRankDescription = (rankId: string): string => {
    const key = `rank.description.${rankId}`;
    const translated = t(key, {
      ns: 'ui',
      defaultValue: RANK_DESCRIPTIONS[locale][rankId as keyof (typeof RANK_DESCRIPTIONS)['uk']],
    });
    return translated !== key
      ? translated
      : (RANK_DESCRIPTIONS[locale][rankId as keyof (typeof RANK_DESCRIPTIONS)['uk']] ?? '');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-3">
        {t('ranks', {
          ns: 'ui',
          defaultValue: isEn ? 'Career Ranks' : 'Звання',
        })}
      </h1>
      <p className="text-sm text-gray-400 max-w-3xl leading-relaxed mb-8">
        {t('ranksIntro', {
          ns: 'ui',
          defaultValue: isEn
            ? 'Ranks reflect your XP from missions. This is a gamified learning ladder — from Script Kiddie to Elite Hacker — inspired by real offensive security culture, not an official certification.'
            : 'Звання відображають ваш досвід (XP) з місій. Це ігрова шкала прогресу — від Скрипт-кіді до Елітного хакера — натхненна культурою offensive security, а не офіційною сертифікацією.',
        })}
      </p>

      <div className="max-w-2xl space-y-0">
        {RANK_TIERS.map((tier, index) => {
          const isCurrent = tier.id === currentRankId;
          const { from, to } = getRankXpRange(index);
          const description = getRankDescription(tier.id);

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg ${
                    isCurrent
                      ? 'border-cyber-success bg-green-900/20 cyber-glow-green'
                      : 'border-cyber-border bg-cyber-panel'
                  }`}
                >
                  {tier.icon}
                </div>
                {index < RANK_TIERS.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[2rem] bg-cyber-border my-1" />
                )}
              </div>

              <div
                className={`flex-1 mb-4 rounded-lg border p-4 transition-colors ${
                  isCurrent
                    ? 'border-cyber-success/50 bg-green-900/10'
                    : 'border-cyber-border bg-cyber-panel/40'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-heading font-bold text-base text-cyber-primary">
                    {getRankLabel(tier.id, t)}
                  </h2>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-cyber-success text-cyber-success">
                      {t('ranksCurrent', {
                        ns: 'ui',
                        defaultValue: isEn ? 'Your rank' : 'Ваше звання',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-500 mb-2">{formatXpRange(from, to)}</p>
                {description && (
                  <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
