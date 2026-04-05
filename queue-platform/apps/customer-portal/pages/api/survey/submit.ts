import type { NextApiRequest, NextApiResponse } from "next";
import { addSurveyResponse, getAccountById } from "@queue-platform/api/src/server";
import { validateSurveyInput } from "@queue-platform/api/src/survey-schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "許可されていないメソッドです" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = validateSurveyInput(body);

    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }

    const account = await getAccountById(result.data.storeId);
    if (!account) {
      return res.status(404).json({ error: "店舗が見つかりません" });
    }

    const row = await addSurveyResponse(result.data);
    return res.status(201).json({ success: true, id: row.id });
  } catch (err) {
    console.error("[api/survey/submit]", err);
    return res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
}
