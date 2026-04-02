/**
 * Frontend API client for communicating with Next.js API routes.
 * Shared across all frontend apps.
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
  phone?: string;
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
  phone?: string;
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

export async function getQueueStats(storeId: string): Promise<{ waitingCount: number; estimatedWait: number; currentTicket: number | null }> {
  return request(`/queue/stats?storeId=${storeId}`);
}

// ─── Store Settings ─────────────────────────────────────
export interface StoreSettingsData {
  storeId: string;
  businessHours: { id: string; days: string; hours: string }[];
  closedDays: { id: string; day: string }[];
  isReceptionOpen: boolean;
  isTodayException: boolean;
  callMessage: string;
  autoCancelMinutes: number;
  updatedAt: string;
}

export async function getStoreSettingsApi(storeId: string): Promise<StoreSettingsData> {
  const data = await request<{ settings: StoreSettingsData }>(`/settings?storeId=${storeId}`);
  return data.settings;
}

export async function updateStoreSettingsApi(storeId: string, settings: Partial<Omit<StoreSettingsData, 'storeId'>>): Promise<StoreSettingsData> {
  const result = await request<{ settings: StoreSettingsData }>('/settings', {
    method: 'PUT',
    body: JSON.stringify({ storeId, ...settings }),
  });
  return result.settings;
}

// ─── Queue History ──────────────────────────────────────
export async function getQueueHistoryApi(storeId: string): Promise<QueueEntryData[]> {
  const data = await request<{ history: QueueEntryData[] }>(`/queue/history?storeId=${storeId}`);
  return data.history;
}

export async function restoreQueueEntryApi(id: string): Promise<QueueEntryData> {
  const result = await request<{ entry: QueueEntryData }>(`/queue/${id}/restore`, { method: 'POST' });
  return result.entry;
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
    console.warn('SSE connection error, reconnecting...');
  };

  return () => es.close();
}
