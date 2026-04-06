import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  assetPrefix: process.env.VERCEL ? "https://store-admin-v2-rosy.vercel.app" : undefined,
  env: {
    NEXT_PUBLIC_API_PREFIX: "/store",
  },
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
