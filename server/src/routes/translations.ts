import { Router } from 'express';
import prisma from '../db/database.js';

const router = Router();

router.get('/languages', async (req, res) => {
  try {
    const languages = await prisma.language.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    res.json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { locale = 'uk', namespace = 'common' } = req.query;

    const translations = await prisma.translation.findMany({
      where: {
        locale: locale as string,
        namespace: namespace as string,
      },
      select: {
        key: true,
        value: true,
      },
    });

    const translationsObj: Record<string, string> = {};
    translations.forEach((t) => {
      translationsObj[t.key] = t.value;
    });

    res.json(translationsObj);
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/namespaces', async (req, res) => {
  try {
    const { locale = 'uk', namespaces } = req.query;
    
    if (!namespaces || typeof namespaces !== 'string') {
      return res.status(400).json({ error: 'namespaces query parameter is required' });
    }

    const namespaceArray = namespaces.split(',');
    const translations = await prisma.translation.findMany({
      where: {
        locale: locale as string,
        namespace: {
          in: namespaceArray,
        },
      },
      select: {
        key: true,
        value: true,
        namespace: true,
      },
    });

    const result: Record<string, Record<string, string>> = {};
    namespaceArray.forEach((ns) => {
      result[ns] = {};
    });

    translations.forEach((t) => {
      if (!result[t.namespace || 'common']) {
        result[t.namespace || 'common'] = {};
      }
      result[t.namespace || 'common'][t.key] = t.value;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching translations by namespaces:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { key, locale = 'uk', value, namespace = 'common' } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'key and value are required' });
    }

    const translation = await prisma.translation.upsert({
      where: {
        key_locale_namespace: {
          key,
          locale,
          namespace,
        },
      },
      update: {
        value,
      },
      create: {
        key,
        locale,
        value,
        namespace,
      },
    });

    res.json(translation);
  } catch (error) {
    console.error('Error creating/updating translation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const { translations, locale = 'uk', namespace = 'common' } = req.body;

    if (!translations || !Array.isArray(translations)) {
      return res.status(400).json({ error: 'translations array is required' });
    }

    const operations = translations.map((t: { key: string; value: string }) =>
      prisma.translation.upsert({
        where: {
          key_locale_namespace: {
            key: t.key,
            locale,
            namespace,
          },
        },
        update: {
          value: t.value,
        },
        create: {
          key: t.key,
          locale,
          value: t.value,
          namespace,
        },
      })
    );

    const result = await prisma.$transaction(operations);
    res.json({ count: result.length, translations: result });
  } catch (error) {
    console.error('Error bulk creating/updating translations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

