import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';

export default function TopBar() {
  const { t, i18n } = useTranslation(['ui', 'common']);
  const { user } = useAuthStore();

  const getRankDisplay = (rank: string) => {
    const rankMap: Record<string, string> = {
      'Script Kiddie': 'Script Kiddie',
      'Novice Hacker': 'Novice Hacker',
      'Intermediate Hacker': 'Intermediate Hacker',
      'Advanced Hacker': 'Advanced Hacker',
      'Elite Hacker': 'Elite Hacker',
    };
    return rankMap[rank] || rank;
  };

  const getXpForNextRank = (currentXp: number) => {
    if (currentXp < 500) return 500;
    if (currentXp < 1500) return 1500;
    if (currentXp < 3000) return 3000;
    if (currentXp < 5000) return 5000;
    return 10000;
  };

  const xp = user?.xp || 0;
  const rank = user?.rank || 'Script Kiddie';
  const stealth = user?.stealth || 100;
  const nextRankXp = getXpForNextRank(xp);
  const xpProgress = (xp / nextRankXp) * 100;

  return (
    <header className="bg-cyber-panel border-b border-l border-cyber-border px-6 py-4 h-[73px] flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Left: Stealth */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{t('stealth', { ns: 'ui' })}:</span>
            <div className="w-48">
              <div className="h-2 bg-cyber-panel rounded-full overflow-hidden border border-cyber-border">
                <div
                  className="h-full bg-cyber-success transition-all duration-300 cyber-glow-green"
                  style={{ width: `${stealth}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-cyber-success">{stealth}%</span>
          </div>
        </div>

        {/* Right: Language Switcher and User Info */}
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{t('rank', { ns: 'ui' })}:</span>
              <span className="font-heading font-bold text-cyber-primary">{getRankDisplay(rank)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-400">{t('xp', { ns: 'ui' })}:</span>
              <span className="font-medium">{xp}/{nextRankXp}</span>
            </div>
            <div className="w-48 mt-1">
              <div className="h-1.5 bg-cyber-panel rounded-full overflow-hidden border border-cyber-border">
                <div
                  className="h-full bg-cyber-success transition-all duration-300 cyber-glow-green"
                  style={{ width: `${Math.min(xpProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-cyber-primary rounded-full flex items-center justify-center text-cyber-background font-bold cyber-glow">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

