function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

/** Backend origin without /api (from env). Empty in dev when vite proxy serves /api. */
export function getApiOrigin(): string {
  const origin = import.meta.env.VITE_API_ORIGIN;
  if (origin) {
    return trimTrailingSlash(origin);
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return trimTrailingSlash(apiUrl).replace(/\/api\/?$/, '');
  }

  return '';
}

export function getApiBase(): string {
  const origin = getApiOrigin();
  return origin ? `${origin}/api` : '/api';
}
