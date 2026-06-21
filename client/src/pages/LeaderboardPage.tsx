import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeaderboardEntry } from '@cybertactics/shared';
import { api } from '../services/api';
import { getRankLabel } from '../utils/rank';
import UserAvatar from '../components/profile/UserAvatar';
import { loadMultipleNamespaces } from '../i18n/config';

function getPositionLabel(position: number): string {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return String(position);
}

export default function LeaderboardPage() {
  const { t, i18n: i18nInstance } = useTranslation(['ui']);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isEn = i18nInstance.resolvedLanguage?.startsWith('en') ?? false;

  useEffect(() => {
    const locale = isEn ? 'en' : 'uk';
    void loadMultipleNamespaces(locale, ['ui']);
  }, [isEn]);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeaderboard();
      setEntries(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('leaderboardLoadError', {
              ns: 'ui',
              defaultValue: isEn
                ? 'Failed to load leaderboard.'
                : 'Не вдалося завантажити таблицю лідерів.',
            })
      );
    } finally {
      setLoading(false);
    }
  }, [t, isEn]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-6 text-center">
          {t('leaderboard', { ns: 'ui' })}
        </h1>

        {loading && (
          <div className="cyber-panel p-6 text-center text-gray-400 text-sm">
            {t('loading', { ns: 'ui', defaultValue: isEn ? 'Loading...' : 'Завантаження...' })}
          </div>
        )}

        {!loading && error && (
          <div className="cyber-panel p-4 border border-red-500/40 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="cyber-panel p-6 text-center text-gray-400 text-sm">
            {t('leaderboardEmpty', {
              ns: 'ui',
              defaultValue: isEn
                ? 'No players on the leaderboard yet.'
                : 'У таблиці лідерів поки немає гравців.',
            })}
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="cyber-panel border border-cyber-border overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-panel/80 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2 w-12">
                      {t('leaderboardPosition', { ns: 'ui', defaultValue: '#' })}
                    </th>
                    <th className="px-3 py-2">
                      {t('leaderboardPlayer', {
                        ns: 'ui',
                        defaultValue: isEn ? 'Player' : 'Гравець',
                      })}
                    </th>
                    <th className="px-3 py-2">{t('rank', { ns: 'ui' })}</th>
                    <th className="px-3 py-2 text-right">{t('xp', { ns: 'ui' })}</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">
                      {t('leaderboardLevels', {
                        ns: 'ui',
                        defaultValue: isEn ? 'Levels' : 'Рівні',
                      })}
                    </th>
                    <th className="px-3 py-2 text-right">
                      {t('leaderboardTechniques', { ns: 'ui', defaultValue: 'MITRE' })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`border-b border-cyber-border/60 transition-colors ${
                        entry.isCurrentUser
                          ? 'bg-cyber-primary/10 border-l-2 border-l-cyber-primary'
                          : 'hover:bg-cyber-panel/40'
                      }`}
                    >
                      <td className="px-3 py-2 font-mono font-bold text-cyber-primary text-center">
                        {getPositionLabel(entry.position)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar
                            username={entry.username}
                            avatarUrl={entry.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0 text-sm">
                            <span className="font-medium text-white truncate">
                              {entry.username}
                            </span>
                            {entry.isCurrentUser && (
                              <span className="ml-1.5 text-xs text-cyber-primary">
                                (
                                {t('leaderboardYou', {
                                  ns: 'ui',
                                  defaultValue: isEn ? 'you' : 'ви',
                                })}
                                )
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-300 text-xs sm:text-sm whitespace-nowrap">
                        {getRankLabel(entry.rank, t)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-cyber-primary font-semibold tabular-nums">
                        {entry.xp.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-300 tabular-nums">
                        {entry.completedLevels}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-300 tabular-nums">
                        {entry.mitreTechniquesCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
