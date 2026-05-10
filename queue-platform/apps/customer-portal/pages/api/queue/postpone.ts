import type { NextApiRequest, NextApiResponse } from "next";
import {
  userPostponeQueueEntry,
  getQueueByStore,
  getQueueEntryById,
  getStoreSettings,
  broadcastToStore,
} from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { entryId, slots } = req.body as { entryId?: string; slots?: number };
  if (!entryId) return res.status(400).json({ error: "entryId is required" });

  try {
    const target = await getQueueEntryById(entryId);
    if (!target) return res.status(404).json({ error: "順番待ちデータが見つかりません" });

    let resolvedSlots: number;
    if (typeof slots === "number" && slots > 0) {
      resolvedSlots = Math.min(5, Math.max(2, Math.round(slots)));
    } else {
      const settings = await getStoreSettings(target.storeId);
      resolvedSlots = settings.defaultPostponeSlots;
    }

    const entry = await userPostponeQueueEntry(entryId, resolvedSlots);
    const queue = await getQueueByStore(entry.storeId);
    broadcastToStore(entry.storeId, "queue_update", { type: "POSTPONE", entry, queue });
    return res.json({
      ok: true,
      entry,
      userPostponedCount: entry.userPostponedCount,
      postponeRemainingSlots: entry.postponeRemainingSlots,
    });
  } catch (e: any) {
    return res.status(404).json({ error: e.message });
  }
}
