import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../components/common/ConfirmModal';
import { useAuthStore } from '../store/authStore';
import {
  api,
  type SupportTicketCloseReason,
  type SupportTicketDetail,
  type SupportTicketSummary,
} from '../services/api';
import {
  getSupportCloseReasonLabel,
  SUPPORT_CLOSE_REASON_OPTIONS,
} from '../utils/supportTicketText';

function statusClassName(status: SupportTicketSummary['status']): string {
  if (status === 'ANSWERED') {
    return 'text-yellow-400';
  }
  if (status === 'CLOSED') {
    return 'text-gray-400';
  }
  return 'text-cyber-primary';
}

export default function AdminTicketsPage() {
  const { t, i18n: i18nInstance } = useTranslation(['ui']);
  const isEn = i18nInstance.resolvedLanguage?.startsWith('en') ?? false;
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDetail | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState<SupportTicketCloseReason>('ANSWERED');
  const [closeReasonText, setCloseReasonText] = useState('');
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminSupportTickets();
      setTickets(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('adminTicketsLoadError', {
              ns: 'ui',
              defaultValue: isEn
                ? 'Failed to load support tickets.'
                : 'Не вдалося завантажити звернення.',
            })
      );
    } finally {
      setLoading(false);
    }
  }, [t, isEn]);

  useEffect(() => {
    loadTickets().catch(() => {
      // loadTickets already sets error state
    });
  }, [loadTickets]);

  const loadTicketDetail = async (ticketId: string) => {
    setError(null);
    setEditingMessageId(null);
    setEditingBody('');
    setIsCloseModalOpen(false);
    setCloseReason('ANSWERED');
    setCloseReasonText('');
    try {
      const detail = await api.getAdminSupportTicket(ticketId);
      setSelectedTicket(detail);
      setReplyBody('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('adminTicketsLoadError', {
              ns: 'ui',
              defaultValue: isEn
                ? 'Failed to load support tickets.'
                : 'Не вдалося завантажити звернення.',
            })
      );
    }
  };

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTicket || !replyBody.trim()) {
      return;
    }

    setReplying(true);
    setError(null);
    try {
      await api.replyAdminSupportTicket(selectedTicket.id, replyBody.trim());
      setReplyBody('');
      await loadTickets();
      await loadTicketDetail(selectedTicket.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('adminTicketsReplyError', {
              ns: 'ui',
              defaultValue: isEn ? 'Failed to send reply.' : 'Не вдалося надіслати відповідь.',
            })
      );
    } finally {
      setReplying(false);
    }
  };

  const startEditingMessage = (messageId: string, body: string) => {
    setEditingMessageId(messageId);
    setEditingBody(body);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingBody('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!selectedTicket || !editingBody.trim()) {
      return;
    }

    setSavingEdit(true);
    setError(null);
    try {
      await api.updateAdminSupportMessage(messageId, editingBody.trim());
      cancelEditingMessage();
      await loadTicketDetail(selectedTicket.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('adminTicketsEditError', {
              ns: 'ui',
              defaultValue: isEn ? 'Failed to update reply.' : 'Не вдалося оновити відповідь.',
            })
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const getCloseReasonOptionLabel = (reason: SupportTicketCloseReason) =>
    getSupportCloseReasonLabel(reason, null, t, isEn) ??
    t(`supportCloseReason.${reason}`, {
      ns: 'ui',
      defaultValue:
        reason === 'ANSWERED'
          ? isEn
            ? 'Answer provided'
            : 'Відповідь надана'
          : reason === 'DECLINED'
            ? isEn
              ? 'Request does not meet requirements'
              : 'Звернення не відповідає вимогам'
            : isEn
              ? 'Custom reason'
              : 'Інша причина',
    });

  const canConfirmClose = closeReason !== 'CUSTOM' || closeReasonText.trim().length >= 3;

  const handleCloseTicket = async () => {
    if (!selectedTicket || !canConfirmClose) {
      return;
    }

    setClosing(true);
    setError(null);
    try {
      const detail = await api.closeAdminSupportTicket(
        selectedTicket.id,
        closeReason,
        closeReason === 'CUSTOM' ? closeReasonText.trim() : undefined
      );
      setSelectedTicket(detail);
      setIsCloseModalOpen(false);
      setCloseReason('ANSWERED');
      setCloseReasonText('');
      await loadTickets();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('adminTicketsCloseError', {
              ns: 'ui',
              defaultValue: isEn ? 'Failed to close ticket.' : 'Не вдалося закрити звернення.',
            })
      );
    } finally {
      setClosing(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedTicket || !deletingMessageId) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await api.deleteAdminSupportMessage(deletingMessageId);
      setDeletingMessageId(null);
      await loadTickets();
      await loadTicketDetail(selectedTicket.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('adminTicketsDeleteError', {
              ns: 'ui',
              defaultValue: isEn ? 'Failed to delete reply.' : 'Не вдалося видалити відповідь.',
            })
      );
    } finally {
      setDeleting(false);
    }
  };

  const canManageMessage = (entry: SupportTicketDetail['messages'][number]) =>
    entry.isStaffReply && entry.authorId === currentUserId && selectedTicket?.status !== 'CLOSED';

  const selectedCloseReasonLabel = selectedTicket
    ? getSupportCloseReasonLabel(
        selectedTicket.closeReason,
        selectedTicket.closeReasonText,
        t,
        isEn
      )
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary">
          {t('adminTickets', {
            ns: 'ui',
            defaultValue: isEn ? 'Support tickets' : 'Звернення',
          })}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="cyber-panel border border-cyber-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-cyber-border bg-cyber-panel/80">
                <h2 className="font-heading text-lg text-cyber-primary">
                  {t('adminTicketsList', {
                    ns: 'ui',
                    defaultValue: isEn ? 'All requests' : 'Усі звернення',
                  })}
                </h2>
              </div>
              {tickets.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  {t('adminTicketsEmpty', {
                    ns: 'ui',
                    defaultValue: isEn ? 'No tickets yet.' : 'Звернень поки немає.',
                  })}
                </div>
              ) : (
                <div className="divide-y divide-cyber-border/60 max-h-[32rem] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => {
                        loadTicketDetail(ticket.id).catch(() => {
                          // loadTicketDetail already sets error state
                        });
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-cyber-panel/60 transition-colors ${
                        selectedTicket?.id === ticket.id ? 'bg-cyber-panel/60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-100">{ticket.subject}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {ticket.username} · {new Date(ticket.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span className={`text-xs uppercase ${statusClassName(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="cyber-panel border border-cyber-border rounded-lg p-4 sm:p-6 min-h-[20rem]">
              {!selectedTicket ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  {t('adminTicketsSelect', {
                    ns: 'ui',
                    defaultValue: isEn ? 'Select a ticket to view details.' : 'Оберіть звернення.',
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-heading text-lg text-cyber-primary">
                      {selectedTicket.subject}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedTicket.username} · {selectedTicket.email}
                    </p>
                    <p
                      className={`text-xs uppercase mt-1 ${statusClassName(selectedTicket.status)}`}
                    >
                      {getStatusLabel(selectedTicket.status)}
                    </p>
                    {selectedTicket.status === 'CLOSED' && selectedCloseReasonLabel && (
                      <p className="text-xs text-gray-400 mt-2">
                        {t('supportClosedReasonLabel', {
                          ns: 'ui',
                          defaultValue: isEn ? 'Closure reason' : 'Причина закриття',
                        })}
                        : {selectedCloseReasonLabel}
                        {selectedTicket.closedAt && (
                          <span className="block mt-1 text-gray-500">
                            {t('adminTicketsClosedAt', {
                              ns: 'ui',
                              date: new Date(selectedTicket.closedAt).toLocaleString(),
                              defaultValue: isEn
                                ? `Closed: ${new Date(selectedTicket.closedAt).toLocaleString()}`
                                : `Закрито: ${new Date(selectedTicket.closedAt).toLocaleString()}`,
                            })}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedTicket.messages.map((entry) => {
                      const isEditing = editingMessageId === entry.id;
                      const canManage = canManageMessage(entry);

                      return (
                        <div
                          key={entry.id}
                          className={`rounded border p-3 text-sm ${
                            entry.isStaffReply
                              ? 'border-cyber-primary/40 bg-cyber-primary/5'
                              : 'border-cyber-border bg-cyber-panel/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="text-xs text-gray-500">
                              {entry.authorUsername} · {new Date(entry.createdAt).toLocaleString()}
                            </div>
                            {canManage && !isEditing && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditingMessage(entry.id, entry.body)}
                                  className="text-xs text-cyber-primary hover:underline"
                                >
                                  {t('edit', {
                                    ns: 'ui',
                                    defaultValue: isEn ? 'Edit' : 'Редагувати',
                                  })}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingMessageId(entry.id)}
                                  className="text-xs text-red-400 hover:underline"
                                >
                                  {t('delete', {
                                    ns: 'ui',
                                    defaultValue: isEn ? 'Delete' : 'Видалити',
                                  })}
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingBody}
                                onChange={(event) => setEditingBody(event.target.value)}
                                rows={4}
                                maxLength={5000}
                                disabled={savingEdit}
                                className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary disabled:opacity-50 resize-none"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={savingEdit || !editingBody.trim()}
                                  onClick={() => {
                                    handleSaveEdit(entry.id).catch(() => {
                                      // handleSaveEdit already sets error state
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded border border-cyber-primary text-cyber-primary text-xs hover:bg-cyber-primary/10 transition-colors disabled:opacity-50"
                                >
                                  {savingEdit
                                    ? t('saving', {
                                        ns: 'ui',
                                        defaultValue: isEn ? 'Saving...' : 'Збереження...',
                                      })
                                    : t('save', {
                                        ns: 'ui',
                                        defaultValue: isEn ? 'Save' : 'Зберегти',
                                      })}
                                </button>
                                <button
                                  type="button"
                                  disabled={savingEdit}
                                  onClick={cancelEditingMessage}
                                  className="px-3 py-1.5 rounded border border-cyber-border text-gray-400 text-xs hover:text-gray-200 transition-colors disabled:opacity-50"
                                >
                                  {t('cancel', {
                                    ns: 'ui',
                                    defaultValue: isEn ? 'Cancel' : 'Скасувати',
                                  })}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-200 whitespace-pre-wrap">{entry.body}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedTicket.status !== 'CLOSED' && (
                    <>
                      <div className="pt-2 border-t border-cyber-border">
                        <button
                          type="button"
                          onClick={() => setIsCloseModalOpen(true)}
                          className="px-4 py-2 rounded border border-gray-500 text-gray-300 text-sm hover:border-gray-400 hover:text-gray-100 transition-colors"
                        >
                          {t('adminTicketsClose', {
                            ns: 'ui',
                            defaultValue: isEn ? 'Close ticket' : 'Закрити звернення',
                          })}
                        </button>
                      </div>

                      <form
                        onSubmit={handleReply}
                        className="space-y-3 pt-2 border-t border-cyber-border"
                      >
                        <label
                          htmlFor="admin-ticket-reply"
                          className="block text-xs uppercase tracking-wide text-gray-500"
                        >
                          {t('adminTicketsReplyLabel', {
                            ns: 'ui',
                            defaultValue: isEn ? 'Reply' : 'Відповідь',
                          })}
                        </label>
                        <textarea
                          id="admin-ticket-reply"
                          value={replyBody}
                          onChange={(event) => setReplyBody(event.target.value)}
                          rows={4}
                          maxLength={5000}
                          disabled={replying}
                          className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary disabled:opacity-50 resize-none"
                        />
                        <button
                          type="submit"
                          disabled={replying || !replyBody.trim()}
                          className="px-4 py-2 rounded border border-cyber-primary text-cyber-primary text-sm hover:bg-cyber-primary/10 transition-colors disabled:opacity-50"
                        >
                          {replying
                            ? t('adminTicketsReplying', {
                                ns: 'ui',
                                defaultValue: isEn ? 'Sending...' : 'Надсилання...',
                              })
                            : t('adminTicketsReplySubmit', {
                                ns: 'ui',
                                defaultValue: isEn ? 'Send reply' : 'Надіслати відповідь',
                              })}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isCloseModalOpen}
        titleId="admin-ticket-close-title"
        title={t('adminTicketsCloseTitle', {
          ns: 'ui',
          defaultValue: isEn ? 'Close ticket?' : 'Закрити звернення?',
        })}
        message={t('adminTicketsCloseMessage', {
          ns: 'ui',
          defaultValue: isEn
            ? 'The ticket will be closed and no further replies can be sent.'
            : 'Звернення буде закрито, і на нього більше не можна буде відповісти.',
        })}
        cancelLabel={t('cancel', { ns: 'ui', defaultValue: isEn ? 'Cancel' : 'Скасувати' })}
        confirmLabel={t('adminTicketsCloseSubmit', {
          ns: 'ui',
          defaultValue: isEn ? 'Close ticket' : 'Закрити звернення',
        })}
        loadingLabel={t('adminTicketsCloseClosing', {
          ns: 'ui',
          defaultValue: isEn ? 'Closing...' : 'Закриття...',
        })}
        isLoading={closing}
        onCancel={() => {
          if (!closing) {
            setIsCloseModalOpen(false);
            setCloseReason('ANSWERED');
            setCloseReasonText('');
          }
        }}
        onConfirm={() => {
          handleCloseTicket().catch(() => {
            // handleCloseTicket already sets error state
          });
        }}
      >
        <label
          htmlFor="admin-ticket-close-reason"
          className="block text-xs uppercase tracking-wide text-gray-500 mb-2"
        >
          {t('adminTicketsCloseReasonLabel', {
            ns: 'ui',
            defaultValue: isEn ? 'Reason' : 'Причина',
          })}
        </label>
        <select
          id="admin-ticket-close-reason"
          value={closeReason}
          onChange={(event) => {
            const nextReason = event.target.value as SupportTicketCloseReason;
            setCloseReason(nextReason);
            if (nextReason !== 'CUSTOM') {
              setCloseReasonText('');
            }
          }}
          disabled={closing}
          className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary disabled:opacity-50"
        >
          {SUPPORT_CLOSE_REASON_OPTIONS.map((reason) => (
            <option key={reason} value={reason}>
              {getCloseReasonOptionLabel(reason)}
            </option>
          ))}
        </select>

        {closeReason === 'CUSTOM' && (
          <div className="mt-3">
            <label
              htmlFor="admin-ticket-close-reason-text"
              className="block text-xs uppercase tracking-wide text-gray-500 mb-2"
            >
              {t('adminTicketsCloseReasonCustomLabel', {
                ns: 'ui',
                defaultValue: isEn ? 'Custom reason' : 'Власна причина',
              })}
            </label>
            <textarea
              id="admin-ticket-close-reason-text"
              value={closeReasonText}
              onChange={(event) => setCloseReasonText(event.target.value)}
              rows={3}
              maxLength={500}
              disabled={closing}
              placeholder={t('adminTicketsCloseReasonCustomPlaceholder', {
                ns: 'ui',
                defaultValue: isEn ? '3–500 characters' : '3–500 символів',
              })}
              className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-cyber-primary disabled:opacity-50 resize-none"
            />
          </div>
        )}
      </ConfirmModal>

      <ConfirmModal
        isOpen={deletingMessageId !== null}
        titleId="admin-ticket-delete-title"
        title={t('adminTicketsDeleteTitle', {
          ns: 'ui',
          defaultValue: isEn ? 'Delete reply?' : 'Видалити відповідь?',
        })}
        message={t('adminTicketsDeleteMessage', {
          ns: 'ui',
          defaultValue: isEn
            ? 'This reply will be removed from the ticket.'
            : 'Цю відповідь буде видалено зі звернення.',
        })}
        cancelLabel={t('cancel', { ns: 'ui', defaultValue: isEn ? 'Cancel' : 'Скасувати' })}
        confirmLabel={t('delete', { ns: 'ui', defaultValue: isEn ? 'Delete' : 'Видалити' })}
        loadingLabel={t('deleting', {
          ns: 'ui',
          defaultValue: isEn ? 'Deleting...' : 'Видалення...',
        })}
        isLoading={deleting}
        variant="danger"
        onCancel={() => setDeletingMessageId(null)}
        onConfirm={() => {
          handleDeleteMessage().catch(() => {
            // handleDeleteMessage already sets error state
          });
        }}
      />
    </div>
  );
}
