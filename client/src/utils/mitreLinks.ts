export function getSkillMatrixTechniqueUrl(techniqueId: string): string {
  const params = new URLSearchParams({ technique: techniqueId });
  return `/skill-matrix?${params.toString()}`;
}

export function tacticSectionId(tactic: string): string {
  return `tactic-${encodeURIComponent(tactic)}`;
}
