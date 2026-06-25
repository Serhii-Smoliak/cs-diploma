export function getSkillMatrixTechniqueUrl(techniqueId: string): string {
  const params = new URLSearchParams({ technique: techniqueId });
  return `/skill-matrix?${params.toString()}`;
}

export function getSkillMatrixTacticUrl(tactic: string): string {
  return `/skill-matrix#${tacticSectionId(tactic)}`;
}

export function tacticSectionId(tactic: string): string {
  return `tactic-${encodeURIComponent(tactic)}`;
}

const MITRE_TACTIC_URLS: Record<string, string> = {
  Reconnaissance: 'https://attack.mitre.org/tactics/TA0043/',
  'Resource Development': 'https://attack.mitre.org/tactics/TA0042/',
  'Initial Access': 'https://attack.mitre.org/tactics/TA0001/',
  Execution: 'https://attack.mitre.org/tactics/TA0002/',
  Persistence: 'https://attack.mitre.org/tactics/TA0003/',
  'Privilege Escalation': 'https://attack.mitre.org/tactics/TA0004/',
  'Defense Evasion': 'https://attack.mitre.org/tactics/TA0005/',
  'Credential Access': 'https://attack.mitre.org/tactics/TA0006/',
  Discovery: 'https://attack.mitre.org/tactics/TA0007/',
  'Lateral Movement': 'https://attack.mitre.org/tactics/TA0008/',
  Collection: 'https://attack.mitre.org/tactics/TA0009/',
  Exfiltration: 'https://attack.mitre.org/tactics/TA0010/',
  'Command and Control': 'https://attack.mitre.org/tactics/TA0011/',
  Impact: 'https://attack.mitre.org/tactics/TA0040/',
  reconnaissance: 'https://attack.mitre.org/tactics/TA0043/',
  'resource-development': 'https://attack.mitre.org/tactics/TA0042/',
  'initial-access': 'https://attack.mitre.org/tactics/TA0001/',
  execution: 'https://attack.mitre.org/tactics/TA0002/',
  persistence: 'https://attack.mitre.org/tactics/TA0003/',
  'privilege-escalation': 'https://attack.mitre.org/tactics/TA0004/',
  'defense-evasion': 'https://attack.mitre.org/tactics/TA0005/',
  'credential-access': 'https://attack.mitre.org/tactics/TA0006/',
  discovery: 'https://attack.mitre.org/tactics/TA0007/',
  'lateral-movement': 'https://attack.mitre.org/tactics/TA0008/',
  collection: 'https://attack.mitre.org/tactics/TA0009/',
  exfiltration: 'https://attack.mitre.org/tactics/TA0010/',
  'command-and-control': 'https://attack.mitre.org/tactics/TA0011/',
  impact: 'https://attack.mitre.org/tactics/TA0040/',
};

export function getMitreTechniqueUrl(techniqueId: string, fallbackUrl?: string | null): string {
  if (fallbackUrl) {
    return fallbackUrl;
  }

  const dotIndex = techniqueId.indexOf('.');
  if (dotIndex !== -1) {
    const baseId = techniqueId.slice(0, dotIndex);
    const subId = techniqueId.slice(dotIndex + 1);
    return `https://attack.mitre.org/techniques/${baseId}/${subId}/`;
  }

  return `https://attack.mitre.org/techniques/${techniqueId}/`;
}

export function getMitreTacticUrl(tactic: string): string {
  return (
    MITRE_TACTIC_URLS[tactic] ??
    MITRE_TACTIC_URLS[tactic.toLowerCase()] ??
    MITRE_TACTIC_URLS[tactic.replace(/\s+/g, '-').toLowerCase()] ??
    'https://attack.mitre.org/tactics/enterprise/'
  );
}
