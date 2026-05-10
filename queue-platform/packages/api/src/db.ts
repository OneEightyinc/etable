/**
 * Database layer: local `data/db.json` or Upstash Redis / Vercel KV when REST env is set.
 * On Vercel, set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL + KV_REST_API_TOKEN).
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { waitingIndexForEntry, waitingLineEntries } from "./queue-waiting-line";
import { pushLineMessage, formatCallMessage } from "./line";

// ─── Types ───────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: "SUPER_ADMIN" | "STORE_ADMIN";
  createdAt: string;
}

/** 店舗ごとに独立した推測困難なURL用トークン（マスタが発行・一覧に表示） */
export type PublicUrlTokenKind = "storeAdmin" | "kiosk" | "portal" | "survey";

export type PublicUrlTokens = Record<PublicUrlTokenKind, string>;

export interface Account {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  storeName: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
  /** 未設定の既存データは read 時に自動採番 */
  publicUrlTokens?: Partial<PublicUrlTokens>;
  /** 軽量 employeeId プロファイル: 店舗共通アカウント配下の担当者一覧 */
  employees?: Employee[];
}

/** 店舗の従業員（軽量プロファイル）。Account に紐付く。 */
export interface Employee {
  id: string;
  name: string;
  createdAt: string;
}

/** 操作ログの actor 情報。mutation 関数群に optional で渡す。 */
export type Actor = {
  employeeId: string;
  employeeName: string;
};

/** 操作ログ。クレーム対応や監査のため、誰がいつ何をしたかを記録する。 */
export interface OperationLog {
  id: string;
  storeId: string;
  entryId?: string;
  ticketNumber?: number;
  action:
    | "CALL"
    | "RECALL"
    | "DONE"
    | "HOLD"
    | "BACK_TO_WAITING"
    | "CANCEL"
    | "POSTPONE_USER"
    | "POSTPONE_STORE"
    | "EDIT"
    | "EMPLOYEE_SELECT";
  employeeId?: string;
  employeeName?: string;
  details?: Record<string, unknown>;
  createdAt: string;
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
  /** ユーザーが後回しにした回数（累積） */
  userPostponedCount?: number;
  /** 後回し中: 自分の前に通常待ちが何組消化されたら通常待機に戻るか（残り組数）。 */
  postponeRemainingSlots?: number;
  /** 何度呼び出したか。0=未呼び出し / 1=初回呼び出し済み / 2=再呼び出し済み（次回の不在で自動キャンセル）。 */
  recallCount?: number;
  /** HOLD 状態の理由。現状は不在検知のみ。 */
  holdReason?: "NO_SHOW";
  /** 通知用メールアドレス（ゲスト時の入力 or プロファイルから denormalize） */
  email?: string;
  /** LINE 連携済み顧客の userId（LIFF 経由で取得） */
  lineUserId?: string;
  /** LINE で通知を受け取る設定 */
  notificationLine?: boolean;
  /** メールで通知を受け取る設定 */
  notificationEmail?: boolean;
  /** 会員顧客ID（ポイント付与用） */
  customerId?: string;
  /** 受付アンケート: 利用目的（PDF F の入口アンケート） */
  visitPurpose?: "lunch" | "dinner" | "drinking" | "date" | "work_cafe" | "other";
  /** 受付アンケート: 利用形態 */
  groupType?: "solo" | "friends" | "couple" | "family" | "business";
  /** 「あと N 組」事前 LINE 通知を発火した時刻。重複送信防止用、エントリごと最大 1 回。 */
  aheadNotifiedAt?: string;
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
  /** ユーザーが「後回しにする」を選んだ際の既定スロット数。範囲 2〜5。 */
  defaultPostponeSlots: number;
  /** 「あと N 組」事前通知の閾値。残 N 組以下になった瞬間に LINE 通知を 1 度発火。範囲 1〜10、デフォルト 3。 */
  notifyAheadSlots: number;
  updatedAt: string;
  /** 顧客ポータル表示名（空ならアカウントの店舗名） */
  portalDisplayName: string;
  portalCategory: string;
  portalImageUrl: string;
  portalTags: string[];
  portalDescription: string;
  portalAddress: string;
  portalDistanceLabel: string;
  portalLat: number | null;
  portalLng: number | null;
  portalRating: number;
  portalPriceRange: string;
  /** 未入力時は businessHours から自動整形 */
  portalHoursSummary: string;
  portalMenuItems: { name: string; price: string }[];
  portalReviews: { author: string; rating: number; comment: string }[];
  /** アイドルタイムボーナス設定 */
  idleTimeBonus?: {
    enabled: boolean;
    startHour: number;   // e.g. 14
    endHour: number;     // e.g. 17
    bonusPoints: number; // e.g. 100 (通常来店100pt + bonus 100pt = 合計200pt)
    days: string[];      // e.g. ["mon","tue","wed","thu","fri"]
  };
  /** 「1〜2 名」タブを店舗ビューに追加表示するか（小人数の素早い案内動線用） */
  showSmallPartyTab?: boolean;
}

