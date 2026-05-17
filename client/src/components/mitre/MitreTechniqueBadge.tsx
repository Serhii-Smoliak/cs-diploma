import { useTranslation } from 'react-i18next';
import type { MitreTechniqueInfo } from '../../types/shared';

interface MitreTechniqueBadgeProps {
  technique: MitreTechniqueInfo;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export default function MitreTechniqueBadge({ 
  technique, 
  size = 'md',
  showDescription = false 
}: MitreTechniqueBadgeProps) {
  const { t } = useTranslation(['mitre']);

  const techniqueNameKey = `technique.name.${technique.id}`;
  const translatedName = t(techniqueNameKey, { ns: 'mitre', defaultValue: technique.name });
  const displayName = translatedName !== techniqueNameKey ? translatedName : technique.name;

  const tacticKey = `tactic.${technique.tactic}`;
  const translatedTactic = t(tacticKey, { ns: 'mitre', defaultValue: technique.tactic });
  const displayTactic = translatedTactic !== tacticKey ? translatedTactic : technique.tactic;
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <a
          href={technique.url || `https://attack.mitre.org/techniques/${technique.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${sizeClasses[size]} font-mono font-bold text-cyber-primary bg-cyber-panel border border-cyber-primary rounded-lg hover:cyber-glow transition-all duration-200 inline-flex items-center gap-2`}
        >
          <span>{technique.id}</span>
          <span className="text-xs opacity-70">→</span>
        </a>
        <span className={`${sizeClasses[size]} text-gray-300`}>
          {displayName}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded bg-cyber-panel border border-cyber-border text-gray-400`}>
          {displayTactic}
        </span>
      </div>
      {showDescription && technique.description && (
        <p className="text-xs text-gray-400 max-w-md line-clamp-2">
          {technique.description}
        </p>
      )}
    </div>
  );
}

