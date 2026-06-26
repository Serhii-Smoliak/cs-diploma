import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  AdminDetailPlaceholder,
  AdminMasterDetailLayout,
  AdminPageShell,
} from '../components/admin/adminPageUi';
import {
  AdminTicketDetailPanel,
  AdminTicketsList,
  AdminTicketsModals,
} from '../components/admin/AdminTicketsPanel';
import {
  adminErrorText,
  adminLoadingLabel,
  adminUiText,
  toErrorMessage,
} from '../components/admin/adminPageUiHelpers';
import { useAuthStore } from '../store/authStore';
import {
  api,
  type SupportTicketCloseReason,
  type SupportTicketDetail,
  type SupportTicketSummary,
} from '../services/api';
import { getSupportCloseReasonLabel } from '../utils/supportTicketText';

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

  const loadErrorMessage = adminUiText(
    t,
    isEn,
    'adminTicketsLoadError',
    'Не вдалося завантажити звернення.',
    'Failed to load support tickets.'
  );

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTickets(await api.getAdminSupportTickets());
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

  const resetCloseModal = () => {
    setIsCloseModalOpen(false);
    setCloseReason('ANSWERED');
    setCloseReasonText('');
  };

  const loadTicketDetail = async (ticketId: string) => {
    setError(null);
    setEditingMessageId(null);
    setEditingBody('');
    resetCloseModal();
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
        adminErrorText(
          t,
          isEn,
          'adminTicketsReplyError',
          'Не вдалося надіслати відповідь.',
          'Failed to send reply.',
          err
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
        adminErrorText(
          t,
          isEn,
          'adminTicketsEditError',
          'Не вдалося оновити відповідь.',
          'Failed to update reply.',
          err
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
      resetCloseModal();
      await loadTickets();
    } catch (err) {
      setError(
        adminErrorText(
          t,
          isEn,
          'adminTicketsCloseError',
          'Не вдалося закрити звернення.',
          'Failed to close ticket.',
          err
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
        adminErrorText(
          t,
          isEn,
          'adminTicketsDeleteError',
          'Не вдалося видалити відповідь.',
          'Failed to delete reply.',
          err
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const canManageMessage = (entry: SupportTicketDetail['messages'][number]) =>
    entry.isStaffReply && entry.authorId === currentUserId && selectedTicket?.status !== 'CLOSED';

  const handleReasonChange = (reason: SupportTicketCloseReason) => {
    setCloseReason(reason);
    if (reason !== 'CUSTOM') {
      setCloseReasonText('');
    }
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
    closeReasonText,
    setCloseReasonText,
    closing,
    error,
    handleReply,
    startEditingMessage,
    cancelEditingMessage,
    handleSaveEdit,
    canManageMessage,
    handleReasonChange,
    handleSelectTicket: (ticketId: string) => {
      void loadTicketDetail(ticketId);
    },
    handleCloseModalCancel: () => {
      if (!closing) {
        resetCloseModal();
      }
    },
    handleCloseConfirm: () => {
      void handleCloseTicket();
    },
    handleDeleteConfirm: () => {
      void handleDeleteMessage();
    },
  };
}

type AdminTicketsState = ReturnType<typeof useAdminTickets>;

function AdminTicketsPageBody({
  state,
  isEn,
  t,
  selectedCloseReasonLabel,
}: Readonly<{
  state: AdminTicketsState;
  isEn: boolean;
  t: TFunction;
  selectedCloseReasonLabel: string | null;
}>) {
  const detail = state.selectedTicket ? (
    <AdminTicketDetailPanel
      ticket={state.selectedTicket}
      selectedCloseReasonLabel={selectedCloseReasonLabel}
      replyBody={state.replyBody}
      replying={state.replying}
      editingMessageId={state.editingMessageId}
      editingBody={state.editingBody}
      savingEdit={state.savingEdit}
      isEn={isEn}
      t={t}
      canManageMessage={state.canManageMessage}
      onReplyBodyChange={state.setReplyBody}
      onReplySubmit={state.handleReply}
      onOpenCloseModal={() => state.setIsCloseModalOpen(true)}
      onStartEdit={state.startEditingMessage}
      onCancelEdit={state.cancelEditingMessage}
      onSaveEdit={state.handleSaveEdit}
      onDeleteMessage={state.setDeletingMessageId}
      onEditingBodyChange={state.setEditingBody}
    />
  ) : (
    <AdminDetailPlaceholder
      message={adminUiText(
        t,
        isEn,
        'adminTicketsSelect',
        'Оберіть звернення.',
        'Select a ticket to view details.'
      )}
    />
  );

  return (
    <>
      <AdminMasterDetailLayout
        loading={state.loading}
        error={state.error}
        loadingLabel={adminLoadingLabel(t, isEn)}
        listTitle={adminUiText(t, isEn, 'adminTicketsList', 'Усі звернення', 'All requests')}
        list={
          <AdminTicketsList
            tickets={state.tickets}
            selectedTicketId={state.selectedTicket?.id ?? null}
            isEn={isEn}
            t={t}
            onSelect={state.handleSelectTicket}
          />
        }
        detail={detail}
      />

      <AdminTicketsModals
        isEn={isEn}
        t={t}
        isCloseModalOpen={state.isCloseModalOpen}
        closeReason={state.closeReason}
        closeReasonText={state.closeReasonText}
        closing={state.closing}
        deletingMessageId={state.deletingMessageId}
        deleting={state.deleting}
        onCloseModalCancel={state.handleCloseModalCancel}
        onCloseConfirm={state.handleCloseConfirm}
        onReasonChange={state.handleReasonChange}
        onReasonTextChange={state.setCloseReasonText}
        onDeleteCancel={() => state.setDeletingMessageId(null)}
        onDeleteConfirm={state.handleDeleteConfirm}
      />
    </>
  );
}

export default function AdminTicketsPage() {
  const { t, i18n: i18nInstance } = useTranslation(['ui']);
  const isEn = i18nInstance.resolvedLanguage?.startsWith('en') ?? false;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const state = useAdminTickets(t, isEn, currentUserId);
  const selectedCloseReasonLabel = state.selectedTicket
    ? getSupportCloseReasonLabel(
        state.selectedTicket.closeReason,
        state.selectedTicket.closeReasonText,
        t,
        isEn
      )
    : null;

  return (
    <AdminPageShell title={adminUiText(t, isEn, 'adminTickets', 'Звернення', 'Support tickets')}>
      <AdminTicketsPageBody
        state={state}
        isEn={isEn}
        t={t}
        selectedCloseReasonLabel={selectedCloseReasonLabel}
      />
    </AdminPageShell>
  );
}
