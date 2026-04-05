import type { NextApiRequest, NextApiResponse } from 'next';
import type { StoreSettings } from '@queue-platform/api/src/db';
import { getStoreSettings, updateStoreSettings } from '@queue-platform/api/src/db';

function parseBody(req: NextApiRequest): Record<string, unknown> {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = req.method === 'PUT' ? parseBody(req) : {};
  const storeId =
    (req.query.storeId as string) ||
    (typeof body.storeId === 'string' ? body.storeId : '') ||
    (req.body?.storeId as string) ||
    'shibuya-001';

  if (req.method === 'GET') {
    try {
      const settings = await getStoreSettings(storeId);
      return res.status(200).json({ settings });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { storeId: bodyStoreId, ...data } = body as { storeId?: string } & Record<string, unknown>;
      const settings = await updateStoreSettings(
        (bodyStoreId as string) || storeId,
        data as Partial<Omit<StoreSettings, 'storeId'>>
      );
      return res.status(200).json({ settings });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      return res.status(500).json({ error: message });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}
