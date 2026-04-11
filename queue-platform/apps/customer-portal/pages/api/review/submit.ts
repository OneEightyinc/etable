import type { NextApiRequest, NextApiResponse } from "next";
import { addPostVisitReview, addPoints, getCustomerIdFromRequest } from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { storeId, queueEntryId, rating, feedback, googleReviewSubmitted } = body as {
      storeId: string;
      queueEntryId?: string;
      rating: number;
      feedback?: string;
      googleReviewSubmitted?: boolean;
    };

    if (!storeId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "storeId and rating (1-5) are required" });
    }

    const customerId = getCustomerIdFromRequest(req) ?? undefined;

    const review = await addPostVisitReview({
      storeId,
      customerId,
      queueEntryId,
      rating,
      feedback: feedback || undefined,
      googleReviewSubmitted: googleReviewSubmitted ?? false,
    });

    // Googleレビュー投稿でポイント付与
    let pointsAwarded = 0;
    if (googleReviewSubmitted && customerId) {
      await addPoints(customerId, "GOOGLE_REVIEW", 300, "Googleレビュー投稿");
      pointsAwarded = 300;
    }

    return res.status(200).json({ success: true, review, pointsAwarded });
  } catch (e: any) {
    console.error("[api/review/submit]", e);
    return res.status(500).json({ error: e.message || "Internal error" });
  }
}
