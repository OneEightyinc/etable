import type { NextApiRequest, NextApiResponse } from 'next';
import { updateQueueStatus, updateQueueDetails, removeFromQueue, getQueueEntryById, getQueueByStore, broadcastToStore, addPoints, getStoreSettings, POINT_RULES } from '@queue-platform/api/src/server';
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
    const { status, adults, children, seatType } = req.body;
    const existing = await getQueueEntryById(id);
    if (!existing) return res.status(404).json({ error: 'Entry not found' });
    if (!requireStoreAdminForStore(req, res, existing.storeId)) return;
    try {
      // 人数・席種変更
      if (adults !== undefined || children !== undefined || seatType !== undefined) {
        const updated = await updateQueueDetails(id, { adults, children, seatType });
        if (!status) {
          const queue = await getQueueByStore(updated.storeId);
          broadcastToStore(updated.storeId, 'queue_update', { type: 'DETAILS_CHANGE', entry: updated, queue });
          return res.status(200).json({ entry: updated });
        }
      }
      // ステータス変更
      if (status) {
        if (!['WAITING', 'CALLED', 'HOLD', 'DONE', 'CANCELLED'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        const entry = await updateQueueStatus(id, status);
        const queue = await getQueueByStore(entry.storeId);
        broadcastToStore(entry.storeId, 'queue_update', { type: 'STATUS_CHANGE', entry, queue });

        // DONE時: 来店ポイント付与（会員のみ）
        if (status === 'DONE' && entry.customerId) {
          try {
            let visitPts = POINT_RULES.VISIT ?? 100;
            let desc = "来店ポイント";

            // アイドルタイムボーナス判定
            const settings = await getStoreSettings(entry.storeId);
            const bonus = settings.idleTimeBonus;
            if (bonus?.enabled) {
              const now = new Date();
              const hour = now.getHours();
              const dayMap: Record<number, string> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
              const today = dayMap[now.getDay()] ?? '';
              if (hour >= bonus.startHour && hour < bonus.endHour && bonus.days.includes(today)) {
                visitPts += bonus.bonusPoints;
                desc = `来店ポイント＋アイドルタイムボーナス`;
              }
            }

            await addPoints(entry.customerId, "VISIT", visitPts, desc);
          } catch { /* best effort */ }
        }

        return res.status(200).json({ entry });
      }
      return res.status(400).json({ error: 'No update fields provided' });
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