/** 顧客ポータル会員（DB 永続化） */
export interface CustomerProfileRecord {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  totalPoints: number;
  currentTier: MemberTier;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export type MemberTier = "BRONZE" | "SILVER" | "GOLD";

export type PointAction =
  | "FIRST_VISIT"       // 初回会員登録 +200
  | "VISIT"             // 来店（案内完了時） +100
  | "SURVEY"            // 待機中アンケート +50
  | "GOOGLE_REVIEW"     // Googleレビュー投稿 +300
  | "REFERRAL_SENT"     // 友達招待（招待者側）+150
  | "REFERRAL_RECEIVED" // 友達招待（被招待者側）+150
  | "IDLE_TIME_BONUS"   // アイドルタイムボーナス +100
  | "STAMP_RALLY"       // スタンプラリー
  | "MANUAL";           // 手動調整

export interface PointHistoryRecord {
  id: string;
  customerId: string;
  action: PointAction;
  points: number;
  description: string;
  createdAt: string;
}

/** アクション別の基本付与ポイント */
export const POINT_RULES: Record<string, number> = {
  FIRST_VISIT: 200,
  VISIT: 100,
  SURVEY: 50,
  GOOGLE_REVIEW: 300,
  REFERRAL_SENT: 150,
  REFERRAL_RECEIVED: 150,
  IDLE_TIME_BONUS: 100,
};

/** ランク判定閾値 */
export function calculateTier(totalPoints: number): MemberTier {
  if (totalPoints >= 1500) return "GOLD";
  if (totalPoints >= 500) return "SILVER";
  return "BRONZE";
}

/** ランク別特典 */
export const TIER_BENEFITS: Record<MemberTier, string[]> = {
  BRONZE: [],
  SILVER: ["ファストパス1回券"],
  GOLD: ["ファストパス月2回", "1ドリンク無料"],
};

/** メニューカテゴリ */
export interface MenuCategory {
  id: string;
  storeId: string;
  name: string;
  sortOrder: number;
}

/** メニューアイテム */
export interface MenuItem {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  soldOut: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** 注文ステータス */
export type OrderStatus = "ORDERED" | "PREPARING" | "SERVED" | "PAID" | "CANCELLED";

/** 注文 */
export interface Order {
  id: string;
  storeId: string;
  tableLabel: string;        // テーブル番号 or 整理券番号
  customerId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paidAmount?: number;
  createdAt: string;
  updatedAt: string;
}

/** 注文アイテム */
export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

/** 待機中ミニアンケート */
export interface WaitingSurveyRecord {
  id: string;
  storeId: string;
  customerId?: string;
  queueEntryId: string;
  discoveryChannel: string;   // Instagram, TikTok, Google, 友人紹介, 通りがかり, etc.
  wantToEatMenu: string;      // 食べたいメニュー（自由記述）
  createdAt: string;
}

/** 食後満足度レビュー */
export interface PostVisitReviewRecord {
  id: string;
  storeId: string;
  customerId?: string;
  queueEntryId?: string;
  rating: number;             // 1-5
  feedback?: string;          // 星1-3の場合の内部フィードバック
  googleReviewSubmitted: boolean;
  createdAt: string;
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
  lat: number | null;
  lng: number | null;
  rating: number;
  priceRange: string;
  hours: string;
  businessHours: { id: string; days: string; hours: string }[];
  menu: { name: string; price: string }[];
  reviews: { author: string; rating: number; comment: string }[];
  waitingGroups: number;
  approxWaitText: string;
  shortestWaitMinutes: number;
  defaultPostponeSlots: number;
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
  pointHistory: PointHistoryRecord[];
  waitingSurveys: WaitingSurveyRecord[];
  postVisitReviews: PostVisitReviewRecord[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  /** 操作ログ（後回し・キャンセル等の actor 記録）。古いものから削除する場合は別途実装。 */
  operationLogs: OperationLog[];
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

const PUBLIC_URL_KINDS: PublicUrlTokenKind[] = ["storeAdmin", "kiosk", "portal", "survey"];

function newPublicOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** アカウントに不足している publicUrlTokens を埋める。変更があれば true */
function ensureAccountPublicTokens(account: Account): boolean {
  if (!account.publicUrlTokens || typeof account.publicUrlTokens !== "object") {
    account.publicUrlTokens = {};
  }
  const t = account.publicUrlTokens;
  let changed = false;
  for (const k of PUBLIC_URL_KINDS) {
    const v = t[k];
    if (typeof v !== "string" || v.length < 32) {
      t[k] = newPublicOpaqueToken();
      changed = true;
    }
  }
  return changed;
}

async function ensureAllAccountsPublicTokens(): Promise<void> {
  const db = globalForDb._queueDb;
  if (!db?.accounts?.length) return;
  let changed = false;
  for (const a of db.accounts) {
    if (ensureAccountPublicTokens(a)) changed = true;
  }
  if (changed) await persistDatabase();
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
    pointHistory: [],
    waitingSurveys: [],
    postVisitReviews: [],
    menuCategories: [],
    menuItems: [],
    orders: [],
    operationLogs: [],
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
    pointHistory: Array.isArray(d.pointHistory) ? (d.pointHistory as PointHistoryRecord[]) : [],
    waitingSurveys: Array.isArray(d.waitingSurveys) ? (d.waitingSurveys as WaitingSurveyRecord[]) : [],
    postVisitReviews: Array.isArray(d.postVisitReviews) ? (d.postVisitReviews as PostVisitReviewRecord[]) : [],
    menuCategories: Array.isArray(d.menuCategories) ? (d.menuCategories as MenuCategory[]) : [],
    menuItems: Array.isArray(d.menuItems) ? (d.menuItems as MenuItem[]) : [],
    orders: Array.isArray(d.orders) ? (d.orders as Order[]) : [],
    operationLogs: Array.isArray(d.operationLogs) ? (d.operationLogs as OperationLog[]) : [],
  };
}

const globalForDb = globalThis as unknown as { _queueDb?: Database };

function loadDbFromFile(forceReload = false): Database {
  if (!forceReload && globalForDb._queueDb) return globalForDb._queueDb;

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
      await ensureAllAccountsPublicTokens();
      return globalForDb._queueDb!;
    }
    globalForDb._queueDb = getDefaultDb();
    await persistDatabase();
    await ensureAllAccountsPublicTokens();
    return globalForDb._queueDb!;
  }
  const fileDb = loadDbFromFile(true);
  await ensureAllAccountsPublicTokens();
  return fileDb;
}

/**
 * 不透明トークンから店舗IDを解決（ACTIVE のみ）
 */
export async function resolvePublicUrlToken(
  kind: PublicUrlTokenKind,
  token: string
): Promise<string | null> {
  const raw = typeof token === "string" ? token.trim() : "";
  /** hex トークンは DB と URL で表記ゆれしうるため小文字に正規化 */
  const t = raw.toLowerCase();
  if (t.length < 32) return null;
  const db = await readDatabase();
  const acc = db.accounts.find((a) => {
    if (a.status !== "ACTIVE") return false;
    const stored = a.publicUrlTokens?.[kind];
    if (typeof stored !== "string") return false;
    return stored.toLowerCase() === t;
  });
  return acc ? acc.id : null;
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
    publicUrlTokens: {
      storeAdmin: newPublicOpaqueToken(),
      kiosk: newPublicOpaqueToken(),
      portal: newPublicOpaqueToken(),
      survey: newPublicOpaqueToken(),
    },
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

// ─── Employees & Operation Logs ───────────────────────────

function appendOperationLogInDb(
  db: Database,
  storeId: string,
  action: OperationLog["action"],
  actor: Actor | undefined,
  options: { entryId?: string; ticketNumber?: number; details?: Record<string, unknown> } = {}
): void {
  if (!db.operationLogs) db.operationLogs = [];
  db.operationLogs.push({
    id: crypto.randomUUID(),
    storeId,
    entryId: options.entryId,
    ticketNumber: options.ticketNumber,
    action,
    employeeId: actor?.employeeId,
    employeeName: actor?.employeeName,
    details: options.details,
    createdAt: new Date().toISOString(),
  });
}

export async function listEmployees(storeId: string): Promise<Employee[]> {
  const db = await readDatabase();
  const account = db.accounts.find((a) => a.id === storeId);
  return Array.isArray(account?.employees) ? [...account!.employees!] : [];
}

export async function addEmployee(storeId: string, name: string): Promise<Employee> {
  const trimmed = (name ?? "").trim();
  if (!trimmed) throw new Error("名前を入力してください");
  if (trimmed.length > 30) throw new Error("名前は30文字以内で入力してください");
  const db = await readDatabase();
  const account = db.accounts.find((a) => a.id === storeId);
  if (!account) throw new Error("店舗アカウントが見つかりません");
  if (!Array.isArray(account.employees)) account.employees = [];
  if (account.employees.some((e) => e.name === trimmed)) {
    throw new Error("同じ名前の担当者が既に登録されています");
  }
  const emp: Employee = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
  account.employees.push(emp);
  account.updatedAt = new Date().toISOString();
  await persistDatabase();
  return emp;
}

export async function removeEmployee(storeId: string, employeeId: string): Promise<void> {
  const db = await readDatabase();
  const account = db.accounts.find((a) => a.id === storeId);
  if (!account || !Array.isArray(account.employees)) return;
  account.employees = account.employees.filter((e) => e.id !== employeeId);
  account.updatedAt = new Date().toISOString();
  await persistDatabase();
}

/** 操作ログを店舗単位で新しい順に最大 limit 件取得。 */
export async function listOperationLogs(storeId: string, limit = 200): Promise<OperationLog[]> {
  const db = await readDatabase();
  const logs = (db.operationLogs ?? []).filter((l) => l.storeId === storeId);
  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return logs.slice(0, Math.max(0, Math.floor(limit)));
}

// ─── Queue Management ────────────────────────────────────
/** 呼び出し→未応答の自動遷移閾値のデフォルト（分）。storeSettings.autoCancelMinutes が未設定/不正の場合に使用。 */
const DEFAULT_CALLOUT_TIMEOUT_MIN = 5;

/** db スナップショットから storeId のキャンセル猶予時間（ミリ秒）を返す。 */
function getCalloutTimeoutMs(db: Database, storeId: string): number {
  const s = db.storeSettings?.find((x) => x.storeId === storeId);
  const min = typeof s?.autoCancelMinutes === "number" && s.autoCancelMinutes > 0
    ? s.autoCancelMinutes
    : DEFAULT_CALLOUT_TIMEOUT_MIN;
  return min * 60 * 1000;
}

function getActiveQueueForStore(db: Database, storeId: string): QueueEntry[] {
  const q = db.queue ?? [];
  return q
    .filter((e) => e.storeId === storeId && !["DONE", "CANCELLED"].includes(e.status))
    .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
}

/**
 * CALLED 状態のエントリのうち、calledAt から CALLOUT_TIMEOUT_MS 以上経過したものを
 * 自動で HOLD（1 回目）or CANCELLED（2 回目以降）に遷移させる。
 * getQueueByStore の冒頭で呼び、polling されるたびに自然に整合する設計。
 */
/**
 * WAITING エントリのうち、自分より前に並ぶ実待ち組数（CALLED 含まず、
 * 後回し中エントリは除く）が storeSettings.notifyAheadSlots 以下になり、
 * かつ aheadNotifiedAt が未設定で LINE 連携済みのものに対し、
 * 「あと N 組」事前通知を 1 度だけ発火する。
 */
function processAheadNotificationsInDb(db: Database, storeId: string): boolean {
  const settings = db.storeSettings?.find((s) => s.storeId === storeId);
  const threshold = typeof settings?.notifyAheadSlots === "number" && settings.notifyAheadSlots > 0
    ? settings.notifyAheadSlots
    : 3;
  const waiting = db.queue
    .filter((e) => e.storeId === storeId && e.status === "WAITING" && !((e.postponeRemainingSlots ?? 0) > 0))
    .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
  let changed = false;
  for (let i = 0; i < waiting.length; i++) {
    const entry = waiting[i];
    if (i > threshold) break;
    if (entry.aheadNotifiedAt) continue;
    if (!entry.notificationLine || !entry.lineUserId) continue;
    const ahead = i;
    if (ahead > threshold) continue;
    entry.aheadNotifiedAt = new Date().toISOString();
    changed = true;
    const text = ahead === 0
      ? "まもなくお呼び出しです。お席の準備を整えてお待ちください。"
      : `あと ${ahead} 組でお呼び出しです。お近くでお待ちください。`;
    void pushLineMessage(entry.lineUserId, [{ type: "text", text }]);
  }
  return changed;
}

function processStaleCalloutsInDb(db: Database, storeId: string): boolean {
  const now = Date.now();
  const timeoutMs = getCalloutTimeoutMs(db, storeId);
  let changed = false;
  for (const e of db.queue) {
    if (e.storeId !== storeId) continue;
    if (e.status !== "CALLED") continue;
    if (!e.calledAt) continue;
    const elapsed = now - new Date(e.calledAt).getTime();
    if (elapsed < timeoutMs) continue;
    if ((e.recallCount ?? 0) >= 2) {
      e.status = "CANCELLED";
    } else {
      e.status = "HOLD";
      e.holdReason = "NO_SHOW";
    }
    e.updatedAt = new Date().toISOString();
    changed = true;
  }
  return changed;
}

export async function getQueueByStore(storeId: string): Promise<QueueEntry[]> {
  const db = await readDatabase();
  const stale = processStaleCalloutsInDb(db, storeId);
  const ahead = processAheadNotificationsInDb(db, storeId);
  if (stale || ahead) {
    await persistDatabase();
  }
  return getActiveQueueForStore(db, storeId);
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
  visitPurpose?: QueueEntry["visitPurpose"];
  groupType?: QueueEntry["groupType"];
  customerId?: string;
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
    visitPurpose: data.visitPurpose,
    groupType: data.groupType,
    customerId: data.customerId,
  };
  db.queue.push(entry);
  await persistDatabase();
  return entry;
}

export async function updateQueueDetails(
  id: string,
  data: Partial<{ adults: number; children: number; seatType: "TABLE" | "COUNTER" | "EITHER" }>,
  actor?: Actor
): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  const before = { adults: entry.adults, children: entry.children, seatType: entry.seatType };
  if (data.adults !== undefined) entry.adults = data.adults;
  if (data.children !== undefined) entry.children = data.children;
  if (data.seatType !== undefined) entry.seatType = data.seatType;
  entry.updatedAt = new Date().toISOString();
  appendOperationLogInDb(db, entry.storeId, "EDIT", actor, {
    entryId: entry.id,
    ticketNumber: entry.ticketNumber,
    details: { before, after: { adults: entry.adults, children: entry.children, seatType: entry.seatType } },
  });
  await persistDatabase();
  return entry;
}

