import type { NextApiRequest, NextApiResponse } from "next";
import {
  getMenuCategories,
  upsertMenuCategory,
  deleteMenuCategory,
  getMenuItems,
  upsertMenuItem,
  deleteMenuItem,
} from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const storeId = (req.query.storeId as string) || "";

  if (req.method === "GET") {
    if (!storeId) return res.status(400).json({ error: "storeId required" });
    const [categories, items] = await Promise.all([
      getMenuCategories(storeId),
      getMenuItems(storeId),
    ]);
    return res.status(200).json({ categories, items });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type } = body as { type: string };

    if (type === "category") {
      const cat = await upsertMenuCategory(body);
      return res.status(200).json({ category: cat });
    }
    if (type === "item") {
      const item = await upsertMenuItem(body);
      return res.status(200).json({ item });
    }
    return res.status(400).json({ error: "type must be 'category' or 'item'" });
  }

  if (req.method === "DELETE") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type, id } = body as { type: string; id: string };
    if (type === "category") await deleteMenuCategory(id);
    else if (type === "item") await deleteMenuItem(id);
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
