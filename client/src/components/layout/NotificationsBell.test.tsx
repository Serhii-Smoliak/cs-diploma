import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NotificationsBell from './NotificationsBell';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: { resolvedLanguage: 'uk' },
  }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (state: { isAuthenticated: boolean }) => unknown) => {
    const state = { isAuthenticated: true };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../services/api', () => ({
  api: {
    getNotifications: vi.fn(),
    getNotificationUnreadCount: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}));

import { api } from '../../services/api';

describe('NotificationsBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigate.mockReset();
    vi.mocked(api.getNotifications).mockResolvedValue([
      {
        id: 'notif-1',
        type: 'SUPPORT_REPLY',
        title: 'notification.supportReply.title',
        body: 'msg-1',
        link: '/support',
        isRead: false,
        createdAt: '2026-06-23T10:00:00.000Z',
        supportSubject: 'Не можу пройти місію',
      },
    ]);
    vi.mocked(api.getNotificationUnreadCount).mockResolvedValue({ count: 1 });
    vi.mocked(api.markNotificationRead).mockResolvedValue({
      id: 'notif-1',
      type: 'SUPPORT_REPLY',
      title: 'notification.supportReply.title',
      body: 'Не можу пройти місію',
      link: '/support',
      isRead: true,
      createdAt: '2026-06-23T10:00:00.000Z',
    });
    vi.mocked(api.markAllNotificationsRead).mockResolvedValue({ success: true });
  });

  it('shows unread badge and opens dropdown', async () => {
    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    expect(await screen.findByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Відкрити сповіщення'));

    expect(await screen.findByText('Відповідь підтримки')).toBeInTheDocument();
    expect(screen.getByText('Нова відповідь на: Не можу пройти місію')).toBeInTheDocument();
  });

  it('marks notification as read and navigates on click', async () => {
    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Відкрити сповіщення'));
    fireEvent.click(await screen.findByText('Відповідь підтримки'));

    await waitFor(() => {
      expect(api.markNotificationRead).toHaveBeenCalledWith('notif-1');
      expect(navigate).toHaveBeenCalledWith('/support');
    });
  });

  it('marks all notifications as read', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Відкрити сповіщення'));
    await user.click(screen.getByRole('button', { name: 'Позначити всі' }));

    await waitFor(() => {
      expect(api.markAllNotificationsRead).toHaveBeenCalled();
    });
  });

  it('shows loading state while refreshing notifications', async () => {
    vi.mocked(api.getNotifications).mockImplementation(() => new Promise(() => undefined));

    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Відкрити сповіщення'));
    expect(screen.getByText('Завантаження...')).toBeInTheDocument();
  });

  it('shows empty state when there are no notifications', async () => {
    vi.mocked(api.getNotifications).mockResolvedValue([]);
    vi.mocked(api.getNotificationUnreadCount).mockResolvedValue({ count: 0 });

    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Відкрити сповіщення'));
    expect(await screen.findByText('Сповіщень поки немає.')).toBeInTheDocument();
  });

  it('does not mark already read notification as read again', async () => {
    vi.mocked(api.getNotifications).mockResolvedValue([
      {
        id: 'notif-2',
        type: 'SUPPORT_REPLY',
        title: 'notification.supportReply.title',
        body: 'msg-2',
        link: '/support',
        isRead: true,
        createdAt: '2026-06-23T10:00:00.000Z',
        supportSubject: 'Resolved issue',
      },
    ]);
    vi.mocked(api.getNotificationUnreadCount).mockResolvedValue({ count: 0 });

    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Відкрити сповіщення'));
    fireEvent.click(await screen.findByText('Відповідь підтримки'));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/support');
    });
    expect(api.markNotificationRead).not.toHaveBeenCalled();
  });
});
