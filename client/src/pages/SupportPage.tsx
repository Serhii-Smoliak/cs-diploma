import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  api,
  ApiError,
  type SupportTicketDetail,
  type SupportTicketLimit,
  type SupportTicketSummary,
} from '../services/api';
import { getSupportCloseReasonLabel } from '../utils/supportTicketText';

function statusClassName(status: SupportTicketSummary['status']): string {
  if (status === 'ANSWERED') {
    return 'text-yellow-400';
  }
  if (status === 'CLOSED') {
    return 'text-gray-400';
  }
  return 'text-cyber-primary';
}

export default function SupportPage() {
  const { t, i18n: i18nInstance } = useTranslation(['ui']);
  const isEn = i18nInstance.resolvedLanguage?.startsWith('en') ?? false;

  const [limit, setLimit] = useState<SupportTicketLimit | null>(null);
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<SupportTicketDetail | null>(null);
  const [expandingTicketId, setExpandingTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getStatusLabel = (status: SupportTicketSummary['status']) =>
    t(`supportStatus.${status}`, {
      ns: 'ui',
      defaultValue:
        status === 'OPEN'
          ? isEn
            ? 'Open'
            : 'Відкрито'
          : status === 'ANSWERED'
            ? isEn
              ? 'Answered'
              : 'Відповідь надано'
            : isEn
              ? 'Closed'
              : 'Закрито',
    });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [limitData, ticketsData] = await Promise.all([
        api.getSupportTicketLimit(),
        api.getSupportTickets(),
      ]);
      setLimit(limitData);
      setTickets(ticketsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('supportLoadError', {
              ns: 'ui',
              defaultValue: isEn
                ? 'Failed to load support requests.'
                : 'Не вдалося завантажити звернення.',
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

  const handleTicketToggle = async (ticketId: string) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      setExpandedTicket(null);
      return;
    }

    setExpandingTicketId(ticketId);
    setError(null);
    try {
      const detail = await api.getSupportTicket(ticketId);
      setExpandedTicketId(ticketId);
      setExpandedTicket(detail);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('supportLoadError', {
              ns: 'ui',
              defaultValue: isEn
                ? 'Failed to load support requests.'
                : 'Не вдалося завантажити звернення.',
            })
      );
    } finally {
      setExpandingTicketId(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.createSupportTicket(subject.trim(), message.trim());
      setSubject('');
      setMessage('');
      setSuccess(
        t('supportSubmitSuccess', {
          ns: 'ui',
          defaultValue: isEn ? 'Your request has been submitted.' : 'Звернення надіслано.',
        })
      );
      setExpandedTicketId(null);
      setExpandedTicket(null);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError(
          t('supportDailyLimitError', {
            ns: 'ui',
            defaultValue: isEn
              ? 'Daily limit reached (3 requests per day).'
              : 'Денний ліміт вичерпано (3 звернення на день).',
          })
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : t('supportSubmitError', {
                ns: 'ui',
                defaultValue: isEn
                  ? 'Failed to submit request.'
                  : 'Не вдалося надіслати звернення.',
              })
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !submitting &&
    subject.trim().length >= 3 &&
    message.trim().length >= 10 &&
    (limit?.remainingToday ?? 0) > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary">
            {t('support', { ns: 'ui', defaultValue: isEn ? 'Support' : 'Підтримка' })}
          </h1>
          {limit && (
            <p className="text-sm text-gray-400 mt-2">
              {t('supportDailyLimit', {
                ns: 'ui',
                remaining: limit.remainingToday,
                limit: limit.limit,
                defaultValue: isEn
                  ? `Remaining today: ${limit.remainingToday} of ${limit.limit}`
                  : `Залишилось сьогодні: ${limit.remainingToday} з ${limit.limit}`,
              })}
            </p>
          )}
        </div>

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

        {!loading && success && (
          <div className="cyber-panel p-4 border border-green-500/40 text-green-400 text-sm">
            {success}
          </div>
        )}

        {!loading && (
          <>
            <form
              onSubmit={handleSubmit}
              className="cyber-panel border border-cyber-border rounded-lg p-4 sm:p-6 space-y-4"
            >
              <h2 className="font-heading text-lg text-cyber-primary">
                {t('supportNewTitle', {
                  ns: 'ui',
                  defaultValue: isEn ? 'New request' : 'Нове звернення',
                })}
              </h2>
              <div>
                <label
                  htmlFor="support-subject"
                  className="block text-xs uppercase tracking-wide text-gray-500 mb-2"
                >
                  {t('supportSubjectLabel', {
                    ns: 'ui',
                    defaultValue: isEn ? 'Subject' : 'Тема',
                  })}
                </label>
                <input
                  id="support-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={200}
                  placeholder={t('supportSubjectPlaceholder', {
                    ns: 'ui',
                    defaultValue: isEn ? '3–200 characters' : '3–200 символів',
                  })}
                  disabled={submitting || (limit?.remainingToday ?? 0) === 0}
                  className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-cyber-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="support-message"
                  className="block text-xs uppercase tracking-wide text-gray-500 mb-2"
                >
                  {t('supportMessageLabel', {
                    ns: 'ui',
                    defaultValue: isEn ? 'Message' : 'Повідомлення',
                  })}
                </label>
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={5000}
                  rows={5}
                  placeholder={t('supportMessagePlaceholder', {
                    ns: 'ui',
                    defaultValue: isEn ? '10–5000 characters' : '10–5000 символів',
                  })}
                  disabled={submitting || (limit?.remainingToday ?? 0) === 0}
                  className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-cyber-primary disabled:opacity-50 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-4 py-2 rounded border border-cyber-primary text-cyber-primary text-sm hover:bg-cyber-primary/10 transition-colors disabled:opacity-50"
              >
                {submitting
                  ? t('supportSubmitting', {
                      ns: 'ui',
                      defaultValue: isEn ? 'Submitting...' : 'Надсилання...',
                    })
                  : t('supportSubmit', {
                      ns: 'ui',
                      defaultValue: isEn ? 'Submit request' : 'Надіслати звернення',
                    })}
              </button>
            </form>

            <section className="cyber-panel border border-cyber-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-cyber-border bg-cyber-panel/80">
                <h2 className="font-heading text-lg text-cyber-primary">
                  {t('supportMyTickets', {
                    ns: 'ui',
                    defaultValue: isEn ? 'My requests' : 'Мої звернення',
                  })}
                </h2>
              </div>
              {tickets.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  {t('supportEmpty', {
                    ns: 'ui',
                    defaultValue: isEn ? 'No requests yet.' : 'Звернень поки немає.',
                  })}
                </div>
              ) : (
                <div className="divide-y divide-cyber-border/60">
                  {tickets.map((ticket) => {
                    const isExpanded = expandedTicketId === ticket.id;
                    const isExpanding = expandingTicketId === ticket.id;

                    return (
                      <div key={ticket.id} className={isExpanded ? 'bg-cyber-panel/40' : undefined}>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => {
                            handleTicketToggle(ticket.id).catch(() => {
                              // handleTicketToggle already sets error state
                            });
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-cyber-panel/60 transition-colors ${
                            isExpanded ? 'bg-cyber-panel/60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 min-w-0">
                              <span
                                className={`text-cyber-primary text-xs mt-1 transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                                aria-hidden
                              >
                                ▶
                              </span>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-100">{ticket.subject}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(ticket.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-xs uppercase shrink-0 ${statusClassName(ticket.status)}`}
                            >
                              {getStatusLabel(ticket.status)}
                            </span>
                          </div>
                        </button>

                        {isExpanding && (
                          <div className="px-4 pb-4 text-xs text-gray-500">
                            {t('loading', {
                              ns: 'ui',
                              defaultValue: isEn ? 'Loading...' : 'Завантаження...',
                            })}
                          </div>
                        )}

                        {isExpanded && expandedTicket?.id === ticket.id && (
                          <div className="px-4 pb-4 space-y-3 border-t border-cyber-border/60">
                            {expandedTicket.status === 'CLOSED' &&
                              getSupportCloseReasonLabel(
                                expandedTicket.closeReason,
                                expandedTicket.closeReasonText,
                                t,
                                isEn
                              ) && (
                                <div className="rounded border border-gray-500/40 bg-gray-500/5 p-3 text-sm text-gray-300">
                                  {t('supportClosedReasonLabel', {
                                    ns: 'ui',
                                    defaultValue: isEn ? 'Closure reason' : 'Причина закриття',
                                  })}
                                  :{' '}
                                  {getSupportCloseReasonLabel(
                                    expandedTicket.closeReason,
                                    expandedTicket.closeReasonText,
                                    t,
                                    isEn
                                  )}
                                </div>
                              )}
                            {expandedTicket.messages.map((entry) => (
                              <div
                                key={entry.id}
                                className={`rounded border p-3 text-sm ${
                                  entry.isStaffReply
                                    ? 'border-cyber-primary/40 bg-cyber-primary/5'
                                    : 'border-cyber-border bg-cyber-panel/40'
                                }`}
                              >
                                <div className="text-xs text-gray-500 mb-2">
                                  {entry.isStaffReply
                                    ? t('supportStaffReply', {
                                        ns: 'ui',
                                        defaultValue: isEn ? 'Support' : 'Підтримка',
                                      })
                                    : t('supportYourMessage', {
                                        ns: 'ui',
                                        defaultValue: isEn ? 'You' : 'Ви',
                                      })}{' '}
                                  · {new Date(entry.createdAt).toLocaleString()}
                                </div>
                                <p className="text-gray-200 whitespace-pre-wrap">{entry.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
