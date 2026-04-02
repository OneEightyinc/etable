import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoreSettings, updateStoreSettings } from '@queue-platform/api/src/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const storeId = (req.query.storeId as string) || (req.body?.storeId as string) || 'shibuya-001';

  if (req.method === 'GET') {
    try {
      const settings = getStoreSettings(storeId);
      return res.status(200).json({ settings });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { storeId: bodyStoreId, ...data } = req.body;
      const settings = updateStoreSettings(bodyStoreId || storeId, data);
      return res.status(200).json({ settings });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}
