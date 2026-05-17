import prisma from '../db/database.js';

interface StixObject {
  type: string;
  id: string;
  name?: string;
  description?: string;
  x_mitre_attack_spec_version?: string;
  x_mitre_deprecated?: boolean;
  x_mitre_platforms?: string[];
  x_mitre_data_sources?: Array<{
    data_source: string;
    data_component?: string;
  }>;
  x_mitre_defense_bypassed?: string[];
  x_mitre_permissions_required?: string[];
  kill_chain_phases?: Array<{
    phase_name: string;
    kill_chain_name: string;
  }>;
  external_references?: Array<{
    source_name: string;
    url?: string;
    external_id?: string;
  }>;
}

interface StixBundle {
  type: string;
  objects: StixObject[];
}

const TACTIC_MAP: Record<string, string> = {
  'reconnaissance': 'Reconnaissance',
  'resource-development': 'Resource Development',
  'initial-access': 'Initial Access',
  'execution': 'Execution',
  'persistence': 'Persistence',
  'privilege-escalation': 'Privilege Escalation',
  'defense-evasion': 'Defense Evasion',
  'credential-access': 'Credential Access',
  'discovery': 'Discovery',
  'lateral-movement': 'Lateral Movement',
  'collection': 'Collection',
  'command-and-control': 'Command and Control',
  'exfiltration': 'Exfiltration',
  'impact': 'Impact',
};

export async function syncMitreTechniques(): Promise<{ synced: number; errors: number }> {
  console.log('🔄 Starting MITRE ATT&CK synchronization...');

  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch MITRE data: ${response.statusText}`);
    }

    const bundle: StixBundle = await response.json();

    if (!bundle.objects || !Array.isArray(bundle.objects)) {
      throw new Error('Invalid MITRE data format');
    }

    const techniques = bundle.objects.filter(
      (obj) => obj.type === 'attack-pattern' && !obj.x_mitre_deprecated
    );

    console.log(`📦 Found ${techniques.length} MITRE techniques`);

    let synced = 0;
    let errors = 0;

    for (const technique of techniques) {
      try {
        const mitreId = extractMitreId(technique);
        if (!mitreId) {
          console.warn(`⚠️  Skipping technique without ID: ${technique.id}`);
          errors++;
          continue;
        }

        const tactic = extractTactic(technique);
        if (!tactic) {
          console.warn(`⚠️  Skipping technique ${mitreId} without tactic`);
          errors++;
          continue;
        }

        const url = findMitreUrl(technique);

        const platforms = technique.x_mitre_platforms || [];
        const dataSources = technique.x_mitre_data_sources?.map(ds => ({
          source: ds.data_source,
          component: ds.data_component || null,
        })) || [];
        const defenseBypassed = technique.x_mitre_defense_bypassed || [];
        const permissionsRequired = technique.x_mitre_permissions_required || [];

        const examples = extractExamples(technique);

        const mitigation = generateMitigationTips(technique, dataSources, defenseBypassed);

        await prisma.mitreTechnique.upsert({
          where: { id: mitreId },
          update: {
            name: technique.name || 'Unknown',
            description: technique.description || null,
            tactic: tactic,
            url: url || null,
            platforms: platforms as any,
            dataSources: dataSources as any,
            defenseBypassed: defenseBypassed as any,
            permissionsRequired: permissionsRequired as any,
            examples: examples as any,
            mitigation: mitigation as any,
          },
          create: {
            id: mitreId,
            name: technique.name || 'Unknown',
            description: technique.description || null,
            tactic: tactic,
            url: url || null,
            platforms: platforms as any,
            dataSources: dataSources as any,
            defenseBypassed: defenseBypassed as any,
            permissionsRequired: permissionsRequired as any,
            examples: examples as any,
            mitigation: mitigation as any,
          },
        });

        synced++;
      } catch (error) {
        console.error(`❌ Error processing technique:`, error);
        errors++;
      }
    }

    console.log(`✅ Synchronization completed: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    console.error('❌ MITRE synchronization failed:', error);
    throw error;
  }
}

