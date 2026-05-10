import type { NextApiRequest, NextApiResponse } from 'next';
import { userPostponeQueueEntry, getQueueByStore, getQueueEntryById, getStoreSettings, broadcastToStore } from '@queue-platform/api/src/server';
import { requireStoreAdminForStore } from '../../../../lib/requireStoreAdminForStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  const entry = await getQueueEntryById(id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  if (!requireStoreAdminForStore(req, res, entry.storeId)) return;

  const { slots, actor } = req.body as { slots?: number; actor?: { employeeId: string; employeeName: string } };
  try {
    let resolvedSlots: number;
    if (typeof slots === 'number' && slots > 0) {
      resolvedSlots = Math.min(5, Math.max(2, Math.round(slots)));
    } else {
      const settings = await getStoreSettings(entry.storeId);
      resolvedSlots = settings.defaultPostponeSlots;
    }
    const updated = await userPostponeQueueEntry(id, resolvedSlots, actor);
    const queue = await getQueueByStore(updated.storeId);
    broadcastToStore(updated.storeId, 'queue_update', { type: 'POSTPONE', entry: updated, queue });
    return res.status(200).json({ entry: updated });
  } catch (e: any) {
    return res.status(404).json({ error: e.message });
  }
}
