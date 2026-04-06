import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, getAccountById, updateAccount, deleteAccount } from '@queue-platform/api/src/server';
import { serializeAccountForMasterAdminApi } from '../../../lib/serializeAccountForApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAuth(req, res, ['SUPER_ADMIN']);
  if (!session) return;

  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: '無効なIDです' });

  if (req.method === 'GET') {
    const account = await getAccountById(id);
    if (!account) return res.status(404).json({ error: 'アカウントが見つかりません' });
    return res.status(200).json({
      account: serializeAccountForMasterAdminApi(account),
    });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const account = await updateAccount(id, req.body);
      return res.status(200).json({
        account: serializeAccountForMasterAdminApi(account),
      });
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const deleted = await deleteAccount(id);
    if (!deleted) return res.status(404).json({ error: 'アカウントが見つかりません' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
