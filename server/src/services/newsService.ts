import { NotificationType } from '@prisma/client';
import { getNewsNotificationData } from './notificationService.js';

export function resolveNewsLocale(preferredLocale?: string | null): 'uk' | 'en' {
  return preferredLocale?.startsWith('en') ? 'en' : 'uk';
}

export function formatNewsPost(
  post: {
    id: string;
    titleUk: string;
    titleEn: string;
    bodyUk: string;
    bodyEn: string;
    isPublished: boolean;
    publishedAt: Date | null;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    author?: { username: string };
  },
  locale: 'uk' | 'en' = 'uk'
) {
  return {
    id: post.id,
    title: locale === 'en' ? post.titleEn : post.titleUk,
    titleUk: post.titleUk,
    titleEn: post.titleEn,
    body: locale === 'en' ? post.bodyEn : post.bodyUk,
    bodyUk: post.bodyUk,
    bodyEn: post.bodyEn,
    isPublished: post.isPublished,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    authorId: post.authorId,
    authorUsername: post.author?.username,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export async function notifyAllUsersAboutNews(
  prisma: {
    user: {
      findMany: (args: {
        where: { isBlocked: boolean };
        select: { id: true };
      }) => Promise<Array<{ id: string }>>;
    };
    notification: {
      createMany: (args: {
        data: Array<{
          userId: string;
          type: NotificationType;
          title: string;
          body: string;
          link: string;
          newsPostId: string;
        }>;
      }) => Promise<unknown>;
    };
  },
  newsId: string
): Promise<void> {
  const users = await prisma.user.findMany({
    where: { isBlocked: false },
    select: { id: true },
  });

  if (users.length === 0) {
    return;
  }

  const payload = getNewsNotificationData(newsId);

  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: NotificationType.NEWS,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      newsPostId: newsId,
    })),
  });
}
