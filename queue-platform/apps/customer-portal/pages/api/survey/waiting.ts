import type { NextApiRequest, NextApiResponse } from "next";
import { addWaitingSurvey, addPoints, getCustomerIdFromRequest } from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { storeId, queueEntryId, discoveryChannel, wantToEatMenu } = body as {
      storeId: string;
      queueEntryId: string;
      discoveryChannel: string;
      wantToEatMenu: string;
    };

    if (!storeId || !queueEntryId || !discoveryChannel) {
      return res.status(400).json({ error: "storeId, queueEntryId, discoveryChannel are required" });
    }

    const customerId = getCustomerIdFromRequest(req) ?? undefined;

    const survey = await addWaitingSurvey({
      storeId,
      customerId,
      queueEntryId,
      discoveryChannel,
      wantToEatMenu: wantToEatMenu || "",
    });

    // ポイント付与（ログインユーザーのみ）
    if (customerId) {
      await addPoints(customerId, "SURVEY", 50, "待機中アンケート回答");
    }

    return res.status(200).json({ success: true, survey, pointsAwarded: customerId ? 50 : 0 });
  } catch (e: any) {
    console.error("[api/survey/waiting]", e);
    return res.status(500).json({ error: e.message || "Internal error" });
  }
}
