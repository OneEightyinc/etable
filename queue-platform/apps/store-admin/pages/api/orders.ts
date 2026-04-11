import type { NextApiRequest, NextApiResponse } from "next";
import {
  getOrdersByStore,
  updateOrderStatus,
} from "@queue-platform/api/src/server";
import type { OrderStatus } from "@queue-platform/api/src/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const storeId = (req.query.storeId as string) || "";

  if (req.method === "GET") {
    if (!storeId) return res.status(400).json({ error: "storeId required" });
    const date = req.query.date as string | undefined;
    const orders = await getOrdersByStore(storeId, date);
    return res.status(200).json({ orders });
  }

  if (req.method === "PATCH") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { orderId, status, paidAmount } = body as {
      orderId: string;
      status: OrderStatus;
      paidAmount?: number;
    };
    if (!orderId || !status) {
      return res.status(400).json({ error: "orderId and status required" });
    }
    const order = await updateOrderStatus(orderId, status, paidAmount);
    return res.status(200).json({ order });
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Method not allowed" });
}
