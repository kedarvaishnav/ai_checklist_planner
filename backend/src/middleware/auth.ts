// src/middleware/auth.ts
// Protects routes by verifying the JWT sent in the Authorization header.
//
// Usage: router.get('/protected', requireAuth, handler)
//
// The middleware attaches `req.userId` (number) so route handlers
// know which user is making the request.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express's Request type to include our custom fields
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

interface JwtPayload {
  userId: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET env variable is not set');

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
