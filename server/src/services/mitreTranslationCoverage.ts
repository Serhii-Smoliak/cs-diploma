import prisma from '../db/database.js';

const MITRE_NAMESPACE = 'mitre';
const LOCALES = ['uk', 'en'] as const;

export type MitreTranslationStatus = 'full' | 'partial' | 'none';

export interface LocaleMitreCoverage {
  full: number;
  partial: number;
  none: number;
}

export interface MitreTranslationCoverage {
  totalTechniques: number;
  uk: LocaleMitreCoverage;
  en: LocaleMitreCoverage;
}

interface TechniqueRecord {
  id: string;
  tactic: string;
  name: string;
  description: string | null;
}

function normalizeTactic(tactic: string): string {
  return tactic.toLowerCase().replace(/\s+/g, '-');
}

function hasTacticTemplate(keys: Set<string>, tactic: string): boolean {
  const normalized = normalizeTactic(tactic);
  return (
    keys.has(`tactic.explanation.${tactic}`) ||
    keys.has(`killChain.goal.${normalized}`) ||
    keys.has(`killChain.description.${normalized}`)
  );
}

function emptyCoverage(): LocaleMitreCoverage {
  return { full: 0, partial: 0, none: 0 };
}

function incrementCoverage(coverage: LocaleMitreCoverage, status: MitreTranslationStatus): void {
  coverage[status] += 1;
}

/**
 * Mirrors MitreTechniqueModal: full = dedicated name + description keys;
 * partial = tactic-based modal content (goal/result/mitigation templates);
 * none = no localized content path for the user.
 */
function classifyUk(technique: TechniqueRecord, keys: Set<string>): MitreTranslationStatus {
  const hasName = keys.has(`technique.name.${technique.id}`);
  const hasDescription = keys.has(`technique.description.${technique.id}`);

  if (hasName && hasDescription) {
    return 'full';
  }

  if (hasTacticTemplate(keys, technique.tactic)) {
    return 'partial';
  }

  return 'none';
}

function classifyEn(technique: TechniqueRecord, keys: Set<string>): MitreTranslationStatus {
  const hasNameKey = keys.has(`technique.name.${technique.id}`);
  const hasDescriptionKey = keys.has(`technique.description.${technique.id}`);

  if (hasNameKey && hasDescriptionKey) {
    return 'full';
  }

  const hasDbName = Boolean(technique.name.trim());
  const hasDbDescription = Boolean(technique.description?.trim());
  const hasTactic = hasTacticTemplate(keys, technique.tactic);

  if (hasDbName && (hasDbDescription || hasTactic)) {
    return 'full';
  }

  if (hasNameKey || hasDescriptionKey || hasTactic || hasDbName) {
    return 'partial';
  }

  return 'none';
}

export async function getMitreTranslationCoverage(): Promise<MitreTranslationCoverage> {
  const techniques = await prisma.mitreTechnique.findMany({
    select: {
      id: true,
      tactic: true,
      name: true,
      description: true,
    },
    orderBy: { id: 'asc' },
  });

  const translations = await prisma.translation.findMany({
    where: {
      namespace: MITRE_NAMESPACE,
      locale: { in: [...LOCALES] },
    },
    select: { key: true, locale: true },
  });

  const keysByLocale: Record<(typeof LOCALES)[number], Set<string>> = {
    uk: new Set(),
    en: new Set(),
  };

  for (const entry of translations) {
    if (entry.locale === 'uk' || entry.locale === 'en') {
      keysByLocale[entry.locale].add(entry.key);
    }
  }

  const uk = emptyCoverage();
  const en = emptyCoverage();

  for (const technique of techniques) {
    incrementCoverage(uk, classifyUk(technique, keysByLocale.uk));
    incrementCoverage(en, classifyEn(technique, keysByLocale.en));
  }

  return {
    totalTechniques: techniques.length,
    uk,
    en,
  };
}
