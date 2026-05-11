import type { NextApiRequest, NextApiResponse } from "next";
import { endOfDayCleanup } from "@queue-platform/api/src/server";
import { requireStoreAdminForStore } from "../../../lib/requireStoreAdminForStore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const storeId = req.body?.storeId as string;
  if (!storeId) return res.status(400).json({ error: "storeId is required" });
  if (!requireStoreAdminForStore(req, res, storeId)) return;

  const actor = req.body?.actor ?? undefined;
  const count = await endOfDayCleanup(storeId, actor);
  return res.status(200).json({ ok: true, cancelledCount: count });
}
