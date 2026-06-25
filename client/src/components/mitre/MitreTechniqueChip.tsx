import { getMitreTechniqueUrl, getSkillMatrixTechniqueUrl } from '../../utils/mitreLinks';

interface MitreTechniqueChipProps {
  techniqueId: string;
  title?: string;
  techniqueUrl?: string | null;
  /** Opens MITRE ATT&CK in a new tab and shows an external-link indicator. */
  external?: boolean;
}

function ExternalLinkIcon() {
  return (
    <svg
      className="w-3 h-3 shrink-0 opacity-70"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"
      />
    </svg>
  );
}

export default function MitreTechniqueChip({
  techniqueId,
  title,
  techniqueUrl,
  external = false,
}: Readonly<MitreTechniqueChipProps>) {
  const href = external
    ? getMitreTechniqueUrl(techniqueId, techniqueUrl)
    : getSkillMatrixTechniqueUrl(techniqueId);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-mono px-2 py-1 bg-cyber-panel border border-cyber-border rounded text-cyber-primary hover:border-cyber-primary hover:bg-cyber-primary/10 transition-colors ${
        external ? 'inline-flex items-center gap-1' : ''
      }`}
    >
      {techniqueId}
      {external && <ExternalLinkIcon />}
    </a>
  );
}

export { ExternalLinkIcon };
