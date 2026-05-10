import type { NextApiRequest, NextApiResponse } from "next";
import { linkLineUserToQueueEntry } from "@queue-platform/api/src/server";

/**
 * LIFF アプリで取得した LINE userId と queueEntryId を紐付ける。
 * クライアント側では LIFF 起動 → liff.getProfile() → fetch('/api/line/link', { entryId, lineUserId }) の流れ。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { entryId, lineUserId } = (req.body ?? {}) as { entryId?: string; lineUserId?: string };
  if (!entryId || typeof entryId !== "string") {
    return res.status(400).json({ error: "entryId is required" });
  }
  if (!lineUserId || typeof lineUserId !== "string") {
    return res.status(400).json({ error: "lineUserId is required" });
  }

  try {
    const entry = await linkLineUserToQueueEntry(entryId, lineUserId);
    return res.status(200).json({ ok: true, entry });
  } catch (e: any) {
    return res.status(404).json({ error: e?.message ?? "link failed" });
  }
}
