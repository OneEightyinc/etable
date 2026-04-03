import type { NextApiRequest, NextApiResponse } from 'next';
import { addToQueue, getQueueByStore, getQueueStats, broadcastToStore } from '@queue-platform/api/src/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const storeId = req.query.storeId as string;
    if (!storeId) return res.status(400).json({ error: 'storeId is required' });
    const stats = await getQueueStats(storeId);
    return res.status(200).json({ stats });
  }

  if (req.method === 'POST') {
    const { storeId, adults, children, seatType, phone } = req.body;
    if (!storeId) return res.status(400).json({ error: 'storeId is required' });
    if (adults === undefined || !seatType) return res.status(400).json({ error: 'adults and seatType are required' });

    const entry = await addToQueue({
      storeId,
      adults: Number(adults),
      children: Number(children || 0),
      seatType,
      phone,
    });

    const queue = await getQueueByStore(storeId);
    broadcastToStore(storeId, 'queue_update', { type: 'NEW_ENTRY', entry, queue });

    const stats = await getQueueStats(storeId);
    return res.status(201).json({ entry, stats });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
