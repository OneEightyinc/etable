import type { NextApiRequest, NextApiResponse } from "next";
import {
  getCustomerProfileById,
  addPoints,
  getPointHistory,
  POINT_RULES,
  getCustomerIdFromRequest,
} from "@queue-platform/api/src/server";
import type { PointAction } from "@queue-platform/api/src/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const customerId =
      (req.query.customerId as string) || getCustomerIdFromRequest(req);
    if (!customerId) {
      return res.status(400).json({ error: "customerId is required" });
    }
    const profile = await getCustomerProfileById(customerId);
    if (!profile) {
      return res.status(404).json({ error: "顧客が見つかりません" });
    }
    const history = await getPointHistory(customerId);
    return res.status(200).json({
      totalPoints: profile.totalPoints ?? 0,
      currentTier: profile.currentTier ?? "BRONZE",
      referralCode: profile.referralCode ?? "",
      history,
    });
  }

  if (req.method === "POST") {
    try {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { customerId, action, points: customPoints, description } = body as {
        customerId: string;
        action: PointAction;
        points?: number;
        description?: string;
      };

      if (!customerId || !action) {
        return res
          .status(400)
          .json({ error: "customerId and action are required" });
      }

      const pts = customPoints ?? POINT_RULES[action] ?? 0;
      const desc =
        description ??
        ({
          FIRST_VISIT: "初回会員登録ボーナス",
          VISIT: "来店ポイント",
          SURVEY: "レビュー回答ボーナス",
          GOOGLE_REVIEW: "クチコミ投稿で300pt",
          REFERRAL_SENT: "友達招待ボーナス",
          REFERRAL_RECEIVED: "招待された特典",
          IDLE_TIME_BONUS: "アイドルタイムボーナス",
          STAMP_RALLY: "スタンプラリー達成",
          MANUAL: "手動調整",
        }[action] ?? action);

      const result = await addPoints(customerId, action, pts, desc);
      return res.status(200).json({
        totalPoints: result.profile.totalPoints,
        currentTier: result.profile.currentTier,
        history: result.history,
      });
    } catch (e: any) {
      console.error("[api/customer/points]", e);
      return res.status(500).json({ error: e.message || "Internal error" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
