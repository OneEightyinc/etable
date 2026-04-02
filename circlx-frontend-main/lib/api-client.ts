/**
 * Frontend API client for communicating with Next.js API routes.
 */

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────
export interface LoginResponse {
  sessionId: string;
  user: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'STORE_ADMIN';
    storeName?: string;
    storeId?: string;
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<LoginResponse['user']> {
  const data = await request<{ user: LoginResponse['user'] }>('/auth/me');
  return data.user;
}

// ─── Accounts ────────────────────────────────────────────
export interface AccountData {
  id: string;
  name: string;
  email: string;
  storeName: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export async function getAccounts(): Promise<AccountData[]> {
  const data = await request<{ accounts: AccountData[] }>('/accounts');
  return data.accounts;
}

export async function createAccountApi(data: {
  id: string;
  name: string;
  email: string;
  password: string;
  storeName: string;
  status: 'ACTIVE' | 'DISABLED';
}): Promise<AccountData> {
  const result = await request<{ account: AccountData }>('/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.account;
}

export async function updateAccountApi(
  id: string,
  data: Partial<{ name: string; email: string; password: string; storeName: string; status: 'ACTIVE' | 'DISABLED' }>
): Promise<AccountData> {
  const result = await request<{ account: AccountData }>(`/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return result.account;
}

export async function deleteAccountApi(id: string): Promise<void> {
  await request(`/accounts/${id}`, { method: 'DELETE' });
}

// ─── Queue ───────────────────────────────────────────────
export interface QueueEntryData {
  id: string;
  storeId: string;
  ticketNumber: number;
  adults: number;
  children: number;
  seatType: 'TABLE' | 'COUNTER' | 'EITHER';
  status: 'WAITING' | 'CALLED' | 'HOLD' | 'DONE' | 'CANCELLED';
  arrivalTime: string;
  calledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getQueue(storeId: string): Promise<QueueEntryData[]> {
  const data = await request<{ queue: QueueEntryData[] }>(`/queue?storeId=${storeId}`);
  return data.queue;
}

export async function addToQueueApi(data: {
  storeId: string;
  adults: number;
  children: number;
  seatType: 'TABLE' | 'COUNTER' | 'EITHER';
}): Promise<QueueEntryData> {
  const result = await request<{ entry: QueueEntryData }>('/queue', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.entry;
}

export async function updateQueueStatusApi(
  id: string,
  status: 'WAITING' | 'CALLED' | 'HOLD' | 'DONE' | 'CANCELLED'
): Promise<QueueEntryData> {
  const result = await request<{ entry: QueueEntryData }>(`/queue/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return result.entry;
}

export async function deleteQueueEntryApi(id: string): Promise<void> {
  await request(`/queue/${id}`, { method: 'DELETE' });
}

export async function getQueuePosition(
  storeId: string,
  entryId: string
): Promise<{ entry: QueueEntryData; position: number; estimatedWait: number; totalInQueue: number }> {
  return request(`/queue/position?storeId=${storeId}&entryId=${entryId}`);
}

// ─── SSE ─────────────────────────────────────────────────
export function subscribeToQueue(
  storeId: string,
  onUpdate: (data: { type: string; queue: QueueEntryData[]; entry?: QueueEntryData }) => void,
  onInit?: (data: { queue: QueueEntryData[] }) => void
): () => void {
  const es = new EventSource(`/api/sse/queue?storeId=${storeId}`);

  es.addEventListener('init', (e) => {
    const data = JSON.parse(e.data);
    onInit?.(data);
  });

  es.addEventListener('queue_update', (e) => {
    const data = JSON.parse(e.data);
    onUpdate(data);
  });

  es.onerror = () => {
    // Auto-reconnect is built into EventSource
    console.warn('SSE connection error, reconnecting...');
  };

  // Return cleanup function
  return () => {
    es.close();
  };
}
