import type { NextApiRequest, NextApiResponse } from "next";
import {
  getWaitingSurveys,
  getPostVisitReviews,
  getQueueHistory,
  getQueueByStore,
  isStoreIdRecognized,
} from "@queue-platform/api/src/server";
import { requireStoreAdminForStore } from "../../../lib/requireStoreAdminForStore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const storeId = typeof req.query.storeId === "string" ? req.query.storeId.trim() : "";
  if (!storeId) return res.status(400).json({ error: "storeId required" });
  if (!requireStoreAdminForStore(req, res, storeId)) return;
  if (!(await isStoreIdRecognized(storeId))) return res.status(404).json({ error: "Store not found" });

  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  try {
    const [waitingSurveys, reviews, history, activeQueue] = await Promise.all([
      getWaitingSurveys(storeId),
      getPostVisitReviews(storeId),
      getQueueHistory(storeId),
      getQueueByStore(storeId),
    ]);

    // Date filter helper
    const inRange = (dateStr: string) => {
      if (!from && !to) return true;
      const d = dateStr.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    // ── 待機中アンケート集計 ──
    const filteredWaiting = waitingSurveys.filter((s) => inRange(s.createdAt));

    // 流入チャネル
    const channelMap: Record<string, number> = {};
    for (const s of filteredWaiting) {
      channelMap[s.discoveryChannel] = (channelMap[s.discoveryChannel] || 0) + 1;
    }
    const channelRanking = Object.entries(channelMap)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => ({ channel, count }));

    // 人気メニュー（食べたいメニュー集計）
    const menuMap: Record<string, number> = {};
    for (const s of filteredWaiting) {
      if (!s.wantToEatMenu?.trim()) continue;
      const words = s.wantToEatMenu.split(/[、,\s・/]+/).filter(Boolean);
      for (const w of words) {
        const key = w.trim();
        if (key.length > 0) menuMap[key] = (menuMap[key] || 0) + 1;
      }
    }
    const popularMenus = Object.entries(menuMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([menu, count]) => ({ menu, count }));

    // ── 食後レビュー集計 ──
    const filteredReviews = reviews.filter((r) => inRange(r.createdAt));
    const totalReviews = filteredReviews.length;

    // 満足度分布
    const satisfactionDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of filteredReviews) {
      const s = Math.min(5, Math.max(1, r.rating));
      satisfactionDist[s] = (satisfactionDist[s] || 0) + 1;
    }

    const avgSatisfaction = totalReviews > 0
      ? Math.round((filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    // Googleレビュー転換率
    const googleReviewCount = filteredReviews.filter((r) => r.googleReviewSubmitted).length;
    const highRatingCount = filteredReviews.filter((r) => r.rating >= 4).length;
    const googleConversionRate = highRatingCount > 0
      ? Math.round((googleReviewCount / highRatingCount) * 100)
      : 0;

    // 低評価フィードバック一覧
    const lowRatingFeedback = filteredReviews
      .filter((r) => r.rating <= 3 && r.feedback?.trim())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
      .map((r) => ({ rating: r.rating, feedback: r.feedback!, createdAt: r.createdAt }));

    // ── キュー統計 ──
    const allEntries = [...history, ...activeQueue];
    const filteredEntries = allEntries.filter((e) => inRange(e.createdAt));
    const totalCustomers = filteredEntries.length;
    const completedCount = filteredEntries.filter((e) => e.status === "DONE").length;
    const cancelledCount = filteredEntries.filter((e) => e.status === "CANCELLED").length;

    // 待機中アンケート回答率
    const waitingSurveyRate = totalCustomers > 0
      ? Math.round((filteredWaiting.length / totalCustomers) * 100)
      : 0;

    // 食後レビュー回答率
    const reviewRate = completedCount > 0
      ? Math.round((totalReviews / completedCount) * 100)
      : 0;

    return res.json({
      // 待機中アンケート
      waitingSurveyCount: filteredWaiting.length,
      waitingSurveyRate,
      channelRanking,
      popularMenus,
      // 食後レビュー
      totalReviews,
      reviewRate,
      avgSatisfaction,
      satisfactionDistribution: satisfactionDist,
      googleReviewCount,
      googleConversionRate,
      highRatingCount,
      lowRatingFeedback,
      // キュー統計
      totalCustomers,
      completedCount,
      cancelledCount,
    });
  } catch (err) {
    console.error("[api/analytics/insights]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
