import { Router } from 'express';
import prisma from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  handleTranslationParamError,
  parseTranslationBulkItems,
  parseTranslationKey,
  parseTranslationLocale,
  parseTranslationNamespace,
  parseTranslationNamespacesList,
  parseTranslationValue,
  translationNamespacesQuerySchema,
  translationQuerySchema,
} from '../validators/translationParams.js';

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
    const query = translationQuerySchema.parse(req.query);
    const locale = parseTranslationLocale(query.locale);
    const namespace = parseTranslationNamespace(query.namespace);

    const translations = await prisma.translation.findMany({
      where: {
        locale,
        namespace,
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
    if (handleTranslationParamError(error, res)) {
      return;
    }
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/namespaces', async (req, res) => {
  try {
    const query = translationNamespacesQuerySchema.parse(req.query);
    const locale = parseTranslationLocale(query.locale);
    const namespaceArray = parseTranslationNamespacesList(query.namespaces);

    const translations = await prisma.translation.findMany({
      where: {
        locale,
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
    if (handleTranslationParamError(error, res)) {
      return;
    }
    console.error('Error fetching translations by namespaces:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const locale = parseTranslationLocale(req.body?.locale);
    const namespace = parseTranslationNamespace(req.body?.namespace);
    const key = parseTranslationKey(req.body?.key);
    const value = parseTranslationValue(req.body?.value);

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
    if (handleTranslationParamError(error, res)) {
      return;
    }
    console.error('Error creating/updating translation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bulk', authenticate, requireAdmin, async (req, res) => {
  try {
    const locale = parseTranslationLocale(req.body?.locale);
    const namespace = parseTranslationNamespace(req.body?.namespace);
    const translations = parseTranslationBulkItems(req.body?.translations);

    const operations = translations.map((t) =>
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
    if (handleTranslationParamError(error, res)) {
      return;
    }
    console.error('Error bulk creating/updating translations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
