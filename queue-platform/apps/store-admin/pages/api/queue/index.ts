import type { NextApiRequest, NextApiResponse } from 'next';
import { getQueueByStore, addToQueue, broadcastToStore } from '@queue-platform/api/src/server';
import { requireStoreAdminForStore } from '../../../lib/requireStoreAdminForStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const storeId = req.query.storeId as string;

  if (req.method === 'GET') {
    if (!storeId) return res.status(400).json({ error: 'storeId is required' });
    if (!requireStoreAdminForStore(req, res, storeId)) return;
    const queue = await getQueueByStore(storeId);
    return res.status(200).json({ queue });
  }

  if (req.method === 'POST') {
    const { storeId: bodyStoreId, adults, children, seatType } = req.body;
    const resolvedStoreId = bodyStoreId || storeId;
    if (!resolvedStoreId) return res.status(400).json({ error: 'storeId is required' });
    if (!requireStoreAdminForStore(req, res, resolvedStoreId)) return;
    if (adults === undefined || !seatType) return res.status(400).json({ error: 'adults and seatType are required' });

    const entry = await addToQueue({
      storeId: resolvedStoreId,
      adults: Number(adults),
      children: Number(children || 0),
      seatType,
    });
    const queue = await getQueueByStore(resolvedStoreId);
    broadcastToStore(resolvedStoreId, 'queue_update', { type: 'NEW_ENTRY', entry, queue });
    return res.status(201).json({ entry });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
