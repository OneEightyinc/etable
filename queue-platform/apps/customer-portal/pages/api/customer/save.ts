import type { NextApiRequest, NextApiResponse } from "next";
import {
  getCustomerProfileById,
  createCustomerProfile,
  updateCustomerProfile,
  getCustomerIdFromRequest,
  setCustomerCookie,
} from "@queue-platform/api/src/server";

function parseBody(req: NextApiRequest): { displayName?: string; email?: string; phone?: string } {
  const b = req.body;
  if (b == null) return {};
  if (typeof b === "string") {
    try {
      return JSON.parse(b) as { displayName?: string; email?: string; phone?: string };
    } catch {
      return {};
    }
  }
  if (typeof b === "object") return b as { displayName?: string; email?: string; phone?: string };
  return {};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { displayName, email, phone } = parseBody(req);
    if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
      return res.status(400).json({ error: "displayName is required" });
    }

    const existingId = getCustomerIdFromRequest(req);
    if (existingId) {
      const existing = await getCustomerProfileById(existingId);
      if (existing) {
        const updated = await updateCustomerProfile(existingId, {
          displayName,
          email: typeof email === "string" ? email : undefined,
          phone: typeof phone === "string" ? phone : undefined,
        });
        setCustomerCookie(res, updated.id);
        return res.status(200).json({
          profile: {
            id: updated.id,
            displayName: updated.displayName,
            email: updated.email,
            phone: updated.phone,
            registeredAt: updated.createdAt,
          },
        });
      }
    }

    const row = await createCustomerProfile({
      displayName,
      email: typeof email === "string" ? email : "",
      phone: typeof phone === "string" ? phone : "",
    });
    setCustomerCookie(res, row.id);
    return res.status(201).json({
      profile: {
        id: row.id,
        displayName: row.displayName,
        email: row.email,
        phone: row.phone,
        registeredAt: row.createdAt,
      },
    });
  } catch (e) {
    console.error("[api/customer/save]", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
