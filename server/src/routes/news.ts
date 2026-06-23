import { Router } from 'express';
import prisma from '../db/database.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { formatNewsPost, resolveNewsLocale } from '../services/newsService.js';
import { requireRouteParam } from '../utils/routeParams.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { preferredLocale: true },
    });
    const locale = resolveNewsLocale(user?.preferredLocale);

    const posts = await prisma.newsPost.findMany({
      where: { isPublished: true },
      include: { author: { select: { username: true } } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(posts.map((post) => formatNewsPost(post, locale)));
  } catch (error) {
    console.error('Error fetching news posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { preferredLocale: true },
    });
    const locale = resolveNewsLocale(user?.preferredLocale);
    const id = requireRouteParam(req.params.id);

    const post = await prisma.newsPost.findFirst({
      where: { id, isPublished: true },
      include: { author: { select: { username: true } } },
    });

    if (!post) {
      return res.status(404).json({ error: 'News post not found' });
    }

    res.json(formatNewsPost(post, locale));
  } catch (error) {
    console.error('Error fetching news post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