export async function updateQueueStatus(
  id: string,
  status: "WAITING" | "CALLED" | "HOLD" | "DONE" | "CANCELLED",
  actor?: Actor
): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  const prevStatus = entry.status;
  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  if (status === "CALLED") {
    entry.calledAt = new Date().toISOString();
    entry.recallCount = (entry.recallCount ?? 0) + 1;
    // 呼び出した時点で HOLD 由来の再呼び出しなら holdReason を消す
    entry.holdReason = undefined;
  }
  if (status === "DONE" && prevStatus !== "DONE") {
    // 1組案内完了 → 同店舗の後回し中エントリの待機残スロットを 1 減らす
    consumePostponeSlotsInDb(db, entry.storeId);
  }
  if (status === "WAITING" && prevStatus !== "WAITING") {
    // 通常待機に戻ったので保留理由をクリア
    entry.holdReason = undefined;
  }

  // 操作ログを記録（status 遷移を action にマッピング）
  const action: OperationLog["action"] | null =
    status === "CALLED"
      ? (entry.recallCount ?? 0) >= 2 ? "RECALL" : "CALL"
      : status === "DONE" ? "DONE"
      : status === "HOLD" ? "HOLD"
      : status === "WAITING" && prevStatus === "HOLD" ? "BACK_TO_WAITING"
      : status === "CANCELLED" ? "CANCEL"
      : null;
  if (action) {
    appendOperationLogInDb(db, entry.storeId, action, actor, {
      entryId: entry.id,
      ticketNumber: entry.ticketNumber,
      details: { from: prevStatus, to: status },
    });
  }

  await persistDatabase();

  // CALLED 遷移時に LINE 通知を best-effort で発火（push 失敗はログだけ残す）
  if (status === "CALLED" && entry.notificationLine && entry.lineUserId) {
    const settings = db.storeSettings?.find((s) => s.storeId === entry.storeId);
    const template = settings?.callMessage ?? "";
    const text = formatCallMessage(template, entry.ticketNumber);
    void pushLineMessage(entry.lineUserId, [{ type: "text", text }]);
  }

  return entry;
}

