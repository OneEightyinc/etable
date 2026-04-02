/**
 * Authentication middleware helpers for API routes.
 * Uses signed cookie tokens (HMAC) instead of server-side sessions.
 * Works on stateless platforms like Vercel serverless.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const SESSION_COOKIE = 'circlx_session';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'circlx-default-secret-key-change-in-production';
const TOKEN_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

// ─── Token helpers ─────────────────────────────────────
interface TokenPayload {
  userId: string;
  role: 'SUPER_ADMIN' | 'STORE_ADMIN';
  storeId?: string;
  exp: number; // expiry timestamp in seconds
}

function signToken(payload: TokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(token: string): TokenPayload | null {
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;

  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('base64url');

  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

// ─── Session-compatible interface ─────────────────────
export interface Session {
  id: string;
  userId: string;
  role: 'SUPER_ADMIN' | 'STORE_ADMIN';
  storeId?: string;
  expiresAt: string;
  createdAt: string;
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getSessionFromRequest(req: NextApiRequest): Session | undefined {
  const cookies = req.headers.cookie
    ?.split(';')
    .reduce((acc, c) => {
      const [key, ...val] = c.trim().split('=');
      acc[key] = val.join('=');
      return acc;
    }, {} as Record<string, string>);

  const raw = cookies?.[SESSION_COOKIE] || req.headers.authorization?.replace('Bearer ', '');
  if (!raw) return undefined;
  const token = decodeCookieValue(raw);

  const payload = verifyToken(token);
  if (!payload) return undefined;

  // Return a Session-compatible object
  return {
    id: token,
    userId: payload.userId,
    role: payload.role,
    storeId: payload.storeId,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function createSessionToken(userId: string, role: 'SUPER_ADMIN' | 'STORE_ADMIN', storeId?: string): string {
  const payload: TokenPayload = {
    userId,
    role,
    storeId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE,
  };
  return signToken(payload);
}

function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

export function setSessionCookie(res: NextApiResponse, token: string): void {
  const secure = isProductionDeployment() ? '; Secure' : '';
  const value = encodeURIComponent(token);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_MAX_AGE}${secure}`
  );
}

export function clearSessionCookie(res: NextApiResponse): void {
  const secure = isProductionDeployment() ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  );
}

export function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles?: ('SUPER_ADMIN' | 'STORE_ADMIN')[]
): Session | null {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return session;
}
