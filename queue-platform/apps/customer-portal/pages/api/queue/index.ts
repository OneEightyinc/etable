import type { NextApiRequest, NextApiResponse } from 'next';
import { getQueueByStore, getQueueStats } from '@queue-platform/api/src/server';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const storeId = req.query.storeId as string;
  if (!storeId) return res.status(400).json({ error: 'storeId is required' });

  const queue = getQueueByStore(storeId);
  const stats = getQueueStats(storeId);

  return res.status(200).json({ queue, stats });
}
