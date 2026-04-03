import type { NextApiRequest, NextApiResponse } from "next";
import { getStorePortalProfile } from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const storeId = req.query.storeId as string;
  if (!storeId || typeof storeId !== "string") {
    return res.status(400).json({ error: "storeId is required" });
  }

  try {
    const profile = await getStorePortalProfile(storeId);
    if (!profile) {
      return res.status(404).json({ error: "Store not found" });
    }
    return res.status(200).json({ profile });
  } catch (e) {
    console.error("[api/store/public]", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
