/**
 * Authentication middleware helpers for API routes
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { findSession, type Session } from './db';

const SESSION_COOKIE = 'circlx_session';

export function getSessionFromRequest(req: NextApiRequest): Session | undefined {
  // Check cookie first
  const cookies = req.headers.cookie
    ?.split(';')
    .reduce((acc, c) => {
      const [key, ...val] = c.trim().split('=');
      acc[key] = val.join('=');
      return acc;
    }, {} as Record<string, string>);

  const sessionId = cookies?.[SESSION_COOKIE] || (req.headers.authorization?.replace('Bearer ', ''));
  if (!sessionId) return undefined;

  return findSession(sessionId);
}

export function setSessionCookie(res: NextApiResponse, sessionId: string): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`
  );
}

export function clearSessionCookie(res: NextApiResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
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
