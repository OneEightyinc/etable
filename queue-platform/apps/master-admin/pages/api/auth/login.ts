import type { NextApiRequest, NextApiResponse } from "next";
import { findAdminByEmail, findAccountByEmail, hashPassword } from "@queue-platform/api/src/db";
import { createSessionToken, setSessionCookie } from "@queue-platform/api/src/auth";

function parseBody(req: NextApiRequest): { email?: string; password?: string } {
  const body = req.body;
  if (body == null) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as { email?: string; password?: string };
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as { email?: string; password?: string };
  }
  return {};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email: rawEmail, password: rawPassword } = parseBody(req);
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
    const password = typeof rawPassword === "string" ? rawPassword : "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const pwHash = hashPassword(password);

    const admin = await findAdminByEmail(email);
    if (admin && admin.passwordHash === pwHash) {
      const token = createSessionToken(admin.id, "SUPER_ADMIN");
      setSessionCookie(res, token);
      return res.status(200).json({
        sessionId: token,
        user: { id: admin.id, email: admin.email, role: "SUPER_ADMIN" },
      });
    }

    const account = await findAccountByEmail(email);
    if (account && account.passwordHash === pwHash && account.status === "ACTIVE") {
      const token = createSessionToken(account.id, "STORE_ADMIN", account.id);
      setSessionCookie(res, token);
      return res.status(200).json({
        sessionId: token,
        user: {
          id: account.id,
          email: account.email,
          role: "STORE_ADMIN",
          storeName: account.storeName,
          storeId: account.id,
        },
      });
    }

    return res.status(401).json({ error: "Invalid email or password" });
  } catch (err) {
    console.error("[api/auth/login]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
