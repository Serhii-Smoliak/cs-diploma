type SessionExpiredHandler = () => void;

const handlers: SessionExpiredHandler[] = [];
let sessionExpiredHandled = false;

export function registerSessionExpiredHandler(handler: SessionExpiredHandler): void {
  handlers.push(handler);
}

export function resetSessionExpiredGuard(): void {
  sessionExpiredHandled = false;
}

export function handleSessionExpired(): void {
  if (sessionExpiredHandled) {
    return;
  }

  sessionExpiredHandled = true;

  for (const handler of handlers) {
    handler();
  }

  globalThis.location.assign('/login');
}
