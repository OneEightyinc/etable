import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
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
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

export default nextConfig;
