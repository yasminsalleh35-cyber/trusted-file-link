import type { Request, Response, NextFunction } from 'express';

// Very simple header-based admin auth middleware.
// In production, replace with a proper session/JWT validation.
const ADMIN_HEADER = 'x-admin-secret';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!ADMIN_SECRET) {
    // If no secret configured, allow only for local development.
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
      return next();
    }
    return res.status(500).json({ error: 'Server admin secret not configured' });
  }

  const provided = req.header(ADMIN_HEADER);
  if (!provided || provided !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}