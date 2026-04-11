/**
 * Frontend API client for communicating with Next.js API routes.
 * Shared across all frontend apps.
 */

function getBase(): string {
  const prefix = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_PREFIX || '' : '';
  return `${prefix}/api`;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBase()}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '不明なエラーが発生しました' }));
    throw new Error(body.error || `通信エラー (HTTP ${res.status})`);
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

export async function getMe(): Promise<LoginResponse['user'] | null> {
  const res = await fetch(`${getBase()}/auth/me`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '不明なエラーが発生しました' }));
    throw new Error(body.error || `通信エラー (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { user: LoginResponse['user'] };
  return data.user;
}

// ─── Accounts ────────────────────────────────────────────
/** 店舗ごとの公開用不透明トークン（マスター管理でリンク表示用） */
export interface AccountPublicUrlTokens {
  storeAdmin?: string;
  kiosk?: string;
  portal?: string;
  survey?: string;
}

export interface AccountData {
  id: string;
  name: string;
  email: string;
  storeName: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  publicUrlTokens?: AccountPublicUrlTokens;
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
  portalDisplayName?: string;
  portalCategory?: string;
  portalImageUrl?: string;
  portalTags?: string[];
  portalDescription?: string;
  portalAddress?: string;
  portalDistanceLabel?: string;
  portalLat?: number | null;
  portalLng?: number | null;
  portalRating?: number;
  portalPriceRange?: string;
  portalHoursSummary?: string;
  portalMenuItems?: { name: string; price: string }[];
  portalReviews?: { author: string; rating: number; comment: string }[];
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

// ─── Points & Rank ──────────────────────────────────────
export type MemberTier = 'BRONZE' | 'SILVER' | 'GOLD';

export type PointAction =
  | 'FIRST_VISIT' | 'SURVEY' | 'GOOGLE_REVIEW'
  | 'REFERRAL_SENT' | 'REFERRAL_RECEIVED'
  | 'IDLE_TIME_BONUS' | 'STAMP_RALLY' | 'MANUAL';

export interface PointHistoryEntry {
  id: string;
  customerId: string;
  action: PointAction;
  points: number;
  description: string;
  createdAt: string;
}

export interface CustomerPointsData {
  totalPoints: number;
  currentTier: MemberTier;
  referralCode: string;
  history: PointHistoryEntry[];
}

export async function getCustomerPointsApi(customerId: string): Promise<CustomerPointsData> {
  return request<CustomerPointsData>(`/customer/points?customerId=${customerId}`);
}

export async function addPointsApi(data: {
  customerId: string;
  action: PointAction;
  points?: number;
  description?: string;
}): Promise<{ totalPoints: number; currentTier: MemberTier; history: PointHistoryEntry }> {
  return request(`/customer/points`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function redeemReferralApi(data: {
  customerId: string;
  referralCode: string;
}): Promise<{ success: boolean; message: string }> {
  return request(`/customer/referral`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
} as const;

export const TIER_BENEFITS: Record<MemberTier, string[]> = {
  BRONZE: [],
  SILVER: ['ファストパス1回券'],
  GOLD: ['ファストパス月2回', '1ドリンク無料'],
};

// ─── SSE ─────────────────────────────────────────────────
export function subscribeToQueue(
  storeId: string,
  onUpdate: (data: { type: string; queue: QueueEntryData[]; entry?: QueueEntryData }) => void,
  onInit?: (data: { queue: QueueEntryData[] }) => void
): () => void {
  const es = new EventSource(`${getBase()}/sse/queue?storeId=${storeId}`);

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
