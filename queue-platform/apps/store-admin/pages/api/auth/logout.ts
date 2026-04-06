import type { NextApiRequest, NextApiResponse } from "next";
import { clearSessionCookie } from "@queue-platform/api/src/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
