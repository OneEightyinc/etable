import type { NextApiRequest, NextApiResponse } from "next";
import { getStorePortalProfile, listActiveStoreProfiles } from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const storeId = req.query.storeId as string | undefined;

  try {
    // storeId が指定されていない場合は全 Active 店舗を返す
    if (!storeId) {
      const profiles = await listActiveStoreProfiles();
      return res.status(200).json({ profiles });
    }

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
