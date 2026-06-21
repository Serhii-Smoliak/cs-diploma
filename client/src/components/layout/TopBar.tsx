import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { useSidebarStore } from '../../store/sidebarStore';
import LanguageSwitcher from './LanguageSwitcher';
import { getNextRankXp } from '../../constants/ranks';
import { getRankLabel } from '../../utils/rank';
import UserAvatar from '../profile/UserAvatar';

export default function TopBar() {
  const { t } = useTranslation(['ui', 'common']);
  const { user } = useAuthStore();
  const stealthNotice = useGameStore((state) => state.stealthNotice);
  const setStealthNotice = useGameStore((state) => state.setStealthNotice);
  const openStealthModal = useGameStore((state) => state.openStealthModal);
  const openMobile = useSidebarStore((state) => state.openMobile);

  const xp = user?.xp || 0;
  const rank = user?.rank || 'Script Kiddie';
  const stealth = user?.stealth ?? 100;
  const nextRankXp = getNextRankXp(xp) ?? 10000;
  const xpProgress = (xp / nextRankXp) * 100;
  const stealthBarClass =
    stealth <= 0 ? 'bg-cyber-danger' : stealth < 30 ? 'bg-yellow-400' : 'bg-cyber-success';
  const stealthTextClass =
    stealth <= 0 ? 'text-cyber-danger' : stealth < 30 ? 'text-yellow-400' : 'text-cyber-success';

  return (
    <header className="bg-cyber-panel border-b border-l border-cyber-border px-3 sm:px-4 lg:px-6 h-[73px] flex items-center shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0">
        <button
          type="button"
          onClick={openMobile}
          className="lg:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-cyber-border text-cyber-primary hover:bg-cyber-panel transition-colors"
          aria-label={t('expandMenu', { ns: 'ui' })}
        >
          ☰
        </button>

        <div className="shrink-0 min-w-0">
          <button
            type="button"
            onClick={openStealthModal}
            title={t('stealthManageTitle', {
              ns: 'ui',
              defaultValue: 'Stealth',
            })}
            className="flex items-center gap-2 sm:gap-2.5 rounded-lg px-1 py-0.5 hover:bg-cyber-panel/60 transition-colors cursor-pointer"
            aria-label={t('stealthOpenModal', {
              ns: 'ui',
              defaultValue: 'Open stealth recovery options',
            })}
          >
            <span className="text-sm text-gray-300 shrink-0 font-medium">{t('stealth', { ns: 'ui' })}:</span>
            <div className="w-16 sm:w-20 md:w-24 shrink-0">
              <div className="h-2 bg-cyber-panel/80 rounded-full overflow-hidden border border-cyber-border/80">
                <div
                  className={`h-full transition-all duration-300 ${stealthBarClass} ${stealth > 0 ? 'cyber-glow-green' : ''}`}
                  style={{ width: `${stealth}%` }}
                />
              </div>
            </div>
            <span className={`text-sm font-semibold shrink-0 w-9 text-right tabular-nums ${stealthTextClass}`}>
              {stealth}%
            </span>
          </button>
          {stealthNotice && (
            <div className="flex items-start gap-2 mt-1 max-w-full sm:max-w-xl">
              <p className="text-xs text-yellow-400 leading-snug">{stealthNotice}</p>
              <button
                type="button"
                onClick={() => setStealthNotice(null)}
                className="text-xs text-gray-500 hover:text-gray-300 shrink-0"
                aria-label={t('close', { ns: 'common' })}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-auto">
          <LanguageSwitcher />
          <div className="hidden md:block text-right">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{t('rank', { ns: 'ui' })}:</span>
              <Link
                to="/ranks"
                title={t('ranks', { ns: 'ui' })}
                className="font-heading font-bold text-cyber-primary text-sm lg:text-base hover:text-cyber-success transition-colors"
              >
                {getRankLabel(rank, t)}
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-400">{t('xp', { ns: 'ui' })}:</span>
              <span className="font-medium text-sm">
                {xp}/{nextRankXp}
              </span>
            </div>
            <div className="w-32 lg:w-48 mt-1">
              <div className="h-1.5 bg-cyber-panel rounded-full overflow-hidden border border-cyber-border">
                <div
                  className="h-full bg-cyber-success transition-all duration-300 cyber-glow-green"
                  style={{ width: `${Math.min(xpProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <Link
            to="/profile"
            title={t('profile', { ns: 'ui' })}
            className="rounded-full hover:ring-2 hover:ring-cyber-primary transition-all"
          >
            <UserAvatar username={user?.username} avatarUrl={user?.avatarUrl} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}
