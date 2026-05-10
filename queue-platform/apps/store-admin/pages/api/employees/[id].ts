import type { NextApiRequest, NextApiResponse } from 'next';
import { removeEmployee } from '@queue-platform/api/src/server';
import { requireStoreAdminForStore } from '../../../lib/requireStoreAdminForStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { id, storeId } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });
  if (typeof storeId !== 'string') return res.status(400).json({ error: 'storeId が必要です' });
  if (!requireStoreAdminForStore(req, res, storeId)) return;

  await removeEmployee(storeId, id);
  return res.status(200).json({ ok: true });
}
