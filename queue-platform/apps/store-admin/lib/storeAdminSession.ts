const KEY_LOGGED = "store_admin_logged_in";
const KEY_RECEPTION = "store_admin_reception_started";

export function isStoreAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY_LOGGED) === "1";
}

export function isStoreReceptionStarted(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY_RECEPTION) === "1";
}

/** ログイン成功時（受付開始はリセットしてスライドから再度入る） */
export function markStoreAdminLoggedIn(): void {
  sessionStorage.setItem(KEY_LOGGED, "1");
  sessionStorage.removeItem(KEY_RECEPTION);
}

export function markStoreReceptionStarted(): void {
  sessionStorage.setItem(KEY_RECEPTION, "1");
}

export function clearStoreAdminSession(): void {
  sessionStorage.removeItem(KEY_LOGGED);
  sessionStorage.removeItem(KEY_RECEPTION);
}
