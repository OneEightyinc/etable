import type { NextApiRequest, NextApiResponse } from "next";
import { incrementUserPostpone } from "@queue-platform/api/src/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { entryId } = req.body as { entryId?: string };
  if (!entryId) return res.status(400).json({ error: "entryId is required" });

  try {
    const entry = await incrementUserPostpone(entryId);
    return res.json({ ok: true, userPostponedCount: entry.userPostponedCount });
  } catch (e: any) {
    return res.status(404).json({ error: e.message });
  }
}
