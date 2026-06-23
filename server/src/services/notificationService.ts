export const NOTIFICATION_LIST_LIMIT = 5;

export const NOTIFICATION_I18N_KEYS = {
  supportReplyTitle: 'notification.supportReply.title',
  rankUpTitle: 'notification.rankUp.title',
  newsTitle: 'notification.news.title',
} as const;

const LEGACY_SUPPORT_REPLY_BODY_PREFIX = 'New reply on: ';

export function getSupportReplyNotificationData(messageId: string) {
  return {
    title: NOTIFICATION_I18N_KEYS.supportReplyTitle,
    body: messageId,
    link: '/support',
  };
}

export function parseLegacySupportReplySubject(body: string): string {
  if (body.startsWith(LEGACY_SUPPORT_REPLY_BODY_PREFIX)) {
    return body.slice(LEGACY_SUPPORT_REPLY_BODY_PREFIX.length);
  }
  return body;
}

export function getRankUpNotificationData(rank: string) {
  return {
    title: NOTIFICATION_I18N_KEYS.rankUpTitle,
    body: rank,
    link: '/ranks',
  };
}

export function getNewsNotificationData(newsId: string) {
  return {
    title: NOTIFICATION_I18N_KEYS.newsTitle,
    body: newsId,
    link: `/news/${newsId}`,
  };
}

export function formatNotification(
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
    supportMessage?: { ticket: { subject: string } } | null;
    newsPost?: { titleUk: string; titleEn: string } | null;
  },
  locale: 'uk' | 'en' = 'uk'
) {
  const supportSubject =
    notification.supportMessage?.ticket.subject ??
    (notification.type === 'SUPPORT_REPLY'
      ? parseLegacySupportReplySubject(notification.body)
      : undefined);

  const newsTitle =
    notification.newsPost != null
      ? locale === 'en'
        ? notification.newsPost.titleEn
        : notification.newsPost.titleUk
      : undefined;

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    ...(supportSubject ? { supportSubject } : {}),
    ...(newsTitle ? { newsTitle } : {}),
  };
}

export async function deleteLegacySupportReplyNotification(
  tx: {
    notification: {
      findMany: (args: {
        where: {
          userId: string;
          type: 'SUPPORT_REPLY';
          supportMessageId: null;
          body: string;
          createdAt: { gte: Date; lte: Date };
        };
        orderBy: { createdAt: 'asc' };
      }) => Promise<Array<{ id: string; createdAt: Date }>>;
      delete: (args: { where: { id: string } }) => Promise<unknown>;
    };
  },
  params: {
    ticketUserId: string;
    ticketSubject: string;
    messageCreatedAt: Date;
  }
): Promise<void> {
  for (const body of [
    params.ticketSubject,
    `${LEGACY_SUPPORT_REPLY_BODY_PREFIX}${params.ticketSubject}`,
  ]) {
    const candidates = await tx.notification.findMany({
      where: {
        userId: params.ticketUserId,
        type: 'SUPPORT_REPLY',
        supportMessageId: null,
        body,
        createdAt: {
          gte: new Date(params.messageCreatedAt.getTime() - 120_000),
          lte: new Date(params.messageCreatedAt.getTime() + 120_000),
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (candidates.length === 0) {
      continue;
    }

    const closest = candidates.reduce((best, current) => {
      const bestDiff = Math.abs(best.createdAt.getTime() - params.messageCreatedAt.getTime());
      const currentDiff = Math.abs(current.createdAt.getTime() - params.messageCreatedAt.getTime());
      return currentDiff < bestDiff ? current : best;
    });

    await tx.notification.delete({ where: { id: closest.id } });
    return;
  }
}
