/**
 * JSON-file based database layer for the queue management system.
 * Uses in-memory cache with periodic flush to disk.
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
  seatType: 'TABLE' | 'COUNTER' | 'EITHER';
  status: 'WAITING' | 'CALLED' | 'HOLD' | 'DONE' | 'CANCELLED';
  arrivalTime: string; // ISO string
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

interface Database {
  admins: AdminUser[];
  accounts: Account[];
  queue: QueueEntry[];
  sessions: Session[];
  counters: Record<string, number>; // storeId -> last ticket number
}

// ─── Helpers ─────────────────────────────────────────────
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export { hashPassword };

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
  };
}

// ─── In-memory cache ─────────────────────────────────────
let _db: Database | null = null;

function loadDb(): Database {
  if (_db) return _db;

  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      _db = JSON.parse(raw) as Database;
    } else {
      _db = getDefaultDb();
      saveDb();
    }
  } catch {
    _db = getDefaultDb();
    saveDb();
  }

  return _db!;
}

function saveDb(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(_db, null, 2), 'utf-8');
}

// ─── Public API ──────────────────────────────────────────

// -- Admin / Auth --
export function findAdminByEmail(email: string): AdminUser | undefined {
  return loadDb().admins.find((a) => a.email === email);
}

export function findAccountByEmail(email: string): Account | undefined {
  return loadDb().accounts.find((a) => a.email === email);
}

// -- Sessions --
export function createSession(userId: string, role: 'SUPER_ADMIN' | 'STORE_ADMIN', storeId?: string): Session {
  const db = loadDb();
  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    role,
    storeId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
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
    // Expired - remove
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

// -- Accounts CRUD --
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

// -- Queue Management --
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
    estimatedWait: idx * 5, // 5 minutes per group estimate
  };
}
