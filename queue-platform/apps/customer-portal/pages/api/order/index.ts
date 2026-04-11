import type { NextApiRequest, NextApiResponse } from "next";
import {
  createOrder,
  addItemsToOrder,
  getOrderById,
  getCustomerIdFromRequest,
} from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { storeId, tableLabel, items, orderId } = body as {
      storeId?: string;
      tableLabel?: string;
      items: { menuItemId: string; name: string; price: number; quantity: number }[];
      orderId?: string;
    };

    // 追加注文
    if (orderId) {
      try {
        const order = await addItemsToOrder(orderId, items);
        return res.status(200).json({ order });
      } catch (e: any) {
        return res.status(400).json({ error: e.message });
      }
    }

    // 新規注文
    if (!storeId || !tableLabel || !items?.length) {
      return res.status(400).json({ error: "storeId, tableLabel, items required" });
    }
    const customerId = getCustomerIdFromRequest(req) ?? undefined;
    const order = await createOrder({ storeId, tableLabel, customerId, items });
    return res.status(201).json({ order });
  }

  if (req.method === "GET") {
    const orderId = req.query.orderId as string;
    if (!orderId) return res.status(400).json({ error: "orderId required" });
    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ error: "注文が見つかりません" });
    return res.status(200).json({ order });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
