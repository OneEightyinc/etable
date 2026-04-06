/**
 * 店舗管理のURL: /a/:opaqueToken/...（middleware が ?storeId= に解決）
 * トークンが無い旧リンクは ?storeId= にフォールバック
 */
export function storeScopedPath(
  publicToken: string | undefined,
  path: string = "/",
  storeIdFallback: string
): string {
  const p = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  if (publicToken && publicToken.length >= 32) {
    return `/a/${publicToken}${p}`;
  }
  const id = encodeURIComponent(storeIdFallback);
  if (!p) return `/?storeId=${id}`;
  return `${p}?storeId=${id}`;
}
