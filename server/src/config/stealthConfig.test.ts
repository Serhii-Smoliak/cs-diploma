import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('getStealthConfig', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns defaults when env is empty', async () => {
    vi.stubEnv('STEALTH_REGEN_INTERVAL_SECONDS', '');
    vi.stubEnv('STEALTH_REGEN_AMOUNT', '');
    vi.stubEnv('STEALTH_MAX', '');
    vi.stubEnv('STEALTH_MASKING_RESTORE', '');
    vi.resetModules();

    const { getStealthConfig } = await import('./stealthConfig');
    const config = getStealthConfig();

    expect(config.max).toBe(100);
    expect(config.maskingRestore).toBe(50);
    expect(config.regenIntervalSeconds).toBe(3600);
    expect(config.regenIntervalMs).toBe(3600 * 1000);
    expect(config.regenAmount).toBe(10);
  });

  it('reads values from environment variables', async () => {
    vi.stubEnv('STEALTH_REGEN_INTERVAL_SECONDS', '120');
    vi.stubEnv('STEALTH_REGEN_AMOUNT', '5');
    vi.stubEnv('STEALTH_MAX', '80');
    vi.stubEnv('STEALTH_MASKING_RESTORE', '40');
    vi.resetModules();

    const { getStealthConfig } = await import('./stealthConfig');
    const config = getStealthConfig();

    expect(config.regenIntervalSeconds).toBe(120);
    expect(config.regenIntervalMs).toBe(120_000);
    expect(config.regenAmount).toBe(5);
    expect(config.max).toBe(80);
    expect(config.maskingRestore).toBe(40);
  });
});
