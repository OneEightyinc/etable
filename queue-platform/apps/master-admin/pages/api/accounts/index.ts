import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, getAllAccounts, createAccount } from '@queue-platform/api/src/server';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAuth(req, res, ['SUPER_ADMIN']);
  if (!session) return;

  if (req.method === 'GET') {
    const accounts = getAllAccounts().map((a) => ({
      id: a.id, name: a.name, email: a.email, storeName: a.storeName, status: a.status, createdAt: a.createdAt,
    }));
    return res.status(200).json({ accounts });
  }

  if (req.method === 'POST') {
    const { id, name, email, password, storeName, status } = req.body;
    if (!id || !email || !password || !storeName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const account = createAccount({ id, name: name || storeName, email, password, storeName, status: status || 'ACTIVE' });
      return res.status(201).json({ account: { id: account.id, name: account.name, email: account.email, storeName: account.storeName, status: account.status, createdAt: account.createdAt } });
    } catch (err: any) {
      return res.status(409).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
