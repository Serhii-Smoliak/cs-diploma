import { fireEvent, render, renderHook, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TFunction } from 'i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { t, i18n } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'uk' as string },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../services/api', () => ({
  api: {
    getAdminSupportTickets: vi.fn(),
    getAdminSupportTicket: vi.fn(),
    replyAdminSupportTicket: vi.fn(),
    closeAdminSupportTicket: vi.fn(),
    updateAdminSupportMessage: vi.fn(),
    deleteAdminSupportMessage: vi.fn(),
  },
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector?: (state: { user: { id: string; role: 'ADMIN' } | null }) => unknown) => {
    const state = { user: { id: 'admin-1', role: 'ADMIN' as const } };
    return selector ? selector(state) : state;
  },
}));

import { api } from '../services/api';
import AdminTicketsPage from './AdminTicketsPage';
import { useAdminTickets } from './useAdminTickets';

describe('AdminTicketsPage', () => {
  beforeEach(() => {
    i18n.resolvedLanguage = 'uk';
    vi.clearAllMocks();
    vi.mocked(api.getAdminSupportTickets).mockResolvedValue([
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
    ]);
    vi.mocked(api.getAdminSupportTicket).mockResolvedValue({
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
      messages: [
        {
          id: 'msg-1',
          authorId: 'user-1',
          authorUsername: 'agent',
          body: 'Cannot login today',
          isStaffReply: false,
          createdAt: '2026-06-23T10:00:00.000Z',
        },
        {
          id: 'msg-2',
          authorId: 'admin-1',
          authorUsername: 'admin',
          body: 'We are checking',
          isStaffReply: true,
          createdAt: '2026-06-23T11:00:00.000Z',
        },
      ],
    });
    vi.mocked(api.replyAdminSupportTicket).mockResolvedValue({
      id: 'msg-2',
      authorId: 'admin-1',
      authorUsername: 'admin',
      body: 'We are checking',
      isStaffReply: true,
      createdAt: '2026-06-23T11:00:00.000Z',
    });
    vi.mocked(api.updateAdminSupportMessage).mockResolvedValue({
      id: 'msg-2',
      authorId: 'admin-1',
      authorUsername: 'admin',
      body: 'Updated reply',
      isStaffReply: true,
      createdAt: '2026-06-23T11:00:00.000Z',
    });
    vi.mocked(api.deleteAdminSupportMessage).mockResolvedValue(undefined);
    vi.mocked(api.closeAdminSupportTicket).mockResolvedValue({
      id: 'ticket-1',
      subject: 'Login issue',
      message: 'Cannot login today',
      status: 'CLOSED',
      closedAt: '2026-06-23T12:00:00.000Z',
      closeReason: 'DECLINED',
      closeReasonText: null,
      createdAt: '2026-06-23T10:00:00.000Z',
      updatedAt: '2026-06-23T12:00:00.000Z',
      username: 'agent',
      email: 'agent@test.com',
      messages: [],
    });
  });

  it('renders ticket list and reply form', async () => {
    render(<AdminTicketsPage />);

    expect(await screen.findByText('Login issue')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Login issue'));

    expect(await screen.findByLabelText('Відповідь')).toBeInTheDocument();
  });

  it('sends admin reply', async () => {
    const userEvents = userEvent.setup();
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByLabelText('Відповідь');

    await userEvents.type(screen.getByLabelText('Відповідь'), 'We are checking');
    fireEvent.click(screen.getByRole('button', { name: 'Надіслати відповідь' }));

    await waitFor(() => {
      expect(api.replyAdminSupportTicket).toHaveBeenCalledWith('ticket-1', 'We are checking');
    });
  });

  it('shows edit and delete actions for own staff replies', async () => {
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));

    expect(await screen.findByRole('button', { name: 'Редагувати' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Видалити' })).toBeInTheDocument();
  });

  it('updates own staff reply', async () => {
    const userEvents = userEvent.setup();
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Редагувати' });

    fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }));
    const editField = screen.getByDisplayValue('We are checking');
    await userEvents.clear(editField);
    await userEvents.type(editField, 'Updated reply');
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => {
      expect(api.updateAdminSupportMessage).toHaveBeenCalledWith('msg-2', 'Updated reply');
    });
  });

  it('closes ticket with selected reason', async () => {
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Закрити звернення' });

    fireEvent.click(screen.getByRole('button', { name: 'Закрити звернення' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Закрити звернення' })[1]);

    await waitFor(() => {
      expect(api.closeAdminSupportTicket).toHaveBeenCalledWith('ticket-1', 'ANSWERED', undefined);
    });
  });

  it('closes ticket with custom reason text', async () => {
    const userEvents = userEvent.setup();
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Закрити звернення' });

    fireEvent.click(screen.getByRole('button', { name: 'Закрити звернення' }));
    fireEvent.change(screen.getByLabelText('Причина'), { target: { value: 'CUSTOM' } });
    await userEvents.type(
      screen.getByPlaceholderText('3–500 символів'),
      'Duplicate ticket already handled'
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Закрити звернення' })[1]);

    await waitFor(() => {
      expect(api.closeAdminSupportTicket).toHaveBeenCalledWith(
        'ticket-1',
        'CUSTOM',
        'Duplicate ticket already handled'
      );
    });
  });

  it('deletes own staff reply', async () => {
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Видалити' });

    fireEvent.click(screen.getByRole('button', { name: 'Видалити' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Видалити' })[1]!);

    await waitFor(() => {
      expect(api.deleteAdminSupportMessage).toHaveBeenCalledWith('msg-2');
    });
  });

  it('shows load error for ticket list', async () => {
    vi.mocked(api.getAdminSupportTickets).mockRejectedValue(new Error('List failed'));
    render(<AdminTicketsPage />);

    expect(await screen.findByText('List failed')).toBeInTheDocument();
  });

  it('cancels close ticket modal', async () => {
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Закрити звернення' });

    fireEvent.click(screen.getByRole('button', { name: 'Закрити звернення' }));
    fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }));

    expect(api.closeAdminSupportTicket).not.toHaveBeenCalled();
  });

  it('cancels delete reply confirmation', async () => {
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Видалити' });

    fireEvent.click(screen.getByRole('button', { name: 'Видалити' }));
    fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }));

    expect(api.deleteAdminSupportMessage).not.toHaveBeenCalled();
  });

  it('shows error when reply fails', async () => {
    vi.mocked(api.replyAdminSupportTicket).mockRejectedValue(new Error('Reply failed'));
    const userEvents = userEvent.setup();
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByLabelText('Відповідь');

    await userEvents.type(screen.getByLabelText('Відповідь'), 'We are checking');
    fireEvent.click(screen.getByRole('button', { name: 'Надіслати відповідь' }));

    expect(await screen.findByText('Reply failed')).toBeInTheDocument();
  });

  it('blocks close modal cancel while closing is in progress', async () => {
    vi.mocked(api.closeAdminSupportTicket).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Закрити звернення' });

    fireEvent.click(screen.getByRole('button', { name: 'Закрити звернення' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Закрити звернення' })[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
    expect(screen.getByText('Закрити звернення?')).toBeInTheDocument();
  });

  it('shows loading state while tickets are fetched', async () => {
    vi.mocked(api.getAdminSupportTickets).mockImplementation(() => new Promise(() => undefined));

    render(<AdminTicketsPage />);

    expect(screen.getByText('Завантаження...')).toBeInTheDocument();
  });

  it('shows empty ticket selection prompt', async () => {
    render(<AdminTicketsPage />);

    expect(await screen.findByText('Login issue')).toBeInTheDocument();
    expect(screen.getByText('Оберіть звернення.')).toBeInTheDocument();
  });

  it('clears custom close reason when switching away from CUSTOM', async () => {
    const user = userEvent.setup();
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Закрити звернення' });

    fireEvent.click(screen.getByRole('button', { name: 'Закрити звернення' }));
    fireEvent.change(screen.getByLabelText('Причина'), { target: { value: 'CUSTOM' } });
    await user.type(screen.getByPlaceholderText('3–500 символів'), 'Duplicate ticket');

    fireEvent.change(screen.getByLabelText('Причина'), { target: { value: 'ANSWERED' } });
    expect(screen.queryByPlaceholderText('3–500 символів')).not.toBeInTheDocument();
  });

  it('shows empty ticket list message', async () => {
    vi.mocked(api.getAdminSupportTickets).mockResolvedValue([]);
    render(<AdminTicketsPage />);

    expect(await screen.findByText('Звернень поки немає.')).toBeInTheDocument();
  });

  it('shows error when ticket detail fails to load', async () => {
    vi.mocked(api.getAdminSupportTicket).mockRejectedValue(new Error('Detail failed'));
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');

    fireEvent.click(screen.getByText('Login issue'));

    expect(await screen.findByText('Detail failed')).toBeInTheDocument();
  });

  it('ignores empty reply submission', async () => {
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    const replyField = await screen.findByLabelText('Відповідь');

    fireEvent.submit(replyField.closest('form')!);

    expect(api.replyAdminSupportTicket).not.toHaveBeenCalled();
  });

  it('ignores empty edit submission', async () => {
    const { result } = renderHook(() => useAdminTickets(t as TFunction, false, 'admin-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.handleSelectTicket('ticket-1');
    });
    await waitFor(() => expect(result.current.selectedTicket).not.toBeNull());

    act(() => {
      result.current.startEditingMessage('msg-2', 'We are checking');
      result.current.setEditingBody('');
    });

    await act(async () => {
      await result.current.handleSaveEdit('msg-2');
    });

    expect(api.updateAdminSupportMessage).not.toHaveBeenCalled();
  });

  it('ignores close modal cancel while closing', async () => {
    vi.mocked(api.closeAdminSupportTicket).mockImplementation(() => new Promise(() => undefined));
    const { result } = renderHook(() => useAdminTickets(t as TFunction, false, 'admin-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.handleSelectTicket('ticket-1');
    });
    await waitFor(() => expect(result.current.selectedTicket).not.toBeNull());

    act(() => {
      result.current.setIsCloseModalOpen(true);
      result.current.handleCloseConfirm();
    });

    await waitFor(() => expect(result.current.closing).toBe(true));

    act(() => {
      result.current.handleCloseModalCancel();
    });

    expect(result.current.isCloseModalOpen).toBe(true);
  });

  it('does not close ticket when custom reason is too short', async () => {
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Закрити звернення' });

    fireEvent.click(screen.getByRole('button', { name: 'Закрити звернення' }));
    fireEvent.change(screen.getByLabelText('Причина'), { target: { value: 'CUSTOM' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Закрити звернення' })[1]!);

    expect(api.closeAdminSupportTicket).not.toHaveBeenCalled();
  });

  it('shows error when edit fails', async () => {
    vi.mocked(api.updateAdminSupportMessage).mockRejectedValue(new Error('Edit failed'));
    const user = userEvent.setup();
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Редагувати' });

    fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }));
    const editField = screen.getByDisplayValue('We are checking');
    await user.clear(editField);
    await user.type(editField, 'Updated reply');
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));

    expect(await screen.findByText('Edit failed')).toBeInTheDocument();
  });

  it('shows error when close fails', async () => {
    vi.mocked(api.closeAdminSupportTicket).mockRejectedValue(new Error('Close failed'));
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Закрити звернення' });

    fireEvent.click(screen.getByRole('button', { name: 'Закрити звернення' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Закрити звернення' })[1]!);

    expect(await screen.findByText('Close failed')).toBeInTheDocument();
  });

  it('shows error when delete fails', async () => {
    vi.mocked(api.deleteAdminSupportMessage).mockRejectedValue(new Error('Delete failed'));
    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));
    await screen.findByRole('button', { name: 'Видалити' });

    fireEvent.click(screen.getByRole('button', { name: 'Видалити' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Видалити' })[1]!);

    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
  });

  it('renders english page shell when locale is en', async () => {
    i18n.resolvedLanguage = 'en';
    render(<AdminTicketsPage />);

    expect(await screen.findByRole('heading', { name: 'Support tickets' })).toBeInTheDocument();
    expect(screen.getByText('All requests')).toBeInTheDocument();
    expect(screen.getByText('Select a ticket to view details.')).toBeInTheDocument();
  });

  it('hides edit actions for replies from other admins', async () => {
    vi.mocked(api.getAdminSupportTicket).mockResolvedValue({
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
      messages: [
        {
          id: 'msg-2',
          authorId: 'admin-2',
          authorUsername: 'other-admin',
          body: 'Other admin reply',
          isStaffReply: true,
          createdAt: '2026-06-23T11:00:00.000Z',
        },
      ],
    });

    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));

    expect(await screen.findByText('Other admin reply')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Редагувати' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Видалити' })).not.toBeInTheDocument();
  });

  it('defaults locale to ukrainian labels when resolvedLanguage is missing', async () => {
    i18n.resolvedLanguage = undefined as unknown as string;
    render(<AdminTicketsPage />);

    expect(await screen.findByRole('heading', { name: 'Звернення' })).toBeInTheDocument();
    expect(screen.getByText('Оберіть звернення.')).toBeInTheDocument();
  });

  it('renders master-detail list heading', async () => {
    render(<AdminTicketsPage />);

    expect(await screen.findByRole('heading', { name: 'Усі звернення' })).toBeInTheDocument();
  });

  it('ignores delete confirm when message id is missing', async () => {
    const { result } = renderHook(() => useAdminTickets(t as TFunction, false, 'admin-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDeleteConfirm();
    });

    expect(api.deleteAdminSupportMessage).not.toHaveBeenCalled();
  });

  it('shows closed ticket closure reason in detail panel', async () => {
    vi.mocked(api.getAdminSupportTickets).mockResolvedValue([
      {
        id: 'ticket-1',
        subject: 'Login issue',
        message: 'Cannot login today',
        status: 'CLOSED',
        closedAt: '2026-06-23T12:00:00.000Z',
        closeReason: 'DECLINED',
        closeReasonText: null,
        createdAt: '2026-06-23T10:00:00.000Z',
        updatedAt: '2026-06-23T12:00:00.000Z',
        username: 'agent',
        email: 'agent@test.com',
      },
    ]);
    vi.mocked(api.getAdminSupportTicket).mockResolvedValue({
      id: 'ticket-1',
      subject: 'Login issue',
      message: 'Cannot login today',
      status: 'CLOSED',
      closedAt: '2026-06-23T12:00:00.000Z',
      closeReason: 'DECLINED',
      closeReasonText: null,
      createdAt: '2026-06-23T10:00:00.000Z',
      updatedAt: '2026-06-23T12:00:00.000Z',
      username: 'agent',
      email: 'agent@test.com',
      messages: [],
    });

    render(<AdminTicketsPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByText('Login issue'));

    expect(await screen.findByText(/не відповідає вимогам/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Закрити звернення' })).not.toBeInTheDocument();
  });
});
