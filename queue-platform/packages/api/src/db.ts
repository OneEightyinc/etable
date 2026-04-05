/**
 * Database layer: local `data/db.json` or Upstash Redis / Vercel KV when REST env is set.
 * On Vercel, set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL + KV_REST_API_TOKEN).
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Redis } from "@upstash/redis";

// ─── Types ───────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: "SUPER_ADMIN" | "STORE_ADMIN";
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  storeName: string;
  status: "ACTIVE" | "DISABLED";
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
  seatType: "TABLE" | "COUNTER" | "EITHER";
  status: "WAITING" | "CALLED" | "HOLD" | "DONE" | "CANCELLED";
  arrivalTime: string;
  calledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  role: "SUPER_ADMIN" | "STORE_ADMIN";
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
  /** 顧客ポータル表示名（空ならアカウントの店舗名） */
  portalDisplayName: string;
  portalCategory: string;
  portalImageUrl: string;
  portalTags: string[];
  portalDescription: string;
  portalAddress: string;
  portalDistanceLabel: string;
  portalRating: number;
  portalPriceRange: string;
  /** 未入力時は businessHours から自動整形 */
  portalHoursSummary: string;
  portalMenuItems: { name: string; price: string }[];
  portalReviews: { author: string; rating: number; comment: string }[];
}

/** 顧客ポータル会員（DB 永続化） */
export interface CustomerProfileRecord {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  storeId: string;
  visitedAt: string;
  gender: "male" | "female" | "other" | "no_answer";
  ageGroup: "teens" | "20s_early" | "20s_late" | "30s_early" | "30s_late" | "40s" | "50s_plus";
  groupType: "solo" | "friends" | "couple" | "family" | "business";
  visitPurpose: "lunch" | "dinner" | "drinking" | "date" | "work_cafe" | "other";
  stayDuration: "under_30min" | "30to60min" | "1to2hours" | "over_2hours";
  visitCount: "first" | "second_third" | "regular";
  budgetPerPerson: number;
  acquisitionChannels: string[];
  favoriteMenu: string | null;
  etableReview: string | null;
  satisfactionScore: number;
  waitTimeTolerance: boolean;
  revisitIntention: "yes" | "no" | "maybe";
  residenceArea: string | null;
  workArea: string | null;
  occupation: "employee" | "student" | "freelance" | "self_employed" | "homemaker" | "retired" | "other" | null;
}

/** 顧客ポータル用の公開ペイロード（認証不要 API 向け） */
export type StorePortalProfile = {
  storeId: string;
  name: string;
  category: string;
  imageUrl: string;
  tags: string[];
  description: string;
  address: string;
  distance: string;
  rating: number;
  priceRange: string;
  hours: string;
  businessHours: { id: string; days: string; hours: string }[];
  menu: { name: string; price: string }[];
  reviews: { author: string; rating: number; comment: string }[];
  waitingGroups: number;
  approxWaitText: string;
  shortestWaitMinutes: number;
};

interface Database {
  admins: AdminUser[];
  accounts: Account[];
  queue: QueueEntry[];
  sessions: Session[];
  counters: Record<string, number>;
  storeSettings: StoreSettings[];
  customerProfiles: CustomerProfileRecord[];
  surveyResponses: SurveyResponse[];
}

const REMOTE_DB_KEY = "queue-platform:database:v1";

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    redisClient = new Redis({ url, token });
    return redisClient;
  }
  redisClient = null;
  return null;
}

export function isRemoteDbEnabled(): boolean {
  return getRedis() !== null;
}

// ─── Helpers ─────────────────────────────────────────────
const DB_PATH = path.resolve(process.cwd(), "..", "..", "data", "db.json");

function getDbPath(): string {
  const monorepoPath = path.resolve(process.cwd(), "..", "..", "data", "db.json");
  const cwdPath = path.resolve(process.cwd(), "data", "db.json");

  if (process.cwd().includes("/apps/")) {
    if (fs.existsSync(monorepoPath)) return monorepoPath;
  }
  if (fs.existsSync(cwdPath)) return cwdPath;

  if (process.cwd().includes("/apps/")) {
    return monorepoPath;
  }
  return cwdPath;
}

