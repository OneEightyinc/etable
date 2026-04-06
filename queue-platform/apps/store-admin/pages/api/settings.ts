import type { NextApiRequest, NextApiResponse } from 'next';
import type { StoreSettings } from '@queue-platform/api/src/db';
import { getStoreSettings, updateStoreSettings } from '@queue-platform/api/src/db';
import { requireStoreAdminForStore } from '../../lib/requireStoreAdminForStore';

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
    '';
  const sid = typeof storeId === 'string' ? storeId.trim() : '';
  if (!sid) {
    return res.status(400).json({ error: '店舗IDが必要です' });
  }

  if (req.method === 'GET') {
    if (!requireStoreAdminForStore(req, res, sid)) return;
    try {
      const settings = await getStoreSettings(sid);
      return res.status(200).json({ settings });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    if (!requireStoreAdminForStore(req, res, sid)) return;
    try {
      const { storeId: bodyStoreId, ...data } = body as { storeId?: string } & Record<string, unknown>;
      const target = typeof bodyStoreId === 'string' && bodyStoreId.trim() ? bodyStoreId.trim() : sid;
      if (target !== sid) {
        return res.status(400).json({ error: '店舗IDが一致しません' });
      }
      const settings = await updateStoreSettings(
        target,
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
