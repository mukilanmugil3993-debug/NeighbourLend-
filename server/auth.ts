import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, dbManager } from './db.js';

export interface AuthUser {
  memberId: string;
  fullName: string;
  email: string;
  role: 'member' | 'admin';
  verificationStatus: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

export function generateToken(): string {
  return 'nl_tok_' + crypto.randomBytes(32).toString('hex');
}

export function createSession(memberId: string): string {
  const token = generateToken();
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  db.sessions[token] = { memberId, expiresAt };
  dbManager.save();
  return token;
}

export function removeSession(token: string): void {
  delete db.sessions[token];
  dbManager.save();
}

export function resolveUserFromToken(token?: string): AuthUser | null {
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    delete db.sessions[token];
    dbManager.save();
    return null;
  }
  const member = db.members.find(m => m.memberId === session.memberId);
  if (!member) return null;

  return {
    memberId: member.memberId,
    fullName: member.fullName,
    email: member.email,
    role: member.role,
    verificationStatus: member.verificationStatus
  };
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']);
  }

  if (token) {
    req.token = token;
    const user = resolveUserFromToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Administrative privileges required.' });
    return;
  }
  next();
}
