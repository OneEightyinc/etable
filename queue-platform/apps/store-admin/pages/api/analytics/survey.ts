import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth, getSurveyResponses } from "@queue-platform/api/src/server";
import type { SurveyResponse } from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "許可されていないメソッドです" });
  }

  const session = requireAuth(req, res);
  if (!session) return;

  const storeId = (req.query.storeId as string) || session.storeId;
  if (!storeId) {
    return res.status(400).json({ error: "店舗IDが必要です" });
  }

  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const responses = await getSurveyResponses(storeId, from, to);

    const totalResponses = responses.length;
    if (totalResponses === 0) {
      return res.status(200).json({
        totalResponses: 0,
        byGender: {},
        byAgeGroup: {},
        byGroupType: {},
        byVisitPurpose: {},
        byAcquisitionChannel: {},
        byBudget: {},
        byVisitCount: {},
        avgSatisfaction: 0,
        satisfactionDistribution: {},
        waitTimeToleranceRate: 0,
        revisitIntentionRate: { yes: 0, no: 0, maybe: 0 },
        recentReviews: [],
        topMenuKeywords: [],
      });
    }

    const count = <T extends string>(arr: SurveyResponse[], key: keyof SurveyResponse): Record<string, number> => {
      const map: Record<string, number> = {};
      for (const r of arr) {
        const v = String(r[key]);
        map[v] = (map[v] || 0) + 1;
      }
      return map;
    };

    const byGender = count(responses, "gender");
    const byAgeGroup = count(responses, "ageGroup");
    const byGroupType = count(responses, "groupType");
    const byVisitPurpose = count(responses, "visitPurpose");
    const byVisitCount = count(responses, "visitCount");

    const byBudget: Record<string, number> = {};
    for (const r of responses) {
      const k = String(r.budgetPerPerson);
      byBudget[k] = (byBudget[k] || 0) + 1;
    }

    const byAcquisitionChannel: Record<string, number> = {};
    for (const r of responses) {
      for (const ch of r.acquisitionChannels) {
        byAcquisitionChannel[ch] = (byAcquisitionChannel[ch] || 0) + 1;
      }
    }

    const avgSatisfaction = responses.reduce((s, r) => s + r.satisfactionScore, 0) / totalResponses;

    const satisfactionDistribution: Record<string, number> = {};
    for (const r of responses) {
      const k = String(r.satisfactionScore);
      satisfactionDistribution[k] = (satisfactionDistribution[k] || 0) + 1;
    }

    const tolerant = responses.filter((r) => r.waitTimeTolerance).length;
    const waitTimeToleranceRate = tolerant / totalResponses;

    const revisitIntentionRate = {
      yes: responses.filter((r) => r.revisitIntention === "yes").length / totalResponses,
      no: responses.filter((r) => r.revisitIntention === "no").length / totalResponses,
      maybe: responses.filter((r) => r.revisitIntention === "maybe").length / totalResponses,
    };

    const recentReviews = responses
      .filter((r) => r.etableReview)
      .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
      .slice(0, 10)
      .map((r) => ({ etableReview: r.etableReview!, visitedAt: r.visitedAt }));

    const wordMap: Record<string, number> = {};
    for (const r of responses) {
      if (!r.favoriteMenu) continue;
      const words = r.favoriteMenu.split(/[、,\s]+/).filter(Boolean);
      for (const w of words) {
        wordMap[w] = (wordMap[w] || 0) + 1;
      }
    }
    const topMenuKeywords = Object.entries(wordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    return res.status(200).json({
      totalResponses,
      byGender,
      byAgeGroup,
      byGroupType,
      byVisitPurpose,
      byAcquisitionChannel,
      byBudget,
      byVisitCount,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      satisfactionDistribution,
      waitTimeToleranceRate: Math.round(waitTimeToleranceRate * 100),
      revisitIntentionRate: {
        yes: Math.round(revisitIntentionRate.yes * 100),
        no: Math.round(revisitIntentionRate.no * 100),
        maybe: Math.round(revisitIntentionRate.maybe * 100),
      },
      recentReviews,
      topMenuKeywords,
    });
  } catch (err) {
    console.error("[api/analytics/survey]", err);
    return res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
}
