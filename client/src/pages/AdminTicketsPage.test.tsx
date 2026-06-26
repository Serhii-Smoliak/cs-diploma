import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { t, i18n } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'uk' },
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

describe('AdminTicketsPage', () => {
  beforeEach(() => {
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
});