export function hashPassword(password: string): string {
  const p = password ?? "";
  return crypto.createHash("sha256").update(p, "utf8").digest("hex");
}

function getDefaultDb(): Database {
  return {
    admins: [
      {
        id: "admin-001",
        email: "admin@circlex.jp",
        passwordHash: hashPassword("password"),
        role: "SUPER_ADMIN",
        createdAt: new Date().toISOString(),
      },
    ],
    accounts: [
      {
        id: "shibuya-001",
        name: "田中 健一",
        email: "tanaka@circlex.jp",
        passwordHash: hashPassword("password"),
        storeName: "CIRCLEX 渋谷店",
        status: "ACTIVE",
        createdAt: "2024-03-01T00:00:00.000Z",
        updatedAt: "2024-03-01T00:00:00.000Z",
      },
      {
        id: "shinjuku-002",
        name: "佐藤 美咲",
        email: "sato@circlex.jp",
        passwordHash: hashPassword("password"),
        storeName: "CIRCLEX 新宿店",
        status: "ACTIVE",
        createdAt: "2024-03-05T00:00:00.000Z",
        updatedAt: "2024-03-05T00:00:00.000Z",
      },
      {
        id: "ikebukuro-003",
        name: "鈴木 浩",
        email: "suzuki@circlex.jp",
        passwordHash: hashPassword("password"),
        storeName: "CIRCLEX 池袋店",
        status: "DISABLED",
        createdAt: "2024-02-15T00:00:00.000Z",
        updatedAt: "2024-02-15T00:00:00.000Z",
      },
    ],
    queue: [],
    sessions: [],
    counters: {},
    storeSettings: [],
    customerProfiles: [],
    surveyResponses: [],
  };
}

function normalizeDatabase(raw: unknown): Database {
  const defaults = getDefaultDb();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }
  const d = raw as Record<string, unknown>;
  return {
    admins: Array.isArray(d.admins) ? (d.admins as AdminUser[]) : [...defaults.admins],
    accounts: Array.isArray(d.accounts) ? (d.accounts as Account[]) : [...defaults.accounts],
    queue: Array.isArray(d.queue) ? (d.queue as QueueEntry[]) : [],
    sessions: Array.isArray(d.sessions) ? (d.sessions as Session[]) : [],
    counters:
      d.counters && typeof d.counters === "object" && !Array.isArray(d.counters)
        ? (d.counters as Record<string, number>)
        : {},
    storeSettings: Array.isArray(d.storeSettings) ? (d.storeSettings as StoreSettings[]) : [],
    customerProfiles: Array.isArray(d.customerProfiles)
      ? (d.customerProfiles as CustomerProfileRecord[])
      : [],
    surveyResponses: Array.isArray(d.surveyResponses) ? (d.surveyResponses as SurveyResponse[]) : [],
  };
}

const globalForDb = globalThis as unknown as { _queueDb?: Database };

function loadDbFromFile(): Database {
  if (globalForDb._queueDb) return globalForDb._queueDb;

  const dbPath = getDbPath();

  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      globalForDb._queueDb = normalizeDatabase(parsed);
    } else {
      globalForDb._queueDb = getDefaultDb();
      saveDbSync();
    }
  } catch {
    globalForDb._queueDb = getDefaultDb();
  }

  return globalForDb._queueDb!;
}

/** Load DB from Redis (if configured) or local file cache. */
export async function readDatabase(): Promise<Database> {
  const r = getRedis();
  if (r) {
    const raw = await r.get(REMOTE_DB_KEY);
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      globalForDb._queueDb = normalizeDatabase(parsed);
      return globalForDb._queueDb!;
    }
    globalForDb._queueDb = getDefaultDb();
    await persistDatabase();
    return globalForDb._queueDb!;
  }
  return loadDbFromFile();
}

function saveDbSync(): void {
  try {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!globalForDb._queueDb) return;
    fs.writeFileSync(dbPath, JSON.stringify(globalForDb._queueDb, null, 2), "utf-8");
  } catch {
    console.warn("[db] saveDb skipped – filesystem is read-only");
  }
}

