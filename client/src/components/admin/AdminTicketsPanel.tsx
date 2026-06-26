import type { FormEvent } from 'react';
import type { TFunction } from 'i18next';
import {
  AdminConfirmModal,
  AdminDangerConfirmModal,
  AdminEmptyListNotice,
  AdminScrollableList,
} from './adminPageUi';
import { adminUiText } from './adminPageUiHelpers';
import type {
  SupportTicketCloseReason,
  SupportTicketDetail,
  SupportTicketSummary,
} from '../../services/api';
import {
  getSupportCloseReasonOptionLabel,
  getSupportStatusLabel,
  SUPPORT_CLOSE_REASON_OPTIONS,
} from '../../utils/supportTicketText';

function statusClassName(status: SupportTicketSummary['status']): string {
  if (status === 'ANSWERED') {
    return 'text-yellow-400';
  }
  if (status === 'CLOSED') {
    return 'text-gray-400';
  }
  return 'text-cyber-primary';
}

export function AdminTicketsList({
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
      <AdminEmptyListNotice
        message={adminUiText(
          t,
          isEn,
          'adminTicketsEmpty',
          'Звернень поки немає.',
          'No tickets yet.'
        )}
      />
    );
  }

  return (
    <AdminScrollableList>
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          type="button"
          onClick={() => onSelect(ticket.id)}
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
    </AdminScrollableList>
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
              {adminUiText(t, isEn, 'edit', 'Редагувати', 'Edit')}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-400 hover:underline"
            >
              {adminUiText(t, isEn, 'delete', 'Видалити', 'Delete')}
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
                ? adminUiText(t, isEn, 'saving', 'Збереження...', 'Saving...')
                : adminUiText(t, isEn, 'save', 'Зберегти', 'Save')}
            </button>
            <button
              type="button"
              disabled={savingEdit}
              onClick={onCancelEdit}
              className="px-3 py-1.5 rounded border border-cyber-border text-gray-400 text-xs hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              {adminUiText(t, isEn, 'cancel', 'Скасувати', 'Cancel')}
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
        {adminUiText(t, isEn, 'adminTicketsCloseReasonLabel', 'Причина', 'Reason')}
      </label>
      <select
        id="admin-ticket-close-reason"
        value={closeReason}
        onChange={(event) => onReasonChange(event.target.value as SupportTicketCloseReason)}
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
            {adminUiText(
              t,
              isEn,
              'adminTicketsCloseReasonCustomLabel',
              'Власна причина',
              'Custom reason'
            )}
          </label>
          <textarea
            id="admin-ticket-close-reason-text"
            value={closeReasonText}
            onChange={(event) => onReasonTextChange(event.target.value)}
            rows={3}
            maxLength={500}
            disabled={closing}
            placeholder={adminUiText(
              t,
              isEn,
              'adminTicketsCloseReasonCustomPlaceholder',
              '3–500 символів',
              '3–500 characters'
            )}
            className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-cyber-primary disabled:opacity-50 resize-none"
          />
        </div>
      )}
    </>
  );
}

export function AdminTicketDetailPanel({
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
            {adminUiText(t, isEn, 'supportClosedReasonLabel', 'Причина закриття', 'Closure reason')}
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
            onSaveEdit={() => onSaveEdit(entry.id)}
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
              {adminUiText(t, isEn, 'adminTicketsClose', 'Закрити звернення', 'Close ticket')}
            </button>
          </div>

          <form onSubmit={onReplySubmit} className="space-y-3 pt-2 border-t border-cyber-border">
            <label
              htmlFor="admin-ticket-reply"
              className="block text-xs uppercase tracking-wide text-gray-500"
            >
              {adminUiText(t, isEn, 'adminTicketsReplyLabel', 'Відповідь', 'Reply')}
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
                ? adminUiText(t, isEn, 'adminTicketsReplying', 'Надсилання...', 'Sending...')
                : adminUiText(
                    t,
                    isEn,
                    'adminTicketsReplySubmit',
                    'Надіслати відповідь',
                    'Send reply'
                  )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export function AdminTicketsModals({
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
  return (
    <>
      <AdminConfirmModal
        isOpen={isCloseModalOpen}
        titleId="admin-ticket-close-title"
        title={adminUiText(
          t,
          isEn,
          'adminTicketsCloseTitle',
          'Закрити звернення?',
          'Close ticket?'
        )}
        message={adminUiText(
          t,
          isEn,
          'adminTicketsCloseMessage',
          'Звернення буде закрито, і на нього більше не можна буде відповісти.',
          'The ticket will be closed and no further replies can be sent.'
        )}
        confirmLabel={adminUiText(
          t,
          isEn,
          'adminTicketsCloseSubmit',
          'Закрити звернення',
          'Close ticket'
        )}
        loadingLabel={adminUiText(t, isEn, 'adminTicketsCloseClosing', 'Закриття...', 'Closing...')}
        isLoading={closing}
        onCancel={onCloseModalCancel}
        onConfirm={onCloseConfirm}
        t={t}
        isEn={isEn}
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
      </AdminConfirmModal>

      <AdminDangerConfirmModal
        isOpen={deletingMessageId !== null}
        titleId="admin-ticket-delete-title"
        title={adminUiText(
          t,
          isEn,
          'adminTicketsDeleteTitle',
          'Видалити відповідь?',
          'Delete reply?'
        )}
        message={adminUiText(
          t,
          isEn,
          'adminTicketsDeleteMessage',
          'Цю відповідь буде видалено зі звернення.',
          'This reply will be removed from the ticket.'
        )}
        isLoading={deleting}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        t={t}
        isEn={isEn}
      />
    </>
  );
}
