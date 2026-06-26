import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  AdminErrorPanel,
  AdminListSection,
  AdminLoadingPanel,
  adminCancelLabel,
  adminDeleteLabels,
  adminLoadingLabel,
  localizedDefault,
} from '../components/admin/adminPageUi';
import { useAuthStore } from '../store/authStore';
import {
  api,
  type SupportTicketCloseReason,
  type SupportTicketDetail,
  type SupportTicketSummary,
} from '../services/api';
import {
  getSupportCloseReasonLabel,
  getSupportCloseReasonOptionLabel,
  getSupportStatusLabel,
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

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function useAdminTickets(t: TFunction, isEn: boolean, currentUserId: string | undefined) {
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

  const loadErrorMessage = t('adminTicketsLoadError', {
    ns: 'ui',
    defaultValue: isEn ? 'Failed to load support tickets.' : 'Не вдалося завантажити звернення.',
  });

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminSupportTickets();
      setTickets(data);
    } catch (err) {
      setError(toErrorMessage(err, loadErrorMessage));
    } finally {
      setLoading(false);
    }
  }, [loadErrorMessage]);

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
      setError(toErrorMessage(err, loadErrorMessage));
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
        toErrorMessage(
          err,
          t('adminTicketsReplyError', {
            ns: 'ui',
            defaultValue: isEn ? 'Failed to send reply.' : 'Не вдалося надіслати відповідь.',
          })
        )
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
        toErrorMessage(
          err,
          t('adminTicketsEditError', {
            ns: 'ui',
            defaultValue: isEn ? 'Failed to update reply.' : 'Не вдалося оновити відповідь.',
          })
        )
      );
    } finally {
      setSavingEdit(false);
    }
  };

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
        toErrorMessage(
          err,
          t('adminTicketsCloseError', {
            ns: 'ui',
            defaultValue: isEn ? 'Failed to close ticket.' : 'Не вдалося закрити звернення.',
          })
        )
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
        toErrorMessage(
          err,
          t('adminTicketsDeleteError', {
            ns: 'ui',
            defaultValue: isEn ? 'Failed to delete reply.' : 'Не вдалося видалити відповідь.',
          })
        )
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

  const resetCloseModal = () => {
    setIsCloseModalOpen(false);
    setCloseReason('ANSWERED');
    setCloseReasonText('');
  };

  return {
    tickets,
    selectedTicket,
    replyBody,
    setReplyBody,
    editingMessageId,
    editingBody,
    setEditingBody,
    deletingMessageId,
    setDeletingMessageId,
    loading,
    replying,
    savingEdit,
    deleting,
    isCloseModalOpen,
    setIsCloseModalOpen,
    closeReason,
    setCloseReason,
    closeReasonText,
    setCloseReasonText,
    closing,
    error,
    canConfirmClose,
    selectedCloseReasonLabel,
    loadTicketDetail,
    handleReply,
    startEditingMessage,
    cancelEditingMessage,
    handleSaveEdit,
    handleCloseTicket,
    handleDeleteMessage,
    canManageMessage,
    resetCloseModal,
  };
}