/** 同一店舗の後回し中エントリの postponeRemainingSlots を 1 つずつ減らし、0 になったらフィールドを削除する。 */
function consumePostponeSlotsInDb(db: Database, storeId: string): void {
  for (const e of db.queue) {
    if (
      e.storeId === storeId &&
      e.status === "WAITING" &&
      typeof e.postponeRemainingSlots === "number" &&
      e.postponeRemainingSlots > 0
    ) {
      e.postponeRemainingSlots -= 1;
      if (e.postponeRemainingSlots <= 0) {
        e.postponeRemainingSlots = undefined;
      }
      e.updatedAt = new Date().toISOString();
    }
  }
}

/** ユーザー主導の後回し: status は WAITING のまま、3 組ぶん自分の前に消化されるまで番が回ってこない状態にする。
 *  store-admin から actor 付きで呼ばれた場合は POSTPONE_STORE として記録する（顧客本人発の場合は actor なしで POSTPONE_USER）。
 */
export async function userPostponeQueueEntry(id: string, slots = 3, actor?: Actor): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  entry.status = "WAITING";
  entry.holdReason = undefined;
  entry.postponeRemainingSlots = slots;
  entry.userPostponedCount = (entry.userPostponedCount ?? 0) + 1;
  entry.updatedAt = new Date().toISOString();
  appendOperationLogInDb(db, entry.storeId, actor ? "POSTPONE_STORE" : "POSTPONE_USER", actor, {
    entryId: entry.id,
    ticketNumber: entry.ticketNumber,
    details: { slots },
  });
  await persistDatabase();
  return entry;
}

