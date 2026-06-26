import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { TFunction } from 'i18next';
import {
  adminErrorText,
  adminUiText,
  toErrorMessage,
} from '../components/admin/adminPageUiHelpers';
import {
  api,
  type SupportTicketCloseReason,
  type SupportTicketDetail,
  type SupportTicketSummary,
} from '../services/api';

export function useAdminTickets(t: TFunction, isEn: boolean, currentUserId: string | undefined) {
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

  const handleLoadError = useCallback(
    (err: unknown) => setError(toErrorMessage(err, loadErrorMessage)),
    [loadErrorMessage]
  );

  const loadTickets = useCallback(() => {
    setLoading(true);
    setError(null);
    return api
      .getAdminSupportTickets()
      .then(setTickets)
      .catch(handleLoadError)
      .finally(() => setLoading(false));
  }, [handleLoadError]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const resetCloseModal = () => {
    setIsCloseModalOpen(false);
    setCloseReason('ANSWERED');
    setCloseReasonText('');
  };

  const loadTicketDetail = useCallback(
    (ticketId: string) => {
      setError(null);
      setEditingMessageId(null);
      setEditingBody('');
      resetCloseModal();
      return api
        .getAdminSupportTicket(ticketId)
        .then((detail) => {
          setSelectedTicket(detail);
          setReplyBody('');
        })
        .catch(handleLoadError);
    },
    [handleLoadError]
  );

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
    handleSelectTicket: loadTicketDetail,
    handleCloseModalCancel: () => {
      if (!closing) {
        resetCloseModal();
      }
    },
    handleCloseConfirm: handleCloseTicket,
    handleDeleteConfirm: handleDeleteMessage,
  };
}
