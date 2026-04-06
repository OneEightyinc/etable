import type { NextApiRequest, NextApiResponse } from 'next';
import { updateQueueStatus, removeFromQueue, getQueueEntryById, getQueueByStore, broadcastToStore } from '@queue-platform/api/src/server';
import { requireStoreAdminForStore } from '../../../lib/requireStoreAdminForStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  if (req.method === 'GET') {
    const entry = await getQueueEntryById(id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    if (!requireStoreAdminForStore(req, res, entry.storeId)) return;
    return res.status(200).json({ entry });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { status } = req.body;
    if (!status || !['WAITING', 'CALLED', 'HOLD', 'DONE', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const existing = await getQueueEntryById(id);
    if (!existing) return res.status(404).json({ error: 'Entry not found' });
    if (!requireStoreAdminForStore(req, res, existing.storeId)) return;
    try {
      const entry = await updateQueueStatus(id, status);
      const queue = await getQueueByStore(entry.storeId);
      broadcastToStore(entry.storeId, 'queue_update', { type: 'STATUS_CHANGE', entry, queue });
      return res.status(200).json({ entry });
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const entry = await getQueueEntryById(id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    if (!requireStoreAdminForStore(req, res, entry.storeId)) return;
    await removeFromQueue(id);
    const queue = await getQueueByStore(entry.storeId);
    broadcastToStore(entry.storeId, 'queue_update', { type: 'REMOVED', entryId: id, queue });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