export async function persistDatabase(): Promise<void> {
  const r = getRedis();
  if (r) {
    if (!globalForDb._queueDb) return;
    await r.set(REMOTE_DB_KEY, JSON.stringify(globalForDb._queueDb));
    return;
  }
  saveDbSync();
}

// ─── Admin / Auth ────────────────────────────────────────
export async function findAdminByEmail(email: string): Promise<AdminUser | undefined> {
  const db = await readDatabase();
  return db.admins.find((a) => a.email === email);
}

export async function findAccountByEmail(email: string): Promise<Account | undefined> {
  const db = await readDatabase();
  return db.accounts.find((a) => a.email === email);
}

// ─── Sessions ────────────────────────────────────────────
export async function createSession(
  userId: string,
  role: "SUPER_ADMIN" | "STORE_ADMIN",
  storeId?: string
): Promise<Session> {
  const db = await readDatabase();
  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    role,
    storeId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.sessions.push(session);
  await persistDatabase();
  return session;
}

export async function findSession(sessionId: string): Promise<Session | undefined> {
  const db = await readDatabase();
  const session = db.sessions.find((s) => s.id === sessionId);
  if (session && new Date(session.expiresAt) < new Date()) {
    db.sessions = db.sessions.filter((s) => s.id !== sessionId);
    await persistDatabase();
    return undefined;
  }
  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await readDatabase();
  db.sessions = db.sessions.filter((s) => s.id !== sessionId);
  await persistDatabase();
}

// ─── Accounts CRUD ───────────────────────────────────────
export async function getAllAccounts(): Promise<Account[]> {
  const db = await readDatabase();
  return db.accounts;
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const db = await readDatabase();
  return db.accounts.find((a) => a.id === id);
}

export async function createAccount(data: {
  id: string;
  name: string;
  email: string;
  password: string;
  storeName: string;
  status: "ACTIVE" | "DISABLED";
}): Promise<Account> {
  const db = await readDatabase();
  if (db.accounts.some((a) => a.id === data.id)) {
    throw new Error("このアカウントIDは既に使用されています");
  }
  if (db.accounts.some((a) => a.email === data.email)) {
    throw new Error("このメールアドレスは既に登録されています");
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
  await persistDatabase();
  return account;
}

export async function updateAccount(
  id: string,
  data: Partial<{ name: string; email: string; password: string; storeName: string; status: "ACTIVE" | "DISABLED" }>
): Promise<Account> {
  const db = await readDatabase();
  const idx = db.accounts.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error("アカウントが見つかりません");
  const account = db.accounts[idx];
  if (data.name !== undefined) account.name = data.name;
  if (data.email !== undefined) account.email = data.email;
  if (data.password) account.passwordHash = hashPassword(data.password);
  if (data.storeName !== undefined) account.storeName = data.storeName;
  if (data.status !== undefined) account.status = data.status;
  account.updatedAt = new Date().toISOString();
  await persistDatabase();
  return account;
}

/** Physical delete: removes the account record from storage. */
export async function deleteAccount(id: string): Promise<boolean> {
  const db = await readDatabase();
  const len = db.accounts.length;
  db.accounts = db.accounts.filter((a) => a.id !== id);
  if (db.accounts.length < len) {
    await persistDatabase();
    return true;
  }
  return false;
}

function bumpTicketNumber(db: Database, storeId: string): number {
  const current = db.counters[storeId] || 100;
  const next = current + 1;
  db.counters[storeId] = next;
  return next;
}

// ─── Queue Management ────────────────────────────────────
export async function getQueueByStore(storeId: string): Promise<QueueEntry[]> {
  const db = await readDatabase();
  return db.queue
    .filter((q) => q.storeId === storeId && !["DONE", "CANCELLED"].includes(q.status))
    .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
}

export async function getNextTicketNumber(storeId: string): Promise<number> {
  const db = await readDatabase();
  const n = bumpTicketNumber(db, storeId);
  await persistDatabase();
  return n;
}

export async function addToQueue(data: {
  storeId: string;
  adults: number;
  children: number;
  seatType: "TABLE" | "COUNTER" | "EITHER";
  phone?: string;
}): Promise<QueueEntry> {
  const db = await readDatabase();
  const ticketNumber = bumpTicketNumber(db, data.storeId);
  const now = new Date().toISOString();
  const entry: QueueEntry = {
    id: crypto.randomUUID(),
    storeId: data.storeId,
    ticketNumber,
    adults: data.adults,
    children: data.children,
    phone: data.phone,
    seatType: data.seatType,
    status: "WAITING",
    arrivalTime: now,
    createdAt: now,
    updatedAt: now,
  };
  db.queue.push(entry);
  await persistDatabase();
  return entry;
}

export async function updateQueueStatus(
  id: string,
  status: "WAITING" | "CALLED" | "HOLD" | "DONE" | "CANCELLED"
): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  if (status === "CALLED") {
    entry.calledAt = new Date().toISOString();
  }
  await persistDatabase();
  return entry;
}

