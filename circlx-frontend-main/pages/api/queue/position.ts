import type { NextApiRequest, NextApiResponse } from 'next';
import { getQueuePosition, getQueueEntryById } from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { storeId, entryId } = req.query;

  if (!storeId || !entryId || typeof storeId !== 'string' || typeof entryId !== 'string') {
    return res.status(400).json({ error: 'storeId and entryId are required' });
  }

  const entry = getQueueEntryById(entryId);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  const position = getQueuePosition(storeId, entryId);
  if (!position) {
    return res.status(404).json({ error: 'Entry not in queue' });
  }

  return res.status(200).json({
    entry,
    position: position.position,
    estimatedWait: position.estimatedWait,
    totalInQueue: position.position + 1,
  });
}
