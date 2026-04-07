import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  assetPrefix: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  env: {
    // ローカルは空（/api/...）。本番でリバースプロキシのサブパス配下に置く場合のみ Vercel 等で NEXT_PUBLIC_API_PREFIX=/admin を設定
    NEXT_PUBLIC_API_PREFIX: process.env.NEXT_PUBLIC_API_PREFIX ?? "",
    // 未設定時はブラウザが localhost のとき hooks が :3020 / :3007 / :3006 にフォールバック（本番は Vercel で各 URL を設定）
    NEXT_PUBLIC_STORE_ADMIN_URL: process.env.NEXT_PUBLIC_STORE_ADMIN_URL ?? "",
    NEXT_PUBLIC_KIOSK_URL: process.env.NEXT_PUBLIC_KIOSK_URL ?? "",
    NEXT_PUBLIC_CUSTOMER_PORTAL_URL: process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ?? "",
  },
  transpilePackages: ["@queue-platform/api"],
  // Vercel / monorepo: trace shared package from queue-platform root
  outputFileTracingRoot: monorepoRoot,
  // サーバーレスに packages/api のソースを確実に同梱（未同梱だと実行時に 500 になり得る）
  outputFileTracingIncludes: {
    "/api/**/*": [path.join(monorepoRoot, "packages", "api", "src", "**", "*")]
  },
  turbopack: {
    root: monorepoRoot
  },
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

export default nextConfig;
