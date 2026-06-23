import { describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import type { AppNotification } from '../services/api';
import { getNotificationDisplayText } from './notificationText';

const t = vi.fn(
  (key: string, options?: { defaultValue?: string; subject?: string; rank?: string }) => {
    if (options?.defaultValue) {
      return options.defaultValue
        .replace('{{subject}}', options.subject ?? '')
        .replace('{{rank}}', options.rank ?? '');
    }
    return key;
  }
) as unknown as TFunction;

describe('getNotificationDisplayText', () => {
  it('translates new support reply notifications', () => {
    const notification: AppNotification = {
      id: '1',
      type: 'SUPPORT_REPLY',
      title: 'notification.supportReply.title',
      body: 'Не можу пройти місію',
      link: '/support',
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
    };

    const display = getNotificationDisplayText(notification, t, false);

    expect(display.title).toBe('Відповідь підтримки');
    expect(display.body).toBe('Нова відповідь на: Не можу пройти місію');
  });

  it('translates legacy support reply notifications', () => {
    const notification: AppNotification = {
      id: '1',
      type: 'SUPPORT_REPLY',
      title: 'Support reply',
      body: 'New reply on: Help',
      link: '/support',
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
    };

    const display = getNotificationDisplayText(notification, t, true);

    expect(display.title).toBe('Support reply');
    expect(display.body).toBe('New reply on: Help');
  });
});
