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
import { adminLoadingLabel, adminUiText } from '../components/admin/adminPageUiHelpers';
import { useAuthStore } from '../store/authStore';
import { getSupportCloseReasonLabel } from '../utils/supportTicketText';
import { useAdminTickets } from './useAdminTickets';

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
