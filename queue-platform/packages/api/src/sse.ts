/**
 * Server-Sent Events (SSE) event bus for real-time queue updates.
 * Shared across all apps.
 */
import type { NextApiResponse } from 'next';

type SSEClient = {
  id: string;
  res: NextApiResponse;
  storeId: string;
};

const globalForSSE = globalThis as unknown as { _sseClients?: SSEClient[] };
if (!globalForSSE._sseClients) {
  globalForSSE._sseClients = [];
}

function getClients(): SSEClient[] {
  return globalForSSE._sseClients!;
}

export function addClient(client: SSEClient): void {
  getClients().push(client);
}

export function removeClient(clientId: string): void {
  const clients = getClients();
  const idx = clients.findIndex((c) => c.id === clientId);
  if (idx !== -1) {
    clients.splice(idx, 1);
  }
}

export function broadcastToStore(storeId: string, event: string, data: unknown): void {
  const clients = getClients();
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const deadClients: string[] = [];

  for (const client of clients) {
    if (client.storeId === storeId) {
      try {
        client.res.write(payload);
      } catch {
        deadClients.push(client.id);
      }
    }
  }

  for (const id of deadClients) {
    removeClient(id);
  }
}

export function broadcastAll(event: string, data: unknown): void {
  const clients = getClients();
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const deadClients: string[] = [];

  for (const client of clients) {
    try {
      client.res.write(payload);
    } catch {
      deadClients.push(client.id);
    }
  }

  for (const id of deadClients) {
    removeClient(id);
  }
}
