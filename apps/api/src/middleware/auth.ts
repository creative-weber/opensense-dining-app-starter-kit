import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';

export interface AuthPayload {
  adminId: string;
  restaurantId: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Accept token from Authorization header OR ?token= query param (needed for EventSource / SSE)
  const header = req.headers.authorization;
  const rawToken = header?.startsWith('Bearer ')
    ? header.slice(7)
    : (req.query.token as string | undefined);

  if (!rawToken) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  try {
    const decoded = jwt.verify(rawToken, JWT_SECRET) as AuthPayload;
    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}
