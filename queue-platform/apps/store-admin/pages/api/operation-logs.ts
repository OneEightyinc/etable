import type { NextApiRequest, NextApiResponse } from 'next';
import { listOperationLogs } from '@queue-platform/api/src/server';
import { requireStoreAdminForStore } from '../../lib/requireStoreAdminForStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { storeId, limit } = req.query;
  if (typeof storeId !== 'string') return res.status(400).json({ error: 'storeId が必要です' });
  if (!requireStoreAdminForStore(req, res, storeId)) return;

  const lim = typeof limit === 'string' ? parseInt(limit, 10) : 200;
  const logs = await listOperationLogs(storeId, Number.isFinite(lim) ? lim : 200);
  return res.status(200).json({ logs });
}
