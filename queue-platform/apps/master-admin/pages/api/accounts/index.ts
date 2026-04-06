import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, getAllAccounts, createAccount } from '@queue-platform/api/src/server';
import { serializeAccountForMasterAdminApi } from '../../../lib/serializeAccountForApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAuth(req, res, ['SUPER_ADMIN']);
  if (!session) return;

  if (req.method === 'GET') {
    const accounts = (await getAllAccounts()).map(serializeAccountForMasterAdminApi);
    return res.status(200).json({ accounts });
  }

  if (req.method === 'POST') {
    const { id, name, email, password, storeName, status } = req.body;
    if (!id || !email || !password || !storeName) {
      return res.status(400).json({ error: '必須項目が入力されていません' });
    }
    try {
      const account = await createAccount({
        id,
        name: name || storeName,
        email,
        password,
        storeName,
        status: status || 'ACTIVE',
      });
      return res.status(201).json({
        account: serializeAccountForMasterAdminApi(account),
      });
    } catch (err: any) {
      return res.status(409).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