/** 不在検知 → 保留状態に遷移。HOLD は店舗主導の不在対応のみで使う。 */
export async function markNoShowHold(id: string, actor?: Actor): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  entry.status = "HOLD";
  entry.holdReason = "NO_SHOW";
  entry.updatedAt = new Date().toISOString();
  appendOperationLogInDb(db, entry.storeId, "HOLD", actor, {
    entryId: entry.id,
    ticketNumber: entry.ticketNumber,
    details: { reason: "NO_SHOW" },
  });
  await persistDatabase();
  return entry;
}

/** LINE 連携: queue entry に lineUserId を保存し、LINE 通知を有効化する。 */
export async function linkLineUserToQueueEntry(
  id: string,
  lineUserId: string
): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  entry.lineUserId = lineUserId;
  entry.notificationLine = true;
  entry.updatedAt = new Date().toISOString();
  await persistDatabase();
  return entry;
}

/** 通知設定の更新（メール登録など）。 */
export async function setQueueNotificationPreferences(
  id: string,
  prefs: Partial<Pick<QueueEntry, "email" | "notificationEmail" | "notificationLine">>
): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  if (prefs.email !== undefined) entry.email = prefs.email;
  if (prefs.notificationEmail !== undefined) entry.notificationEmail = prefs.notificationEmail;
  if (prefs.notificationLine !== undefined) entry.notificationLine = prefs.notificationLine;
  entry.updatedAt = new Date().toISOString();
  await persistDatabase();
  return entry;
}

export async function removeFromQueue(id: string, actor?: Actor): Promise<boolean> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) return false;
  const prevStatus = entry.status;
  entry.status = "CANCELLED";
  entry.updatedAt = new Date().toISOString();
  appendOperationLogInDb(db, entry.storeId, "CANCEL", actor, {
    entryId: entry.id,
    ticketNumber: entry.ticketNumber,
    details: { from: prevStatus, to: "CANCELLED" },
  });
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
  const entry = queue.find((q) => q.id === entryId);
  if (!entry) return null;
  if (entry.status === "CALLED") {
    return { position: 0, estimatedWait: 0 };
  }
  if (entry.status === "DONE" || entry.status === "CANCELLED") {
    return null;
  }
  const idx = waitingIndexForEntry(queue, entryId);
  if (idx < 0) return null;
  // 後回し中（postponeRemainingSlots>0）は仮想的に N 組ぶん後ろにずらす
  const postponeShift = entry.postponeRemainingSlots ?? 0;
  const adjustedPosition = idx + postponeShift;
  return {
    position: adjustedPosition,
    estimatedWait: adjustedPosition * 5,
  };
}

function queueStatsFromActiveQueue(queue: QueueEntry[]): {
  waitingCount: number;
  estimatedWait: number;
  currentTicket: number | null;
} {
  const inLine = waitingLineEntries(queue);
  const called = queue.filter((q) => q.status === "CALLED");
  return {
    waitingCount: inLine.length,
    estimatedWait: inLine.length * 5,
    currentTicket: called.length > 0 ? called[called.length - 1].ticketNumber : null,
  };
}

export async function getQueueStats(storeId: string): Promise<{
  waitingCount: number;
  estimatedWait: number;
  currentTicket: number | null;
}> {
  const db = await readDatabase();
  return queueStatsFromActiveQueue(getActiveQueueForStore(db, storeId));
}

