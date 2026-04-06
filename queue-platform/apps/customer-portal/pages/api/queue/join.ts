import type { NextApiRequest, NextApiResponse } from "next";
import {
  addToQueue,
  getQueueByStore,
  getQueuePosition,
  getStorePortalProfile,
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

function mapSeatType(label: string): "TABLE" | "COUNTER" | "EITHER" {
  if (label === "カウンター") return "COUNTER";
  if (label === "テーブル席") return "TABLE";
  return "EITHER";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = parseJsonBody(req);
    const storeId = typeof body.storeId === "string" ? body.storeId.trim() : "";
    const peopleRaw = body.peopleCount;
    const seatLabel = typeof body.seatType === "string" ? body.seatType : "";

    if (!storeId) return res.status(400).json({ error: "storeId is required" });
    const peopleCount = Number(peopleRaw);
    if (!Number.isFinite(peopleCount) || peopleCount < 1 || peopleCount > 20) {
      return res.status(400).json({ error: "peopleCount must be between 1 and 20" });
    }

    const profile = await getStorePortalProfile(storeId);
    if (!profile) {
      return res.status(404).json({ error: "Store not found" });
    }

    const seatType = mapSeatType(seatLabel);
    const entry = await addToQueue({
      storeId,
      adults: peopleCount,
      children: 0,
      seatType,
    });

    const pos = await getQueuePosition(storeId, entry.id);
    if (!pos) {
      return res.status(500).json({ error: "Could not resolve queue position" });
    }

    const queue = await getQueueByStore(storeId);
    broadcastToStore(storeId, "queue_update", { type: "NEW_ENTRY", entry, queue });

    return res.status(201).json({
      entry,
      position: pos.position,
      estimatedWait: pos.estimatedWait,
    });
  } catch (e) {
    console.error("[api/queue/join]", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
