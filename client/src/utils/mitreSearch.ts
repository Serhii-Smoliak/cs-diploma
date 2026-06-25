import type { MitreTechnique } from '../services/api';

const MITRE_ID_PATTERN = /^t?(\d+(?:\.\d+)*)$/;

function normalizeMitreIdQuery(query: string): string | null {
  const trimmed = query.trim().toLowerCase();
  const match = MITRE_ID_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }
  return `t${match[1]}`;
}

export function matchesMitreTechniqueSearch(tech: MitreTechnique, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) {
    return true;
  }

  const mitreIdQuery = normalizeMitreIdQuery(trimmed);
  if (mitreIdQuery) {
    const id = tech.id.toLowerCase();
    return id === mitreIdQuery || id.startsWith(`${mitreIdQuery}.`);
  }

  const q = trimmed.toLowerCase();
  return (
    tech.id.toLowerCase().includes(q) ||
    tech.name.toLowerCase().includes(q) ||
    tech.description?.toLowerCase().includes(q) ||
    tech.tactic.toLowerCase().includes(q)
  );
}
