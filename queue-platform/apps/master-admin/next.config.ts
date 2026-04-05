import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  assetPrefix: "https://master-admin-xi.vercel.app",
  env: {
    NEXT_PUBLIC_API_PREFIX: "/admin",
    NEXT_PUBLIC_STORE_ADMIN_URL: "https://etable.net/store",
    NEXT_PUBLIC_KIOSK_URL: "https://etable.net/kiosk",
    NEXT_PUBLIC_CUSTOMER_PORTAL_URL: "https://etable.net",
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
