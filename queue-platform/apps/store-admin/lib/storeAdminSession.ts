const KEY_RECEPTION = "store_admin_reception_started";

export function isStoreReceptionStarted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_RECEPTION) === "1";
}

export function markStoreReceptionStarted(): void {
  localStorage.setItem(KEY_RECEPTION, "1");
}

export function clearStoreAdminSession(): void {
  localStorage.removeItem(KEY_RECEPTION);
}
