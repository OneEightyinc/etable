import type { NextApiRequest, NextApiResponse } from "next";
import { findAccountByEmail, findAdminByEmail, hashPassword } from "@queue-platform/api/src/db";
import { createSessionToken, setSessionCookie } from "@queue-platform/api/src/auth";

function parseBody(req: NextApiRequest): {
  email?: string;
  password?: string;
  expectedStoreId?: string;
} {
  const body = req.body;
  if (body == null) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as { email?: string; password?: string; expectedStoreId?: string };
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as { email?: string; password?: string; expectedStoreId?: string };
  }
  return {};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email: rawEmail, password: rawPassword, expectedStoreId: rawExpected } = parseBody(req);
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
    const password = typeof rawPassword === "string" ? rawPassword : "";
    const expectedStoreId = typeof rawExpected === "string" ? rawExpected.trim() : "";

    if (!email || !password) {
      return res.status(400).json({ error: "メールアドレスとパスワードを入力してください" });
    }

    const admin = await findAdminByEmail(email);
    const pwHash = hashPassword(password);
    if (admin && admin.passwordHash === pwHash) {
      return res.status(403).json({
        error: "マスター管理者はマスター管理画面からログインしてください",
      });
    }

    const account = await findAccountByEmail(email);
    if (!account || account.passwordHash !== pwHash) {
      return res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });
    }
    if (account.status !== "ACTIVE") {
      return res.status(403).json({ error: "このアカウントは無効です" });
    }

    if (expectedStoreId && account.id !== expectedStoreId) {
      return res.status(403).json({
        error: "このURLの店舗のアカウントでログインしてください",
      });
    }

    const token = createSessionToken(account.id, "STORE_ADMIN", account.id);
    setSessionCookie(res, token);
    return res.status(200).json({
      sessionId: token,
      user: {
        id: account.id,
        email: account.email,
        role: "STORE_ADMIN" as const,
        storeName: account.storeName,
        storeId: account.id,
      },
    });
  } catch (err: unknown) {
    console.error("[store-admin/api/auth/login]", err);
    return res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
}
