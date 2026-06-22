import { getSkillMatrixTechniqueUrl } from '../../utils/mitreLinks';

interface MitreTechniqueChipProps {
  techniqueId: string;
  title?: string;
}

export default function MitreTechniqueChip({ techniqueId, title }: MitreTechniqueChipProps) {
  return (
    <a
      href={getSkillMatrixTechniqueUrl(techniqueId)}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      onClick={(e) => e.stopPropagation()}
      className="text-xs font-mono px-2 py-1 bg-cyber-panel border border-cyber-border rounded text-cyber-primary hover:border-cyber-primary hover:bg-cyber-primary/10 transition-colors"
    >
      {techniqueId}
    </a>
  );
}