function extractMitreId(technique: StixObject): string | null {
  if (technique.external_references) {
    for (const ref of technique.external_references) {
      if (ref.source_name === 'mitre-attack' && ref.external_id) {
        return ref.external_id;
      }
    }
  }
  return null;
}

function extractTactic(technique: StixObject): string | null {
  if (!technique.kill_chain_phases || technique.kill_chain_phases.length === 0) {
    return null;
  }

  const phase = technique.kill_chain_phases[0];
  const tacticKey = phase.phase_name;

  return TACTIC_MAP[tacticKey] || tacticKey;
}

function findMitreUrl(technique: StixObject): string | null {
  if (!technique.external_references) {
    return null;
  }

  for (const ref of technique.external_references) {
    if (ref.source_name === 'mitre-attack' && ref.url) {
      return ref.url;
    }
  }

  return null;
}

function extractExamples(technique: StixObject): string[] {
  const examples: string[] = [];
  
  if (technique.description) {
    const subTechniqueMatches = technique.description.match(/\[([^\]]+)\]\(https:\/\/attack\.mitre\.org\/[^\)]+\)/g);
    if (subTechniqueMatches) {
      subTechniqueMatches.forEach(match => {
        const name = match.match(/\[([^\]]+)\]/)?.[1];
        if (name && !name.startsWith('T')) {
          examples.push(name);
        }
      });
    }
  }

  if (examples.length === 0 && technique.name) {
    examples.push(technique.name);
  }

  return examples;
}

function generateMitigationTips(
  technique: StixObject,
  dataSources: Array<{ source: string; component: string | null }>,
  defenseBypassed: string[]
): string[] {
  const tips: string[] = [];

  if (dataSources.length > 0) {
    dataSources.forEach(ds => {
      if (ds.source === 'Process monitoring') {
        tips.push('Стежте за виконанням процесів і підозрілою активністю');
      } else if (ds.source === 'File monitoring') {
        tips.push('Відстежуйте зміни у файловій системі');
      } else if (ds.source === 'Network traffic') {
        tips.push('Аналізуйте мережевий трафік щодо підозрілих з’єднань');
      } else if (ds.source === 'Command execution') {
        tips.push('Логуйте й аналізуйте команди, що виконуються');
      } else if (ds.source === 'User account') {
        tips.push('Стежте за активністю облікових записів користувачів');
      }
    });
  }

  if (defenseBypassed.length > 0) {
    defenseBypassed.forEach(defense => {
      if (defense === 'Anti-virus') {
        tips.push('Використовуйте сучасні засоби антивірусного захисту з евристичним аналізом');
      } else if (defense === 'Behavioral analysis') {
        tips.push('Запровадьте системи поведінкового аналізу для виявлення аномалій');
      } else if (defense === 'File monitoring') {
        tips.push('Налаштуйте моніторинг критичних файлів і каталогів');
      } else if (defense === 'Process monitoring') {
        tips.push('Відстежуйте створення та виконання процесів');
      }
    });
  }

  if (technique.kill_chain_phases && technique.kill_chain_phases.length > 0) {
    const phase = technique.kill_chain_phases[0].phase_name;
    if (phase === 'initial-access') {
      tips.push('Використовуйте багатофакторну автентифікацію');
      tips.push('Навчайте співробітників розпізнавати фішинг');
    } else if (phase === 'execution') {
      tips.push('Обмежуйте права користувачів');
      tips.push('Застосовуйте whitelisting застосунків');
    } else if (phase === 'collection') {
      tips.push('Шифруйте конфіденційні дані');
      tips.push('Обмежуйте доступ до чутливої інформації');
    }
  }

  if (tips.length === 0) {
    tips.push('Регулярно оновлюйте системи безпеки');
    tips.push('Використовуйте моніторинг і журналювання');
    tips.push('Запровадьте принцип мінімальних привілеїв');
  }

  return tips;
}

