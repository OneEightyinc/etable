const LEGACY_KEY = "etable_customer_profile";

export type CustomerProfile = {
  id?: string;
  displayName: string;
  email: string;
  phone: string;
  registeredAt: string;
};

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** サーバー（DB + Redis/KV）に保存されたプロフィール。Cookie で紐づけ */
export async function fetchCustomerMe(): Promise<CustomerProfile | null> {
  const res = await fetch("/api/customer/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as { profile: CustomerProfile };
  return data.profile ?? null;
}

export async function saveCustomerProfileToServer(data: {
  displayName: string;
  email?: string;
  phone?: string;
}): Promise<CustomerProfile> {
  const res = await fetch("/api/customer/save", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: data.displayName.trim(),
      email: data.email?.trim() ?? "",
      phone: data.phone?.trim() ?? "",
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const out = (await res.json()) as { profile: CustomerProfile };
  if (!out.profile) throw new Error("Invalid response");
  return out.profile;
}

export async function deleteCustomerProfileFromServer(): Promise<void> {
  const res = await fetch("/api/customer/me", { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await readError(res));
}

/** 旧 localStorage から1回だけ移行（DB 未登録時のみ） */
export function tryMigrateLegacyProfile(): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { displayName?: string; email?: string; phone?: string; registeredAt?: string };
    if (!p?.displayName) return null;
    return {
      displayName: p.displayName,
      email: p.email ?? "",
      phone: p.phone ?? "",
      registeredAt: p.registeredAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearLegacyProfileStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_KEY);
}
