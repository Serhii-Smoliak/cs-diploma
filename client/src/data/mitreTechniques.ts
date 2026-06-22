export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
}

export interface MitreTactic {
  id: string;
  name: string;
  description: string;
  techniques: MitreTechnique[];
}

export const MITRE_TECHNIQUES: Record<string, MitreTechnique> = {
  T1593: {
    id: 'T1593',
    name: 'Search Open Websites/Domains',
    tactic: 'Reconnaissance',
    description:
      'Adversaries may search publicly available information sources that can be used during targeting.',
  },
  'T1583.001': {
    id: 'T1583.001',
    name: 'Acquire Infrastructure: Domains',
    tactic: 'Resource Development',
    description: 'Adversaries may buy domains that can be used during targeting.',
  },
  'T1566.001': {
    id: 'T1566.001',
    name: 'Phishing: Spearphishing Attachment',
    tactic: 'Initial Access',
    description:
      'Adversaries may send spearphishing emails with a malicious attachment in an attempt to gain access to victim systems.',
  },
  'T1059.001': {
    id: 'T1059.001',
    name: 'Command and Scripting Interpreter: PowerShell',
    tactic: 'Execution',
    description: 'Adversaries may abuse PowerShell commands and scripts for execution.',
  },
  'T1547.001': {
    id: 'T1547.001',
    name: 'Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder',
    tactic: 'Persistence',
    description:
      'Adversaries may achieve persistence by adding a program to a startup folder or referencing it with a Registry run key.',
  },
};

export const MITRE_TACTICS: MitreTactic[] = [
  {
    id: 'reconnaissance',
    name: 'Reconnaissance',
    description:
      'The adversary is trying to gather information they can use to plan future operations.',
    techniques: [MITRE_TECHNIQUES['T1593']],
  },
  {
    id: 'resource-development',
    name: 'Resource Development',
    description:
      'The adversary is trying to establish resources they can use to support operations.',
    techniques: [MITRE_TECHNIQUES['T1583.001']],
  },
  {
    id: 'initial-access',
    name: 'Initial Access',
    description: 'The adversary is trying to get into your network.',
    techniques: [MITRE_TECHNIQUES['T1566.001']],
  },
  {
    id: 'execution',
    name: 'Execution',
    description: 'The adversary is trying to run malicious code.',
    techniques: [MITRE_TECHNIQUES['T1059.001']],
  },
  {
    id: 'persistence',
    name: 'Persistence',
    description: 'The adversary is trying to maintain their foothold.',
    techniques: [MITRE_TECHNIQUES['T1547.001']],
  },
];

export const getAllTechniques = (): MitreTechnique[] => {
  return MITRE_TACTICS.flatMap((tactic) => tactic.techniques);
};
