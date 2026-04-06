import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { addClient, removeClient, getQueueByStore } from '@queue-platform/api/src/server';
import { requireStoreAdminForStore } from '../../../lib/requireStoreAdminForStore';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const storeId = req.query.storeId as string;
  if (!storeId) return res.status(400).json({ error: 'storeId is required' });

  if (!requireStoreAdminForStore(req, res, storeId)) return;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const queue = await getQueueByStore(storeId);
  res.write(`event: init\ndata: ${JSON.stringify({ queue })}\n\n`);

  const clientId = crypto.randomUUID();
  addClient({ id: clientId, res, storeId });

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      removeClient(clientId);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(clientId);
  });
}
