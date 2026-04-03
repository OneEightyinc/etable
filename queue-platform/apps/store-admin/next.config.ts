import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@queue-platform/api"],
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/api/**/*": [path.join(monorepoRoot, "packages", "api", "src", "**", "*")],
  },
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
