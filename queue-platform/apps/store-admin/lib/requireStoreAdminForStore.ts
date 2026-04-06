import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth, type Session } from "@queue-platform/api/src/server";

/**
 * 店舗管理 API: STORE_ADMIN セッションがあり、要求 storeId がログイン店舗と一致すること。
 */
export function requireStoreAdminForStore(
  req: NextApiRequest,
  res: NextApiResponse,
  storeId: string | undefined
): Session | null {
  const sid = typeof storeId === "string" ? storeId.trim() : "";
  if (!sid) {
    res.status(400).json({ error: "店舗IDが必要です" });
    return null;
  }
  const session = requireAuth(req, res, ["STORE_ADMIN"]);
  if (!session) return null;
  if (session.storeId !== sid) {
    res.status(403).json({ error: "この店舗のデータにアクセスできません" });
    return null;
  }
  return session;
}
