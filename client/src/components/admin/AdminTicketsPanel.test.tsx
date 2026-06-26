import type { TFunction } from 'i18next';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { t, i18n } = vi.hoisted(() => ({
  t: ((key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key) as TFunction,
  i18n: { resolvedLanguage: 'uk' as string },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

import { AdminTicketDetailPanel, AdminTicketsList, AdminTicketsModals } from './AdminTicketsPanel';

const sampleTicket = {
  id: 'ticket-1',
  subject: 'Login issue',
  message: 'Cannot login today',
  status: 'OPEN' as const,
  closedAt: null,
  closeReason: null,
  closeReasonText: null,
  createdAt: '2026-06-23T10:00:00.000Z',
  updatedAt: '2026-06-23T10:00:00.000Z',
  username: 'agent',
  email: 'agent@test.com',
  messages: [
    {
      id: 'msg-1',
      authorId: 'user-1',
      authorUsername: 'agent',
      body: 'Cannot login today',
      isStaffReply: false,
      createdAt: '2026-06-23T10:00:00.000Z',
    },
  ],
};

describe('AdminTicketsPanel', () => {
  it('renders empty ticket list notice', () => {
    render(
      <AdminTicketsList
        tickets={[]}
        selectedTicketId={null}
        isEn={false}
        t={t}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Звернень поки немає.')).toBeInTheDocument();
  });

  it('renders ticket rows and calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <AdminTicketsList
        tickets={[
          {
            id: 'ticket-1',
            subject: 'Login issue',
            message: 'Cannot login today',
            status: 'OPEN',
            closedAt: null,
            closeReason: null,
            closeReasonText: null,
            createdAt: '2026-06-23T10:00:00.000Z',
            updatedAt: '2026-06-23T10:00:00.000Z',
            username: 'agent',
            email: 'agent@test.com',
          },
        ]}
        selectedTicketId={null}
        isEn={false}
        t={t}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Login issue'));
    expect(onSelect).toHaveBeenCalledWith('ticket-1');
  });

  it('renders reply form in detail panel for open ticket', () => {
    render(
      <AdminTicketDetailPanel
        ticket={sampleTicket}
        selectedCloseReasonLabel={null}
        replyBody=""
        replying={false}
        editingMessageId={null}
        editingBody=""
        savingEdit={false}
        isEn={false}
        t={t}
        canManageMessage={() => false}
        onReplyBodyChange={vi.fn()}
        onReplySubmit={vi.fn()}
        onOpenCloseModal={vi.fn()}
        onStartEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onDeleteMessage={vi.fn()}
        onEditingBodyChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Відповідь')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Закрити звернення' })).toBeInTheDocument();
  });

  it('renders close and delete modals', () => {
    render(
      <AdminTicketsModals
        isEn={false}
        t={t}
        isCloseModalOpen
        closeReason="ANSWERED"
        closeReasonText=""
        closing={false}
        deletingMessageId="msg-2"
        deleting={false}
        onCloseModalCancel={vi.fn()}
        onCloseConfirm={vi.fn()}
        onReasonChange={vi.fn()}
        onReasonTextChange={vi.fn()}
        onDeleteCancel={vi.fn()}
        onDeleteConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Закрити звернення?')).toBeInTheDocument();
    expect(screen.getByText('Видалити відповідь?')).toBeInTheDocument();
  });
});
