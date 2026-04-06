import type { NextApiRequest, NextApiResponse } from "next";
import {
  resolvePublicUrlToken,
  type PublicUrlTokenKind,
} from "@queue-platform/api/src/server";

const KINDS: PublicUrlTokenKind[] = ["storeAdmin", "kiosk", "portal", "survey"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const kind = req.query.kind as string;
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (!token || !KINDS.includes(kind as PublicUrlTokenKind)) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const storeId = await resolvePublicUrlToken(kind as PublicUrlTokenKind, token);
  if (!storeId) return res.status(404).json({ error: "Not found" });
  return res.status(200).json({ storeId });
}
