/**
 * JSON-file based database layer for the queue management system.
 * Shared across all apps in the monorepo.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ─── Types ───────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'STORE_ADMIN';
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  storeName: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface QueueEntry {
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

export interface Session {
  id: string;
  userId: string;
  role: 'SUPER_ADMIN' | 'STORE_ADMIN';
  storeId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface StoreSettings {
  storeId: string;
  businessHours: { id: string; days: string; hours: string }[];
  closedDays: { id: string; day: string }[];
  isReceptionOpen: boolean;
  isTodayException: boolean;
  callMessage: string;
  autoCancelMinutes: number;
  updatedAt: string;
}

interface Database {
  admins: AdminUser[];
  accounts: Account[];
  queue: QueueEntry[];
  sessions: Session[];
  counters: Record<string, number>;
  storeSettings: StoreSettings[];
}

// ─── Helpers ─────────────────────────────────────────────
// DB file is stored at the monorepo root /data/db.json
const DB_PATH = path.resolve(process.cwd(), '..', '..', 'data', 'db.json');

// Fallback: try relative to cwd too
function getDbPath(): string {
  // If running from an app (apps/xxx), go up to monorepo root
  const monorepoPath = path.resolve(process.cwd(), '..', '..', 'data', 'db.json');
  const cwdPath = path.resolve(process.cwd(), 'data', 'db.json');

  // Check if we're inside apps/ directory
  if (process.cwd().includes('/apps/')) {
    if (fs.existsSync(monorepoPath)) return monorepoPath;
  }
  if (fs.existsSync(cwdPath)) return cwdPath;

  // Fallback: try monorepo path first, then cwd path
  if (process.cwd().includes('/apps/')) {
    return monorepoPath;
  }
  return cwdPath;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getDefaultDb(): Database {
  return {
    admins: [
      {
        id: 'admin-001',
        email: 'admin@circlex.jp',
        passwordHash: hashPassword('password'),
        role: 'SUPER_ADMIN',
        createdAt: new Date().toISOString(),
      },
    ],
    accounts: [
      {
        id: 'shibuya-001',
        name: '田中 健一',
        email: 'tanaka@circlex.jp',
        passwordHash: hashPassword('password'),
        storeName: 'CIRCLEX 渋谷店',
        status: 'ACTIVE',
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z',
      },
      {
        id: 'shinjuku-002',
        name: '佐藤 美咲',
        email: 'sato@circlex.jp',
        passwordHash: hashPassword('password'),
        storeName: 'CIRCLEX 新宿店',
        status: 'ACTIVE',
        createdAt: '2024-03-05T00:00:00.000Z',
        updatedAt: '2024-03-05T00:00:00.000Z',
      },
      {
        id: 'ikebukuro-003',
        name: '鈴木 浩',
        email: 'suzuki@circlex.jp',
        passwordHash: hashPassword('password'),
        storeName: 'CIRCLEX 池袋店',
        status: 'DISABLED',
        createdAt: '2024-02-15T00:00:00.000Z',
        updatedAt: '2024-02-15T00:00:00.000Z',
      },
    ],
    queue: [],
    sessions: [],
    counters: {},
    storeSettings: [],
  };
}

// ─── In-memory cache ─────────────────────────────────────
const globalForDb = globalThis as unknown as { _queueDb?: Database };

function loadDb(): Database {
  if (globalForDb._queueDb) return globalForDb._queueDb;

  const dbPath = getDbPath();

  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      globalForDb._queueDb = JSON.parse(raw) as Database;
    } else {
      globalForDb._queueDb = getDefaultDb();
      saveDb(); // will silently skip on read-only filesystems
    }
  } catch {
    globalForDb._queueDb = getDefaultDb();
    // Don't call saveDb() here – if we can't read, we likely can't write either
  }

  return globalForDb._queueDb!;
}

function saveDb(): void {
  try {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(globalForDb._queueDb, null, 2), 'utf-8');
  } catch {
    // On read-only filesystems (e.g. Vercel), silently skip file writes.
    // Data is still held in the in-memory cache (globalForDb._queueDb).
    console.warn('[db] saveDb skipped – filesystem is read-only');
  }
}

// ─── Admin / Auth ────────────────────────────────────────
export function findAdminByEmail(email: string): AdminUser | undefined {
  return loadDb().admins.find((a) => a.email === email);
}

export function findAccountByEmail(email: string): Account | undefined {
  return loadDb().accounts.find((a) => a.email === email);
}

// ─── Sessions ────────────────────────────────────────────
export function createSession(userId: string, role: 'SUPER_ADMIN' | 'STORE_ADMIN', storeId?: string): Session {
  const db = loadDb();
  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    role,
    storeId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.sessions.push(session);
  saveDb();
  return session;
}

export function findSession(sessionId: string): Session | undefined {
  const db = loadDb();
  const session = db.sessions.find((s) => s.id === sessionId);
  if (session && new Date(session.expiresAt) < new Date()) {
    db.sessions = db.sessions.filter((s) => s.id !== sessionId);
    saveDb();
    return undefined;
  }
  return session;
}

export function deleteSession(sessionId: string): void {
  const db = loadDb();
  db.sessions = db.sessions.filter((s) => s.id !== sessionId);
  saveDb();
}

// ─── Accounts CRUD ───────────────────────────────────────
export function getAllAccounts(): Account[] {
  return loadDb().accounts;
}

export function getAccountById(id: string): Account | undefined {
  return loadDb().accounts.find((a) => a.id === id);
}

export function createAccount(data: {
  id: string;
  name: string;
  email: string;
  password: string;
  storeName: string;
  status: 'ACTIVE' | 'DISABLED';
}): Account {
  const db = loadDb();
  if (db.accounts.some((a) => a.id === data.id)) {
    throw new Error('Account ID already exists');
  }
  if (db.accounts.some((a) => a.email === data.email)) {
    throw new Error('Email already exists');
  }
  const now = new Date().toISOString();
  const account: Account = {
    id: data.id,
    name: data.name,
    email: data.email,
    passwordHash: hashPassword(data.password),
    storeName: data.storeName,
    status: data.status,
    createdAt: now,
    updatedAt: now,
  };
  db.accounts.push(account);
  saveDb();
  return account;
}

export function updateAccount(
  id: string,
  data: Partial<{ name: string; email: string; password: string; storeName: string; status: 'ACTIVE' | 'DISABLED' }>
): Account {
  const db = loadDb();
  const idx = db.accounts.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Account not found');
  const account = db.accounts[idx];
  if (data.name !== undefined) account.name = data.name;
  if (data.email !== undefined) account.email = data.email;
  if (data.password) account.passwordHash = hashPassword(data.password);
  if (data.storeName !== undefined) account.storeName = data.storeName;
  if (data.status !== undefined) account.status = data.status;
  account.updatedAt = new Date().toISOString();
  saveDb();
  return account;
}

export function deleteAccount(id: string): boolean {
  const db = loadDb();
  const len = db.accounts.length;
  db.accounts = db.accounts.filter((a) => a.id !== id);
  if (db.accounts.length < len) {
    saveDb();
    return true;
  }
  return false;
}

// ─── Queue Management ────────────────────────────────────
export function getQueueByStore(storeId: string): QueueEntry[] {
  return loadDb()
    .queue.filter((q) => q.storeId === storeId && !['DONE', 'CANCELLED'].includes(q.status))
    .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
}

export function getNextTicketNumber(storeId: string): number {
  const db = loadDb();
  const current = db.counters[storeId] || 100;
  const next = current + 1;
  db.counters[storeId] = next;
  saveDb();
  return next;
}

export function addToQueue(data: {
  storeId: string;
  adults: number;
  children: number;
  seatType: 'TABLE' | 'COUNTER' | 'EITHER';
  phone?: string;
}): QueueEntry {
  const db = loadDb();
  const ticketNumber = getNextTicketNumber(data.storeId);
  const now = new Date().toISOString();
  const entry: QueueEntry = {
    id: crypto.randomUUID(),
    storeId: data.storeId,
    ticketNumber,
    adults: data.adults,
    children: data.children,
    phone: data.phone,
    seatType: data.seatType,
    status: 'WAITING',
    arrivalTime: now,
    createdAt: now,
    updatedAt: now,
  };
  db.queue.push(entry);
  saveDb();
  return entry;
}

export function updateQueueStatus(
  id: string,
  status: 'WAITING' | 'CALLED' | 'HOLD' | 'DONE' | 'CANCELLED'
): QueueEntry {
  const db = loadDb();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error('Queue entry not found');
  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  if (status === 'CALLED') {
    entry.calledAt = new Date().toISOString();
  }
  saveDb();
  return entry;
}

export function removeFromQueue(id: string): boolean {
  const db = loadDb();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) return false;
  entry.status = 'CANCELLED';
  entry.updatedAt = new Date().toISOString();
  saveDb();
  return true;
}

export function getQueueEntryById(id: string): QueueEntry | undefined {
  return loadDb().queue.find((q) => q.id === id);
}

export function getQueuePosition(storeId: string, entryId: string): { position: number; estimatedWait: number } | null {
  const queue = getQueueByStore(storeId);
  const idx = queue.findIndex((q) => q.id === entryId);
  if (idx === -1) return null;
  return {
    position: idx,
    estimatedWait: idx * 5,
  };
}

export function getQueueStats(storeId: string): { waitingCount: number; estimatedWait: number; currentTicket: number | null } {
  const queue = getQueueByStore(storeId);
  const waiting = queue.filter((q) => q.status === 'WAITING');
  const called = queue.filter((q) => q.status === 'CALLED');
  return {
    waitingCount: waiting.length,
    estimatedWait: waiting.length * 5,
    currentTicket: called.length > 0 ? called[called.length - 1].ticketNumber : null,
  };
}

// ─── Queue History (DONE / CANCELLED) ───────────────────
export function getQueueHistory(storeId: string): QueueEntry[] {
  return loadDb()
    .queue.filter((q) => q.storeId === storeId && ['DONE', 'CANCELLED'].includes(q.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function restoreQueueEntry(id: string): QueueEntry {
  const db = loadDb();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error('Queue entry not found');
  entry.status = 'WAITING';
  entry.updatedAt = new Date().toISOString();
  saveDb();
  return entry;
}

// ─── Store Settings ─────────────────────────────────────
function getDefaultStoreSettings(storeId: string): StoreSettings {
  return {
    storeId,
    businessHours: [
      { id: '1', days: '月・火・水・木・金', hours: '10:00〜20:00' },
      { id: '2', days: '土・日', hours: '11:00〜22:00' },
    ],
    closedDays: [
      { id: '1', day: '毎週月曜' },
    ],
    isReceptionOpen: true,
    isTodayException: false,
    callMessage: '番号 {number} のお客様、ご来店をお願いいたします。',
    autoCancelMinutes: 10,
    updatedAt: new Date().toISOString(),
  };
}

export function getStoreSettings(storeId: string): StoreSettings {
  const db = loadDb();
  if (!db.storeSettings) db.storeSettings = [];
  let settings = db.storeSettings.find((s) => s.storeId === storeId);
  if (!settings) {
    settings = getDefaultStoreSettings(storeId);
    db.storeSettings.push(settings);
    saveDb();
  }
  return settings;
}

export function updateStoreSettings(storeId: string, data: Partial<Omit<StoreSettings, 'storeId'>>): StoreSettings {
  const db = loadDb();
  if (!db.storeSettings) db.storeSettings = [];
  let idx = db.storeSettings.findIndex((s) => s.storeId === storeId);
  if (idx === -1) {
    db.storeSettings.push(getDefaultStoreSettings(storeId));
    idx = db.storeSettings.length - 1;
  }
  const settings = db.storeSettings[idx];
  if (data.businessHours !== undefined) settings.businessHours = data.businessHours;
  if (data.closedDays !== undefined) settings.closedDays = data.closedDays;
  if (data.isReceptionOpen !== undefined) settings.isReceptionOpen = data.isReceptionOpen;
  if (data.isTodayException !== undefined) settings.isTodayException = data.isTodayException;
  if (data.callMessage !== undefined) settings.callMessage = data.callMessage;
  if (data.autoCancelMinutes !== undefined) settings.autoCancelMinutes = data.autoCancelMinutes;
  settings.updatedAt = new Date().toISOString();
  saveDb();
  return settings;
}
