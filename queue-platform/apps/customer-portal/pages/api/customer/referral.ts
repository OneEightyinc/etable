import type { NextApiRequest, NextApiResponse } from "next";
import {
  getCustomerProfileById,
  findCustomerByReferralCode,
  addPoints,
  getCustomerIdFromRequest,
} from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { referralCode } = body as { customerId?: string; referralCode: string };
    const customerId = body.customerId || getCustomerIdFromRequest(req);

    if (!customerId || !referralCode) {
      return res.status(400).json({ error: "customerId and referralCode are required" });
    }

    const customer = await getCustomerProfileById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "顧客が見つかりません" });
    }

    // 自分の招待コードは使えない
    if (customer.referralCode === referralCode.toUpperCase()) {
      return res.status(400).json({ success: false, message: "自分の招待コードは使用できません" });
    }

    const referrer = await findCustomerByReferralCode(referralCode);
    if (!referrer) {
      return res.status(400).json({ success: false, message: "無効な招待コードです" });
    }

    // 双方にポイント付与
    await addPoints(customerId, "REFERRAL_RECEIVED", 150, `${referrer.displayName}さんからの招待特典`);
    await addPoints(referrer.id, "REFERRAL_SENT", 150, `${customer.displayName}さんを招待`);

    return res.status(200).json({ success: true, message: "招待特典が適用されました！双方に150ptを付与しました" });
  } catch (e: any) {
    console.error("[api/customer/referral]", e);
    return res.status(500).json({ error: e.message || "Internal error" });
  }
}
