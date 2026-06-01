import type { NextFunction, Request, Response } from 'express';

export function apiNotFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

function isJsonSyntaxError(err: unknown): boolean {
  return err instanceof SyntaxError && 'body' in err;
}

export function apiErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (res.headersSent) {
    return;
  }

  if (isJsonSyntaxError(err)) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  console.error('Unhandled API error:', {
    method: req.method,
    path: req.path,
    error: err,
  });

  res.status(500).json({ error: 'Internal server error' });
}
