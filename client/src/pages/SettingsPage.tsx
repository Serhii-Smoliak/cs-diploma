import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../components/common/ConfirmModal';
import { api, type AdminUserSummary, type MitreAdminStats } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { t, i18n: i18nInstance } = useTranslation(['ui']);
  const isEn = i18nInstance.resolvedLanguage?.startsWith('en') ?? false;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [mitreStats, setMitreStats] = useState<MitreAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [blockModalUser, setBlockModalUser] = useState<AdminUserSummary | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, statsData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminMitreStats(),
      ]);
      setUsers(usersData);
      setMitreStats(statsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('settingsLoadError', {
              ns: 'ui',
              defaultValue: isEn
                ? 'Failed to load admin settings.'
                : 'Не вдалося завантажити налаштування.',
            })
      );
    } finally {
      setLoading(false);
    }
  }, [t, isEn]);

  useEffect(() => {
    loadData().catch(() => {
      // loadData already sets error state
    });
  }, [loadData]);

  const handleBlockRequest = (user: AdminUserSummary) => {
    if (user.id === currentUserId || user.role === 'ADMIN') {
      return;
    }

    if (user.isBlocked) {
      void submitBlockChange(user, false);
      return;
    }

    setBlockReason('');
    setBlockModalUser(user);
  };

  const handleBlockCancel = () => {
    if (blockSubmitting) {
      return;
    }
    setBlockModalUser(null);
    setBlockReason('');
  };

  const submitBlockChange = async (user: AdminUserSummary, blocked: boolean, reason?: string) => {
    setActionUserId(user.id);
    setError(null);
    try {
      const updated = await api.setAdminUserBlocked(user.id, blocked, reason);
      setUsers((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      setBlockModalUser(null);
      setBlockReason('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('settingsBlockError', {
              ns: 'ui',
              defaultValue: isEn
                ? 'Failed to update user block status.'
                : 'Не вдалося оновити статус блокування.',
            })
      );
    } finally {
      setActionUserId(null);
      setBlockSubmitting(false);
    }
  };

  const handleBlockConfirm = async () => {
    if (!blockModalUser) {
      return;
    }

    setBlockSubmitting(true);
    const reason = blockReason.trim() || undefined;
    await submitBlockChange(blockModalUser, true, reason);
  };

  const handleMitreSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const result = await api.syncAdminMitre();
      setMitreStats(result.coverage);
      setSyncMessage(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('settingsMitreSyncError', {
              ns: 'ui',
              defaultValue: isEn ? 'MITRE sync failed.' : 'Синхронізація MITRE не вдалась.',
            })
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncRequest = () => {
    if (syncing) {
      return;
    }
    setSyncConfirmOpen(true);
  };

  const handleSyncCancel = () => {
    if (syncing) {
      return;
    }
    setSyncConfirmOpen(false);
  };

  const handleSyncConfirm = async () => {
    setError(null);
    try {
      const profile = await api.getCurrentUser();
      if (profile.role !== 'ADMIN') {
        setError(
          t('settingsAdminRequired', {
            ns: 'ui',
            defaultValue: isEn
              ? 'Administrator permissions are required for this action.'
              : 'Для цієї дії потрібні права адміністратора.',
          })
        );
        setSyncConfirmOpen(false);
        return;
      }

      await refreshUser();
      setSyncConfirmOpen(false);
      await handleMitreSync();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('settingsMitreSyncError', {
              ns: 'ui',
              defaultValue: isEn ? 'MITRE sync failed.' : 'Синхронізація MITRE не вдалась.',
            })
      );
      setSyncConfirmOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary">
          {t('settings', { ns: 'ui' })}
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

        {!loading && !error && (
          <>
            <section className="cyber-panel border border-cyber-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-cyber-border bg-cyber-panel/80">
                <h2 className="font-heading text-lg text-cyber-primary">
                  {t('settingsUsersTitle', {
                    ns: 'ui',
                    defaultValue: isEn ? 'Users' : 'Користувачі',
                  })}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyber-border text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">
                        {t('settingsUserColumn', {
                          ns: 'ui',
                          defaultValue: isEn ? 'User' : 'Користувач',
                        })}
                      </th>
                      <th className="px-3 py-2">
                        {t('settingsRoleColumn', {
                          ns: 'ui',
                          defaultValue: isEn ? 'Role' : 'Роль',
                        })}
                      </th>
                      <th className="px-3 py-2 text-right">{t('xp', { ns: 'ui' })}</th>
                      <th className="px-3 py-2">
                        {t('settingsStatusColumn', {
                          ns: 'ui',
                          defaultValue: isEn ? 'Status' : 'Статус',
                        })}
                      </th>
                      <th className="px-3 py-2">
                        {t('settingsBlockReasonColumn', {
                          ns: 'ui',
                          defaultValue: isEn ? 'Block reason' : 'Причина блокування',
                        })}
                      </th>
                      <th className="px-3 py-2 text-right">
                        {t('settingsActionsColumn', {
                          ns: 'ui',
                          defaultValue: isEn ? 'Actions' : 'Дії',
                        })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isSelf = user.id === currentUserId;
                      const isAdmin = user.role === 'ADMIN';
                      const disabled = isSelf || isAdmin || actionUserId === user.id;

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-cyber-border/60 last:border-b-0"
                        >
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-100">{user.username}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-3 py-3 text-gray-300">{user.role}</td>
                          <td className="px-3 py-3 text-right font-mono text-cyber-primary">
                            {user.xp}
                          </td>
                          <td className="px-3 py-3">
                            {user.isBlocked ? (
                              <span className="text-red-400">
                                {t('settingsBlocked', {
                                  ns: 'ui',
                                  defaultValue: isEn ? 'Blocked' : 'Заблоковано',
                                })}
                              </span>
                            ) : (
                              <span className="text-green-400">
                                {t('settingsActive', {
                                  ns: 'ui',
                                  defaultValue: isEn ? 'Active' : 'Активний',
                                })}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-400 text-xs max-w-xs">
                            {user.isBlocked && user.blockedReason ? (
                              <span title={user.blockedReason}>{user.blockedReason}</span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => handleBlockRequest(user)}
                              className="px-3 py-1 rounded border border-cyber-border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:border-cyber-primary hover:text-cyber-primary transition-colors"
                            >
                              {user.isBlocked
                                ? t('settingsUnblock', {
                                    ns: 'ui',
                                    defaultValue: isEn ? 'Unblock' : 'Розблокувати',
                                  })
                                : t('settingsBlock', {
                                    ns: 'ui',
                                    defaultValue: isEn ? 'Block' : 'Заблокувати',
                                  })}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="cyber-panel border border-cyber-border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="font-heading text-lg text-cyber-primary">
                  {t('settingsMitreTitle', {
                    ns: 'ui',
                    defaultValue: 'MITRE ATT&CK',
                  })}
                </h2>
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleSyncRequest}
                  className="px-4 py-2 rounded border border-cyber-primary text-cyber-primary text-sm uppercase tracking-wide disabled:opacity-50 hover:bg-cyber-primary/10 transition-colors"
                >
                  {syncing
                    ? t('settingsMitreSyncing', {
                        ns: 'ui',
                        defaultValue: isEn ? 'Syncing...' : 'Синхронізація...',
                      })
                    : t('settingsMitreSync', {
                        ns: 'ui',
                        defaultValue: isEn ? 'Sync techniques' : 'Синхронізувати техніки',
                      })}
                </button>
              </div>

              {syncMessage && <p className="text-sm text-green-400">{syncMessage}</p>}

              {mitreStats && (
                <div className="space-y-4 text-sm">
                  <div className="rounded border border-cyber-border p-3 max-w-xs">
                    <div className="text-gray-500 text-xs uppercase mb-1">
                      {t('settingsMitreTotal', {
                        ns: 'ui',
                        defaultValue: isEn ? 'Techniques' : 'Техніки',
                      })}
                    </div>
                    <div className="font-mono text-xl text-cyber-primary">
                      {mitreStats.totalTechniques}
                    </div>
                  </div>

                  {(['uk', 'en'] as const).map((locale) => (
                    <div key={locale} className="space-y-2">
                      <h3 className="text-xs uppercase tracking-wide text-gray-500">
                        {locale === 'uk'
                          ? t('settingsMitreUkTitle', {
                              ns: 'ui',
                              defaultValue: isEn
                                ? 'Ukrainian (visible in UI)'
                                : 'Українська (як у UI)',
                            })
                          : t('settingsMitreEnTitle', {
                              ns: 'ui',
                              defaultValue: isEn ? 'English (visible in UI)' : 'English (як у UI)',
                            })}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded border border-green-500/30 p-3">
                          <div className="text-gray-500 text-xs uppercase mb-1">
                            {t('settingsMitreFull', {
                              ns: 'ui',
                              defaultValue: isEn ? 'Full' : 'Повний переклад',
                            })}
                          </div>
                          <div className="font-mono text-xl text-green-400">
                            {mitreStats[locale].full}
                          </div>
                        </div>
                        <div className="rounded border border-yellow-500/30 p-3">
                          <div className="text-gray-500 text-xs uppercase mb-1">
                            {t('settingsMitrePartial', {
                              ns: 'ui',
                              defaultValue: isEn ? 'Partial' : 'Неповний переклад',
                            })}
                          </div>
                          <div className="font-mono text-xl text-yellow-400">
                            {mitreStats[locale].partial}
                          </div>
                        </div>
                        <div className="rounded border border-red-500/30 p-3">
                          <div className="text-gray-500 text-xs uppercase mb-1">
                            {t('settingsMitreNone', {
                              ns: 'ui',
                              defaultValue: isEn ? 'None' : 'Без перекладу',
                            })}
                          </div>
                          <div className="font-mono text-xl text-red-400">
                            {mitreStats[locale].none}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={syncConfirmOpen}
        titleId="mitre-sync-confirm-title"
        title={t('settingsMitreSyncConfirmTitle', {
          ns: 'ui',
          defaultValue: isEn ? 'Synchronize MITRE techniques?' : 'Синхронізувати техніки MITRE?',
        })}
        message={t('settingsMitreSyncConfirmMessage', {
          ns: 'ui',
          defaultValue: isEn
            ? 'This will fetch the latest MITRE ATT&CK data from the external source and update the database. Continue?'
            : 'Буде завантажено актуальні дані MITRE ATT&CK із зовнішнього джерела та оновлено базу. Продовжити?',
        })}
        cancelLabel={t('settingsMitreSyncCancel', {
          ns: 'ui',
          defaultValue: isEn ? 'Cancel' : 'Скасувати',
        })}
        confirmLabel={t('settingsMitreSyncConfirm', {
          ns: 'ui',
          defaultValue: isEn ? 'Yes, synchronize' : 'Так, синхронізувати',
        })}
        loadingLabel={t('settingsMitreSyncing', {
          ns: 'ui',
          defaultValue: isEn ? 'Syncing...' : 'Синхронізація...',
        })}
        isLoading={syncing}
        onCancel={handleSyncCancel}
        onConfirm={() => {
          handleSyncConfirm().catch(() => {
            // handleSyncConfirm already sets error state
          });
        }}
      />

      <ConfirmModal
        isOpen={Boolean(blockModalUser)}
        titleId="block-user-title"
        variant="danger"
        title={t('settingsBlockConfirmTitle', {
          ns: 'ui',
          defaultValue: isEn ? 'Block user?' : 'Заблокувати користувача?',
        })}
        message={
          blockModalUser
            ? t('settingsBlockConfirmMessage', {
                ns: 'ui',
                username: blockModalUser.username,
                defaultValue: isEn
                  ? `Block ${blockModalUser.username}? They will not be able to sign in.`
                  : `Заблокувати ${blockModalUser.username}? Користувач не зможе увійти в систему.`,
              })
            : undefined
        }
        cancelLabel={t('settingsBlockCancel', {
          ns: 'ui',
          defaultValue: isEn ? 'Cancel' : 'Скасувати',
        })}
        confirmLabel={t('settingsBlockConfirm', {
          ns: 'ui',
          defaultValue: isEn ? 'Yes, block' : 'Так, заблокувати',
        })}
        loadingLabel={t('settingsBlocking', {
          ns: 'ui',
          defaultValue: isEn ? 'Blocking...' : 'Блокування...',
        })}
        isLoading={blockSubmitting}
        onCancel={handleBlockCancel}
        onConfirm={() => {
          handleBlockConfirm().catch(() => {
            // handleBlockConfirm already sets error state
          });
        }}
      >
        <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
          {t('settingsBlockReasonLabel', {
            ns: 'ui',
            defaultValue: isEn ? 'Block reason' : 'Причина блокування',
          })}
        </label>
        <textarea
          value={blockReason}
          onChange={(event) => setBlockReason(event.target.value)}
          maxLength={500}
          rows={4}
          disabled={blockSubmitting}
          placeholder={t('settingsBlockReasonPlaceholder', {
            ns: 'ui',
            defaultValue: isEn
              ? 'Describe why this account is being blocked...'
              : 'Опишіть, чому акаунт блокується...',
          })}
          className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-cyber-primary disabled:opacity-50 resize-none"
        />
      </ConfirmModal>
    </div>
  );
}
