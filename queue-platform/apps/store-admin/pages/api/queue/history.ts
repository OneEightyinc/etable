import type { NextApiRequest, NextApiResponse } from 'next';
import { getQueueHistory } from '@queue-platform/api/src/db';
import { requireStoreAdminForStore } from '../../../lib/requireStoreAdminForStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const storeId = typeof req.query.storeId === 'string' ? req.query.storeId.trim() : '';
  if (!storeId) {
    return res.status(400).json({ error: 'storeId is required' });
  }
  if (!requireStoreAdminForStore(req, res, storeId)) return;

  try {
    const history = await getQueueHistory(storeId);
    return res.status(200).json({ history });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
