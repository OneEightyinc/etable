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
