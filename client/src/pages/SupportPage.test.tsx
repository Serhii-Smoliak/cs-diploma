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
});
