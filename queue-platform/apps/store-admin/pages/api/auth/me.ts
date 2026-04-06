import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionFromRequest } from "@queue-platform/api/src/auth";
import { getAccountById } from "@queue-platform/api/src/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const session = getSessionFromRequest(req);
  if (!session) return res.status(401).json({ error: "認証が必要です" });

  if (session.role !== "STORE_ADMIN") {
    return res.status(403).json({ error: "店舗スタッフのアカウントでログインしてください" });
  }

  const account = await getAccountById(session.userId);
  if (!account) return res.status(401).json({ error: "アカウントが見つかりません" });

  return res.status(200).json({
    user: {
      id: account.id,
      email: account.email,
      role: "STORE_ADMIN" as const,
      storeName: account.storeName,
      storeId: account.id,
    },
  });
}
