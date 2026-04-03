import { useEffect, useState } from "react";
import {
  getAppBaseUrlsFromEnv,
  withLocalPortFallback,
  type AppBaseUrls
} from "../lib/publicAppUrls";

/**
 * SSR では env のみ。マウント後に localhost ならポートフォールバックを適用。
 */
export function useAppBaseUrls(): AppBaseUrls {
  const [urls, setUrls] = useState<AppBaseUrls>(() => getAppBaseUrlsFromEnv());

  useEffect(() => {
    setUrls(withLocalPortFallback(getAppBaseUrlsFromEnv()));
  }, []);

  return urls;
}
