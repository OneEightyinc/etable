/**
 * 本番では Vercel の Environment Variables に以下を設定（末尾スラッシュなし推奨）:
 * - NEXT_PUBLIC_STORE_ADMIN_URL  … 店舗管理（例: https://etable-1yex.vercel.app）
 * - NEXT_PUBLIC_KIOSK_URL        … キオスク（例: https://etable-blush.vercel.app）
 * - NEXT_PUBLIC_CUSTOMER_PORTAL_URL … 顧客ポータル（例: https://etable-customer-portal.vercel.app）
 *
 * 未設定かつ localhost のときだけ :3020 / :3022 / :3006 にフォールバック（store-admin dev 3020、kiosk dev 3022）。
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
    storeAdmin: urls.storeAdmin || `${protocol}//${hostname}:3020`,
    kiosk: urls.kiosk || `${protocol}//${hostname}:3022`,
    customer: urls.customer || `${protocol}//${hostname}:3021`,
    fullyConfigured: true
  };
}

export function appendStoreQuery(base: string, storeId: string): string {
  if (!base) return "#";
  const q = `storeId=${encodeURIComponent(storeId)}`;
  return base.includes("?") ? `${base}&${q}` : `${base}?${q}`;
}

/** 店舗管理（不透明トークン /a/:token） */
export function storeAdminEntryUrl(base: string, publicToken: string): string {
  const b = trimBase(base);
  if (!b || !publicToken || publicToken.length < 32) return "#";
  return `${b}/a/${publicToken}`;
}

/** キオスク（/k/:token） */
export function kioskEntryUrl(base: string, publicToken: string): string {
  const b = trimBase(base);
  if (!b || !publicToken || publicToken.length < 32) return "#";
  return `${b}/k/${publicToken}`;
}

/** 顧客ポータル店舗入口（/p/:token） */
export function customerPortalEntryUrl(base: string, publicToken: string): string {
  const b = trimBase(base);
  if (!b || !publicToken || publicToken.length < 32) return "#";
  return `${b}/p/${publicToken}`;
}

/** 来店アンケート（/q/:token） */
export function surveyPublicUrl(customerPortalBase: string, surveyToken: string): string {
  const base = trimBase(customerPortalBase);
  if (!base || !surveyToken || surveyToken.length < 32) return "#";
  return `${base}/q/${surveyToken}`;
}
