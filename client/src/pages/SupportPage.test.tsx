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
    getSupportTicketLimit: vi.fn(),
    getSupportTickets: vi.fn(),
    getSupportTicket: vi.fn(),
    createSupportTicket: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { api } from '../services/api';
import SupportPage from './SupportPage';

describe('SupportPage', () => {
  beforeEach(() => {
    vi.mocked(api.getSupportTicketLimit).mockResolvedValue({
      limit: 3,
      usedToday: 1,
      remainingToday: 2,
    });
    vi.mocked(api.getSupportTickets).mockResolvedValue([
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
      },
    ]);
    vi.mocked(api.createSupportTicket).mockResolvedValue({
      id: 'ticket-2',
      subject: 'New issue',
      message: 'Need help please now',
      status: 'OPEN',
      closedAt: null,
      closeReason: null,
      closeReasonText: null,
      createdAt: '2026-06-23T11:00:00.000Z',
      updatedAt: '2026-06-23T11:00:00.000Z',
    });
    vi.mocked(api.getSupportTicket).mockResolvedValue({
      id: 'ticket-1',
      subject: 'Login issue',
      message: 'Cannot login today',
      status: 'OPEN',
      closedAt: null,
      closeReason: null,
      closeReasonText: null,
      createdAt: '2026-06-23T10:00:00.000Z',
      updatedAt: '2026-06-23T10:00:00.000Z',
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
    });
  });

  it('renders form and ticket list', async () => {
    render(<SupportPage />);

    expect(await screen.findByText('Login issue')).toBeInTheDocument();
    expect(screen.getByText('Залишилось сьогодні: 2 з 3')).toBeInTheDocument();
  });

  it('toggles ticket thread on repeated click', async () => {
    render(<SupportPage />);
    await screen.findByText('Login issue');

    fireEvent.click(screen.getByRole('button', { name: /Login issue/i }));
    expect(await screen.findByText('Cannot login today')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Login issue/i }));
    await waitFor(() => {
      expect(screen.queryByText('Cannot login today')).not.toBeInTheDocument();
    });
  });

  it('shows load error', async () => {
    vi.mocked(api.getSupportTickets).mockRejectedValue(new Error('Load failed'));
    render(<SupportPage />);

    expect(await screen.findByText('Load failed')).toBeInTheDocument();
  });

  it('shows error when ticket detail fails to load', async () => {
    vi.mocked(api.getSupportTicket).mockRejectedValue(new Error('Detail failed'));
    render(<SupportPage />);
    await screen.findByText('Login issue');

    fireEvent.click(screen.getByRole('button', { name: /Login issue/i }));

    expect(await screen.findByText('Detail failed')).toBeInTheDocument();
  });

  it('shows daily limit error on 429 submit', async () => {
    const { ApiError } = await import('../services/api');
    vi.mocked(api.createSupportTicket).mockRejectedValue(new ApiError('Too many', 429));
    const userEvents = userEvent.setup();
    render(<SupportPage />);
    await screen.findByText('Login issue');

    await userEvents.type(screen.getByRole('textbox', { name: 'Тема' }), 'New issue');
    await userEvents.type(
      screen.getByRole('textbox', { name: 'Повідомлення' }),
      'Need help please now'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Надіслати звернення' }));

    expect(
      await screen.findByText('Денний ліміт вичерпано (3 звернення на день).')
    ).toBeInTheDocument();
  });

  it('shows closed ticket reason in expanded thread', async () => {
    vi.mocked(api.getSupportTickets).mockResolvedValue([
      {
        id: 'ticket-1',
        subject: 'Closed issue',
        message: 'Please close',
        status: 'CLOSED',
        closedAt: '2026-06-23T12:00:00.000Z',
        closeReason: 'DECLINED',
        closeReasonText: null,
        createdAt: '2026-06-23T10:00:00.000Z',
        updatedAt: '2026-06-23T12:00:00.000Z',
      },
    ]);
    vi.mocked(api.getSupportTicket).mockResolvedValue({
      id: 'ticket-1',
      subject: 'Closed issue',
      message: 'Please close',
      status: 'CLOSED',
      closedAt: '2026-06-23T12:00:00.000Z',
      closeReason: 'DECLINED',
      closeReasonText: null,
      createdAt: '2026-06-23T10:00:00.000Z',
      updatedAt: '2026-06-23T12:00:00.000Z',
      messages: [],
    });

    render(<SupportPage />);
    await screen.findByText('Closed issue');
    fireEvent.click(screen.getByRole('button', { name: /Closed issue/i }));

    expect(await screen.findByText(/Причина закриття/)).toBeInTheDocument();
  });

  it('shows empty ticket list', async () => {
    vi.mocked(api.getSupportTickets).mockResolvedValue([]);
    render(<SupportPage />);

    expect(await screen.findByText('Звернень поки немає.')).toBeInTheDocument();
  });

  it('submits support ticket', async () => {
    const userEvents = userEvent.setup();
    render(<SupportPage />);
    await screen.findByText('Login issue');

    await userEvents.type(screen.getByRole('textbox', { name: 'Тема' }), 'New issue');
    await userEvents.type(
      screen.getByRole('textbox', { name: 'Повідомлення' }),
      'Need help please now'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Надіслати звернення' }));

    await waitFor(() => {
      expect(api.createSupportTicket).toHaveBeenCalledWith('New issue', 'Need help please now');
    });
  });

  it('shows answered ticket status styling', async () => {
    vi.mocked(api.getSupportTickets).mockResolvedValue([
      {
        id: 'ticket-1',
        subject: 'Answered issue',
        message: 'Please answer',
        status: 'ANSWERED',
        closedAt: null,
        closeReason: null,
        closeReasonText: null,
        createdAt: '2026-06-23T10:00:00.000Z',
        updatedAt: '2026-06-23T11:00:00.000Z',
      },
    ]);

    render(<SupportPage />);
    expect(await screen.findByText('Answered issue')).toBeInTheDocument();
  });

  it('shows generic submit error', async () => {
    vi.mocked(api.createSupportTicket).mockRejectedValue(new Error('Submit failed'));
    const userEvents = userEvent.setup();
    render(<SupportPage />);
    await screen.findByText('Login issue');

    await userEvents.type(screen.getByRole('textbox', { name: 'Тема' }), 'New issue');
    await userEvents.type(
      screen.getByRole('textbox', { name: 'Повідомлення' }),
      'Need help please now'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Надіслати звернення' }));

    expect(await screen.findByText('Submit failed')).toBeInTheDocument();
  });

  it('renders staff reply styling in expanded thread', async () => {
    vi.mocked(api.getSupportTicket).mockResolvedValue({
      id: 'ticket-1',
      subject: 'Login issue',
      message: 'Cannot login today',
      status: 'OPEN',
      closedAt: null,
      closeReason: null,
      closeReasonText: null,
      createdAt: '2026-06-23T10:00:00.000Z',
      updatedAt: '2026-06-23T10:00:00.000Z',
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
          body: 'Staff reply here',
          isStaffReply: true,
          createdAt: '2026-06-23T11:00:00.000Z',
        },
      ],
    });

    render(<SupportPage />);
    await screen.findByText('Login issue');
    fireEvent.click(screen.getByRole('button', { name: /Login issue/i }));

    expect(await screen.findByText('Staff reply here')).toBeInTheDocument();
  });
});
