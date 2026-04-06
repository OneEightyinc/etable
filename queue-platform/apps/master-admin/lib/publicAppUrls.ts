/**
 * 本番では Vercel の Environment Variables に以下を設定（末尾スラッシュなし推奨）:
 * - NEXT_PUBLIC_STORE_ADMIN_URL  … 店舗管理（例: https://etable-1yex.vercel.app）
 * - NEXT_PUBLIC_KIOSK_URL        … キオスク（例: https://etable-blush.vercel.app）
 * - NEXT_PUBLIC_CUSTOMER_PORTAL_URL … 顧客ポータル（例: https://etable-customer-portal.vercel.app）
 *
 * 未設定かつ localhost のときだけ :3005 / :3007 / :3006 にフォールバック（ローカル開発用）。
 */

function trimBase(u: string | undefined): string {
  if (!u) return "";
  return u.replace(/\/$/, "");
}

export function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export type AppBaseUrls = {
  storeAdmin: string;
  kiosk: string;
  customer: string;
  /** 3つとも env で埋まっている */
  fullyConfigured: boolean;
};

export function getAppBaseUrlsFromEnv(): AppBaseUrls {
  const storeAdmin = trimBase(process.env.NEXT_PUBLIC_STORE_ADMIN_URL);
  const kiosk = trimBase(process.env.NEXT_PUBLIC_KIOSK_URL);
  const customer = trimBase(process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL);
  return {
    storeAdmin,
    kiosk,
    customer,
    fullyConfigured: !!(storeAdmin && kiosk && customer)
  };
}

/** クライアントで localhost のとき env 欠けをポートで補完 */
export function withLocalPortFallback(urls: AppBaseUrls): AppBaseUrls {
  if (urls.fullyConfigured) return urls;
  if (typeof window === "undefined") return urls;
  const { protocol, hostname } = window.location;
  if (!isLocalHostname(hostname)) return urls;
  return {
    storeAdmin: urls.storeAdmin || `${protocol}//${hostname}:3005`,
    kiosk: urls.kiosk || `${protocol}//${hostname}:3007`,
    customer: urls.customer || `${protocol}//${hostname}:3006`,
    fullyConfigured: true
  };
}

export function appendStoreQuery(base: string, storeId: string): string {
  if (!base) return "#";
  const q = `storeId=${encodeURIComponent(storeId)}`;
  return base.includes("?") ? `${base}&${q}` : `${base}?${q}`;
}

/** 顧客ポータル上の来店アンケート（/survey/[storeId]） */
export function surveyUrlForStore(customerPortalBase: string, storeId: string): string {
  const base = trimBase(customerPortalBase);
  if (!base) return "#";
  return `${base}/survey/${encodeURIComponent(storeId)}`;
}