function AdminTicketsList({
  tickets,
  selectedTicketId,
  isEn,
  t,
  onSelect,
}: Readonly<{
  tickets: SupportTicketSummary[];
  selectedTicketId: string | null;
  isEn: boolean;
  t: TFunction;
  onSelect: (ticketId: string) => void;
}>) {
  if (tickets.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        {t('adminTicketsEmpty', {
          ns: 'ui',
          defaultValue: isEn ? 'No tickets yet.' : 'Звернень поки немає.',
        })}
      </div>
    );
  }

  return (
    <div className="divide-y divide-cyber-border/60 max-h-[32rem] overflow-y-auto">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          type="button"
          onClick={() => {
            onSelect(ticket.id);
          }}
          className={`w-full text-left px-4 py-3 hover:bg-cyber-panel/60 transition-colors ${
            selectedTicketId === ticket.id ? 'bg-cyber-panel/60' : ''
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
              {getSupportStatusLabel(ticket.status, t, isEn)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function AdminTicketMessageItem({
  entry,
  isEditing,
  editingBody,
  savingEdit,
  isEn,
  t,
  canManage,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditingBodyChange,
}: Readonly<{
  entry: SupportTicketDetail['messages'][number];
  isEditing: boolean;
  editingBody: string;
  savingEdit: boolean;
  isEn: boolean;
  t: TFunction;
  canManage: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onEditingBodyChange: (value: string) => void;
}>) {
  return (
    <div
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
              onClick={onStartEdit}
              className="text-xs text-cyber-primary hover:underline"
            >
              {t('edit', { ns: 'ui', defaultValue: isEn ? 'Edit' : 'Редагувати' })}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-400 hover:underline"
            >
              {t('delete', { ns: 'ui', defaultValue: isEn ? 'Delete' : 'Видалити' })}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editingBody}
            onChange={(event) => onEditingBodyChange(event.target.value)}
            rows={4}
            maxLength={5000}
            disabled={savingEdit}
            className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary disabled:opacity-50 resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={savingEdit || !editingBody.trim()}
              onClick={onSaveEdit}
              className="px-3 py-1.5 rounded border border-cyber-primary text-cyber-primary text-xs hover:bg-cyber-primary/10 transition-colors disabled:opacity-50"
            >
              {savingEdit
                ? t('saving', { ns: 'ui', defaultValue: isEn ? 'Saving...' : 'Збереження...' })
                : t('save', { ns: 'ui', defaultValue: isEn ? 'Save' : 'Зберегти' })}
            </button>
            <button
              type="button"
              disabled={savingEdit}
              onClick={onCancelEdit}
              className="px-3 py-1.5 rounded border border-cyber-border text-gray-400 text-xs hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              {t('cancel', { ns: 'ui', defaultValue: isEn ? 'Cancel' : 'Скасувати' })}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-200 whitespace-pre-wrap">{entry.body}</p>
      )}
    </div>
  );
}

function AdminTicketCloseReasonFields({
  closeReason,
  closeReasonText,
  closing,
  isEn,
  t,
  onReasonChange,
  onReasonTextChange,
}: Readonly<{
  closeReason: SupportTicketCloseReason;
  closeReasonText: string;
  closing: boolean;
  isEn: boolean;
  t: TFunction;
  onReasonChange: (reason: SupportTicketCloseReason) => void;
  onReasonTextChange: (value: string) => void;
}>) {
  return (
    <>
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
          onReasonChange(event.target.value as SupportTicketCloseReason);
        }}
        disabled={closing}
        className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary disabled:opacity-50"
      >
        {SUPPORT_CLOSE_REASON_OPTIONS.map((reason) => (
          <option key={reason} value={reason}>
            {getSupportCloseReasonOptionLabel(reason, t, isEn)}
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
            onChange={(event) => onReasonTextChange(event.target.value)}
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
    </>
  );
}

function AdminTicketDetailPanel({
  ticket,
  selectedCloseReasonLabel,
  replyBody,
  replying,
  editingMessageId,
  editingBody,
  savingEdit,
  isEn,
  t,
  canManageMessage,
  onReplyBodyChange,
  onReplySubmit,
  onOpenCloseModal,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteMessage,
  onEditingBodyChange,
}: Readonly<{
  ticket: SupportTicketDetail;
  selectedCloseReasonLabel: string | null;
  replyBody: string;
  replying: boolean;
  editingMessageId: string | null;
  editingBody: string;
  savingEdit: boolean;
  isEn: boolean;
  t: TFunction;
  canManageMessage: (entry: SupportTicketDetail['messages'][number]) => boolean;
  onReplyBodyChange: (value: string) => void;
  onReplySubmit: (event: FormEvent) => void;
  onOpenCloseModal: () => void;
  onStartEdit: (messageId: string, body: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onEditingBodyChange: (value: string) => void;
}>) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg text-cyber-primary">{ticket.subject}</h2>
        <p className="text-xs text-gray-500 mt-1">
          {ticket.username} · {ticket.email}
        </p>
        <p className={`text-xs uppercase mt-1 ${statusClassName(ticket.status)}`}>
          {getSupportStatusLabel(ticket.status, t, isEn)}
        </p>
        {ticket.status === 'CLOSED' && selectedCloseReasonLabel && (
          <p className="text-xs text-gray-400 mt-2">
            {t('supportClosedReasonLabel', {
              ns: 'ui',
              defaultValue: isEn ? 'Closure reason' : 'Причина закриття',
            })}
            : {selectedCloseReasonLabel}
            {ticket.closedAt && (
              <span className="block mt-1 text-gray-500">
                {t('adminTicketsClosedAt', {
                  ns: 'ui',
                  date: new Date(ticket.closedAt).toLocaleString(),
                  defaultValue: isEn
                    ? `Closed: ${new Date(ticket.closedAt).toLocaleString()}`
                    : `Закрито: ${new Date(ticket.closedAt).toLocaleString()}`,
                })}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {ticket.messages.map((entry) => (
          <AdminTicketMessageItem
            key={entry.id}
            entry={entry}
            isEditing={editingMessageId === entry.id}
            editingBody={editingBody}
            savingEdit={savingEdit}
            isEn={isEn}
            t={t}
            canManage={canManageMessage(entry)}
            onStartEdit={() => onStartEdit(entry.id, entry.body)}
            onCancelEdit={onCancelEdit}
            onSaveEdit={() => {
              onSaveEdit(entry.id);
            }}
            onDelete={() => onDeleteMessage(entry.id)}
            onEditingBodyChange={onEditingBodyChange}
          />
        ))}
      </div>

      {ticket.status !== 'CLOSED' && (
        <>
          <div className="pt-2 border-t border-cyber-border">
            <button
              type="button"
              onClick={onOpenCloseModal}
              className="px-4 py-2 rounded border border-gray-500 text-gray-300 text-sm hover:border-gray-400 hover:text-gray-100 transition-colors"
            >
              {t('adminTicketsClose', {
                ns: 'ui',
                defaultValue: isEn ? 'Close ticket' : 'Закрити звернення',
              })}
            </button>
          </div>

          <form onSubmit={onReplySubmit} className="space-y-3 pt-2 border-t border-cyber-border">
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
              onChange={(event) => onReplyBodyChange(event.target.value)}
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
  );
}

function AdminTicketsPageContent({
  loading,
  error,
  isEn,
  t,
  tickets,
  selectedTicket,
  selectedCloseReasonLabel,
  replyBody,
  replying,
  editingMessageId,
  editingBody,
  savingEdit,
  canManageMessage,
  onSelectTicket,
  onReplyBodyChange,
  onReplySubmit,
  onOpenCloseModal,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteMessage,
  onEditingBodyChange,
}: Readonly<{
  loading: boolean;
  error: string | null;
  isEn: boolean;
  t: TFunction;
  tickets: SupportTicketSummary[];
  selectedTicket: SupportTicketDetail | null;
  selectedCloseReasonLabel: string | null;
  replyBody: string;
  replying: boolean;
  editingMessageId: string | null;
  editingBody: string;
  savingEdit: boolean;
  canManageMessage: (entry: SupportTicketDetail['messages'][number]) => boolean;
  onSelectTicket: (ticketId: string) => void;
  onReplyBodyChange: (value: string) => void;
  onReplySubmit: (event: FormEvent) => void;
  onOpenCloseModal: () => void;
  onStartEdit: (messageId: string, body: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onEditingBodyChange: (value: string) => void;
}>) {
  if (loading) {
    return <AdminLoadingPanel label={adminLoadingLabel(t, isEn)} />;
  }

  if (error) {
    return <AdminErrorPanel message={error} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AdminListSection
        title={t('adminTicketsList', {
          ns: 'ui',
          defaultValue: localizedDefault(isEn, 'Усі звернення', 'All requests'),
        })}
      >
        <AdminTicketsList
          tickets={tickets}
          selectedTicketId={selectedTicket?.id ?? null}
          isEn={isEn}
          t={t}
          onSelect={onSelectTicket}
        />
      </AdminListSection>

      <section className="cyber-panel border border-cyber-border rounded-lg p-4 sm:p-6 min-h-[20rem]">
        {selectedTicket ? (
          <AdminTicketDetailPanel
            ticket={selectedTicket}
            selectedCloseReasonLabel={selectedCloseReasonLabel}
            replyBody={replyBody}
            replying={replying}
            editingMessageId={editingMessageId}
            editingBody={editingBody}
            savingEdit={savingEdit}
            isEn={isEn}
            t={t}
            canManageMessage={canManageMessage}
            onReplyBodyChange={onReplyBodyChange}
            onReplySubmit={onReplySubmit}
            onOpenCloseModal={onOpenCloseModal}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onDeleteMessage={onDeleteMessage}
            onEditingBodyChange={onEditingBodyChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            {t('adminTicketsSelect', {
              ns: 'ui',
              defaultValue: localizedDefault(
                isEn,
                'Оберіть звернення.',
                'Select a ticket to view details.'
              ),
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminTicketsModals({
  isEn,
  t,
  isCloseModalOpen,
  closeReason,
  closeReasonText,
  closing,
  deletingMessageId,
  deleting,
  onCloseModalCancel,
  onCloseConfirm,
  onReasonChange,
  onReasonTextChange,
  onDeleteCancel,
  onDeleteConfirm,
}: Readonly<{
  isEn: boolean;
  t: TFunction;
  isCloseModalOpen: boolean;
  closeReason: SupportTicketCloseReason;
  closeReasonText: string;
  closing: boolean;
  deletingMessageId: string | null;
  deleting: boolean;
  onCloseModalCancel: () => void;
  onCloseConfirm: () => void;
  onReasonChange: (reason: SupportTicketCloseReason) => void;
  onReasonTextChange: (value: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}>) {
  const cancelLabel = adminCancelLabel(t, isEn);
  const deleteLabels = adminDeleteLabels(t, isEn);

  return (
    <>
      <ConfirmModal
        isOpen={isCloseModalOpen}
        titleId="admin-ticket-close-title"
        title={t('adminTicketsCloseTitle', {
          ns: 'ui',
          defaultValue: localizedDefault(isEn, 'Закрити звернення?', 'Close ticket?'),
        })}
        message={t('adminTicketsCloseMessage', {
          ns: 'ui',
          defaultValue: localizedDefault(
            isEn,
            'Звернення буде закрито, і на нього більше не можна буде відповісти.',
            'The ticket will be closed and no further replies can be sent.'
          ),
        })}
        cancelLabel={cancelLabel}
        confirmLabel={t('adminTicketsCloseSubmit', {
          ns: 'ui',
          defaultValue: localizedDefault(isEn, 'Закрити звернення', 'Close ticket'),
        })}
        loadingLabel={t('adminTicketsCloseClosing', {
          ns: 'ui',
          defaultValue: localizedDefault(isEn, 'Закриття...', 'Closing...'),
        })}
        isLoading={closing}
        onCancel={onCloseModalCancel}
        onConfirm={onCloseConfirm}
      >
        <AdminTicketCloseReasonFields
          closeReason={closeReason}
          closeReasonText={closeReasonText}
          closing={closing}
          isEn={isEn}
          t={t}
          onReasonChange={onReasonChange}
          onReasonTextChange={onReasonTextChange}
        />
      </ConfirmModal>

      <ConfirmModal
        isOpen={deletingMessageId !== null}
        titleId="admin-ticket-delete-title"
        title={t('adminTicketsDeleteTitle', {
          ns: 'ui',
          defaultValue: localizedDefault(isEn, 'Видалити відповідь?', 'Delete reply?'),
        })}
        message={t('adminTicketsDeleteMessage', {
          ns: 'ui',
          defaultValue: localizedDefault(
            isEn,
            'Цю відповідь буде видалено зі звернення.',
            'This reply will be removed from the ticket.'
          ),
        })}
        cancelLabel={cancelLabel}
        confirmLabel={deleteLabels.confirmLabel}
        loadingLabel={deleteLabels.loadingLabel}
        isLoading={deleting}
        variant="danger"
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
      />
    </>
  );
}

export default function AdminTicketsPage() {
  const { t, i18n: i18nInstance } = useTranslation(['ui']);
  const isEn = i18nInstance.resolvedLanguage?.startsWith('en') ?? false;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const {
    tickets,
    selectedTicket,
    replyBody,
    setReplyBody,
    editingMessageId,
    editingBody,
    setEditingBody,
    deletingMessageId,
    setDeletingMessageId,
    loading,
    replying,
    savingEdit,
    deleting,
    isCloseModalOpen,
    setIsCloseModalOpen,
    closeReason,
    setCloseReason,
    closeReasonText,
    setCloseReasonText,
    closing,
    error,
    selectedCloseReasonLabel,
    loadTicketDetail,
    handleReply,
    startEditingMessage,
    cancelEditingMessage,
    handleSaveEdit,
    handleCloseTicket,
    handleDeleteMessage,
    canManageMessage,
    resetCloseModal,
  } = useAdminTickets(t, isEn, currentUserId);

  const handleReasonChange = (reason: SupportTicketCloseReason) => {
    setCloseReason(reason);
    if (reason !== 'CUSTOM') {
      setCloseReasonText('');
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    void loadTicketDetail(ticketId);
  };

  const handleCloseModalCancel = () => {
    if (!closing) resetCloseModal();
  };

  const handleCloseConfirm = () => {
    void handleCloseTicket();
  };

  const handleDeleteConfirm = () => {
    void handleDeleteMessage();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary">
          {t('adminTickets', {
            ns: 'ui',
            defaultValue: isEn ? 'Support tickets' : 'Звернення',
          })}
        </h1>

        <AdminTicketsPageContent
          loading={loading}
          error={error}
          isEn={isEn}
          t={t}
          tickets={tickets}
          selectedTicket={selectedTicket}
          selectedCloseReasonLabel={selectedCloseReasonLabel}
          replyBody={replyBody}
          replying={replying}
          editingMessageId={editingMessageId}
          editingBody={editingBody}
          savingEdit={savingEdit}
          canManageMessage={canManageMessage}
          onSelectTicket={handleSelectTicket}
          onReplyBodyChange={setReplyBody}
          onReplySubmit={handleReply}
          onOpenCloseModal={() => setIsCloseModalOpen(true)}
          onStartEdit={startEditingMessage}
          onCancelEdit={cancelEditingMessage}
          onSaveEdit={handleSaveEdit}
          onDeleteMessage={setDeletingMessageId}
          onEditingBodyChange={setEditingBody}
        />
      </div>

      <AdminTicketsModals
        isEn={isEn}
        t={t}
        isCloseModalOpen={isCloseModalOpen}
        closeReason={closeReason}
        closeReasonText={closeReasonText}
        closing={closing}
        deletingMessageId={deletingMessageId}
        deleting={deleting}
        onCloseModalCancel={handleCloseModalCancel}
        onCloseConfirm={handleCloseConfirm}
        onReasonChange={handleReasonChange}
        onReasonTextChange={setCloseReasonText}
        onDeleteCancel={() => setDeletingMessageId(null)}
        onDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
