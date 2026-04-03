import type { NextApiRequest, NextApiResponse } from "next";
import {
  getCustomerProfileById,
  deleteCustomerProfile,
  getCustomerIdFromRequest,
  clearCustomerCookie,
} from "@queue-platform/api/src/server";

function profileJson(p: Awaited<ReturnType<typeof getCustomerProfileById>>) {
  if (!p) return null;
  return {
    id: p.id,
    displayName: p.displayName,
    email: p.email,
    phone: p.phone,
    registeredAt: p.createdAt,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const customerId = getCustomerIdFromRequest(req);

  if (req.method === "GET") {
    if (!customerId) {
      return res.status(401).json({ error: "Not registered" });
    }
    const profile = await getCustomerProfileById(customerId);
    if (!profile) {
      clearCustomerCookie(res);
      return res.status(401).json({ error: "Session invalid" });
    }
    return res.status(200).json({ profile: profileJson(profile) });
  }

  if (req.method === "DELETE") {
    if (!customerId) {
      clearCustomerCookie(res);
      return res.status(204).end();
    }
    await deleteCustomerProfile(customerId);
    clearCustomerCookie(res);
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
