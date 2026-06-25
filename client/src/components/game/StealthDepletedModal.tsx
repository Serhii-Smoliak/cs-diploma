import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { api } from '../../services/api';
import { STEALTH_MASKING_RESTORE, wouldMaskingExceedMax } from '../../constants/stealth';
import { formatStealthRetryAfter } from '../../utils/stealthRetry';

interface StealthRecoveryStatus {
  ready: boolean;
  alreadyAtMax: boolean;
  retryAfterMs: number;
  regenAmount: number;
}

export default function StealthDepletedModal() {
  const { t, i18n } = useTranslation(['ui', 'common']);
  const { user, updateUser } = useAuthStore();
  const stealthModalOpen = useGameStore((state) => state.stealthModalOpen);
  const closeStealthModal = useGameStore((state) => state.closeStealthModal);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<StealthRecoveryStatus | null>(null);

  useEffect(() => {
    if (!stealthModalOpen) {
      setRecoveryStatus(null);
      return;
    }

    setNotice(null);
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const status = await api.getStealthRecoveryStatus();
        if (cancelled) {
          return;
        }

        useAuthStore.getState().updateUser({ stealth: status.stealth });
        setRecoveryStatus({
          ready: status.ready,
          alreadyAtMax: status.alreadyAtMax,
          retryAfterMs: status.retryAfterMs,
          regenAmount: status.regenAmount,
        });
      } catch (error) {
        console.error('Failed to load stealth recovery status:', error);
        if (!cancelled) {
          setRecoveryStatus(null);
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [stealthModalOpen]);

  useEffect(() => {
    if (!stealthModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        closeStealthModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [stealthModalOpen, isLoading, closeStealthModal]);

  const handleMasking = async () => {
    setIsLoading(true);
    setNotice(null);
    try {
      const result = await api.purchaseStealthMasking();
      updateUser({ stealth: result.stealth });
      closeStealthModal();
    } catch (error) {
      console.error('Masking purchase failed:', error);
      setNotice(t('stealthMaskingFailed', { ns: 'ui' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePremium = () => {
    setNotice(t('stealthPremiumMock', { ns: 'ui' }));
  };

  const stealth = user?.stealth ?? 100;
  const isDepleted = stealth <= 0;
  const isMaskingUnavailable = wouldMaskingExceedMax(stealth);
  const passiveRecoveryMessage = recoveryStatus?.alreadyAtMax
    ? t('stealthAtMax', {
        ns: 'ui',
        defaultValue: i18n.language.startsWith('en')
          ? 'Stealth is already at 100%.'
          : 'Стелс уже на рівні 100%.',
      })
    : recoveryStatus && recoveryStatus.retryAfterMs > 0
      ? t('stealthPassiveRecoveryIn', {
          ns: 'ui',
          amount: recoveryStatus.regenAmount,
          time: formatStealthRetryAfter(recoveryStatus.retryAfterMs, i18n.language),
          defaultValue: i18n.language.startsWith('en')
            ? `+${recoveryStatus.regenAmount}% stealth will recover automatically in ${formatStealthRetryAfter(recoveryStatus.retryAfterMs, i18n.language)}.`
            : `+${recoveryStatus.regenAmount}% стелсу відновиться автоматично через ${formatStealthRetryAfter(recoveryStatus.retryAfterMs, i18n.language)}.`,
        })
      : null;

  if (!user) {
    return null;
  }

  return (
    <AnimatePresence>
      {stealthModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isLoading && closeStealthModal()}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', duration: 0.35 }}
              onClick={(event) => event.stopPropagation()}
              className={`w-full max-w-md cyber-panel border-2 p-6 shadow-2xl pointer-events-auto relative ${
                isDepleted ? 'border-cyber-danger' : 'border-cyber-success/40'
              }`}
              role="dialog"
              aria-labelledby="stealth-modal-title"
            >
              <button
                type="button"
                onClick={closeStealthModal}
                disabled={isLoading}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none transition-colors disabled:opacity-50"
                aria-label={t('close', { ns: 'common' })}
              >
                ×
              </button>

              <h2
                id="stealth-modal-title"
                className={`font-heading font-bold text-xl mb-2 pr-8 ${
                  isDepleted ? 'text-cyber-danger' : 'text-cyber-primary'
                }`}
              >
                {isDepleted
                  ? t('stealthDepletedTitle', { ns: 'ui' })
                  : t('stealthManageTitle', { ns: 'ui', defaultValue: 'Stealth' })}
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                {isDepleted
                  ? t('stealthDepletedMessage', { ns: 'ui' })
                  : t('stealthManageMessage', {
                      ns: 'ui',
                      stealth,
                      defaultValue: i18n.language.startsWith('en')
                        ? `Current stealth: ${stealth}%. Choose a recovery option:`
                        : `Поточний стелс: ${stealth}%. Оберіть спосіб поповнення:`,
                    })}
              </p>

              {notice && (
                <p className="text-yellow-400 text-sm mb-4 rounded border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 leading-relaxed">
                  {notice}
                </p>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={isLoading || isMaskingUnavailable}
                  onClick={handleMasking}
                  title={
                    isMaskingUnavailable
                      ? t('stealthMaskingUnavailable', {
                          ns: 'ui',
                          stealth,
                          amount: STEALTH_MASKING_RESTORE,
                          defaultValue: i18n.language.startsWith('en')
                            ? `Masking (+${STEALTH_MASKING_RESTORE}%) would exceed 100% (current: ${stealth}%).`
                            : `Маскування (+${STEALTH_MASKING_RESTORE}%) перевищить 100% (зараз: ${stealth}%).`,
                        })
                      : undefined
                  }
                  className="w-full cyber-button-success py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('stealthBuyMasking', {
                    ns: 'ui',
                    amount: STEALTH_MASKING_RESTORE,
                    defaultValue: i18n.language.startsWith('en')
                      ? `Buy ${STEALTH_MASKING_RESTORE}% masking — restore stealth`
                      : `Купити ${STEALTH_MASKING_RESTORE}% маскування — відновити стелс`,
                  })}
                </button>
                {isMaskingUnavailable && (
                  <p className="text-xs text-gray-500 -mt-1 text-center">
                    {t('stealthMaskingUnavailable', {
                      ns: 'ui',
                      stealth,
                      amount: STEALTH_MASKING_RESTORE,
                      defaultValue: i18n.language.startsWith('en')
                        ? `Masking (+${STEALTH_MASKING_RESTORE}%) would exceed 100% (current: ${stealth}%).`
                        : `Маскування (+${STEALTH_MASKING_RESTORE}%) перевищить 100% (зараз: ${stealth}%).`,
                    })}
                  </p>
                )}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handlePremium}
                  className="w-full cyber-button py-3 disabled:opacity-50"
                >
                  {t('stealthUpgradePlan', { ns: 'ui' })}
                </button>
                {passiveRecoveryMessage && (
                  <p className="text-sm text-gray-400 rounded border border-cyber-border/60 bg-cyber-panel/40 px-3 py-3 leading-relaxed text-center">
                    {passiveRecoveryMessage}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
