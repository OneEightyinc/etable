import type { NextApiRequest, NextApiResponse } from 'next';
import { getQueueHistory } from '@queue-platform/api/src/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const storeId = (req.query.storeId as string) || 'shibuya-001';

  try {
    const history = await getQueueHistory(storeId);
    return res.status(200).json({ history });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
