import { describe, expect, it, vi } from 'vitest';
import {
  deleteLegacySupportReplyNotification,
  formatNotification,
  getNewsNotificationData,
  getRankUpNotificationData,
  getSupportReplyNotificationData,
  NOTIFICATION_I18N_KEYS,
  parseLegacySupportReplySubject,
} from './notificationService.js';

describe('notificationService data helpers', () => {
  it('returns support reply i18n payload', () => {
    expect(getSupportReplyNotificationData('msg-1')).toEqual({
      title: NOTIFICATION_I18N_KEYS.supportReplyTitle,
      body: 'msg-1',
      link: '/support',
    });
  });

  it('returns rank-up i18n payload', () => {
    expect(getRankUpNotificationData('Novice Hacker')).toEqual({
      title: NOTIFICATION_I18N_KEYS.rankUpTitle,
      body: 'Novice Hacker',
      link: '/ranks',
    });
  });

  it('returns news i18n payload', () => {
    expect(getNewsNotificationData('news-1')).toEqual({
      title: NOTIFICATION_I18N_KEYS.newsTitle,
      body: 'news-1',
      link: '/news/news-1',
    });
  });

  it('parses legacy support reply subject', () => {
    expect(parseLegacySupportReplySubject('New reply on: Login issue')).toBe('Login issue');
    expect(parseLegacySupportReplySubject('Login issue')).toBe('Login issue');
  });

  it('formats notification with support subject and localized news title', () => {
    const createdAt = new Date('2026-06-23T10:00:00.000Z');

    expect(
      formatNotification(
        {
          id: 'n1',
          type: 'NEWS',
          title: 'notification.news.title',
          body: 'news-1',
          link: '/news/news-1',
          isRead: false,
          createdAt,
          newsPost: { titleUk: 'Новина', titleEn: 'News' },
        },
        'en'
      )
    ).toEqual({
      id: 'n1',
      type: 'NEWS',
      title: 'notification.news.title',
      body: 'news-1',
      link: '/news/news-1',
      isRead: false,
      createdAt: createdAt.toISOString(),
      newsTitle: 'News',
    });
  });

  it('uses legacy support reply body when support message is missing', () => {
    const createdAt = new Date('2026-06-23T10:00:00.000Z');

    expect(
      formatNotification({
        id: 'n2',
        type: 'SUPPORT_REPLY',
        title: 'notification.supportReply.title',
        body: 'New reply on: Login issue',
        link: '/support',
        isRead: true,
        createdAt,
      }).supportSubject
    ).toBe('Login issue');
  });

  it('deletes closest legacy support reply notification', async () => {
    const messageCreatedAt = new Date('2026-06-23T10:00:00.000Z');
    const tx = {
      notification: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'older', createdAt: new Date('2026-06-23T09:58:00.000Z') },
          { id: 'closest', createdAt: new Date('2026-06-23T10:00:30.000Z') },
        ]),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    };

    await deleteLegacySupportReplyNotification(tx, {
      ticketUserId: 'u1',
      ticketSubject: 'Login issue',
      messageCreatedAt,
    });

    expect(tx.notification.delete).toHaveBeenCalledWith({ where: { id: 'closest' } });
  });

  it('does nothing when no legacy notification candidates exist', async () => {
    const tx = {
      notification: {
        findMany: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
      },
    };

    await deleteLegacySupportReplyNotification(tx, {
      ticketUserId: 'u1',
      ticketSubject: 'Login issue',
      messageCreatedAt: new Date('2026-06-23T10:00:00.000Z'),
    });

    expect(tx.notification.delete).not.toHaveBeenCalled();
  });
});