export async function removeFromQueue(id: string): Promise<boolean> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) return false;
  entry.status = "CANCELLED";
  entry.updatedAt = new Date().toISOString();
  await persistDatabase();
  return true;
}

export async function getQueueEntryById(id: string): Promise<QueueEntry | undefined> {
  const db = await readDatabase();
  return db.queue.find((q) => q.id === id);
}

export async function getQueuePosition(
  storeId: string,
  entryId: string
): Promise<{ position: number; estimatedWait: number } | null> {
  const queue = await getQueueByStore(storeId);
  const idx = queue.findIndex((q) => q.id === entryId);
  if (idx === -1) return null;
  return {
    position: idx,
    estimatedWait: idx * 5,
  };
}

export async function getQueueStats(storeId: string): Promise<{
  waitingCount: number;
  estimatedWait: number;
  currentTicket: number | null;
}> {
  const queue = await getQueueByStore(storeId);
  const waiting = queue.filter((q) => q.status === "WAITING");
  const called = queue.filter((q) => q.status === "CALLED");
  return {
    waitingCount: waiting.length,
    estimatedWait: waiting.length * 5,
    currentTicket: called.length > 0 ? called[called.length - 1].ticketNumber : null,
  };
}

export async function getQueueHistory(storeId: string): Promise<QueueEntry[]> {
  const db = await readDatabase();
  return db.queue
    .filter((q) => q.storeId === storeId && ["DONE", "CANCELLED"].includes(q.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function restoreQueueEntry(id: string): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  entry.status = "WAITING";
  entry.updatedAt = new Date().toISOString();
  await persistDatabase();
  return entry;
}

// ─── Store Settings ─────────────────────────────────────
function getDefaultStoreSettings(storeId: string): StoreSettings {
  return {
    storeId,
    businessHours: [
      { id: "1", days: "月・火・水・木・金", hours: "10:00〜20:00" },
      { id: "2", days: "土・日", hours: "11:00〜22:00" },
    ],
    closedDays: [{ id: "1", day: "毎週月曜" }],
    isReceptionOpen: true,
    isTodayException: false,
    callMessage: "番号 {number} のお客様、ご来店をお願いいたします。",
    autoCancelMinutes: 10,
    updatedAt: new Date().toISOString(),
    portalDisplayName: "",
    portalCategory: "レストラン",
    portalImageUrl: "",
    portalTags: [],
    portalDescription: "",
    portalAddress: "",
    portalDistanceLabel: "",
    portalRating: 4.5,
    portalPriceRange: "¥1,000〜¥3,000",
    portalHoursSummary: "",
    portalMenuItems: [],
    portalReviews: [],
  };
}

function normalizeStoreSettings(raw: StoreSettings): StoreSettings {
  const d = getDefaultStoreSettings(raw.storeId);
  return {
    ...d,
    ...raw,
    businessHours: Array.isArray(raw.businessHours) && raw.businessHours.length > 0 ? raw.businessHours : d.businessHours,
    closedDays: Array.isArray(raw.closedDays) && raw.closedDays.length > 0 ? raw.closedDays : d.closedDays,
    portalTags: Array.isArray(raw.portalTags) ? raw.portalTags : d.portalTags,
    portalMenuItems: Array.isArray(raw.portalMenuItems) ? raw.portalMenuItems : d.portalMenuItems,
    portalReviews: Array.isArray(raw.portalReviews) ? raw.portalReviews : d.portalReviews,
    portalRating: typeof raw.portalRating === "number" && !Number.isNaN(raw.portalRating) ? raw.portalRating : d.portalRating,
  };
}

function formatPortalHours(s: StoreSettings): string {
  const summary = s.portalHoursSummary?.trim();
  if (summary) return summary;
  const parts = s.businessHours.map((bh) => `${bh.days} ${bh.hours}`);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

const FALLBACK_PORTAL_IMAGE = "https://picsum.photos/seed/etable-portal/400/300";

/**
 * アカウントが存在する店舗のみ公開（マスタの店舗 ID と紐づく画面向け）
 */
export async function getStorePortalProfile(storeId: string): Promise<StorePortalProfile | null> {
  const account = await getAccountById(storeId);
  if (!account || account.status !== "ACTIVE") {
    return null;
  }
  const s = normalizeStoreSettings(await getStoreSettings(storeId));
  const stats = await getQueueStats(storeId);
  const waitingGroups = stats.waitingCount;
  const estimated = stats.estimatedWait;
  const approxWaitText = waitingGroups === 0 ? "空いています" : `約${estimated}分`;
  const name = s.portalDisplayName?.trim() || account.storeName;
  const imageUrl = s.portalImageUrl?.trim() || FALLBACK_PORTAL_IMAGE;
  return {
    storeId,
    name,
    category: s.portalCategory?.trim() || "レストラン",
    imageUrl,
    tags: s.portalTags,
    description: s.portalDescription?.trim() || "",
    address: s.portalAddress?.trim() || "",
    distance: s.portalDistanceLabel?.trim() || "—",
    rating: Math.min(5, Math.max(0, s.portalRating)),
    priceRange: s.portalPriceRange?.trim() || "—",
    hours: formatPortalHours(s),
    businessHours: s.businessHours,
    menu: s.portalMenuItems,
    reviews: s.portalReviews,
    waitingGroups,
    approxWaitText,
    shortestWaitMinutes: estimated,
  };
}

export async function listActiveStoreProfiles(): Promise<StorePortalProfile[]> {
  const accounts = await getAllAccounts();
  const active = accounts.filter((a) => a.status === "ACTIVE");
  const profiles = await Promise.all(active.map((a) => getStorePortalProfile(a.id)));
  return profiles.filter((p): p is StorePortalProfile => p !== null);
}

export async function getStoreSettings(storeId: string): Promise<StoreSettings> {
  const db = await readDatabase();
  if (!db.storeSettings) db.storeSettings = [];
  let settings = db.storeSettings.find((s) => s.storeId === storeId);
  if (!settings) {
    settings = getDefaultStoreSettings(storeId);
    db.storeSettings.push(settings);
    await persistDatabase();
  }
  return normalizeStoreSettings(settings);
}

export async function updateStoreSettings(
  storeId: string,
  data: Partial<Omit<StoreSettings, "storeId">>
): Promise<StoreSettings> {
  const db = await readDatabase();
  if (!db.storeSettings) db.storeSettings = [];
  let idx = db.storeSettings.findIndex((s) => s.storeId === storeId);
  if (idx === -1) {
    db.storeSettings.push(getDefaultStoreSettings(storeId));
    idx = db.storeSettings.length - 1;
  }
  db.storeSettings[idx] = normalizeStoreSettings(db.storeSettings[idx]);
  const settings = db.storeSettings[idx];
  if (data.businessHours !== undefined) settings.businessHours = data.businessHours;
  if (data.closedDays !== undefined) settings.closedDays = data.closedDays;
  if (data.isReceptionOpen !== undefined) settings.isReceptionOpen = data.isReceptionOpen;
  if (data.isTodayException !== undefined) settings.isTodayException = data.isTodayException;
  if (data.callMessage !== undefined) settings.callMessage = data.callMessage;
  if (data.autoCancelMinutes !== undefined) settings.autoCancelMinutes = data.autoCancelMinutes;
  if (data.portalDisplayName !== undefined) settings.portalDisplayName = data.portalDisplayName;
  if (data.portalCategory !== undefined) settings.portalCategory = data.portalCategory;
  if (data.portalImageUrl !== undefined) {
    const v = data.portalImageUrl.trim();
    if (v.length > 2_000_000) {
      throw new Error("メイン画像のデータが大きすぎます。画像を小さくしてから再度お試しください。");
    }
    settings.portalImageUrl = v;
  }
  if (data.portalTags !== undefined) settings.portalTags = data.portalTags;
  if (data.portalDescription !== undefined) settings.portalDescription = data.portalDescription;
  if (data.portalAddress !== undefined) settings.portalAddress = data.portalAddress;
  if (data.portalDistanceLabel !== undefined) settings.portalDistanceLabel = data.portalDistanceLabel;
  if (data.portalRating !== undefined) settings.portalRating = data.portalRating;
  if (data.portalPriceRange !== undefined) settings.portalPriceRange = data.portalPriceRange;
  if (data.portalHoursSummary !== undefined) settings.portalHoursSummary = data.portalHoursSummary;
  if (data.portalMenuItems !== undefined) settings.portalMenuItems = data.portalMenuItems;
  if (data.portalReviews !== undefined) settings.portalReviews = data.portalReviews;
  settings.updatedAt = new Date().toISOString();
  await persistDatabase();
  return normalizeStoreSettings(settings);
}

// ─── Customer portal profiles ────────────────────────────
export async function getCustomerProfileById(id: string): Promise<CustomerProfileRecord | undefined> {
  const db = await readDatabase();
  if (!db.customerProfiles) db.customerProfiles = [];
  return db.customerProfiles.find((c) => c.id === id);
}

export async function createCustomerProfile(data: {
  displayName: string;
  email?: string;
  phone?: string;
}): Promise<CustomerProfileRecord> {
  const db = await readDatabase();
  if (!db.customerProfiles) db.customerProfiles = [];
  const now = new Date().toISOString();
  const row: CustomerProfileRecord = {
    id: crypto.randomUUID(),
    displayName: data.displayName.trim(),
    email: (data.email ?? "").trim(),
    phone: (data.phone ?? "").trim(),
    createdAt: now,
    updatedAt: now,
  };
  db.customerProfiles.push(row);
  await persistDatabase();
  return row;
}

export async function updateCustomerProfile(
  id: string,
  data: Partial<{ displayName: string; email: string; phone: string }>
): Promise<CustomerProfileRecord> {
  const db = await readDatabase();
  if (!db.customerProfiles) db.customerProfiles = [];
  const idx = db.customerProfiles.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("顧客が見つかりません");
  const row = db.customerProfiles[idx];
  if (data.displayName !== undefined) row.displayName = data.displayName.trim();
  if (data.email !== undefined) row.email = data.email.trim();
  if (data.phone !== undefined) row.phone = data.phone.trim();
  row.updatedAt = new Date().toISOString();
  await persistDatabase();
  return row;
}

export async function deleteCustomerProfile(id: string): Promise<boolean> {
  const db = await readDatabase();
  if (!db.customerProfiles?.length) return false;
  const len = db.customerProfiles.length;
  db.customerProfiles = db.customerProfiles.filter((c) => c.id !== id);
  if (db.customerProfiles.length < len) {
    await persistDatabase();
    return true;
  }
  return false;
}

// ─── Survey Responses ───────────────────────────────────
export async function addSurveyResponse(data: Omit<SurveyResponse, "id" | "visitedAt">): Promise<SurveyResponse> {
  const db = await readDatabase();
  if (!db.surveyResponses) db.surveyResponses = [];
  const row: SurveyResponse = {
    id: crypto.randomUUID(),
    visitedAt: new Date().toISOString(),
    ...data,
  };
  db.surveyResponses.push(row);
  await persistDatabase();
  return row;
}

export async function getSurveyResponses(
  storeId: string,
  from?: string,
  to?: string
): Promise<SurveyResponse[]> {
  const db = await readDatabase();
  if (!db.surveyResponses) return [];
  return db.surveyResponses.filter((r) => {
    if (r.storeId !== storeId) return false;
    if (from && r.visitedAt < from) return false;
    if (to && r.visitedAt > to) return false;
    return true;
  });
}
