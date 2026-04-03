import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@queue-platform/api/src/auth';
import { getAccountById } from '@queue-platform/api/src/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = getSessionFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  if (session.role === 'SUPER_ADMIN') {
    return res.status(200).json({ user: { id: session.userId, role: 'SUPER_ADMIN', email: 'admin@circlex.jp' } });
  }

  const account = await getAccountById(session.userId);
  if (!account) return res.status(401).json({ error: 'Account not found' });

  return res.status(200).json({
    user: { id: account.id, email: account.email, role: 'STORE_ADMIN', storeName: account.storeName, storeId: account.id },
  });
}
