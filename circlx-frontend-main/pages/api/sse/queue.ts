import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { addClient, removeClient } from '../../../lib/sse';
import { getQueueByStore } from '../../../lib/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const storeId = req.query.storeId as string;
  if (!storeId) {
    return res.status(400).json({ error: 'storeId is required' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial data
  const queue = getQueueByStore(storeId);
  res.write(`event: init\ndata: ${JSON.stringify({ queue })}\n\n`);

  // Register client
  const clientId = crypto.randomUUID();
  addClient({ id: clientId, res, storeId });

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      removeClient(clientId);
    }
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(clientId);
  });
}
