import type { NextApiRequest, NextApiResponse } from 'next';
import { listEmployees, addEmployee } from '@queue-platform/api/src/server';
import { requireStoreAdminForStore } from '../../../lib/requireStoreAdminForStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { storeId } = req.query;
    if (typeof storeId !== 'string') return res.status(400).json({ error: 'storeId が必要です' });
    if (!requireStoreAdminForStore(req, res, storeId)) return;
    const employees = await listEmployees(storeId);
    return res.status(200).json({ employees });
  }

  if (req.method === 'POST') {
    const { storeId, name } = req.body as { storeId?: string; name?: string };
    if (!storeId || !requireStoreAdminForStore(req, res, storeId)) return;
    try {
      const employee = await addEmployee(storeId, name ?? '');
      return res.status(200).json({ employee });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
