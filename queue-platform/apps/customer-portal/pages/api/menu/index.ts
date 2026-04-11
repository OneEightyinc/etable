import type { NextApiRequest, NextApiResponse } from "next";
import { getMenuCategories, getMenuItems } from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const storeId = req.query.storeId as string;
  if (!storeId) return res.status(400).json({ error: "storeId required" });

  const [categories, items] = await Promise.all([
    getMenuCategories(storeId),
    getMenuItems(storeId),
  ]);
  // 品切れを除外して返す
  const available = items.filter((i) => !i.soldOut);
  return res.status(200).json({ categories, items: available });
}