export async function getQueueHistory(storeId: string): Promise<QueueEntry[]> {
  const db = await readDatabase();
  return db.queue
    .filter((q) => q.storeId === storeId && ["DONE", "CANCELLED"].includes(q.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function incrementUserPostpone(id: string): Promise<QueueEntry> {
  const db = await readDatabase();
  const entry = db.queue.find((q) => q.id === id);
  if (!entry) throw new Error("順番待ちデータが見つかりません");
  entry.userPostponedCount = (entry.userPostponedCount ?? 0) + 1;
  entry.updatedAt = new Date().toISOString();
  await persistDatabase();
  return entry;
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
    autoCancelMinutes: 5,
    defaultPostponeSlots: 3,
    notifyAheadSlots: 3,
    showSmallPartyTab: false,
    updatedAt: new Date().toISOString(),
    portalDisplayName: "",
    portalCategory: "レストラン",
    portalImageUrl: "",
    portalTags: [],
    portalDescription: "",
    portalAddress: "",
    portalDistanceLabel: "",
    portalLat: null,
    portalLng: null,
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
    defaultPostponeSlots: typeof raw.defaultPostponeSlots === "number" && Number.isFinite(raw.defaultPostponeSlots)
      ? Math.min(5, Math.max(2, Math.round(raw.defaultPostponeSlots)))
      : d.defaultPostponeSlots,
    notifyAheadSlots: typeof raw.notifyAheadSlots === "number" && Number.isFinite(raw.notifyAheadSlots)
      ? Math.min(10, Math.max(1, Math.round(raw.notifyAheadSlots)))
      : d.notifyAheadSlots,
  };
}

function formatPortalHours(s: StoreSettings): string {
  const summary = s.portalHoursSummary?.trim();
  if (summary) return summary;
  const parts = s.businessHours.map((bh) => `${bh.days} ${bh.hours}`);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

const FALLBACK_PORTAL_IMAGE = "https://picsum.photos/seed/etable-portal/400/300";

const AGE_LABELS: Record<string, string> = {
  teens: "10代", "20s_early": "20代前半", "20s_late": "20代後半",
  "30s_early": "30代前半", "30s_late": "30代後半", "40s": "40代", "50s_plus": "50代以上",
};

function buildReviewsFromSurveys(
  surveys: SurveyResponse[],
  storeId: string
): { author: string; rating: number; comment: string }[] {
  return surveys
    .filter((s) => s.storeId === storeId && s.etableReview?.trim())
    .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
    .slice(0, 20)
    .map((s) => ({
      author: AGE_LABELS[s.ageGroup] ?? "お客様",
      rating: Math.min(5, Math.max(1, s.satisfactionScore)),
      comment: s.etableReview!.trim(),
    }));
}

function storePortalProfileFromParts(
  storeId: string,
  account: Account,
  s: StoreSettings,
  waitingGroups: number,
  estimated: number,
  reviews: { author: string; rating: number; comment: string }[]
): StorePortalProfile {
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
    lat: s.portalLat ?? null,
    lng: s.portalLng ?? null,
    rating: Math.min(5, Math.max(0, s.portalRating)),
    priceRange: s.portalPriceRange?.trim() || "—",
    hours: formatPortalHours(s),
    businessHours: s.businessHours,
    menu: s.portalMenuItems,
    reviews,
    waitingGroups,
    approxWaitText,
    shortestWaitMinutes: estimated,
    defaultPostponeSlots: s.defaultPostponeSlots,
  };
}

/**
 * 同一 DB スナップショット上でポータル用プロフィールを組み立てる（一覧 API の一貫性用）
 */
function buildPortalProfileFromDbSnapshot(db: Database, account: Account): StorePortalProfile | null {
  if (account.status !== "ACTIVE") return null;
  if (!db.storeSettings) db.storeSettings = [];
  let raw = db.storeSettings.find((x) => x.storeId === account.id);
  if (!raw) {
    raw = getDefaultStoreSettings(account.id);
    db.storeSettings.push(raw);
  }
  const s = normalizeStoreSettings(raw);
  const queue = getActiveQueueForStore(db, account.id);
  const { waitingCount: waitingGroups, estimatedWait: estimated } = queueStatsFromActiveQueue(queue);
  const reviews = buildReviewsFromSurveys(db.surveyResponses || [], account.id);
  return storePortalProfileFromParts(account.id, account, s, waitingGroups, estimated, reviews);
}

/**
 * アカウントが存在する店舗のみ公開（マスタの店舗 ID と紐づく画面向け）
 */
export async function getStorePortalProfile(storeId: string): Promise<StorePortalProfile | null> {
  const db = await readDatabase();
  const account = db.accounts.find((a) => a.id === storeId);
  if (!account || account.status !== "ACTIVE") {
    return null;
  }
  if (!db.storeSettings) db.storeSettings = [];
  const hadSettingsRow = db.storeSettings.some((s) => s.storeId === storeId);
  const profile = buildPortalProfileFromDbSnapshot(db, account);
  if (!hadSettingsRow) await persistDatabase();
  return profile;
}

export async function listActiveStoreProfiles(): Promise<StorePortalProfile[]> {
  const db = await readDatabase();
  if (!db.storeSettings) db.storeSettings = [];
  const active = db.accounts.filter((a) => a.status === "ACTIVE");
  let needPersist = false;
  const out: StorePortalProfile[] = [];
  for (const account of active) {
    try {
      const missingSettings = !db.storeSettings.some((s) => s.storeId === account.id);
      const p = buildPortalProfileFromDbSnapshot(db, account);
      if (missingSettings) needPersist = true;
      if (p) out.push(p);
    } catch (e) {
      console.error("[listActiveStoreProfiles]", account.id, e);
    }
  }
  if (needPersist) await persistDatabase();
  return out;
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
  if (data.defaultPostponeSlots !== undefined) {
    const n = Math.round(Number(data.defaultPostponeSlots));
    settings.defaultPostponeSlots = Number.isFinite(n) ? Math.min(5, Math.max(2, n)) : 3;
  }
  if (data.showSmallPartyTab !== undefined) settings.showSmallPartyTab = data.showSmallPartyTab;
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
  if (data.portalLat !== undefined) settings.portalLat = data.portalLat;
  if (data.portalLng !== undefined) settings.portalLng = data.portalLng;
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
  const profile = db.customerProfiles.find((c) => c.id === id);
  if (profile) {
    // 既存プロフィールに新フィールドがない場合は自動補完
    let changed = false;
    if (!profile.referralCode) {
      profile.referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      changed = true;
    }
    if (profile.totalPoints === undefined) {
      profile.totalPoints = 0;
      changed = true;
    }
    if (!profile.currentTier) {
      profile.currentTier = calculateTier(profile.totalPoints);
      changed = true;
    }
    if (profile.avatarUrl === undefined) {
      profile.avatarUrl = "";
      changed = true;
    }
    if (changed) await persistDatabase();
  }
  return profile;
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
    avatarUrl: "",
    totalPoints: 0,
    currentTier: "BRONZE",
    referralCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
    createdAt: now,
    updatedAt: now,
  };
  db.customerProfiles.push(row);
  await persistDatabase();
  return row;
}

export async function updateCustomerProfile(
  id: string,
  data: Partial<{ displayName: string; email: string; phone: string; avatarUrl: string }>
): Promise<CustomerProfileRecord> {
  const db = await readDatabase();
  if (!db.customerProfiles) db.customerProfiles = [];
  const idx = db.customerProfiles.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("顧客が見つかりません");
  const row = db.customerProfiles[idx];
  if (data.displayName !== undefined) row.displayName = data.displayName.trim();
  if (data.email !== undefined) row.email = data.email.trim();
  if (data.phone !== undefined) row.phone = data.phone.trim();
  if (data.avatarUrl !== undefined) row.avatarUrl = data.avatarUrl;
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

// ─── Points ─────────────────────────────────────────────

/** ポイント付与（顧客のtotalPoints・currentTierも更新） */
export async function addPoints(
  customerId: string,
  action: PointAction,
  points: number,
  description: string
): Promise<{ profile: CustomerProfileRecord; history: PointHistoryRecord }> {
  const db = await readDatabase();
  if (!db.pointHistory) db.pointHistory = [];
  const profile = (db.customerProfiles ?? []).find((c) => c.id === customerId);
  if (!profile) throw new Error("顧客が見つかりません");

  const record: PointHistoryRecord = {
    id: crypto.randomUUID(),
    customerId,
    action,
    points,
    description,
    createdAt: new Date().toISOString(),
  };
  db.pointHistory.push(record);

  // プロフィール更新
  profile.totalPoints = (profile.totalPoints ?? 0) + points;
  profile.currentTier = calculateTier(profile.totalPoints);
  profile.updatedAt = new Date().toISOString();

  await persistDatabase();
  return { profile, history: record };
}

/** ポイント履歴取得 */
export async function getPointHistory(customerId: string): Promise<PointHistoryRecord[]> {
  const db = await readDatabase();
  return (db.pointHistory ?? [])
    .filter((h) => h.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** 招待コードから顧客を検索 */
export async function findCustomerByReferralCode(code: string): Promise<CustomerProfileRecord | undefined> {
  const db = await readDatabase();
  return (db.customerProfiles ?? []).find((c) => c.referralCode === code.toUpperCase());
}

// ─── Menu ───────────────────────────────────────────────

export async function getMenuCategories(storeId: string): Promise<MenuCategory[]> {
  const db = await readDatabase();
  return (db.menuCategories ?? []).filter((c) => c.storeId === storeId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertMenuCategory(data: { id?: string; storeId: string; name: string; sortOrder?: number }): Promise<MenuCategory> {
  const db = await readDatabase();
  if (!db.menuCategories) db.menuCategories = [];
  if (data.id) {
    const idx = db.menuCategories.findIndex((c) => c.id === data.id);
    if (idx >= 0) {
      db.menuCategories[idx].name = data.name;
      if (data.sortOrder !== undefined) db.menuCategories[idx].sortOrder = data.sortOrder;
      await persistDatabase();
      return db.menuCategories[idx];
    }
  }
  const cat: MenuCategory = {
    id: crypto.randomUUID(),
    storeId: data.storeId,
    name: data.name,
    sortOrder: data.sortOrder ?? db.menuCategories.filter((c) => c.storeId === data.storeId).length,
  };
  db.menuCategories.push(cat);
  await persistDatabase();
  return cat;
}

export async function deleteMenuCategory(id: string): Promise<void> {
  const db = await readDatabase();
  db.menuCategories = (db.menuCategories ?? []).filter((c) => c.id !== id);
  await persistDatabase();
}

export async function getMenuItems(storeId: string): Promise<MenuItem[]> {
  const db = await readDatabase();
  return (db.menuItems ?? []).filter((m) => m.storeId === storeId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertMenuItem(data: Partial<MenuItem> & { storeId: string; name: string; price: number; categoryId: string }): Promise<MenuItem> {
  const db = await readDatabase();
  if (!db.menuItems) db.menuItems = [];
  const now = new Date().toISOString();
  if (data.id) {
    const idx = db.menuItems.findIndex((m) => m.id === data.id);
    if (idx >= 0) {
      const m = db.menuItems[idx];
      m.name = data.name;
      m.price = data.price;
      m.categoryId = data.categoryId;
      if (data.description !== undefined) m.description = data.description;
      if (data.imageUrl !== undefined) m.imageUrl = data.imageUrl;
      if (data.soldOut !== undefined) m.soldOut = data.soldOut;
      if (data.sortOrder !== undefined) m.sortOrder = data.sortOrder;
      m.updatedAt = now;
      await persistDatabase();
      return m;
    }
  }
  const item: MenuItem = {
    id: crypto.randomUUID(),
    storeId: data.storeId,
    categoryId: data.categoryId,
    name: data.name,
    price: data.price,
    description: data.description ?? "",
    imageUrl: data.imageUrl ?? "",
    soldOut: data.soldOut ?? false,
    sortOrder: data.sortOrder ?? db.menuItems.filter((m) => m.storeId === data.storeId).length,
    createdAt: now,
    updatedAt: now,
  };
  db.menuItems.push(item);
  await persistDatabase();
  return item;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const db = await readDatabase();
  db.menuItems = (db.menuItems ?? []).filter((m) => m.id !== id);
  await persistDatabase();
}

// ─── Orders ─────────────────────────────────────────────

const TAX_RATE = 0.10;

export async function createOrder(data: {
  storeId: string;
  tableLabel: string;
  customerId?: string;
  items: { menuItemId: string; name: string; price: number; quantity: number }[];
}): Promise<Order> {
  const db = await readDatabase();
  if (!db.orders) db.orders = [];
  const subtotal = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.floor(subtotal * TAX_RATE);
  const now = new Date().toISOString();
  const order: Order = {
    id: crypto.randomUUID(),
    storeId: data.storeId,
    tableLabel: data.tableLabel,
    customerId: data.customerId,
    items: data.items,
    subtotal,
    tax,
    total: subtotal + tax,
    status: "ORDERED",
    createdAt: now,
    updatedAt: now,
  };
  db.orders.push(order);
  await persistDatabase();
  return order;
}

export async function addItemsToOrder(orderId: string, items: OrderItem[]): Promise<Order> {
  const db = await readDatabase();
  const order = (db.orders ?? []).find((o) => o.id === orderId);
  if (!order) throw new Error("注文が見つかりません");
  for (const newItem of items) {
    const existing = order.items.find((i) => i.menuItemId === newItem.menuItemId);
    if (existing) {
      existing.quantity += newItem.quantity;
    } else {
      order.items.push(newItem);
    }
  }
  order.subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  order.tax = Math.floor(order.subtotal * TAX_RATE);
  order.total = order.subtotal + order.tax;
  order.updatedAt = new Date().toISOString();
  await persistDatabase();
  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, paidAmount?: number): Promise<Order> {
  const db = await readDatabase();
  const order = (db.orders ?? []).find((o) => o.id === orderId);
  if (!order) throw new Error("注文が見つかりません");
  order.status = status;
  if (paidAmount !== undefined) order.paidAmount = paidAmount;
  order.updatedAt = new Date().toISOString();
  await persistDatabase();
  return order;
}

export async function getOrdersByStore(storeId: string, date?: string): Promise<Order[]> {
  const db = await readDatabase();
  let orders = (db.orders ?? []).filter((o) => o.storeId === storeId);
  if (date) {
    orders = orders.filter((o) => o.createdAt.startsWith(date));
  }
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const db = await readDatabase();
  return (db.orders ?? []).find((o) => o.id === id);
}

// ─── Waiting Survey ─────────────────────────────────────

export async function addWaitingSurvey(data: Omit<WaitingSurveyRecord, "id" | "createdAt">): Promise<WaitingSurveyRecord> {
  const db = await readDatabase();
  if (!db.waitingSurveys) db.waitingSurveys = [];
  const record: WaitingSurveyRecord = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  db.waitingSurveys.push(record);
  await persistDatabase();
  return record;
}

export async function getWaitingSurveys(storeId: string): Promise<WaitingSurveyRecord[]> {
  const db = await readDatabase();
  return (db.waitingSurveys ?? []).filter((s) => s.storeId === storeId);
}

// ─── Post-Visit Reviews ────────────────────────────────

export async function addPostVisitReview(data: Omit<PostVisitReviewRecord, "id" | "createdAt">): Promise<PostVisitReviewRecord> {
  const db = await readDatabase();
  if (!db.postVisitReviews) db.postVisitReviews = [];
  const record: PostVisitReviewRecord = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  db.postVisitReviews.push(record);
  await persistDatabase();
  return record;
}

export async function getPostVisitReviews(storeId: string): Promise<PostVisitReviewRecord[]> {
  const db = await readDatabase();
  return (db.postVisitReviews ?? []).filter((r) => r.storeId === storeId);
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

/** YYYY-MM-DD のときはその日の UTC 0:00〜23:59:59.999 で比較（文字列比較だけだと to 当日分が落ちる） */
function surveyDateRangeBounds(from?: string, to?: string): { fromIso?: string; toIso?: string } {
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/;
  return {
    fromIso: from && dayOnly.test(from) ? `${from}T00:00:00.000Z` : from,
    toIso: to && dayOnly.test(to) ? `${to}T23:59:59.999Z` : to,
  };
}

/**
 * マスタに店舗行が無くても、キュー or アンケートに該当 storeId があれば分析 API で扱う（レガシー店舗ID向け）
 */
export async function isStoreIdRecognized(storeId: string): Promise<boolean> {
  const db = await readDatabase();
  if ((db.accounts ?? []).some((a) => a.id === storeId)) return true;
  if ((db.queue ?? []).some((q) => q.storeId === storeId)) return true;
  if ((db.surveyResponses ?? []).some((r) => r.storeId === storeId)) return true;
  return false;
}

export async function getSurveyResponses(
  storeId: string,
  from?: string,
  to?: string
): Promise<SurveyResponse[]> {
  const db = await readDatabase();
  if (!db.surveyResponses) return [];
  const { fromIso, toIso } = surveyDateRangeBounds(from, to);
  return db.surveyResponses.filter((r) => {
    if (r.storeId !== storeId) return false;
    if (fromIso && r.visitedAt < fromIso) return false;
    if (toIso && r.visitedAt > toIso) return false;
    return true;
  });
}
