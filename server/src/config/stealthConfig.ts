export interface StealthConfig {
  regenIntervalSeconds: number;
  regenIntervalMs: number;
  regenAmount: number;
  max: number;
  maskingRestore: number;
  failPenalty: number;
}

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getStealthConfig(): StealthConfig {
  const regenIntervalSeconds = Math.max(1, parseEnvInt('STEALTH_REGEN_INTERVAL_SECONDS', 3600));
  const regenAmount = Math.max(1, parseEnvInt('STEALTH_REGEN_AMOUNT', 10));

  return {
    regenIntervalSeconds,
    regenIntervalMs: regenIntervalSeconds * 1000,
    regenAmount,
    max: parseEnvInt('STEALTH_MAX', 100),
    maskingRestore: parseEnvInt('STEALTH_MASKING_RESTORE', 50),
    failPenalty: parseEnvInt('STEALTH_FAIL_PENALTY', 5),
  };
}
