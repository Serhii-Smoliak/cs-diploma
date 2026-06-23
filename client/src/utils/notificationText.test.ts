import { describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import type { AppNotification } from '../services/api';
import { getNotificationDisplayText, NOTIFICATION_I18N_KEYS } from './notificationText';

function createT(isEn: boolean): TFunction {
  return vi.fn(
    (
      key: string,
      options?: { defaultValue?: string; subject?: string; rank?: string; title?: string }
    ) => {
      if (options?.defaultValue) {
        return options.defaultValue
          .replace('{{subject}}', options.subject ?? '')
          .replace('{{rank}}', options.rank ?? '')
          .replace('{{title}}', options.title ?? '');
      }
      if (key === NOTIFICATION_I18N_KEYS.supportReplyTitle) {
        return isEn ? 'Support reply' : 'Відповідь підтримки';
      }
      if (key === NOTIFICATION_I18N_KEYS.newsTitle) {
        return isEn ? 'News' : 'Новина';
      }
      if (key === NOTIFICATION_I18N_KEYS.rankUpTitle) {
        return isEn ? 'Rank up!' : 'Нове звання!';
      }
      return key;
    }
  ) as unknown as TFunction;
}

describe('getNotificationDisplayText', () => {
  it('translates support reply with supportSubject', () => {
    const notification: AppNotification = {
      id: '1',
      type: 'SUPPORT_REPLY',
      title: NOTIFICATION_I18N_KEYS.supportReplyTitle,
      body: 'msg-1',
      link: '/support',
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
      supportSubject: 'Не можу пройти місію',
    };

    const display = getNotificationDisplayText(notification, createT(false), false);

    expect(display.title).toBe('Відповідь підтримки');
    expect(display.body).toBe('Нова відповідь на: Не можу пройти місію');
  });

  it('parses legacy support reply body prefix', () => {
    const notification: AppNotification = {
      id: '1',
      type: 'SUPPORT_REPLY',
      title: 'Support reply',
      body: 'New reply on: Help with login',
      link: '/support',
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
    };

    const display = getNotificationDisplayText(notification, createT(true), true);

    expect(display.body).toBe('New reply on: Help with login');
  });

  it('uses body as subject when title is i18n key', () => {
    const notification: AppNotification = {
      id: '1',
      type: 'SUPPORT_REPLY',
      title: NOTIFICATION_I18N_KEYS.supportReplyTitle,
      body: 'Subject from body',
      link: '/support',
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
    };

    const display = getNotificationDisplayText(notification, createT(false), false);

    expect(display.body).toBe('Нова відповідь на: Subject from body');
  });

  it('translates news notifications', () => {
    const notification: AppNotification = {
      id: '2',
      type: 'NEWS',
      title: NOTIFICATION_I18N_KEYS.newsTitle,
      body: 'news-1',
      link: '/news/news-1',
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
      newsTitle: 'Platform update',
    };

    const display = getNotificationDisplayText(notification, createT(false), false);

    expect(display.title).toBe('Новина');
    expect(display.body).toBe('Нова публікація: Platform update');
  });

  it('translates rank-up system notifications', () => {
    const notification: AppNotification = {
      id: '3',
      type: 'SYSTEM',
      title: NOTIFICATION_I18N_KEYS.rankUpTitle,
      body: 'Novice Hacker',
      link: '/ranks',
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
    };

    const display = getNotificationDisplayText(notification, createT(false), false);

    expect(display.title).toBe('Нове звання!');
    expect(display.body).toContain('Novice Hacker');
  });

  it('returns legacy rank-up body unchanged', () => {
    const notification: AppNotification = {
      id: '3',
      type: 'SYSTEM',
      title: 'Rank up!',
      body: 'You reached Novice Hacker',
      link: '/ranks',
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
    };

    const display = getNotificationDisplayText(notification, createT(true), true);

    expect(display.title).toBe('Rank up!');
    expect(display.body).toBe('You reached Novice Hacker');
  });

  it('returns raw text for unknown notification types', () => {
    const notification: AppNotification = {
      id: '4',
      type: 'SYSTEM',
      title: 'Maintenance',
      body: 'Planned downtime',
      link: null,
      isRead: false,
      createdAt: '2026-06-23T10:00:00.000Z',
    };

    const display = getNotificationDisplayText(notification, createT(true), true);

    expect(display).toEqual({ title: 'Maintenance', body: 'Planned downtime' });
  });
});
