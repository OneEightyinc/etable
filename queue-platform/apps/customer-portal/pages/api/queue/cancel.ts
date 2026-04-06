import type { NextApiRequest, NextApiResponse } from "next";
import {
  getQueueEntryById,
  removeFromQueue,
  getQueueByStore,
  broadcastToStore,
} from "@queue-platform/api/src/server";

function parseJsonBody(req: NextApiRequest): Record<string, unknown> {
  const b = req.body;
  if (b == null) return {};
  if (typeof b === "string") {
    try {
      return JSON.parse(b) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof b === "object" && !Array.isArray(b)) return b as Record<string, unknown>;
  return {};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = parseJsonBody(req);
    const entryId = typeof body.entryId === "string" ? body.entryId.trim() : "";
    if (!entryId) return res.status(400).json({ error: "entryId is required" });

    const entry = await getQueueEntryById(entryId);
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    await removeFromQueue(entryId);
    const queue = await getQueueByStore(entry.storeId);
    broadcastToStore(entry.storeId, "queue_update", {
      type: "REMOVED",
      entryId,
      queue,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[api/queue/cancel]", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
