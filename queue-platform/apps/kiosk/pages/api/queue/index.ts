import type { NextApiRequest, NextApiResponse } from 'next';
import { addToQueue, getQueueByStore, getQueueStats, broadcastToStore } from '@queue-platform/api/src/server';

function parseJsonBody(req: NextApiRequest): Record<string, unknown> {
  const b = req.body;
  if (b == null) return {};
  if (typeof b === 'string') {
    try {
      return JSON.parse(b) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof b === 'object' && !Array.isArray(b)) return b as Record<string, unknown>;
  return {};
}

const SEAT_TYPES = new Set(['TABLE', 'COUNTER', 'EITHER']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const storeId = req.query.storeId as string;
    if (!storeId) return res.status(400).json({ error: 'storeId is required' });
    try {
      const stats = await getQueueStats(storeId);
      return res.status(200).json({ stats });
    } catch (e) {
      console.error('[kiosk/api/queue GET]', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = parseJsonBody(req);
      const storeId = typeof body.storeId === 'string' ? body.storeId : '';
      const adultsRaw = body.adults;
      const childrenRaw = body.children;
      const seatType = body.seatType;
      const phone = typeof body.phone === 'string' ? body.phone : undefined;

      if (!storeId) return res.status(400).json({ error: 'storeId is required' });
      if (adultsRaw === undefined || adultsRaw === null) {
        return res.status(400).json({ error: 'adults is required' });
      }
      const adults = Number(adultsRaw);
      if (!Number.isFinite(adults) || adults < 0) {
        return res.status(400).json({ error: 'adults must be a non-negative number' });
      }
      if (typeof seatType !== 'string' || !SEAT_TYPES.has(seatType)) {
        return res.status(400).json({ error: 'seatType must be TABLE, COUNTER, or EITHER' });
      }

      const entry = await addToQueue({
        storeId,
        adults,
        children: Number(childrenRaw ?? 0) || 0,
        seatType: seatType as 'TABLE' | 'COUNTER' | 'EITHER',
        phone,
      });

      const queue = await getQueueByStore(storeId);
      broadcastToStore(storeId, 'queue_update', { type: 'NEW_ENTRY', entry, queue });

      const stats = await getQueueStats(storeId);
      return res.status(201).json({ entry, stats });
    } catch (e) {
      console.error('[kiosk/api/queue POST]', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
