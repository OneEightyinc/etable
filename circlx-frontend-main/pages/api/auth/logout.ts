import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteSession } from '../../../lib/db';
import { getSessionFromRequest, clearSessionCookie } from '../../../lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = getSessionFromRequest(req);
  if (session) {
    deleteSession(session.id);
  }

  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
