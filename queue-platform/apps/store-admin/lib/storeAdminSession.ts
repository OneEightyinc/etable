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
  if (typeof window === "undefined") return;
  try {
    const remove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("sa__actor:")) remove.push(k);
    }
    remove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
