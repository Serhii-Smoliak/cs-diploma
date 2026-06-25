import type { TFunction } from 'i18next';
import type { AppNotification } from '../services/api';
import { getRankLabel } from './rank';

export const NOTIFICATION_I18N_KEYS = {
  supportReplyTitle: 'notification.supportReply.title',
  rankUpTitle: 'notification.rankUp.title',
  newsTitle: 'notification.news.title',
} as const;

const LEGACY_SUPPORT_REPLY_BODY_PREFIX = 'New reply on: ';
const LEGACY_RANK_UP_TITLES = new Set(['Rank up!', 'Нове звання!']);

function parseSupportReplySubject(notification: AppNotification): string {
  if (notification.supportSubject) {
    return notification.supportSubject;
  }

  if (notification.title === NOTIFICATION_I18N_KEYS.supportReplyTitle) {
    return notification.body;
  }

  if (notification.body.startsWith(LEGACY_SUPPORT_REPLY_BODY_PREFIX)) {
    return notification.body.slice(LEGACY_SUPPORT_REPLY_BODY_PREFIX.length);
  }

  return notification.body;
}

function getSupportReplyDisplay(
  notification: AppNotification,
  t: TFunction,
  isEn: boolean
): { title: string; body: string } {
  const subject = parseSupportReplySubject(notification);

  return {
    title: t(NOTIFICATION_I18N_KEYS.supportReplyTitle, {
      ns: 'ui',
      defaultValue: isEn ? 'Support reply' : 'Відповідь підтримки',
    }),
    body: t('notification.supportReply.body', {
      ns: 'ui',
      subject,
      defaultValue: isEn ? `New reply on: ${subject}` : `Нова відповідь на: ${subject}`,
    }),
  };
}

function getNewsDisplay(
  notification: AppNotification,
  t: TFunction,
  isEn: boolean
): { title: string; body: string } {
  const newsTitle = notification.newsTitle ?? notification.body;

  return {
    title: t(NOTIFICATION_I18N_KEYS.newsTitle, {
      ns: 'ui',
      defaultValue: isEn ? 'News' : 'Новина',
    }),
    body: t('notification.news.body', {
      ns: 'ui',
      title: newsTitle,
      defaultValue: isEn ? `New article: ${newsTitle}` : `Нова публікація: ${newsTitle}`,
    }),
  };
}

function getRankUpDisplay(
  notification: AppNotification,
  t: TFunction,
  isEn: boolean
): { title: string; body: string } {
  const rankLabel = getRankLabel(notification.body, t);

  return {
    title: t(NOTIFICATION_I18N_KEYS.rankUpTitle, {
      ns: 'ui',
      defaultValue: isEn ? 'Rank up!' : 'Нове звання!',
    }),
    body: t('notification.rankUp.body', {
      ns: 'ui',
      rank: rankLabel,
      defaultValue: isEn ? `You reached the rank: ${rankLabel}` : `Ви досягли звання: ${rankLabel}`,
    }),
  };
}

function getLegacyRankUpDisplay(
  notification: AppNotification,
  t: TFunction,
  isEn: boolean
): { title: string; body: string } {
  return {
    title: t(NOTIFICATION_I18N_KEYS.rankUpTitle, {
      ns: 'ui',
      defaultValue: isEn ? 'Rank up!' : 'Нове звання!',
    }),
    body: notification.body,
  };
}

function getSystemNotificationDisplay(
  notification: AppNotification,
  t: TFunction,
  isEn: boolean
): { title: string; body: string } | null {
  if (notification.title === NOTIFICATION_I18N_KEYS.rankUpTitle) {
    return getRankUpDisplay(notification, t, isEn);
  }

  if (LEGACY_RANK_UP_TITLES.has(notification.title)) {
    return getLegacyRankUpDisplay(notification, t, isEn);
  }

  return null;
}

export function getNotificationDisplayText(
  notification: AppNotification,
  t: TFunction,
  isEn: boolean
): { title: string; body: string } {
  if (notification.type === 'SUPPORT_REPLY') {
    return getSupportReplyDisplay(notification, t, isEn);
  }

  if (notification.type === 'NEWS') {
    return getNewsDisplay(notification, t, isEn);
  }

  if (notification.type === 'SYSTEM') {
    const systemDisplay = getSystemNotificationDisplay(notification, t, isEn);
    if (systemDisplay) {
      return systemDisplay;
    }
  }

  return {
    title: notification.title,
    body: notification.body,
  };
}
