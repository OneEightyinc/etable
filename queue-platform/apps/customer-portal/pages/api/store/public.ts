import type { NextApiRequest, NextApiResponse } from "next";
import {
  getStorePortalProfile,
  listActiveStoreProfiles,
  isRemoteDbEnabled,
} from "@queue-platform/api/src/server";

function noStoreCache(res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const storeId = req.query.storeId as string | undefined;

  try {
    // storeId が指定されていない場合は全 Active 店舗を返す
    if (!storeId) {
      const profiles = await listActiveStoreProfiles();
      noStoreCache(res);
      if (
        profiles.length === 0 &&
        process.env.VERCEL &&
        !isRemoteDbEnabled()
      ) {
        console.warn(
          "[api/store/public] 店舗が0件です。このデプロイに Redis/KV（UPSTASH または Vercel KV）が未設定の可能性があります。master-admin と同じ環境変数を customer-portal にも設定してください。"
        );
      }
      return res.status(200).json({ profiles });
    }

    const profile = await getStorePortalProfile(storeId);
    noStoreCache(res);
    if (!profile) {
      return res.status(404).json({ error: "Store not found" });
    }
    return res.status(200).json({ profile });
  } catch (e) {
    console.error("[api/store/public]", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
