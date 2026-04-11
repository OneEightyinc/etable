import type { NextApiRequest, NextApiResponse } from "next";
import {
  createOrder,
  addItemsToOrder,
  getOrderById,
  getOrdersByStore,
  getCustomerIdFromRequest,
} from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { storeId, tableLabel, items, orderId } = body as {
        storeId?: string;
        tableLabel?: string;
        items: { menuItemId: string; name: string; price: number; quantity: number }[];
        orderId?: string;
      };

      // 追加注文
      if (orderId) {
        const order = await addItemsToOrder(orderId, items);
        return res.status(200).json({ order });
      }

      // 新規注文
      if (!storeId || !tableLabel || !items?.length) {
        return res.status(400).json({ error: "storeId, tableLabel, items required" });
      }
      let customerId: string | undefined;
      try {
        customerId = getCustomerIdFromRequest(req) ?? undefined;
      } catch {
        // cookie無しの場合は無視
      }
      const order = await createOrder({ storeId, tableLabel, customerId, items });
      return res.status(201).json({ order });
    } catch (e: any) {
      console.error("[api/order] POST error:", e);
      return res.status(500).json({ error: e.message || "注文処理に失敗しました" });
    }
  }

  if (req.method === "GET") {
    try {
      const orderId = req.query.orderId as string;
      const storeId = req.query.storeId as string;
      const tableLabel = req.query.table as string;

      // 単一注文取得
      if (orderId) {
        const order = await getOrderById(orderId);
        if (!order) return res.status(404).json({ error: "注文が見つかりません" });
        return res.status(200).json({ order });
      }

      // テーブル別の注文履歴
      if (storeId) {
        const today = new Date().toISOString().slice(0, 10);
        const orders = await getOrdersByStore(storeId, today);
        const filtered = tableLabel
          ? orders.filter((o) => o.tableLabel === tableLabel)
          : orders;
        return res.status(200).json({ orders: filtered });
      }

      return res.status(400).json({ error: "orderId or storeId required" });
    } catch (e: any) {
      console.error("[api/order] GET error:", e);
      return res.status(500).json({ error: e.message || "取得に失敗しました" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
