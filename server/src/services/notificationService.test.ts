import { describe, expect, it } from 'vitest';
import {
  getNewsNotificationData,
  getRankUpNotificationData,
  getSupportReplyNotificationData,
  NOTIFICATION_I18N_KEYS,
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
});
