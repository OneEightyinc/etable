import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  basePath: process.env.VERCEL ? "/store" : "",
  assetPrefix: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  /**
   * 同一オリジンでは空のまま `/api/*` を使う（localhost:3020 や etable-1yex のルート配信）。
   * リバースプロキシで `/store` 以下にマウントする場合のみ Vercel 等で NEXT_PUBLIC_API_PREFIX=/store を設定。
   */
  transpilePackages: ["@queue-platform/api"],
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/api/**/*": [path.join(monorepoRoot, "packages", "api", "src", "**", "*")],
  },
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
