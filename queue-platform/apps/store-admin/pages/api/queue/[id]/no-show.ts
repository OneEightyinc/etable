import type { NextApiRequest, NextApiResponse } from 'next';
import { markNoShowHold, getQueueByStore, getQueueEntryById, broadcastToStore } from '@queue-platform/api/src/server';
import { requireStoreAdminForStore } from '../../../../lib/requireStoreAdminForStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  const entry = await getQueueEntryById(id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  if (!requireStoreAdminForStore(req, res, entry.storeId)) return;

  const { actor } = (req.body ?? {}) as { actor?: { employeeId: string; employeeName: string } };
  try {
    const updated = await markNoShowHold(id, actor);
    const queue = await getQueueByStore(updated.storeId);
    broadcastToStore(updated.storeId, 'queue_update', { type: 'NO_SHOW', entry: updated, queue });
    return res.status(200).json({ entry: updated });
  } catch (e: any) {
    return res.status(404).json({ error: e.message });
  }
}
