import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  mitreTechnique: {
    upsert: vi.fn(),
  },
}));

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('../db/database.js', () => ({ default: prismaMock }));

import { syncMitreTechniques } from './mitreSyncService.js';

function createTechnique(overrides: Record<string, unknown> = {}) {
  return {
    type: 'attack-pattern',
    id: 'attack-pattern--1',
    name: 'Phishing for Information',
    description: 'See [Example technique](https://attack.mitre.org/techniques/T1598/)',
    x_mitre_platforms: ['Windows'],
    x_mitre_data_sources: [{ data_source: 'Process monitoring' }],
    x_mitre_defense_bypassed: ['Anti-virus'],
    x_mitre_permissions_required: ['User'],
    kill_chain_phases: [{ phase_name: 'reconnaissance', kill_chain_name: 'mitre-attack' }],
    external_references: [
      {
        source_name: 'mitre-attack',
        external_id: 'T1598',
        url: 'https://attack.mitre.org/techniques/T1598/',
      },
    ],
    ...overrides,
  };
}

function createBundle(objects: unknown[]) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({ type: 'bundle', objects }),
  };
}

describe('syncMitreTechniques', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    prismaMock.mitreTechnique.upsert.mockResolvedValue({});
  });

  it('syncs valid MITRE techniques from STIX bundle', async () => {
    fetchMock.mockResolvedValue(createBundle([createTechnique()]));

    const result = await syncMitreTechniques();

    expect(result).toEqual({ synced: 1, errors: 0 });
    expect(prismaMock.mitreTechnique.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'T1598' },
        create: expect.objectContaining({
          id: 'T1598',
          tactic: 'Reconnaissance',
          url: 'https://attack.mitre.org/techniques/T1598/',
        }),
      })
    );
  });

  it('throws when MITRE fetch fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, statusText: 'Not Found' });

    await expect(syncMitreTechniques()).rejects.toThrow('Failed to fetch MITRE data');
  });

  it('throws when STIX bundle is invalid', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ type: 'bundle' }),
    });

    await expect(syncMitreTechniques()).rejects.toThrow('Invalid MITRE data format');
  });

  it('skips deprecated techniques and techniques without id or tactic', async () => {
    fetchMock.mockResolvedValue(
      createBundle([
        { type: 'attack-pattern', x_mitre_deprecated: true },
        { type: 'attack-pattern', external_references: [] },
        {
          type: 'attack-pattern',
          external_references: [{ source_name: 'mitre-attack', external_id: 'T0001' }],
          kill_chain_phases: [],
        },
        createTechnique({
          kill_chain_phases: [{ phase_name: 'custom-phase', kill_chain_name: 'mitre-attack' }],
          external_references: [{ source_name: 'mitre-attack', external_id: 'T0002' }],
        }),
      ])
    );

    const result = await syncMitreTechniques();

    expect(result).toEqual({ synced: 1, errors: 2 });
  });

  it('counts upsert failures as errors', async () => {
    fetchMock.mockResolvedValue(createBundle([createTechnique(), createTechnique()]));
    prismaMock.mitreTechnique.upsert
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('db down'));

    const result = await syncMitreTechniques();

    expect(result).toEqual({ synced: 1, errors: 1 });
  });

  it('generates mitigation tips for multiple data sources and kill chain phases', async () => {
    fetchMock.mockResolvedValue(
      createBundle([
        createTechnique({
          external_references: [{ source_name: 'mitre-attack', external_id: 'T1204' }],
          kill_chain_phases: [{ phase_name: 'execution', kill_chain_name: 'mitre-attack' }],
          x_mitre_data_sources: [
            { data_source: 'File monitoring' },
            { data_source: 'Network traffic' },
            { data_source: 'Command execution' },
            { data_source: 'User account' },
          ],
          x_mitre_defense_bypassed: [
            'Behavioral analysis',
            'File monitoring',
            'Process monitoring',
          ],
        }),
        createTechnique({
          name: 'Collection Example',
          description: 'Plain description',
          external_references: [{ source_name: 'mitre-attack', external_id: 'T1119' }],
          kill_chain_phases: [{ phase_name: 'collection', kill_chain_name: 'mitre-attack' }],
          x_mitre_data_sources: [],
          x_mitre_defense_bypassed: [],
        }),
        createTechnique({
          name: 'Initial Access Example',
          external_references: [{ source_name: 'mitre-attack', external_id: 'T1566' }],
          kill_chain_phases: [{ phase_name: 'initial-access', kill_chain_name: 'mitre-attack' }],
          x_mitre_data_sources: [],
          x_mitre_defense_bypassed: [],
        }),
      ])
    );

    const result = await syncMitreTechniques();

    expect(result.synced).toBe(3);
    const mitigations = prismaMock.mitreTechnique.upsert.mock.calls.map(
      ([args]) => args.create.mitigation as string[]
    );
    expect(mitigations[0]).toEqual(
      expect.arrayContaining([
        'Обмежуйте права користувачів',
        'Застосовуйте whitelisting застосунків',
      ])
    );
    expect(mitigations[1]).toEqual(expect.arrayContaining(['Шифруйте конфіденційні дані']));
    expect(mitigations[2]).toEqual(
      expect.arrayContaining(['Використовуйте багатофакторну автентифікацію'])
    );
  });

  it('extracts examples from description with MITRE links and filters technique IDs', async () => {
    fetchMock.mockResolvedValue(
      createBundle([
        createTechnique({
          external_references: [{ source_name: 'mitre-attack', external_id: 'T1598' }],
          description:
            'Attackers can use [search engines](https://attack.mitre.org/techniques/T1593/001/) or [social media](https://attack.mitre.org/techniques/T1593/002/). Also see [T1234](https://attack.mitre.org/techniques/T1234/) and [unclosed bracket text',
        }),
      ])
    );

    const result = await syncMitreTechniques();

    expect(result.synced).toBe(1);
    const examples = prismaMock.mitreTechnique.upsert.mock.calls[0]?.[0]?.create
      ?.examples as string[];
    expect(examples).toContain('search engines');
    expect(examples).toContain('social media');
    expect(examples).not.toContain('T1234');
    expect(examples).not.toContain('unclosed bracket text');
  });
});
