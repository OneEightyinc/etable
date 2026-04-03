/**
 * 顧客ポータル用: プロフィール ID を HMAC 署名 Cookie で保持（admin の circlx_session と分離）
 */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

const CUSTOMER_COOKIE = "etable_customer";
const TOKEN_SECRET = process.env.TOKEN_SECRET || "circlx-default-secret-key-change-in-production";
const CUSTOMER_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

interface CustomerTokenPayload {
  v: 1;
  cid: string;
  exp: number;
}

function signCustomerToken(payload: CustomerTokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
  if (signature !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as CustomerTokenPayload;
    if (payload.v !== 1 || !payload.cid) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getCustomerIdFromRequest(req: NextApiRequest): string | null {
  const cookies = req.headers.cookie
    ?.split(";")
    .reduce((acc, c) => {
      const [key, ...val] = c.trim().split("=");
      acc[key] = val.join("=");
      return acc;
    }, {} as Record<string, string>);
  const raw = cookies?.[CUSTOMER_COOKIE];
  if (!raw) return null;
  const payload = verifyCustomerToken(decodeCookieValue(raw));
  return payload?.cid ?? null;
}

export function createCustomerSessionToken(customerId: string): string {
  return signCustomerToken({
    v: 1,
    cid: customerId,
    exp: Math.floor(Date.now() / 1000) + CUSTOMER_MAX_AGE,
  });
}

function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function setCustomerCookie(res: NextApiResponse, customerId: string): void {
  const token = createCustomerSessionToken(customerId);
  const secure = isProductionDeployment() ? "; Secure" : "";
  const value = encodeURIComponent(token);
  res.setHeader(
    "Set-Cookie",
    `${CUSTOMER_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CUSTOMER_MAX_AGE}${secure}`
  );
}

export function clearCustomerCookie(res: NextApiResponse): void {
  const secure = isProductionDeployment() ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${CUSTOMER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  );
}
