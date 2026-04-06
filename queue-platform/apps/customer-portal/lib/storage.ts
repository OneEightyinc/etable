export interface ReservationItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  peopleCount: number;
  seatType: string;
  ticketNumber: number;
  waitingGroups: number;
  waitMinutes: number;
  status: "waiting" | "cancelled";
  createdAt: string;
  /** 店舗キュー上のエントリ ID（API 参加時のみ） */
  queueEntryId?: string;
  /** 登録直後の「前の組数」基準（「順番を後回し」で増分を表示するため） */
  baselineQueuePosition?: number;
  /** 登録直後の目安待ち（分）基準 */
  baselineWaitMinutes?: number;
}

export interface FavoriteItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2);
}

const RESERVATIONS_KEY = "etable_reservations";
const FAVORITES_KEY = "etable_favorites";
const TRANSPORT_PREF_KEY = "etable_transport_pref";

export type TransportPreference = "public" | "car";

export function getTransportPreference(): TransportPreference {
  if (typeof window === "undefined") return "public";
  try {
    const v = localStorage.getItem(TRANSPORT_PREF_KEY);
    if (v === "car" || v === "public") return v;
  } catch {
    /* ignore */
  }
  return "public";
}

export function setTransportPreference(v: TransportPreference): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRANSPORT_PREF_KEY, v);
  } catch {
    /* ignore */
  }
}

export function getReservations(): ReservationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(RESERVATIONS_KEY);
    if (!data) return [];
    return JSON.parse(data) as ReservationItem[];
  } catch { return []; }
}

export function addReservation(item: ReservationItem): void {
  if (typeof window === "undefined") return;
  const current = getReservations();
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify([item, ...current]));
}

export function updateReservationStatus(id: string, status: "waiting" | "cancelled"): void {
  if (typeof window === "undefined") return;
  const current = getReservations();
  const updated = current.map((r) => (r.id === id ? { ...r, status } : r));
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updated));
}

export function updateReservationWait(id: string, addGroups: number, addMinutes: number): void {
  if (typeof window === "undefined") return;
  const current = getReservations();
  const updated = current.map((r) =>
    r.id === id
      ? { ...r, waitingGroups: r.waitingGroups + addGroups, waitMinutes: r.waitMinutes + addMinutes }
      : r
  );
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updated));
}

export function getFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    if (!data) return [];
    return JSON.parse(data) as FavoriteItem[];
  } catch { return []; }
}

export function addFavorite(item: FavoriteItem): void {
  if (typeof window === "undefined") return;
  const current = getFavorites();
  if (current.some((f) => f.restaurantId === item.restaurantId)) return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...current, item]));
}

export function removeFavorite(restaurantId: string): void {
  if (typeof window === "undefined") return;
  const current = getFavorites().filter((f) => f.restaurantId !== restaurantId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(current));
}
